const { query } = require('../../config/db');
const { createError } = require('../../utils/helpers');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');


// ─── Upload File ──────────────────────────────────────────────

const uploadFile = async (userId, entryId, file) => {
  try {
    // Verify entry exists and user can access it
    const entryResult = await query(
      'SELECT * FROM log_entries WHERE id = $1 AND is_deleted = FALSE',
      [entryId]
    );

    if (entryResult.rows.length === 0) {
      // Delete uploaded file if entry not found
      fs.unlinkSync(file.path);
      throw createError('Log entry not found', 404, 'NOT_FOUND');
    }

    const entry = entryResult.rows[0];

    // Verify user can upload to this entry
    if (entry.student_id !== userId) {
      fs.unlinkSync(file.path);
      throw createError('You do not have permission to upload files to this entry', 403, 'AUTHORIZATION_ERROR');
    }

    // Create file record in DB
    const fileId = uuidv4();
    const fileUrl = `/uploads/log-entries/${file.filename}`;

    const result = await query(
      `INSERT INTO files (
        id, entry_id, uploaded_by, file_name, original_name,
        file_type, file_size, file_path, url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        fileId,
        entryId,
        userId,
        file.filename,
        file.originalname,
        file.mimetype,
        file.size,
        file.path,
        fileUrl,
      ]
    );

    return result.rows[0];
  } catch (err) {
    // Clean up file on error
    if (file && file.path) {
      try {
        fs.unlinkSync(file.path);
      } catch (unlinkErr) {
        console.error('Failed to delete file on error:', unlinkErr);
      }
    }
    throw err;
  }
};


// ─── Get File ─────────────────────────────────────────────────

const getFile = async (userId, fileId) => {
  try {
    const result = await query(
      'SELECT * FROM files WHERE id = $1',
      [fileId]
    );

    if (result.rows.length === 0) {
      throw createError('File not found', 404, 'NOT_FOUND');
    }

    const file = result.rows[0];

    // Verify access: uploader, entry owner, or admin
    const entryResult = await query(
      'SELECT * FROM log_entries WHERE id = $1',
      [file.entry_id]
    );

    if (entryResult.rows.length === 0) {
      throw createError('Associated entry not found', 404, 'NOT_FOUND');
    }

    const entry = entryResult.rows[0];

    // Check if user can access this file
    const canAccess = file.uploaded_by === userId || entry.student_id === userId;
    if (!canAccess) {
      // Supervisors can view if they've reviewed the entry
      const supervisorCheck = await query(
        'SELECT id FROM log_entries WHERE id = $1 AND supervisor_id = $2',
        [file.entry_id, userId]
      );
      if (supervisorCheck.rows.length === 0) {
        throw createError('You do not have permission to access this file', 403, 'AUTHORIZATION_ERROR');
      }
    }

    return file;
  } catch (err) {
    throw err;
  }
};


// ─── Delete File ──────────────────────────────────────────────

const deleteFile = async (userId, fileId) => {
  try {
    const fileResult = await query(
      'SELECT * FROM files WHERE id = $1',
      [fileId]
    );

    if (fileResult.rows.length === 0) {
      throw createError('File not found', 404, 'NOT_FOUND');
    }

    const file = fileResult.rows[0];

    // Verify user can delete this file (uploader or entry owner)
    const entryResult = await query(
      'SELECT * FROM log_entries WHERE id = $1',
      [file.entry_id]
    );

    if (entryResult.rows.length === 0) {
      throw createError('Associated entry not found', 404, 'NOT_FOUND');
    }

    const entry = entryResult.rows[0];

    if (file.uploaded_by !== userId && entry.student_id !== userId) {
      throw createError('You do not have permission to delete this file', 403, 'AUTHORIZATION_ERROR');
    }

    // Delete from disk
    try {
      fs.unlinkSync(file.file_path);
    } catch (fsErr) {
      console.error('Failed to delete file from disk:', fsErr);
    }

    // Delete from database
    await query('DELETE FROM files WHERE id = $1', [fileId]);

    return true;
  } catch (err) {
    throw err;
  }
};


// ─── Get Entry Files ──────────────────────────────────────────

const getEntryFiles = async (userId, entryId) => {
  try {
    const entryResult = await query(
      'SELECT * FROM log_entries WHERE id = $1 AND is_deleted = FALSE',
      [entryId]
    );

    if (entryResult.rows.length === 0) {
      throw createError('Log entry not found', 404, 'NOT_FOUND');
    }

    const entry = entryResult.rows[0];

    // Verify access
    if (entry.student_id !== userId) {
      // Check if supervisor has reviewed this entry
      if (entry.supervisor_id !== userId) {
        throw createError('You do not have permission to access these files', 403, 'AUTHORIZATION_ERROR');
      }
    }

    const filesResult = await query(
      'SELECT id, file_name, original_name, file_type, file_size, url, created_at FROM files WHERE entry_id = $1 ORDER BY created_at DESC',
      [entryId]
    );

    return filesResult.rows;
  } catch (err) {
    throw err;
  }
};


module.exports = {
  uploadFile,
  getFile,
  deleteFile,
  getEntryFiles,
};

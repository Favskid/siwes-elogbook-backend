const { query } = require('../../config/db');
const { createError, getOffset } = require('../../utils/helpers');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');


// ─── Validation ───────────────────────────────────────────────

const validateCreateInput = (body) => {
  const errors = [];
  const { date, week_number, activity_description, tools_equipment, skills_acquired, challenges_faced } = body;

  if (!date || isNaN(new Date(date))) {
    errors.push('Valid date is required');
  }

  if (!week_number || week_number < 1 || week_number > 52) {
    errors.push('Week number must be between 1 and 52');
  }

  if (!activity_description || activity_description.trim().length < 50) {
    errors.push('Activity description must be at least 50 characters');
  }

  if (!tools_equipment || tools_equipment.trim().length < 10) {
    errors.push('Tools/equipment information must be at least 10 characters');
  }

  if (!skills_acquired || skills_acquired.trim().length < 10) {
    errors.push('Skills acquired must be at least 10 characters');
  }

  if (!challenges_faced || challenges_faced.trim().length < 10) {
    errors.push('Challenges faced must be at least 10 characters');
  }

  return errors;
};

const validateUpdateInput = (body) => {
  const errors = [];
  const { date, week_number, activity_description, tools_equipment, skills_acquired, challenges_faced } = body;

  if (date && isNaN(new Date(date))) {
    errors.push('Valid date is required');
  }

  if (week_number !== undefined && (week_number < 1 || week_number > 52)) {
    errors.push('Week number must be between 1 and 52');
  }

  if (activity_description && activity_description.trim().length < 50) {
    errors.push('Activity description must be at least 50 characters');
  }

  if (tools_equipment && tools_equipment.trim().length < 10) {
    errors.push('Tools/equipment information must be at least 10 characters');
  }

  if (skills_acquired && skills_acquired.trim().length < 10) {
    errors.push('Skills acquired must be at least 10 characters');
  }

  if (challenges_faced && challenges_faced.trim().length < 10) {
    errors.push('Challenges faced must be at least 10 characters');
  }

  return errors;
};


// ─── Create Log Entry with Files ──────────────────────────────

const createEntry = async (studentId, body, uploadedFiles = []) => {
  // 1. Validate inputs
  const errors = validateCreateInput(body);
  if (errors.length > 0) {
    throw createError(errors[0], 400, 'VALIDATION_ERROR');
  }

  const { date, week_number, activity_description, tools_equipment, skills_acquired, challenges_faced } = body;

  // 2. Check if student already has entry for this date
  const dateCheck = await query(
    'SELECT id FROM log_entries WHERE student_id = $1 AND date = $2 AND is_deleted = FALSE',
    [studentId, date]
  );

  if (dateCheck.rows.length > 0) {
    // Clean up uploaded files if duplicate entry
    uploadedFiles.forEach(file => {
      try {
        fs.unlinkSync(file.path);
      } catch (err) {
        console.error(`Failed to delete file: ${file.path}`);
      }
    });
    throw createError('You already have an entry for this date', 409, 'CONFLICT');
  }

  // 3. Create log entry
  const entryId = uuidv4();
  const result = await query(
    `INSERT INTO log_entries (
      id, student_id, date, week_number, activity_description,
      tools_equipment, skills_acquired, challenges_faced, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *`,
    [
      entryId,
      studentId,
      date,
      week_number,
      activity_description.trim(),
      tools_equipment.trim(),
      skills_acquired.trim(),
      challenges_faced.trim(),
      'draft',
    ]
  );

  const entry = result.rows[0];

  // 4. Insert file records if files were uploaded
  const fileRecords = [];
  if (uploadedFiles && uploadedFiles.length > 0) {
    for (const file of uploadedFiles) {
      const fileId = uuidv4();
      const fileUrl = `/uploads/log-entries/${file.filename}`;

      const fileResult = await query(
        `INSERT INTO files (
          id, entry_id, uploaded_by, file_name, original_name,
          file_type, file_size, file_path, url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          fileId,
          entryId,
          studentId,
          file.filename,
          file.originalname,
          file.mimetype,
          file.size,
          file.path,
          fileUrl,
        ]
      );

      fileRecords.push(fileResult.rows[0]);
    }
  }

  return {
    ...entry,
    files: fileRecords,
  };
};


// ─── Get Single Entry ─────────────────────────────────────────

const getEntry = async (entryId, userId, userRole) => {
  const result = await query(
    `SELECT * FROM log_entries WHERE id = $1 AND is_deleted = FALSE`,
    [entryId]
  );

  if (result.rows.length === 0) {
    throw createError('Log entry not found', 404, 'NOT_FOUND');
  }

  const entry = result.rows[0];

  // Check authorization: student can view their own, supervisors/admin can view all
  if (userRole === 'student' && entry.student_id !== userId) {
    throw createError('You do not have permission to view this entry', 403, 'AUTHORIZATION_ERROR');
  }

  // Get associated files
  const filesResult = await query(
    'SELECT id, file_name, original_name, file_type, file_size, url, created_at FROM files WHERE entry_id = $1 ORDER BY created_at DESC',
    [entryId]
  );

  return {
    ...entry,
    files: filesResult.rows,
  };
};


// ─── List Entries (Role-aware) ────────────────────────────────

const listEntries = async (userId, userRole, filters = {}) => {
  const { page = 1, limit = 10, status, week_number, date_from, date_to } = filters;

  let whereCondition = 'WHERE is_deleted = FALSE';
  const params = [];
  let paramCount = 1;

  // Role-based filtering
  if (userRole === 'student') {
    whereCondition += ` AND student_id = $${paramCount}`;
    params.push(userId);
    paramCount++;
  } else if (userRole === 'supervisor' || userRole === 'admin') {
    // Supervisors see entries of students they supervise + their own if they're also students
    // For now, supervisors see all pending/approved entries in their department/company
    // This can be more complex based on business logic
  }

  // Additional filters
  if (status) {
    whereCondition += ` AND status = $${paramCount}`;
    params.push(status);
    paramCount++;
  }

  if (week_number) {
    whereCondition += ` AND week_number = $${paramCount}`;
    params.push(week_number);
    paramCount++;
  }

  if (date_from) {
    whereCondition += ` AND date >= $${paramCount}`;
    params.push(date_from);
    paramCount++;
  }

  if (date_to) {
    whereCondition += ` AND date <= $${paramCount}`;
    params.push(date_to);
    paramCount++;
  }

  // Get total count
  const countResult = await query(
    `SELECT COUNT(*)::INTEGER as total FROM log_entries ${whereCondition}`,
    params
  );

  const total = countResult.rows[0].total;

  // Get paginated results
  const offset = getOffset(page, limit);
  const entriesResult = await query(
    `SELECT * FROM log_entries
     ${whereCondition}
     ORDER BY date DESC, created_at DESC
     LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
    [...params, limit, offset]
  );

  return {
    entries: entriesResult.rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  };
};


// ─── Update Entry (student only, draft/pending) ────────────────

const updateEntry = async (entryId, studentId, body) => {
  // Get current entry
  const result = await query(
    'SELECT * FROM log_entries WHERE id = $1 AND is_deleted = FALSE',
    [entryId]
  );

  if (result.rows.length === 0) {
    throw createError('Log entry not found', 404, 'NOT_FOUND');
  }

  const entry = result.rows[0];

  // Authorization: only student who created it
  if (entry.student_id !== studentId) {
    throw createError('You do not have permission to update this entry', 403, 'AUTHORIZATION_ERROR');
  }

  // Business logic: can only edit draft, pending, or rejected entries
  if (!['draft', 'pending', 'rejected'].includes(entry.status)) {
    throw createError(`Cannot edit ${entry.status} entries`, 403, 'AUTHORIZATION_ERROR');
  }

  // Validate inputs
  const errors = validateUpdateInput(body);
  if (errors.length > 0) {
    throw createError(errors[0], 400, 'VALIDATION_ERROR');
  }

  // Build update
  const updates = [];
  const params = [entryId];
  let paramCount = 2;

  if (body.date !== undefined) {
    updates.push(`date = $${paramCount}`);
    params.push(body.date);
    paramCount++;
  }

  if (body.week_number !== undefined) {
    updates.push(`week_number = $${paramCount}`);
    params.push(body.week_number);
    paramCount++;
  }

  if (body.activity_description !== undefined) {
    updates.push(`activity_description = $${paramCount}`);
    params.push(body.activity_description.trim());
    paramCount++;
  }

  if (body.tools_equipment !== undefined) {
    updates.push(`tools_equipment = $${paramCount}`);
    params.push(body.tools_equipment.trim());
    paramCount++;
  }

  if (body.skills_acquired !== undefined) {
    updates.push(`skills_acquired = $${paramCount}`);
    params.push(body.skills_acquired.trim());
    paramCount++;
  }

  if (body.challenges_faced !== undefined) {
    updates.push(`challenges_faced = $${paramCount}`);
    params.push(body.challenges_faced.trim());
    paramCount++;
  }

  if (updates.length === 0) {
    throw createError('No valid fields to update', 400, 'VALIDATION_ERROR');
  }

  const updateResult = await query(
    `UPDATE log_entries
     SET ${updates.join(', ')}
     WHERE id = $1
     RETURNING *`,
    params
  );

  // Get files
  const filesResult = await query(
    'SELECT id, file_name, original_name, file_type, file_size, url, created_at FROM files WHERE entry_id = $1',
    [entryId]
  );

  return {
    ...updateResult.rows[0],
    files: filesResult.rows,
  };
};


// ─── Submit Entry (draft → pending) ───────────────────────────

const submitEntry = async (entryId, studentId) => {
  const result = await query(
    'SELECT * FROM log_entries WHERE id = $1 AND is_deleted = FALSE',
    [entryId]
  );

  if (result.rows.length === 0) {
    throw createError('Log entry not found', 404, 'NOT_FOUND');
  }

  const entry = result.rows[0];

  // Authorization
  if (entry.student_id !== studentId) {
    throw createError('You do not have permission to submit this entry', 403, 'AUTHORIZATION_ERROR');
  }

  // Business logic: can only submit draft or rejected entries
  if (!['draft', 'rejected'].includes(entry.status)) {
    throw createError(`Cannot submit ${entry.status} entries. Only drafts or rejected entries can be submitted.`, 403, 'AUTHORIZATION_ERROR');
  }

  const updateResult = await query(
    `UPDATE log_entries
     SET status = 'pending', supervisor_comment = NULL
     WHERE id = $1
     RETURNING *`,
    [entryId]
  );

  // Get files
  const filesResult = await query(
    'SELECT id, file_name, original_name, file_type, file_size, url, created_at FROM files WHERE entry_id = $1',
    [entryId]
  );

  return {
    ...updateResult.rows[0],
    files: filesResult.rows,
  };
};


// ─── Delete Entry (soft delete) ───────────────────────────────

const deleteEntry = async (entryId, studentId) => {
  const result = await query(
    'SELECT * FROM log_entries WHERE id = $1 AND is_deleted = FALSE',
    [entryId]
  );

  if (result.rows.length === 0) {
    throw createError('Log entry not found', 404, 'NOT_FOUND');
  }

  const entry = result.rows[0];

  // Authorization: only student who created it
  if (entry.student_id !== studentId) {
    throw createError('You do not have permission to delete this entry', 403, 'AUTHORIZATION_ERROR');
  }

  // Business logic: can only delete draft or pending
  if (!['draft', 'pending'].includes(entry.status)) {
    throw createError(`Cannot delete ${entry.status} entries`, 403, 'AUTHORIZATION_ERROR');
  }

  // Soft delete
  await query(
    `UPDATE log_entries
     SET is_deleted = TRUE
     WHERE id = $1`,
    [entryId]
  );

  return true;
};


module.exports = {
  createEntry,
  getEntry,
  listEntries,
  updateEntry,
  submitEntry,
  deleteEntry,
};

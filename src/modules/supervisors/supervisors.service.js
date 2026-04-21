const { query } = require('../../config/db');
const { createError } = require('../../utils/helpers');
const notificationService = require('../../services/notificationService');
const { v4: uuidv4 } = require('uuid');


// ─── Get Supervisor Dashboard ──────────────────────────────────

const getDashboard = async (supervisorId, supervisorRole) => {
  try {
    let assignedStudentIds = [];

    // Personalized discovery: Get students assigned to this supervisor
    const studentsResult = await query(
      `SELECT DISTINCT id FROM users
       WHERE role = 'student' AND supervisor_id = $1 AND is_deleted = FALSE`,
      [supervisorId]
    );
    assignedStudentIds = studentsResult.rows.map(r => r.id);

    // Get stats
    let stats = { total: 0, pending: 0, approved: 0, rejected: 0 };
    
    if (assignedStudentIds.length > 0) {
      const statsResult = await query(
        `SELECT
          COUNT(*)::INTEGER as total,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END)::INTEGER as pending,
          SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END)::INTEGER as approved,
          SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END)::INTEGER as rejected
         FROM log_entries 
         WHERE is_deleted = FALSE AND student_id = ANY($1)`,
        [assignedStudentIds]
      );
      if (statsResult.rows.length > 0) {
        stats = {
          total: statsResult.rows[0].total || 0,
          pending: statsResult.rows[0].pending || 0,
          approved: statsResult.rows[0].approved || 0,
          rejected: statsResult.rows[0].rejected || 0,
        };
      }
    }

    return {
      stats,
      assignedStudentsCount: assignedStudentIds.length,
    };
  } catch (err) {
    throw err;
  }
};


// ─── Get Supervisor's Assigned Entries ─────────────────────────

const getAssignedEntries = async (supervisorId, supervisorRole, filters = {}) => {
  const { page = 1, limit = 10, status } = filters;

  try {
    let whereCondition = 'WHERE le.is_deleted = FALSE AND (u.supervisor_id IS NULL OR u.supervisor_id = $1)';
    const params = [supervisorId];
    let paramCount = 2;

    // NOTE: Removed strict department filter to allow discovery as requested.
    // However, we still order by relevance or keep the system open.
    /*
    const supervisorResult = await query(
      'SELECT department FROM users WHERE id = $1',
      [supervisorId]
    );
    if (supervisorResult.rows.length > 0) {
      const dept = supervisorResult.rows[0].department;
      whereCondition += ` AND u.department ILIKE $${paramCount}`;
      params.push(dept);
      paramCount++;
    }
    */

    if (status) {
      whereCondition += ` AND le.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    // Get count
    const countResult = await query(
      `SELECT COUNT(*)::INTEGER as total FROM log_entries le
       JOIN users u ON le.student_id = u.id
       ${whereCondition}`,
      params
    );
    const total = countResult.rows[0].total;

    // Get paginated entries
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const entriesResult = await query(
      `SELECT le.*, u.name as student_name, u.matric_number, u.email
       FROM log_entries le
       JOIN users u ON le.student_id = u.id
       ${whereCondition}
       ORDER BY le.date DESC
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
  } catch (err) {
    throw err;
  }
};


// ─── Approve Entry ────────────────────────────────────────────

const approveEntry = async (entryId, supervisorId, supervisorRole, comment = '') => {
  try {
    // Get entry and validate access
    const entryResult = await query(
      'SELECT * FROM log_entries WHERE id = $1 AND is_deleted = FALSE',
      [entryId]
    );

    if (entryResult.rows.length === 0) {
      throw createError('Log entry not found', 404, 'NOT_FOUND');
    }

    const entry = entryResult.rows[0];

    // Validate supervisor access - Relaxed for Broadened Discovery
    let hasAccess = false;
    if (supervisorRole === 'supervisor' || supervisorRole === 'admin') {
      hasAccess = true;
    }

    if (!hasAccess) {
      throw createError('You do not have permission to approve this entry', 403, 'AUTHORIZATION_ERROR');
    }

    // Update entry
    const updateResult = await query(
      `UPDATE log_entries
       SET status = 'approved', supervisor_id = $1, supervisor_comment = $2
       WHERE id = $3
       RETURNING *`,
      [supervisorId, comment.trim() || null, entryId]
    );

    // Automatic Assignment: if student doesn't have a supervisor, assign this one
    await query(
      `UPDATE users
       SET supervisor_id = $1
       WHERE id = $2 AND role = 'student' AND (supervisor_id IS NULL OR supervisor_id != $1)`,
      [supervisorId, entry.student_id]
    );

    // Trigger notification
    await notificationService.triggerOnApprove(entry.student_id, entryId, comment);

    return updateResult.rows[0];
  } catch (err) {
    throw err;
  }
};


// ─── Reject Entry ─────────────────────────────────────────────

const rejectEntry = async (entryId, supervisorId, supervisorRole, comment = '') => {
  try {
    if (!comment || comment.trim().length === 0) {
      throw createError('Comment is required for rejection', 400, 'VALIDATION_ERROR');
    }

    // Get entry and validate access
    const entryResult = await query(
      'SELECT * FROM log_entries WHERE id = $1 AND is_deleted = FALSE',
      [entryId]
    );

    if (entryResult.rows.length === 0) {
      throw createError('Log entry not found', 404, 'NOT_FOUND');
    }

    const entry = entryResult.rows[0];

    // Validate supervisor access - Relaxed for Broadened Discovery
    let hasAccess = false;
    if (supervisorRole === 'supervisor' || supervisorRole === 'admin') {
      hasAccess = true;
    }

    if (!hasAccess) {
      throw createError('You do not have permission to reject this entry', 403, 'AUTHORIZATION_ERROR');
    }

    // Update entry (set status to rejected to satisfy database constraint)
    const updateResult = await query(
      `UPDATE log_entries
       SET status = 'rejected', supervisor_id = $1, supervisor_comment = $2
       WHERE id = $3
       RETURNING *`,
      [supervisorId, comment.trim(), entryId]
    );

    // Trigger notification
    await notificationService.triggerOnReject(entry.student_id, entryId, comment);

    return updateResult.rows[0];
  } catch (err) {
    throw err;
  }
};


// ─── Bulk Approve Entries ─────────────────────────────────────

const bulkApproveEntries = async (entryIds, supervisorId, supervisorRole, comment = '') => {
  if (!Array.isArray(entryIds) || entryIds.length === 0) {
    throw createError('No entries selected', 400, 'VALIDATION_ERROR');
  }

  const results = {
    successful: [],
    failed: []
  };

  for (const entryId of entryIds) {
    try {
      const approvedEntry = await approveEntry(entryId, supervisorId, supervisorRole, comment);
      results.successful.push(approvedEntry.id);
    } catch (err) {
      results.failed.push({
        id: entryId,
        error: err.message
      });
    }
  }

  if (results.successful.length === 0 && results.failed.length > 0) {
    throw createError(`Failed to approve entries: ${results.failed[0].error}`, 400, 'BULK_ACTION_ERROR');
  }

  return {
    message: `Successfully approved ${results.successful.length} entries`,
    count: results.successful.length,
    results
  };
};


// ─── Get Assigned Students ────────────────────────────────────

const getAssignedStudents = async (supervisorId, supervisorRole) => {
  try {
    let studentsResult;

    if (supervisorRole === 'supervisor') {
      studentsResult = await query(
        `SELECT id, name, matric_number, email, department, supervisor_id
         FROM users
         WHERE role = 'student' AND is_deleted = FALSE 
           AND (supervisor_id IS NULL OR supervisor_id = $1)
         ORDER BY name`,
        [supervisorId]
      );
    } else {
      studentsResult = { rows: [] };
    }

    return studentsResult.rows;
  } catch (err) {
    throw err;
  }
};


// ─── Get Student Progress ────────────────────────────────────

const getStudentProgress = async (supervisorId, supervisorRole, studentId) => {
  try {
    // Verify supervisor can view this student - Relaxed for Broadened Discovery
    if (supervisorRole !== 'supervisor' && supervisorRole !== 'admin') {
      throw createError('Insufficient permissions', 403, 'AUTHORIZATION_ERROR');
    }

    // Get student info
    const studentResult = await query(
      'SELECT id, name, matric_number, email, department FROM users WHERE id = $1',
      [studentId]
    );

    if (studentResult.rows.length === 0) {
      throw createError('Student not found', 404, 'NOT_FOUND');
    }

    const student = studentResult.rows[0];

    // Get entries stats
    const statsResult = await query(
      `SELECT
        COUNT(*)::INTEGER as total,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END)::INTEGER as approved,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END)::INTEGER as pending,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END)::INTEGER as draft,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END)::INTEGER as rejected
       FROM log_entries
       WHERE student_id = $1 AND is_deleted = FALSE`,
      [studentId]
    );

    const stats = statsResult.rows[0];

    // Get recent entries
    const recentResult = await query(
      `SELECT id, date, week_number, status, supervisor_comment, created_at, updated_at
       FROM log_entries
       WHERE student_id = $1 AND is_deleted = FALSE
       ORDER BY date DESC
       LIMIT 10`,
      [studentId]
    );

    return {
      student,
      stats: {
        total: stats.total || 0,
        approved: stats.approved || 0,
        pending: stats.pending || 0,
        draft: stats.draft || 0,
        rejected: stats.rejected || 0,
      },
      recentEntries: recentResult.rows,
    };
  } catch (err) {
    throw err;
  }
};


module.exports = {
  getDashboard,
  getAssignedEntries,
  approveEntry,
  rejectEntry,
  getAssignedStudents,
  getStudentProgress,
  bulkApproveEntries,
};

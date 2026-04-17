const { query } = require('../../config/db');
const { createError } = require('../../utils/helpers');
const notificationService = require('../../services/notificationService');
const { v4: uuidv4 } = require('uuid');


// ─── Get Supervisor Dashboard ──────────────────────────────────

const getDashboard = async (supervisorId, supervisorRole) => {
  try {
    let assignedStudentIds = [];

    // Get list of students assigned to this supervisor
    if (supervisorRole === 'industry_supervisor') {
      const studentsResult = await query(
        `SELECT DISTINCT student_id FROM log_entries
         WHERE supervisor_id = $1 AND is_deleted = FALSE`,
        [supervisorId]
      );
      assignedStudentIds = studentsResult.rows.map(r => r.student_id);
    } else if (supervisorRole === 'school_supervisor') {
      // School supervisors see students from their department
      const supervisorResult = await query(
        'SELECT department FROM users WHERE id = $1',
        [supervisorId]
      );
      if (supervisorResult.rows.length > 0) {
        const dept = supervisorResult.rows[0].department;
        const studentsResult = await query(
          `SELECT DISTINCT id FROM users
           WHERE role = 'student' AND department = $1 AND is_deleted = FALSE`,
          [dept]
        );
        assignedStudentIds = studentsResult.rows.map(r => r.id);
      }
    }

    // Get stats
    let statsQuery = `SELECT
      COUNT(*)::INTEGER as total,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END)::INTEGER as pending,
      SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END)::INTEGER as approved,
      SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END)::INTEGER as rejected
      FROM log_entries WHERE is_deleted = FALSE`;

    let statsParams = [];
    if (assignedStudentIds.length > 0) {
      statsQuery += ` AND student_id = ANY($1)`;
      statsParams = [assignedStudentIds];
    }

    const statsResult = await query(statsQuery, statsParams);
    const stats = statsResult.rows[0];

    return {
      stats: {
        total: stats.total || 0,
        pending: stats.pending || 0,
        approved: stats.approved || 0,
        rejected: stats.rejected || 0,
      },
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
    let whereCondition = 'WHERE le.is_deleted = FALSE';
    const params = [];
    let paramCount = 1;

    // Filter by supervisor role
    if (supervisorRole === 'industry_supervisor') {
      whereCondition += ` AND le.supervisor_id = $${paramCount}`;
      params.push(supervisorId);
      paramCount++;
    } else if (supervisorRole === 'school_supervisor') {
      const supervisorResult = await query(
        'SELECT department FROM users WHERE id = $1',
        [supervisorId]
      );
      if (supervisorResult.rows.length > 0) {
        const dept = supervisorResult.rows[0].department;
        whereCondition += ` AND u.department = $${paramCount}`;
        params.push(dept);
        paramCount++;
      }
    }

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

    // Validate supervisor access
    let hasAccess = false;
    if (supervisorRole === 'industry_supervisor' && entry.supervisor_id === supervisorId) {
      hasAccess = true;
    } else if (supervisorRole === 'school_supervisor') {
      // Check department match
      const supervisorDept = await query(
        'SELECT department FROM users WHERE id = $1',
        [supervisorId]
      );
      const studentDept = await query(
        'SELECT department FROM users WHERE id = $1',
        [entry.student_id]
      );
      if (
        supervisorDept.rows[0] &&
        studentDept.rows[0] &&
        supervisorDept.rows[0].department === studentDept.rows[0].department
      ) {
        hasAccess = true;
      }
    } else if (supervisorRole === 'admin') {
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

    // Validate supervisor access (same logic as approve)
    let hasAccess = false;
    if (supervisorRole === 'industry_supervisor' && entry.supervisor_id === supervisorId) {
      hasAccess = true;
    } else if (supervisorRole === 'school_supervisor') {
      const supervisorDept = await query(
        'SELECT department FROM users WHERE id = $1',
        [supervisorId]
      );
      const studentDept = await query(
        'SELECT department FROM users WHERE id = $1',
        [entry.student_id]
      );
      if (
        supervisorDept.rows[0] &&
        studentDept.rows[0] &&
        supervisorDept.rows[0].department === studentDept.rows[0].department
      ) {
        hasAccess = true;
      }
    } else if (supervisorRole === 'admin') {
      hasAccess = true;
    }

    if (!hasAccess) {
      throw createError('You do not have permission to reject this entry', 403, 'AUTHORIZATION_ERROR');
    }

    // Update entry (set status back to draft so student can edit)
    const updateResult = await query(
      `UPDATE log_entries
       SET status = 'draft', supervisor_id = $1, supervisor_comment = $2
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


// ─── Get Assigned Students ────────────────────────────────────

const getAssignedStudents = async (supervisorId, supervisorRole) => {
  try {
    let studentsResult;

    if (supervisorRole === 'industry_supervisor') {
      // Get all students who have submitted to this supervisor
      studentsResult = await query(
        `SELECT DISTINCT u.id, u.name, u.matric_number, u.email, u.department
         FROM users u
         JOIN log_entries le ON u.id = le.student_id
         WHERE le.supervisor_id = $1 AND le.is_deleted = FALSE AND u.role = 'student'
         ORDER BY u.name`,
        [supervisorId]
      );
    } else if (supervisorRole === 'school_supervisor') {
      // Get all students in their department
      const supervisorResult = await query(
        'SELECT department FROM users WHERE id = $1',
        [supervisorId]
      );
      if (supervisorResult.rows[0]) {
        const dept = supervisorResult.rows[0].department;
        studentsResult = await query(
          `SELECT id, name, matric_number, email, department
           FROM users
           WHERE role = 'student' AND department = $1 AND is_deleted = FALSE
           ORDER BY name`,
          [dept]
        );
      } else {
        studentsResult = { rows: [] };
      }
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
    // Verify supervisor can view this student
    if (supervisorRole === 'industry_supervisor') {
      // Check if supervisor has reviewed entries from this student
      const accessResult = await query(
        `SELECT id FROM log_entries
         WHERE student_id = $1 AND supervisor_id = $2 LIMIT 1`,
        [studentId, supervisorId]
      );
      if (accessResult.rows.length === 0) {
        throw createError('You do not have access to this student\'s progress', 403, 'AUTHORIZATION_ERROR');
      }
    } else if (supervisorRole === 'school_supervisor') {
      // Check department match
      const supervisorDept = await query(
        'SELECT department FROM users WHERE id = $1',
        [supervisorId]
      );
      const studentDept = await query(
        'SELECT department FROM users WHERE id = $1 AND role = $2',
        [studentId, 'student']
      );
      if (!supervisorDept.rows[0] || !studentDept.rows[0] ||
          supervisorDept.rows[0].department !== studentDept.rows[0].department) {
        throw createError('You do not have access to this student\'s progress', 403, 'AUTHORIZATION_ERROR');
      }
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
};

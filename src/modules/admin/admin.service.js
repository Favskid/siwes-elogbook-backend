const { query } = require('../../config/db');
const { createError, getOffset, isValidEmail } = require('../../utils/helpers');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');


// ─── Audit Logging ────────────────────────────────────────────

const logAuditAction = async (adminId, action, targetTable, targetId, description, metadata = {}) => {
  try {
    await query(
      `INSERT INTO audit_logs (id, admin_id, action, target_table, target_id, description, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [uuidv4(), adminId, action, targetTable, targetId, description, JSON.stringify(metadata)]
    );
  } catch (err) {
    console.error('Audit logging failed:', err);
  }
};


// ─── Dashboard ────────────────────────────────────────────────

const getDashboard = async () => {
  try {
    const [usersResult, entriesResult, notificationsResult, filesResult] = await Promise.all([
      query('SELECT COUNT(*)::INTEGER as total, SUM(CASE WHEN role = $1 THEN 1 ELSE 0 END)::INTEGER as students FROM users WHERE is_deleted = FALSE', ['student']),
      query('SELECT COUNT(*)::INTEGER as total, SUM(CASE WHEN status = $1 THEN 1 ELSE 0 END)::INTEGER as pending FROM log_entries WHERE is_deleted = FALSE', ['pending']),
      query('SELECT COUNT(*)::INTEGER as unread FROM notifications WHERE is_read = FALSE'),
      query('SELECT COUNT(*)::INTEGER as total, SUM(file_size)::BIGINT as totalSize FROM files'),
    ]);

    const users = usersResult.rows[0];
    const entries = entriesResult.rows[0];
    const notifications = notificationsResult.rows[0];
    const files = filesResult.rows[0];

    return {
      users: {
        total: users.total || 0,
        students: users.students || 0,
      },
      logEntries: {
        total: entries.total || 0,
        pending: entries.pending || 0,
      },
      notifications: {
        unread: notifications.unread || 0,
      },
      files: {
        total: files.total || 0,
        totalSize: files.totalSize || 0,
      },
    };
  } catch (err) {
    throw err;
  }
};


// ─── User Management ──────────────────────────────────────────

const listUsers = async (filters = {}) => {
  const { page = 1, limit = 10, role, is_active } = filters;

  let whereCondition = 'WHERE is_deleted = FALSE';
  const params = [];
  let paramCount = 1;

  if (role) {
    whereCondition += ` AND role = $${paramCount}`;
    params.push(role);
    paramCount++;
  }

  if (is_active !== undefined) {
    whereCondition += ` AND is_active = $${paramCount}`;
    params.push(is_active);
    paramCount++;
  }

  const countResult = await query(
    `SELECT COUNT(*)::INTEGER as total FROM users ${whereCondition}`,
    params
  );

  const total = countResult.rows[0].total;
  const offset = getOffset(page, limit);

  const usersResult = await query(
    `SELECT id, name, email, role, matric_number, department, company, phone, is_active, created_at
     FROM users
     ${whereCondition}
     ORDER BY created_at DESC
     LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
    [...params, limit, offset]
  );

  return {
    users: usersResult.rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  };
};


const createUser = async (adminId, body) => {
  const { name, email, password, role, matric_number, department, company, phone } = body;

  // Validate inputs
  if (!name || name.trim().length < 2) throw createError('Valid name required', 400, 'VALIDATION_ERROR');
  if (!email || !isValidEmail(email)) throw createError('Valid email required', 400, 'VALIDATION_ERROR');
  if (!password || password.length < 6) throw createError('Password min 6 chars', 400, 'VALIDATION_ERROR');

  const validRoles = ['student', 'supervisor', 'admin'];
  if (!role || !validRoles.includes(role)) throw createError('Invalid role', 400, 'VALIDATION_ERROR');

  // Check email exists
  const emailCheck = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
  if (emailCheck.rows.length > 0) throw createError('Email already exists', 409, 'CONFLICT');

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  const userId = uuidv4();
  const result = await query(
    `INSERT INTO users (id, name, email, password, role, matric_number, department, company, phone)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id, name, email, role, is_active, created_at`,
    [userId, name.trim(), email.toLowerCase().trim(), hashedPassword, role, matric_number || null, department || null, company || null, phone || null]
  );

  await logAuditAction(adminId, 'CREATE', 'users', userId, `Created user: ${email}`);
  return result.rows[0];
};


const updateUser = async (adminId, userId, body) => {
  const { name, phone, is_active, department, company } = body;

  const updates = [];
  const params = [userId];
  let paramCount = 2;

  if (name !== undefined) {
    if (name.trim().length < 2) throw createError('Name min 2 chars', 400, 'VALIDATION_ERROR');
    updates.push(`name = $${paramCount}`);
    params.push(name.trim());
    paramCount++;
  }

  if (phone !== undefined) {
    updates.push(`phone = $${paramCount}`);
    params.push(phone || null);
    paramCount++;
  }

  if (is_active !== undefined) {
    updates.push(`is_active = $${paramCount}`);
    params.push(is_active);
    paramCount++;
  }

  if (department !== undefined) {
    updates.push(`department = $${paramCount}`);
    params.push(department || null);
    paramCount++;
  }

  if (company !== undefined) {
    updates.push(`company = $${paramCount}`);
    params.push(company || null);
    paramCount++;
  }

  if (updates.length === 0) throw createError('No valid fields', 400, 'VALIDATION_ERROR');

  const result = await query(
    `UPDATE users SET ${updates.join(', ')} WHERE id = $1 RETURNING id, name, email, role, is_active, created_at`,
    params
  );

  if (result.rows.length === 0) throw createError('User not found', 404, 'NOT_FOUND');

  await logAuditAction(adminId, 'UPDATE', 'users', userId, `Updated user: ${userId}`);
  return result.rows[0];
};


const deleteUser = async (adminId, userId) => {
  const userResult = await query('SELECT * FROM users WHERE id = $1', [userId]);
  if (userResult.rows.length === 0) throw createError('User not found', 404, 'NOT_FOUND');

  await query('UPDATE users SET is_deleted = TRUE WHERE id = $1', [userId]);
  await logAuditAction(adminId, 'DELETE', 'users', userId, `Soft deleted user: ${userId}`);
  return true;
};


// ─── Department Management ────────────────────────────────────

const listDepartments = async () => {
  const result = await query('SELECT * FROM departments ORDER BY name');
  return result.rows;
};


const createDepartment = async (adminId, body) => {
  const { name, code, supervisor_id } = body;

  if (!name || name.trim().length < 2) throw createError('Valid name required', 400, 'VALIDATION_ERROR');
  if (!code || code.trim().length < 2) throw createError('Valid code required', 400, 'VALIDATION_ERROR');

  const codeCheck = await query('SELECT id FROM departments WHERE code = $1', [code.toUpperCase().trim()]);
  if (codeCheck.rows.length > 0) throw createError('Department code already exists', 409, 'CONFLICT');

  const deptId = uuidv4();
  const result = await query(
    `INSERT INTO departments (id, name, code, supervisor_id)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [deptId, name.trim(), code.toUpperCase().trim(), supervisor_id || null]
  );

  await logAuditAction(adminId, 'CREATE', 'departments', deptId, `Created department: ${name}`);
  return result.rows[0];
};


const updateDepartment = async (adminId, deptId, body) => {
  const { name, code, supervisor_id } = body;

  const updates = [];
  const params = [deptId];
  let paramCount = 2;

  if (name !== undefined) {
    updates.push(`name = $${paramCount}`);
    params.push(name.trim());
    paramCount++;
  }

  if (code !== undefined) {
    updates.push(`code = $${paramCount}`);
    params.push(code.toUpperCase().trim());
    paramCount++;
  }

  if (supervisor_id !== undefined) {
    updates.push(`supervisor_id = $${paramCount}`);
    params.push(supervisor_id || null);
    paramCount++;
  }

  if (updates.length === 0) throw createError('No valid fields', 400, 'VALIDATION_ERROR');

  const result = await query(
    `UPDATE departments SET ${updates.join(', ')} WHERE id = $1 RETURNING *`,
    params
  );

  if (result.rows.length === 0) throw createError('Department not found', 404, 'NOT_FOUND');

  await logAuditAction(adminId, 'UPDATE', 'departments', deptId, `Updated department: ${deptId}`);
  return result.rows[0];
};


const deleteDepartment = async (adminId, deptId) => {
  const deptResult = await query('SELECT * FROM departments WHERE id = $1', [deptId]);
  if (deptResult.rows.length === 0) throw createError('Department not found', 404, 'NOT_FOUND');

  // Soft delete by clearing reference
  await query('UPDATE users SET department = NULL WHERE department = $1', [deptResult.rows[0].name]);
  await logAuditAction(adminId, 'DELETE', 'departments', deptId, `Soft deleted department: ${deptId}`);
  return true;
};


// ─── Log Entries ─────────────────────────────────────────────

const getAllEntries = async (filters = {}) => {
  const { page = 1, limit = 10, status, student_id, week_number } = filters;

  let whereCondition = 'WHERE le.is_deleted = FALSE';
  const params = [];
  let paramCount = 1;

  if (status) {
    whereCondition += ` AND status = $${paramCount}`;
    params.push(status);
    paramCount++;
  }

  if (student_id) {
    whereCondition += ` AND student_id = $${paramCount}`;
    params.push(student_id);
    paramCount++;
  }

  if (week_number) {
    whereCondition += ` AND week_number = $${paramCount}`;
    params.push(week_number);
    paramCount++;
  }

  const countResult = await query(
    `SELECT COUNT(*)::INTEGER as total FROM log_entries le ${whereCondition}`,
    params
  );

  const offset = getOffset(page, limit);
  const entriesResult = await query(
    `SELECT le.*, u.name as student_name, u.email as student_email
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
      total: countResult.rows[0].total,
      pages: Math.ceil(countResult.rows[0].total / limit),
    },
  };
};


// ─── CSV Export ───────────────────────────────────────────────

const exportEntriesCSV = async (adminId) => {
  const result = await query(
    `SELECT le.id, u.name, u.matric_number, u.email, le.date, le.week_number,
            le.status, le.activity_description, le.created_at
     FROM log_entries le
     JOIN users u ON le.student_id = u.id
     WHERE le.is_deleted = FALSE
     ORDER BY le.date DESC`
  );

  await logAuditAction(adminId, 'EXPORT', 'log_entries', null, 'Exported log entries to CSV');

  // Create CSV header
  const headers = ['Entry ID', 'Student Name', 'Matric Number', 'Email', 'Date', 'Week', 'Status', 'Activity Description', 'Created At'];
  const rows = result.rows.map(row => [
    row.id,
    row.name,
    row.matric_number || '',
    row.email,
    row.date,
    row.week_number,
    row.status,
    `"${(row.activity_description || '').replace(/"/g, '""')}"`,
    row.created_at,
  ]);

  let csv = headers.join(',') + '\n';
  rows.forEach(row => {
    csv += row.join(',') + '\n';
  });

  return csv;
};


// ─── Data Purge (Hard Delete Old Data) ────────────────────────

const purgeOldData = async (adminId, daysOld = 365) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  try {
    // Get stats before deletion
    const beforeResult = await query(
      `SELECT 
        COUNT(DISTINCT id) as log_entries
       FROM log_entries
       WHERE is_deleted = TRUE AND updated_at < $1`,
      [cutoffDate.toISOString()]
    );

    const beforeCount = beforeResult.rows[0].log_entries || 0;

    // Hard delete old soft-deleted entries
    await query(
      `DELETE FROM log_entries
       WHERE is_deleted = TRUE AND updated_at < $1`,
      [cutoffDate.toISOString()]
    );

    await logAuditAction(
      adminId,
      'PURGE',
      'log_entries',
      null,
      `Purged ${beforeCount} old entries older than ${daysOld} days`
    );

    return {
      message: `Purged ${beforeCount} entries`,
      daysOld,
      cutoffDate: cutoffDate.toISOString(),
    };
  } catch (err) {
    throw err;
  }
};


module.exports = {
  getDashboard,
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  listDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getAllEntries,
  exportEntriesCSV,
  purgeOldData,
  logAuditAction,
};

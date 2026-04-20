const { query } = require('../../config/db');
const { sanitizeUser, createError } = require('../../utils/helpers');


// ─── Get Student Profile ──────────────────────────────────────

const getProfile = async (studentId) => {
  const result = await query(
    `SELECT u.id, u.name, u.email, u.role, u.matric_number, u.department, u.phone, u.avatar, 
            u.is_active, u.created_at, u.updated_at, s.name as supervisor_name
     FROM users u
     LEFT JOIN users s ON u.supervisor_id = s.id
     WHERE u.id = $1 AND u.role = 'student' AND u.is_deleted = FALSE`,
    [studentId]
  );

  if (result.rows.length === 0) {
    throw createError('Student profile not found', 404, 'NOT_FOUND');
  }

  return result.rows[0];
};


// ─── Update Student Profile ───────────────────────────────────

const updateProfile = async (studentId, updateData) => {
  const { name, phone, avatar } = updateData;

  // Validate inputs
  if (name && (name.trim().length < 2 || name.trim().length > 100)) {
    throw createError('Name must be between 2 and 100 characters', 400, 'VALIDATION_ERROR');
  }

  if (phone && phone.trim().length > 20) {
    throw createError('Phone number must not exceed 20 characters', 400, 'VALIDATION_ERROR');
  }

  // Build dynamic update query
  const updates = [];
  const values = [studentId];
  let paramCount = 2;

  if (name !== undefined) {
    updates.push(`name = $${paramCount}`);
    values.push(name.trim());
    paramCount++;
  }

  if (phone !== undefined) {
    updates.push(`phone = $${paramCount}`);
    values.push(phone ? phone.trim() : null);
    paramCount++;
  }

  if (avatar !== undefined) {
    updates.push(`avatar = $${paramCount}`);
    values.push(avatar || null);
    paramCount++;
  }

  if (updates.length === 0) {
    throw createError('No valid fields to update', 400, 'VALIDATION_ERROR');
  }

  const result = await query(
    `UPDATE users
     SET ${updates.join(', ')}
     WHERE id = $1 AND role = 'student' AND is_deleted = FALSE
     RETURNING id, name, email, role, matric_number, department, phone, avatar, 
               is_active, created_at, updated_at`,
    values
  );

  if (result.rows.length === 0) {
    throw createError('Student profile not found or unable to update', 404, 'NOT_FOUND');
  }

  return result.rows[0];
};


// ─── Get Student Dashboard ────────────────────────────────────

const getDashboard = async (studentId) => {
  try {
    // 1. Get stats on log entries
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

    // 2. Get recent log entries (last 5)
    const recentEntriesResult = await query(
      `SELECT id, date, week_number, activity_description, status, supervisor_comment, created_at, updated_at
       FROM log_entries
       WHERE student_id = $1 AND is_deleted = FALSE
       ORDER BY date DESC
       LIMIT 5`,
      [studentId]
    );

    const recentEntries = recentEntriesResult.rows;

    // 3. Get unread notifications
    const unreadNotifResult = await query(
      `SELECT id, title, message, type, is_read, related_entry_id, created_at
       FROM notifications
       WHERE user_id = $1 AND is_read = FALSE
       ORDER BY created_at DESC`,
      [studentId]
    );

    const unreadNotifications = unreadNotifResult.rows;

    // 4. Count unread
    const unreadCount = unreadNotifications.length;

    return {
      stats: {
        total: stats.total || 0,
        approved: stats.approved || 0,
        pending: stats.pending || 0,
        draft: stats.draft || 0,
        rejected: stats.rejected || 0,
      },
      recentEntries,
      unreadNotifications: {
        count: unreadCount,
        items: unreadNotifications,
      },
    };
  } catch (err) {
    throw err;
  }
};


module.exports = { getProfile, updateProfile, getDashboard };

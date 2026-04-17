const { query } = require('../../config/db');
const { createError, getOffset } = require('../../utils/helpers');


// ─── Get Notifications (Paginated & Filterable) ────────────────

const getNotifications = async (userId, filters = {}) => {
  const { page = 1, limit = 10, is_read, type } = filters;

  let whereCondition = 'WHERE user_id = $1';
  const params = [userId];
  let paramCount = 2;

  if (is_read !== undefined && is_read !== 'undefined') {
    whereCondition += ` AND is_read = $${paramCount}`;
    params.push(is_read === 'true' || is_read === true);
    paramCount++;
  }

  if (type) {
    whereCondition += ` AND type = $${paramCount}`;
    params.push(type);
    paramCount++;
  }

  const countResult = await query(
    `SELECT COUNT(*)::INTEGER as total FROM notifications ${whereCondition}`,
    params
  );

  const total = countResult.rows[0].total;
  const offset = getOffset(page, limit);

  const notificationsResult = await query(
    `SELECT * FROM notifications
     ${whereCondition}
     ORDER BY created_at DESC
     LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
    [...params, limit, offset]
  );

  return {
    notifications: notificationsResult.rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  };
};


// ─── Mark Single Notification as Read ──────────────────────────

const markAsRead = async (userId, notificationId) => {
  const result = await query(
    `UPDATE notifications
     SET is_read = TRUE
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [notificationId, userId]
  );

  if (result.rows.length === 0) {
    throw createError('Notification not found', 404, 'NOT_FOUND');
  }

  return result.rows[0];
};


// ─── Mark All Notifications as Read ────────────────────────────

const markAllAsRead = async (userId) => {
  await query(
    `UPDATE notifications
     SET is_read = TRUE
     WHERE user_id = $1 AND is_read = FALSE`,
    [userId]
  );

  return true;
};


// ─── Delete Notification ──────────────────────────────────────

const deleteNotification = async (userId, notificationId) => {
  const result = await query(
    `DELETE FROM notifications
     WHERE id = $1 AND user_id = $2
     RETURNING id`,
    [notificationId, userId]
  );

  if (result.rows.length === 0) {
    throw createError('Notification not found', 404, 'NOT_FOUND');
  }

  return true;
};


module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};

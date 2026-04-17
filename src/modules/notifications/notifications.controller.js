const notificationsService = require('./notifications.service');
const { success } = require('../../utils/response');


const getNotificationsController = async (req, res, next) => {
  try {
    const { page, limit, is_read, type } = req.query;
    const result = await notificationsService.getNotifications(
      req.user.id,
      { page, limit, is_read, type }
    );
    return success(res, result, 'Notifications retrieved successfully');
  } catch (err) {
    next(err);
  }
};


const markAsReadController = async (req, res, next) => {
  try {
    const notification = await notificationsService.markAsRead(
      req.user.id,
      req.params.id
    );
    return success(res, notification, 'Notification marked as read');
  } catch (err) {
    next(err);
  }
};


const markAllAsReadController = async (req, res, next) => {
  try {
    await notificationsService.markAllAsRead(req.user.id);
    return success(res, null, 'All notifications marked as read');
  } catch (err) {
    next(err);
  }
};


const deleteNotificationController = async (req, res, next) => {
  try {
    await notificationsService.deleteNotification(
      req.user.id,
      req.params.id
    );
    return success(res, null, 'Notification deleted successfully');
  } catch (err) {
    next(err);
  }
};


module.exports = {
  getNotificationsController,
  markAsReadController,
  markAllAsReadController,
  deleteNotificationController,
};

const studentsService = require('./students.service');
const { success } = require('../../utils/response');


const getProfileController = async (req, res, next) => {
  try {
    // req.user is attached by authenticate middleware
    const profile = await studentsService.getProfile(req.user.id);
    return success(res, profile, 'Student profile retrieved successfully');
  } catch (err) {
    next(err);
  }
};


const updateProfileController = async (req, res, next) => {
  try {
    const { name, phone, avatar } = req.body;
    const updated = await studentsService.updateProfile(req.user.id, {
      name,
      phone,
      avatar,
    });
    return success(res, updated, 'Student profile updated successfully');
  } catch (err) {
    next(err);
  }
};


const getDashboardController = async (req, res, next) => {
  try {
    const dashboard = await studentsService.getDashboard(req.user.id);
    return success(res, dashboard, 'Student dashboard retrieved successfully');
  } catch (err) {
    next(err);
  }
};


module.exports = {
  getProfileController,
  updateProfileController,
  getDashboardController,
};

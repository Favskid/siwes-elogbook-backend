const supervisorsService = require('./supervisors.service');
const { success } = require('../../utils/response');


const getDashboardController = async (req, res, next) => {
  try {
    const dashboard = await supervisorsService.getDashboard(req.user.id, req.user.role);
    return success(res, dashboard, 'Supervisor dashboard retrieved successfully');
  } catch (err) {
    next(err);
  }
};


const getAssignedEntriesController = async (req, res, next) => {
  try {
    const { page, limit, status } = req.query;
    const result = await supervisorsService.getAssignedEntries(
      req.user.id,
      req.user.role,
      { page, limit, status }
    );
    return success(res, result, 'Assigned entries retrieved successfully');
  } catch (err) {
    next(err);
  }
};


const approveEntryController = async (req, res, next) => {
  try {
    const { comment } = req.body;
    const entry = await supervisorsService.approveEntry(
      req.params.id,
      req.user.id,
      req.user.role,
      comment
    );
    return success(res, entry, 'Entry approved successfully');
  } catch (err) {
    next(err);
  }
};


const rejectEntryController = async (req, res, next) => {
  try {
    const { comment } = req.body;
    const entry = await supervisorsService.rejectEntry(
      req.params.id,
      req.user.id,
      req.user.role,
      comment
    );
    return success(res, entry, 'Entry rejected successfully');
  } catch (err) {
    next(err);
  }
};


const getAssignedStudentsController = async (req, res, next) => {
  try {
    const students = await supervisorsService.getAssignedStudents(
      req.user.id,
      req.user.role
    );
    return success(res, students, 'Assigned students retrieved successfully');
  } catch (err) {
    next(err);
  }
};


const getStudentProgressController = async (req, res, next) => {
  try {
    const progress = await supervisorsService.getStudentProgress(
      req.user.id,
      req.user.role,
      req.params.studentId
    );
    return success(res, progress, 'Student progress retrieved successfully');
  } catch (err) {
    next(err);
  }
};


module.exports = {
  getDashboardController,
  getAssignedEntriesController,
  approveEntryController,
  rejectEntryController,
  getAssignedStudentsController,
  getStudentProgressController,
};

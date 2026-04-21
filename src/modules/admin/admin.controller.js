const adminService = require('./admin.service');
const { success, created } = require('../../utils/response');


const getDashboardController = async (req, res, next) => {
  try {
    const dashboard = await adminService.getDashboard();
    return success(res, dashboard, 'Admin dashboard retrieved successfully');
  } catch (err) {
    next(err);
  }
};


const listUsersController = async (req, res, next) => {
  try {
    const { page, limit, role, is_active } = req.query;
    const filters = { page, limit, role };
    if (is_active !== undefined) {
      filters.is_active = is_active === 'true';
    }
    const result = await adminService.listUsers(filters);
    return success(res, result, 'Users retrieved successfully');
  } catch (err) {
    next(err);
  }
};


const createUserController = async (req, res, next) => {
  try {
    const user = await adminService.createUser(req.user.id, req.body);
    return created(res, user, 'User created successfully');
  } catch (err) {
    next(err);
  }
};


const updateUserController = async (req, res, next) => {
  try {
    const user = await adminService.updateUser(req.user.id, req.params.id, req.body);
    return success(res, user, 'User updated successfully');
  } catch (err) {
    next(err);
  }
};


const deleteUserController = async (req, res, next) => {
  try {
    await adminService.deleteUser(req.user.id, req.params.id);
    return success(res, null, 'User deleted successfully');
  } catch (err) {
    next(err);
  }
};


const listDepartmentsController = async (req, res, next) => {
  try {
    const departments = await adminService.listDepartments();
    return success(res, departments, 'Departments retrieved successfully');
  } catch (err) {
    next(err);
  }
};


const createDepartmentController = async (req, res, next) => {
  try {
    const department = await adminService.createDepartment(req.user.id, req.body);
    return created(res, department, 'Department created successfully');
  } catch (err) {
    next(err);
  }
};


const updateDepartmentController = async (req, res, next) => {
  try {
    const department = await adminService.updateDepartment(req.user.id, req.params.id, req.body);
    return success(res, department, 'Department updated successfully');
  } catch (err) {
    next(err);
  }
};


const deleteDepartmentController = async (req, res, next) => {
  try {
    await adminService.deleteDepartment(req.user.id, req.params.id);
    return success(res, null, 'Department deleted successfully');
  } catch (err) {
    next(err);
  }
};


const getAllEntriesController = async (req, res, next) => {
  try {
    const { page, limit, status, student_id, week_number } = req.query;
    const result = await adminService.getAllEntries({ page, limit, status, student_id, week_number });
    return success(res, result, 'All log entries retrieved successfully');
  } catch (err) {
    next(err);
  }
};


const exportEntriesController = async (req, res, next) => {
  try {
    const csv = await adminService.exportEntriesCSV(req.user.id);
    res.header('Content-Type', 'text/csv; charset=utf-8');
    res.header('Content-Disposition', 'attachment; filename=log_entries_export.csv');
    return res.send(csv);
  } catch (err) {
    next(err);
  }
};


const purgeOldDataController = async (req, res, next) => {
  try {
    const { daysOld } = req.body;
    const result = await adminService.purgeOldData(req.user.id, daysOld || 365);
    return success(res, result, 'Old data purged successfully');
  } catch (err) {
    next(err);
  }
};


module.exports = {
  getDashboardController,
  listUsersController,
  createUserController,
  updateUserController,
  deleteUserController,
  listDepartmentsController,
  createDepartmentController,
  updateDepartmentController,
  deleteDepartmentController,
  getAllEntriesController,
  exportEntriesController,
  purgeOldDataController,
};

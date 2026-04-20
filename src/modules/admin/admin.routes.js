const express = require('express');
const router = express.Router();
const {
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
} = require('./admin.controller');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/rbac');

// All routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

/**
 * @swagger
 * /admin/dashboard:
 *   get:
 *     summary: Get admin dashboard
 *     description: Retrieve system-wide statistics and overview
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         students:
 *                           type: integer
 *                     logEntries:
 *                       type: object
 *                     notifications:
 *                       type: object
 *                     files:
 *                       type: object
 */
router.get('/dashboard', getDashboardController);

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: List users
 *     description: Get paginated list of all users with optional filtering
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [student, supervisor, admin]
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
 *                     pagination:
 *                       type: object
 */
router.get('/users', listUsersController);

/**
 * @swagger
 * /admin/users:
 *   post:
 *     summary: Create user
 *     description: Create new user account (logs audit entry)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, role, department]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               role:
 *                 type: string
 *                 enum: [student, supervisor, admin]
 *               department:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/User'
 */
router.post('/users', createUserController);

/**
 * @swagger
 * /admin/users/{id}:
 *   put:
 *     summary: Update user
 *     description: Update user information (logs audit entry)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *               department:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/User'
 */
router.put('/users/:id', updateUserController);

/**
 * @swagger
 * /admin/users/{id}:
 *   delete:
 *     summary: Delete user
 *     description: Soft delete user (logs audit entry)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User deleted successfully
 */
router.delete('/users/:id', deleteUserController);

/**
 * @swagger
 * /admin/departments:
 *   get:
 *     summary: List departments
 *     description: Get all departments in the system
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Departments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       code:
 *                         type: string
 */
router.get('/departments', listDepartmentsController);

/**
 * @swagger
 * /admin/departments:
 *   post:
 *     summary: Create department
 *     description: Create new department (logs audit entry)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, code]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Computer Science
 *               code:
 *                 type: string
 *                 example: CSC
 *               supervisor_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Department created successfully
 */
router.post('/departments', createDepartmentController);

/**
 * @swagger
 * /admin/departments/{id}:
 *   put:
 *     summary: Update department
 *     description: Update department information (logs audit entry)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               supervisor_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Department updated successfully
 */
router.put('/departments/:id', updateDepartmentController);

/**
 * @swagger
 * /admin/departments/{id}:
 *   delete:
 *     summary: Delete department
 *     description: Delete department (logs audit entry)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Department deleted successfully
 */
router.delete('/departments/:id', deleteDepartmentController);

/**
 * @swagger
 * /admin/log-entries:
 *   get:
 *     summary: Get all log entries
 *     description: Get all log entries system-wide with filtering options
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: student_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: week_number
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Entries retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     entries:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/LogEntry'
 *                     pagination:
 *                       type: object
 */
router.get('/log-entries', getAllEntriesController);

/**
 * @swagger
 * /admin/reports/export:
 *   get:
 *     summary: Export entries as CSV
 *     description: Download all log entries as CSV file
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: CSV file download
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 */
router.get('/reports/export', exportEntriesController);

/**
 * @swagger
 * /admin/data/purge:
 *   delete:
 *     summary: Purge old data
 *     description: Hard delete entries older than specified days (logs audit entry)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [daysOld]
 *             properties:
 *               daysOld:
 *                 type: integer
 *                 example: 365
 *                 description: Delete entries older than X days
 *     responses:
 *       200:
 *         description: Data purged successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                     daysOld:
 *                       type: integer
 *                     cutoffDate:
 *                       type: string
 *                       format: date-time
 */
router.delete('/data/purge', purgeOldDataController);

module.exports = router;

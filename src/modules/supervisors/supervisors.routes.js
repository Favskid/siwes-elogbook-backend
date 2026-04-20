const express = require('express');
const router = express.Router();
const {
  getDashboardController,
  getAssignedEntriesController,
  approveEntryController,
  rejectEntryController,
  getAssignedStudentsController,
  getStudentProgressController,
  bulkApproveEntriesController,
} = require('./supervisors.controller');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/rbac');

// All routes require authentication and supervisor role
router.use(authenticate);
router.use(authorize('supervisor', 'admin'));

/**
 * @swagger
 * /supervisors/dashboard:
 *   get:
 *     summary: Get supervisor dashboard
 *     description: Retrieve supervisor dashboard with statistics and assigned entries count
 *     tags: [Supervisors]
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
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     stats:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         pending:
 *                           type: integer
 *                         approved:
 *                           type: integer
 *                         rejected:
 *                           type: integer
 *                     assignedStudentsCount:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 */
router.get('/dashboard', getDashboardController);

/**
 * @swagger
 * /supervisors/entries:
 *   get:
 *     summary: Get assigned entries
 *     description: Get paginated list of entries assigned to supervisor for review
 *     tags: [Supervisors]
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
 *           enum: [draft, pending, approved, rejected]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: Entries retrieved successfully
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
 *                     entries:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/LogEntry'
 *                     pagination:
 *                       type: object
 */
router.get('/entries', getAssignedEntriesController);

/**
 * @swagger
 * /supervisors/entries/{id}/approve:
 *   put:
 *     summary: Approve log entry
 *     description: Approve a log entry with supervisor comment (triggers notification)
 *     tags: [Supervisors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Entry ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [comment]
 *             properties:
 *               comment:
 *                 type: string
 *                 example: Excellent work! Your analysis was thorough and well-documented.
 *     responses:
 *       200:
 *         description: Entry approved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/LogEntry'
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Entry not found
 */
router.put('/entries/:id/approve', approveEntryController);

/**
 * @swagger
 * /supervisors/entries/{id}/reject:
 *   put:
 *     summary: Reject log entry
 *     description: Reject a log entry with feedback comment (entry reverted to draft)
 *     tags: [Supervisors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Entry ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [comment]
 *             properties:
 *               comment:
 *                 type: string
 *                 minLength: 20
 *                 example: Please provide more details about the challenges faced and how you overcame them.
 *     responses:
 *       200:
 *         description: Entry rejected successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/LogEntry'
 *       400:
 *         description: Comment required or invalid status
 *       404:
 *         description: Entry not found
 */
router.put('/entries/:id/reject', rejectEntryController);

/**
 * @swagger
 * /supervisors/entries/bulk-approve:
 *   put:
 *     summary: Bulk approve log entries
 *     description: Approve multiple log entries at once
 *     tags: [Supervisors]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [entryIds]
 *             properties:
 *               entryIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Entries approved successfully
 */
router.put('/entries/bulk-approve', bulkApproveEntriesController);

/**
 * @swagger
 * /supervisors/students:
 *   get:
 *     summary: Get assigned students
 *     description: Get list of students assigned to this supervisor
 *     tags: [Supervisors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Students retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 */
router.get('/students', getAssignedStudentsController);

/**
 * @swagger
 * /supervisors/students/{studentId}/progress:
 *   get:
 *     summary: Get student progress
 *     description: Get detailed progress statistics for a specific student
 *     tags: [Supervisors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Student ID
 *     responses:
 *       200:
 *         description: Student progress retrieved successfully
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
 *                     student:
 *                       $ref: '#/components/schemas/User'
 *                     stats:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         approved:
 *                           type: integer
 *                         pending:
 *                           type: integer
 *                         rejected:
 *                           type: integer
 *                     recentEntries:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/LogEntry'
 *       404:
 *         description: Student not found
 */
router.get('/students/:studentId/progress', getStudentProgressController);

module.exports = router;

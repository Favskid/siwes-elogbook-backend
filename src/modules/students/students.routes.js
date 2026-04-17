const express = require('express');
const router = express.Router();
const {
  getProfileController,
  updateProfileController,
  getDashboardController,
} = require('./students.controller');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/rbac');

// All routes are protected — require authentication and student role
router.use(authenticate);
router.use(authorize('student'));

/**
 * @swagger
 * /students/profile:
 *   get:
 *     summary: Get student profile
 *     description: Retrieve the authenticated student's profile information
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
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
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */
router.get('/profile', getProfileController);

/**
 * @swagger
 * /students/profile:
 *   put:
 *     summary: Update student profile
 *     description: Update authenticated student's profile information
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Updated
 *               phone:
 *                 type: string
 *                 example: 08087654321
 *               avatar:
 *                 type: string
 *                 example: https://example.com/avatar.jpg
 *     responses:
 *       200:
 *         description: Profile updated successfully
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
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.put('/profile', updateProfileController);

/**
 * @swagger
 * /students/dashboard:
 *   get:
 *     summary: Get student dashboard
 *     description: Retrieve student dashboard with statistics and recent entries
 *     tags: [Students]
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
 *                         approved:
 *                           type: integer
 *                         pending:
 *                           type: integer
 *                         draft:
 *                           type: integer
 *                         rejected:
 *                           type: integer
 *                     recentEntries:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/LogEntry'
 *                     unreadNotifications:
 *                       type: object
 *       401:
 *         description: Unauthorized
 */
router.get('/dashboard', getDashboardController);

module.exports = router;

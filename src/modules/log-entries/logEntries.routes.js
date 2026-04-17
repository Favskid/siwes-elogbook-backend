const express = require('express');
const router = express.Router();
const {
  createEntryController,
  getEntryController,
  listEntriesController,
  updateEntryController,
  submitEntryController,
  deleteEntryController,
} = require('./logEntries.controller');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/rbac');
const { uploadLogEntryFiles, handleUploadErrors } = require('../../middleware/uploadHandler');

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /log-entries:
 *   post:
 *     summary: Create new log entry with files
 *     description: Create a new log entry and upload up to 5 files
 *     tags: [Log Entries]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [date, week_number, activity_description, tools_equipment, skills_acquired, challenges_faced]
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 example: 2024-04-15
 *               week_number:
 *                 type: integer
 *                 example: 15
 *               activity_description:
 *                 type: string
 *                 minLength: 50
 *                 example: Worked on database optimization with team members...
 *               tools_equipment:
 *                 type: string
 *                 minLength: 10
 *                 example: PostgreSQL, pgAdmin, DBeaver
 *               skills_acquired:
 *                 type: string
 *                 minLength: 10
 *                 example: Database optimization, query profiling
 *               challenges_faced:
 *                 type: string
 *                 minLength: 10
 *                 example: Complex query optimization required deep analysis
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 maxItems: 5
 *                 description: Upload up to 5 files (10MB each, PDF/Images/Docs)
 *     responses:
 *       201:
 *         description: Entry created successfully
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
 *                   $ref: '#/components/schemas/LogEntry'
 *       400:
 *         description: Validation error
 *       413:
 *         description: File too large
 */
router.post(
  '/',
  authorize('student'),
  uploadLogEntryFiles,
  handleUploadErrors,
  createEntryController
);

/**
 * @swagger
 * /log-entries:
 *   get:
 *     summary: List log entries
 *     description: Get paginated list of log entries (role-aware filtering)
 *     tags: [Log Entries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, pending, approved, rejected]
 *         description: Filter by status
 *       - in: query
 *         name: week_number
 *         schema:
 *           type: integer
 *         description: Filter by week number
 *       - in: query
 *         name: date_from
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter from date (YYYY-MM-DD)
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter to date (YYYY-MM-DD)
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
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     entries:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/LogEntry'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         pages:
 *                           type: integer
 */
router.get('/', listEntriesController);

/**
 * @swagger
 * /log-entries/{id}:
 *   get:
 *     summary: Get single log entry
 *     description: Retrieve a specific log entry with all details
 *     tags: [Log Entries]
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
 *     responses:
 *       200:
 *         description: Entry retrieved successfully
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
 *                   $ref: '#/components/schemas/LogEntry'
 *       404:
 *         description: Entry not found
 */
router.get('/:id', getEntryController);

/**
 * @swagger
 * /log-entries/{id}:
 *   put:
 *     summary: Update log entry
 *     description: Update a log entry (draft or pending status only)
 *     tags: [Log Entries]
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
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               week_number:
 *                 type: integer
 *               activity_description:
 *                 type: string
 *                 minLength: 50
 *               tools_equipment:
 *                 type: string
 *               skills_acquired:
 *                 type: string
 *               challenges_faced:
 *                 type: string
 *     responses:
 *       200:
 *         description: Entry updated successfully
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
 *                   $ref: '#/components/schemas/LogEntry'
 *       400:
 *         description: Validation error or invalid status
 *       404:
 *         description: Entry not found
 */
router.put('/:id', authorize('student'), updateEntryController);

/**
 * @swagger
 * /log-entries/{id}/submit:
 *   put:
 *     summary: Submit log entry
 *     description: Submit entry from draft status to pending (triggers notification)
 *     tags: [Log Entries]
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
 *     responses:
 *       200:
 *         description: Entry submitted successfully
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
 *                   $ref: '#/components/schemas/LogEntry'
 *       400:
 *         description: Entry must be in draft status
 *       404:
 *         description: Entry not found
 */
router.put('/:id/submit', authorize('student'), submitEntryController);

/**
 * @swagger
 * /log-entries/{id}:
 *   delete:
 *     summary: Delete log entry
 *     description: Soft delete a log entry (draft or pending only)
 *     tags: [Log Entries]
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
 *     responses:
 *       200:
 *         description: Entry deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Entry must be in draft or pending status
 *       404:
 *         description: Entry not found
 */
router.delete('/:id', authorize('student'), deleteEntryController);

module.exports = router;

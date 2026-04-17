const express = require('express');
const router = express.Router();
const {
  uploadFileController,
  getFileController,
  deleteFileController,
  getEntryFilesController,
} = require('./files.controller');
const { authenticate } = require('../../middleware/auth');
const { uploadLogEntryFiles, handleUploadErrors } = require('../../middleware/uploadHandler');

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /files/upload/{entryId}:
 *   post:
 *     summary: Upload files to entry
 *     description: Upload up to 5 files to a log entry (10MB each)
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entryId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Log entry ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [files]
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 maxItems: 5
 *                 description: Upload up to 5 files (PDF, Images, Office docs)
 *     responses:
 *       201:
 *         description: File uploaded successfully
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
 *                   $ref: '#/components/schemas/File'
 *       400:
 *         description: Bad request or invalid file
 *       413:
 *         description: File size exceeds 10MB limit
 *       404:
 *         description: Entry not found
 */
router.post(
  '/upload/:entryId',
  uploadLogEntryFiles,
  handleUploadErrors,
  uploadFileController
);

/**
 * @swagger
 * /files/{fileId}:
 *   get:
 *     summary: Download file
 *     description: Download a file from the server (binary response)
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: File ID
 *     responses:
 *       200:
 *         description: File download successful
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       403:
 *         description: Access denied - insufficient permissions
 *       404:
 *         description: File not found
 */
router.get('/:fileId', getFileController);

/**
 * @swagger
 * /files/{fileId}:
 *   delete:
 *     summary: Delete file
 *     description: Delete a file from disk and database
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: File ID
 *     responses:
 *       200:
 *         description: File deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       403:
 *         description: Access denied - insufficient permissions
 *       404:
 *         description: File not found
 */
router.delete('/:fileId', deleteFileController);

/**
 * @swagger
 * /files/entry/{entryId}:
 *   get:
 *     summary: Get entry files
 *     description: Get all files associated with a log entry
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entryId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Log entry ID
 *     responses:
 *       200:
 *         description: Files retrieved successfully
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
 *                     $ref: '#/components/schemas/File'
 *       404:
 *         description: Entry not found
 */
router.get('/entry/:entryId', getEntryFilesController);

module.exports = router;

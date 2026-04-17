const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

// ─── Upload Directories ───────────────────────────────────────

const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
const logsDir = path.join(uploadsDir, 'log-entries');

// Create directories if they don't exist
[uploadsDir, logsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});


// ─── Multer Disk Storage ──────────────────────────────────────

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, logsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: uuid_originalname
    const uniqueName = `${uuidv4()}_${file.originalname}`;
    cb(null, uniqueName);
  },
});


// ─── File Filter ───────────────────────────────────────────────

const fileFilter = (req, file, cb) => {
  // Allowed MIME types for documents, images, etc.
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} not allowed`), false);
  }
};


// ─── Multer Middleware ────────────────────────────────────────

const uploadFiles = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 5, // max 5 files
  },
  // Handle errors
  onError: (err, next) => {
    next(err);
  },
});


// ─── Middleware for handling upload with error wrapper ────────

const uploadLogEntryFiles = uploadFiles.array('files', 5);

const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: 'File size exceeds 10MB limit',
        },
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(413).json({
        success: false,
        error: {
          code: 'TOO_MANY_FILES',
          message: 'Maximum 5 files allowed',
        },
      });
    }
  }
  if (err && err.message && err.message.includes('File type')) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_FILE_TYPE',
        message: err.message,
      },
    });
  }
  next(err);
};


module.exports = { uploadLogEntryFiles, handleUploadErrors };

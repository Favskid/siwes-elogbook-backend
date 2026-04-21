// Error handling middleware
const env = require('../config/env');

const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err);

  // Duplicate key (PostgreSQL error code 23505)
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      error: {
        code: 'CONFLICT',
        message: 'Resource already exists',
        details: err.detail || {},
      },
    });
  }

  // Foreign key violation (PostgreSQL error code 23503)
  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Referenced resource does not exist',
        details: err.detail || {},
      },
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Invalid token',
        details: {},
      },
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Token has expired',
        details: {},
      },
    });
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'File size exceeds the 10MB limit',
        details: {},
      },
    });
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Too many files. Maximum 5 files per entry',
        details: {},
      },
    });
  }

  // Default server error
  const statusCode = err.statusCode || 500;
  const message = (env.nodeEnv === 'production' && statusCode >= 500) ? 'Internal server error' : err.message;
  const code = err.code || 'INTERNAL_SERVER_ERROR';

  // Return response with helpful field for frontend
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      errorType: code, // Helps frontend handle specific error types
      details: {},
    },
    // Helper hints for development
    ...(env.nodeEnv !== 'production' && { hint: `Use code "${code}" to handle this error type in frontend` }),
  });
};

module.exports = errorHandler;
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { query } = require('../config/db');
const { createError } = require('../utils/helpers');

const authenticate = async (req, res, next) => {
  try {
    // 1. Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(createError('Authentication token is required', 401, 'AUTHENTICATION_REQUIRED'));
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return next(createError('Authentication token is required', 401, 'AUTHENTICATION_REQUIRED'));
    }

    // 2. Check if token is blacklisted (logged out)
    const blacklisted = await query(
      'SELECT id FROM token_blacklist WHERE token = $1',
      [token]
    );

    if (blacklisted.rows.length > 0) {
      return next(createError('Token has been invalidated. Please log in again.', 401, 'AUTHENTICATION_REQUIRED'));
    }

    // 3. Verify token
    const decoded = jwt.verify(token, env.jwt.secret);

    // 4. Check user still exists and is active
    const result = await query(
      'SELECT id, name, email, role, is_active, is_deleted FROM users WHERE id = $1',
      [decoded.sub]
    );

    if (result.rows.length === 0 || result.rows[0].is_deleted) {
      return next(createError('User no longer exists', 401, 'AUTHENTICATION_REQUIRED'));
    }

    if (!result.rows[0].is_active) {
      return next(createError('Your account has been deactivated. Contact admin.', 403, 'AUTHORIZATION_ERROR'));
    }

    // 5. Attach user to request
    req.user = result.rows[0];
    req.token = token;

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { authenticate };

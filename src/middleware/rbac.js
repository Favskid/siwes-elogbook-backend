const { createError } = require('../utils/helpers');

/**
 * Restrict route to specific roles
 * Usage: authorize('admin') or authorize('student', 'supervisor')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(createError('Authentication required', 401, 'AUTHENTICATION_REQUIRED'));
    }

    if (!roles.includes(req.user.role)) {
      return next(createError(
        'You do not have permission to perform this action',
        403,
        'AUTHORIZATION_ERROR'
      ));
    }

    next();
  };
};

module.exports = { authorize };

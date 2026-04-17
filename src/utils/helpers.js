/**
 * Remove sensitive fields from user object before sending response
 */
const sanitizeUser = (user) => {
  const { password, is_deleted, ...safeUser } = user;
  return safeUser;
};

/**
 * Build pagination metadata
 */
const paginate = (total, page, limit) => {
  return {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / limit),
  };
};

/**
 * Get offset for SQL queries
 */
const getOffset = (page, limit) => {
  return (parseInt(page) - 1) * parseInt(limit);
};

/**
 * Validate email format
 */
const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Validate password strength
 * Min 8 chars, uppercase, lowercase, number, special char
 */
const isValidPassword = (password) => {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#\-_])[A-Za-z\d@$!%*?&^#\-_]{8,}$/;
  return regex.test(password);
};

/**
 * Validate matric number format: DEPT/YEAR/NUMBER
 */
const isValidMatricNumber = (matric) => {
  const regex = /^[A-Z]{2,10}\/\d{4}\/\d{3,6}$/;
  return regex.test(matric);
};

/**
 * Create a custom error with status code
 */
const createError = (message, statusCode = 400, code = 'BAD_REQUEST') => {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.code = code;
  return err;
};

module.exports = {
  sanitizeUser,
  paginate,
  getOffset,
  isValidEmail,
  isValidPassword,
  isValidMatricNumber,
  createError,
};
// Rate limiting middleware
const rateLimit = require('express-rate-limit');
const { error } = require('../utils/response');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  handler: (req, res) => {
    return error(res, 'Too many attempts. Please try again after 15 minutes.', 429, 'RATE_LIMITED');
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100,
  handler: (req, res) => {
    return error(res, 'Too many requests. Please try again later.', 429, 'RATE_LIMITED');
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { authLimiter, generalLimiter };
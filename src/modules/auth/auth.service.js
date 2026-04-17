const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../../config/db');
const env = require('../../config/env');
const {
  isValidEmail,
  isValidPassword,
  isValidMatricNumber,
  sanitizeUser,
  createError,
} = require('../../utils/helpers');


// ─── Validation ───────────────────────────────────────────────

const validateRegisterInput = (body) => {
  const errors = [];
  const { name, email, password, role, matric_number, department, company } = body;

  if (!name || name.trim().length < 2 || name.trim().length > 100) {
    errors.push('Name must be between 2 and 100 characters');
  }

  if (!email || !isValidEmail(email)) {
    errors.push('A valid email address is required');
  }

  if (!password || !isValidPassword(password)) {
    errors.push('Password must be at least 8 characters and include uppercase, lowercase, number, and special character');
  }

  const validRoles = ['student', 'industry_supervisor', 'school_supervisor', 'admin'];
  if (!role || !validRoles.includes(role)) {
    errors.push(`Role must be one of: ${validRoles.join(', ')}`);
  }

  if (role === 'student') {
    if (!matric_number) {
      errors.push('Matric number is required for students');
    } else if (!isValidMatricNumber(matric_number)) {
      errors.push('Matric number format must be DEPT/YEAR/NUMBER e.g. CSC/2021/001');
    }
    if (!department || department.trim().length < 2) {
      errors.push('Department is required for students');
    }
  }

  if (role === 'industry_supervisor') {
    if (!company || company.trim().length < 2) {
      errors.push('Company name is required for industry supervisors');
    }
  }

  if (role === 'school_supervisor') {
    if (!department || department.trim().length < 2) {
      errors.push('Department is required for school supervisors');
    }
  }

  return errors;
};

const validateLoginInput = (body) => {
  const errors = [];
  const { emailOrMatric, password, role } = body;

  if (!emailOrMatric || emailOrMatric.trim().length < 3) {
    errors.push('Email or matric number is required');
  }

  if (!password) {
    errors.push('Password is required');
  }

  const validRoles = ['student', 'industry_supervisor', 'school_supervisor', 'admin'];
  if (!role || !validRoles.includes(role)) {
    errors.push(`Role must be one of: ${validRoles.join(', ')}`);
  }

  return errors;
};


// ─── Token Helpers ────────────────────────────────────────────

const generateAccessToken = (user) => {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
    },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { sub: user.id },
    env.jwt.refreshSecret,
    { expiresIn: env.jwt.refreshExpiresIn }
  );
};


// ─── Auth Services ────────────────────────────────────────────

const register = async (body) => {
  // 1. Validate inputs
  const errors = validateRegisterInput(body);
  if (errors.length > 0) {
    throw createError(errors[0], 400, 'VALIDATION_ERROR');
  }

  const { name, email, password, role, matric_number, department, company, phone } = body;

  // 2. Check if email already exists
  const emailCheck = await query(
    'SELECT id FROM users WHERE email = $1',
    [email.toLowerCase().trim()]
  );
  if (emailCheck.rows.length > 0) {
    throw createError('An account with this email already exists', 409, 'CONFLICT');
  }

  // 3. Check if matric number already exists (students only)
  if (matric_number) {
    const matricCheck = await query(
      'SELECT id FROM users WHERE matric_number = $1',
      [matric_number.trim()]
    );
    if (matricCheck.rows.length > 0) {
      throw createError('An account with this matric number already exists', 409, 'CONFLICT');
    }
  }

  // 4. Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // 5. Insert user into DB
  const result = await query(
    `INSERT INTO users (
      id, name, email, password, role,
      matric_number, department, company, phone
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9
    ) RETURNING *`,
    [
      uuidv4(),
      name.trim(),
      email.toLowerCase().trim(),
      hashedPassword,
      role,
      matric_number ? matric_number.trim() : null,
      department ? department.trim() : null,
      company ? company.trim() : null,
      phone ? phone.trim() : null,
    ]
  );

  const user = result.rows[0];

  // 6. Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  return {
    user: sanitizeUser(user),
    token: accessToken,
    refreshToken,
    expiresIn: env.jwt.expiresIn,
  };
};


const login = async (body) => {
  // 1. Validate inputs
  const errors = validateLoginInput(body);
  if (errors.length > 0) {
    throw createError(errors[0], 400, 'VALIDATION_ERROR');
  }

  const { emailOrMatric, password, role } = body;

  // 2. Find user by email or matric number
  const isEmail = isValidEmail(emailOrMatric);

  const result = await query(
    `SELECT * FROM users
     WHERE (email = $1 OR matric_number = $1)
     AND role = $2
     AND is_deleted = FALSE`,
    [emailOrMatric.toLowerCase().trim(), role]
  );

  if (result.rows.length === 0) {
    throw createError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  const user = result.rows[0];

  // 3. Check account is active
  if (!user.is_active) {
    throw createError('Your account has been deactivated. Contact the administrator.', 403, 'AUTHORIZATION_ERROR');
  }

  // 4. Compare password
  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    throw createError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  // 5. Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  return {
    user: sanitizeUser(user),
    token: accessToken,
    refreshToken,
    expiresIn: env.jwt.expiresIn,
  };
};


const logout = async (token, userId) => {
  // Decode token to get expiry (without verifying — it may already be expired)
  const decoded = jwt.decode(token);
  const expiresAt = decoded?.exp
    ? new Date(decoded.exp * 1000).toISOString()
    : new Date(Date.now() + env.jwt.expiresIn * 1000).toISOString();

  // Add token to blacklist
  await query(
    `INSERT INTO token_blacklist (id, token, user_id, expires_at)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (token) DO NOTHING`,
    [uuidv4(), token, userId, expiresAt]
  );

  return true;
};


const refreshToken = async (body) => {
  const { refreshToken: token } = body;

  if (!token) {
    throw createError('Refresh token is required', 400, 'VALIDATION_ERROR');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, env.jwt.refreshSecret);
  } catch (err) {
    throw createError('Invalid or expired refresh token', 401, 'AUTHENTICATION_REQUIRED');
  }

  // Get user
  const result = await query(
    'SELECT * FROM users WHERE id = $1 AND is_deleted = FALSE AND is_active = TRUE',
    [decoded.sub]
  );

  if (result.rows.length === 0) {
    throw createError('User not found', 401, 'AUTHENTICATION_REQUIRED');
  }

  const user = result.rows[0];
  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);

  return {
    token: newAccessToken,
    refreshToken: newRefreshToken,
    expiresIn: env.jwt.expiresIn,
  };
};


module.exports = { register, login, logout, refreshToken };

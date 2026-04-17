const authService = require('./auth.service');
const { success, created, error } = require('../../utils/response');

const registerController = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    return created(res, result, 'Account created successfully');
  } catch (err) {
    next(err);
  }
};

const loginController = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    return success(res, result, 'Login successful');
  } catch (err) {
    next(err);
  }
};

const logoutController = async (req, res, next) => {
  try {
    await authService.logout(req.token, req.user.id);
    return success(res, null, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
};

const refreshTokenController = async (req, res, next) => {
  try {
    const result = await authService.refreshToken(req.body);
    return success(res, result, 'Token refreshed successfully');
  } catch (err) {
    next(err);
  }
};

const getMeController = async (req, res, next) => {
  try {
    // req.user is already attached by authenticate middleware
    return success(res, req.user, 'Authenticated user fetched');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  registerController,
  loginController,
  logoutController,
  refreshTokenController,
  getMeController,
};

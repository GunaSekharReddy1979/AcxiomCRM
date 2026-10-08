const authService = require('../services/authService');

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser({ email, password, req });
    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: result
    });
  } catch (err) {
    next(err);
  }
}

async function register(req, res, next) {
  try {
    const { name, email, password, roleId, department, phone } = req.body;
    const result = await authService.registerUser({ name, email, password, roleId, department, phone, req });
    return res.status(201).json({
      success: true,
      message: 'Registration successful. You may now log in.',
      data: result
    });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    await authService.logoutUser({ userId: req.user?.userId, req });
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully.'
    });
  } catch (err) {
    next(err);
  }
}

async function getMe(req, res, next) {
  try {
    return res.status(200).json({
      success: true,
      data: req.user
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { login, register, logout, getMe };

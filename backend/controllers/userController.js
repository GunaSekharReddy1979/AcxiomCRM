const userService = require('../services/userService');

async function getUsers(req, res, next) {
  try {
    const users = await userService.getUsers(req.query);
    return res.status(200).json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
}

async function getUserById(req, res, next) {
  try {
    const user = await userService.getUserById(req.params.id);
    return res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

async function createUser(req, res, next) {
  try {
    const user = await userService.createUser(req.user, req.body, req);
    return res.status(201).json({
      success: true,
      message: 'User created successfully.',
      data: user
    });
  } catch (err) {
    next(err);
  }
}

async function updateUser(req, res, next) {
  try {
    const user = await userService.updateUser(req.user, req.params.id, req.body, req);
    return res.status(200).json({
      success: true,
      message: 'User updated successfully.',
      data: user
    });
  } catch (err) {
    next(err);
  }
}

async function unlockUser(req, res, next) {
  try {
    const result = await userService.unlockUser(req.user, req.params.id, req);
    return res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (err) {
    next(err);
  }
}

async function toggleStatus(req, res, next) {
  try {
    const result = await userService.toggleUserStatus(req.user, req.params.id, req);
    return res.status(200).json({
      success: true,
      message: result.message,
      data: result
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  unlockUser,
  toggleStatus
};

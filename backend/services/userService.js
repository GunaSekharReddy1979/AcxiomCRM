const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { User, Role } = require('../models');
const { logAudit } = require('../utils/auditLogger');

async function getUsers(query = {}) {
  const { search, roleId, status } = query;
  const where = {};

  if (roleId) where.RoleId = roleId;
  if (status !== undefined && status !== '') {
    where.IsActive = status === 'active' || status === 'true';
  }

  if (search) {
    const s = `%${search.trim()}%`;
    where[Op.or] = [
      { Name: { [Op.like]: s } },
      { Email: { [Op.like]: s } },
      { Department: { [Op.like]: s } }
    ];
  }

  const users = await User.findAll({
    where,
    attributes: ['UserId', 'Name', 'Email', 'RoleId', 'Department', 'Phone', 'IsActive', 'FailedLoginCount', 'LockoutEnd', 'CreatedDate'],
    include: [{ model: Role, as: 'role', attributes: ['RoleId', 'RoleName'] }],
    order: [['UserId', 'ASC']]
  });

  return users.map(u => {
    const plain = u.toJSON();
    plain.isLocked = plain.LockoutEnd && new Date(plain.LockoutEnd) > new Date();
    return plain;
  });
}

async function getUserById(userId) {
  const user = await User.findByPk(userId, {
    attributes: ['UserId', 'Name', 'Email', 'RoleId', 'Department', 'Phone', 'IsActive', 'FailedLoginCount', 'LockoutEnd', 'CreatedDate'],
    include: [{ model: Role, as: 'role' }]
  });

  if (!user) {
    const error = new Error('User not found.');
    error.status = 404;
    error.isOperational = true;
    throw error;
  }

  const plain = user.toJSON();
  plain.isLocked = plain.LockoutEnd && new Date(plain.LockoutEnd) > new Date();
  return plain;
}

async function createUser(adminUser, data, req) {
  const { name, email, password, roleId, department = 'Direct Sales', phone } = data;

  const normalizedEmail = email.toLowerCase().trim();
  const existing = await User.findOne({ where: { Email: normalizedEmail } });
  if (existing) {
    const error = new Error('A user with this email address already exists.');
    error.status = 409;
    error.isOperational = true;
    throw error;
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const newUser = await User.create({
    Name: name.trim(),
    Email: normalizedEmail,
    PasswordHash: passwordHash,
    RoleId: roleId || 3,
    Department: department,
    Phone: phone || null,
    IsActive: true,
    FailedLoginCount: 0
  });

  const role = await Role.findByPk(newUser.RoleId);

  await logAudit({
    userId: adminUser.userId,
    action: 'CREATE_USER',
    entityName: 'User',
    recordId: newUser.UserId,
    oldValue: null,
    newValue: { email: newUser.Email, name: newUser.Name, role: role?.RoleName },
    req
  });

  return {
    userId: newUser.UserId,
    name: newUser.Name,
    email: newUser.Email,
    roleId: newUser.RoleId,
    roleName: role ? role.RoleName : 'Sales Executive',
    department: newUser.Department,
    isActive: newUser.IsActive
  };
}

async function updateUser(adminUser, userId, data, req) {
  const user = await User.findByPk(userId, {
    include: [{ model: Role, as: 'role' }]
  });

  if (!user) {
    const error = new Error('User not found.');
    error.status = 404;
    error.isOperational = true;
    throw error;
  }

  const oldValues = {
    name: user.Name,
    email: user.Email,
    roleId: user.RoleId,
    roleName: user.role?.RoleName,
    isActive: user.IsActive,
    department: user.Department
  };

  let roleChanged = false;
  if (data.roleId && data.roleId !== user.RoleId) {
    user.RoleId = data.roleId;
    roleChanged = true;
  }

  if (data.name) user.Name = data.name.trim();
  if (data.department) user.Department = data.department.trim();
  if (data.phone !== undefined) user.Phone = data.phone;
  if (data.isActive !== undefined) user.IsActive = data.isActive;

  if (data.password) {
    const salt = await bcrypt.genSalt(10);
    user.PasswordHash = await bcrypt.hash(data.password, salt);
  }

  await user.save();

  const newRole = await Role.findByPk(user.RoleId);

  // If role changed, record explicit ROLE_CHANGE audit log
  if (roleChanged) {
    await logAudit({
      userId: adminUser.userId,
      action: 'ROLE_CHANGE',
      entityName: 'User',
      recordId: user.UserId,
      oldValue: { roleId: oldValues.roleId, role: oldValues.roleName },
      newValue: { roleId: user.RoleId, role: newRole?.RoleName },
      req
    });
  }

  await logAudit({
    userId: adminUser.userId,
    action: 'UPDATE_USER',
    entityName: 'User',
    recordId: user.UserId,
    oldValue: oldValues,
    newValue: {
      name: user.Name,
      roleId: user.RoleId,
      isActive: user.IsActive,
      department: user.Department
    },
    req
  });

  return {
    userId: user.UserId,
    name: user.Name,
    email: user.Email,
    roleId: user.RoleId,
    roleName: newRole ? newRole.RoleName : 'Sales Executive',
    department: user.Department,
    isActive: user.IsActive
  };
}

async function unlockUser(adminUser, userId, req) {
  const user = await User.findByPk(userId);
  if (!user) {
    const error = new Error('User not found.');
    error.status = 404;
    error.isOperational = true;
    throw error;
  }

  user.FailedLoginCount = 0;
  user.LockoutEnd = null;
  await user.save();

  await logAudit({
    userId: adminUser.userId,
    action: 'UNLOCK_USER',
    entityName: 'User',
    recordId: user.UserId,
    newValue: { message: `Account unlocked by admin ${adminUser.name}` },
    req
  });

  return { message: `Account for ${user.Email} has been unlocked successfully.` };
}

async function toggleUserStatus(adminUser, userId, req) {
  const user = await User.findByPk(userId);
  if (!user) {
    const error = new Error('User not found.');
    error.status = 404;
    error.isOperational = true;
    throw error;
  }

  // Prevent admin from deactivating themselves
  if (user.UserId === adminUser.userId) {
    const error = new Error('Cannot deactivate your own administrator account.');
    error.status = 400;
    error.isOperational = true;
    throw error;
  }

  const oldStatus = user.IsActive;
  user.IsActive = !user.IsActive;
  await user.save();

  await logAudit({
    userId: adminUser.userId,
    action: user.IsActive ? 'ACTIVATE_USER' : 'DEACTIVATE_USER',
    entityName: 'User',
    recordId: user.UserId,
    oldValue: { isActive: oldStatus },
    newValue: { isActive: user.IsActive },
    req
  });

  return {
    userId: user.UserId,
    isActive: user.IsActive,
    message: `User ${user.IsActive ? 'activated' : 'deactivated'} successfully.`
  };
}

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  unlockUser,
  toggleUserStatus
};

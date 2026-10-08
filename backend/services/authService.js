const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Role } = require('../models');
const { logAudit } = require('../utils/auditLogger');

const MAX_FAILED_ATTEMPTS = parseInt(process.env.MAX_FAILED_LOGIN_ATTEMPTS || '5', 10);
const LOCKOUT_MINUTES = parseInt(process.env.LOCKOUT_MINUTES || '15', 10);

async function loginUser({ email, password, req }) {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({
    where: { Email: normalizedEmail },
    include: [{ model: Role, as: 'role' }]
  });

  if (!user) {
    await logAudit({
      userId: null,
      action: 'FAILED_LOGIN',
      entityName: 'Auth',
      recordId: null,
      oldValue: null,
      newValue: { email: normalizedEmail, reason: 'User not found' },
      req
    });
    const error = new Error('Invalid email or password.');
    error.status = 401;
    error.isOperational = true;
    throw error;
  }

  // Check if deactivated
  if (!user.IsActive) {
    await logAudit({
      userId: user.UserId,
      action: 'FAILED_LOGIN',
      entityName: 'Auth',
      recordId: user.UserId,
      newValue: { reason: 'Deactivated account attempted login' },
      req
    });
    const error = new Error('Your account has been deactivated. Please contact an administrator.');
    error.status = 403;
    error.isOperational = true;
    throw error;
  }

  // Check account lockout
  if (user.LockoutEnd && new Date(user.LockoutEnd) > new Date()) {
    const diffMs = new Date(user.LockoutEnd) - new Date();
    const remainingMinutes = Math.max(1, Math.ceil(diffMs / (60 * 1000)));

    await logAudit({
      userId: user.UserId,
      action: 'LOCKED_ATTEMPT',
      entityName: 'Auth',
      recordId: user.UserId,
      newValue: { remainingMinutes },
      req
    });

    const error = new Error(`Account is temporarily locked due to repeated failed login attempts. Please try again in ${remainingMinutes} minute(s).`);
    error.status = 403;
    error.isOperational = true;
    throw error;
  }

  // Verify password
  const isMatch = await bcrypt.compare(password, user.PasswordHash);
  if (!isMatch) {
    user.FailedLoginCount = (user.FailedLoginCount || 0) + 1;

    let lockedNow = false;
    if (user.FailedLoginCount >= MAX_FAILED_ATTEMPTS) {
      const lockoutDate = new Date();
      lockoutDate.setMinutes(lockoutDate.getMinutes() + LOCKOUT_MINUTES);
      user.LockoutEnd = lockoutDate;
      lockedNow = true;

      await logAudit({
        userId: user.UserId,
        action: 'LOCKOUT',
        entityName: 'Auth',
        recordId: user.UserId,
        newValue: { failedAttempts: user.FailedLoginCount, lockoutEnd: lockoutDate },
        req
      });
    } else {
      await logAudit({
        userId: user.UserId,
        action: 'FAILED_LOGIN',
        entityName: 'Auth',
        recordId: user.UserId,
        newValue: { failedAttempts: user.FailedLoginCount },
        req
      });
    }

    await user.save();

    if (lockedNow) {
      const error = new Error(`Account locked due to ${MAX_FAILED_ATTEMPTS} consecutive failed login attempts. Please try again in ${LOCKOUT_MINUTES} minutes.`);
      error.status = 403;
      error.isOperational = true;
      throw error;
    }

    const attemptsRemaining = MAX_FAILED_ATTEMPTS - user.FailedLoginCount;
    const error = new Error(`Invalid email or password. (${attemptsRemaining} attempt(s) remaining before lockout).`);
    error.status = 401;
    error.isOperational = true;
    throw error;
  }

  // Successful login
  user.FailedLoginCount = 0;
  user.LockoutEnd = null;
  await user.save();

  const tokenPayload = {
    userId: user.UserId,
    email: user.Email,
    roleId: user.RoleId,
    roleName: user.role ? user.role.RoleName : 'Sales Executive'
  };

  const token = jwt.sign(
    tokenPayload,
    process.env.JWT_SECRET || 'super_secret_acxiom_crm_jwt_secure_key_2026',
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );

  await logAudit({
    userId: user.UserId,
    action: 'LOGIN',
    entityName: 'Auth',
    recordId: user.UserId,
    newValue: { email: user.Email, role: user.role?.RoleName },
    req
  });

  return {
    token,
    user: {
      userId: user.UserId,
      name: user.Name,
      email: user.Email,
      roleId: user.RoleId,
      roleName: user.role ? user.role.RoleName : 'Sales Executive',
      department: user.Department,
      phone: user.Phone
    }
  };
}

async function registerUser({ name, email, password, roleId = 3, department = 'Direct Sales', phone = '', req }) {
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
    Phone: phone,
    IsActive: true,
    FailedLoginCount: 0
  });

  const role = await Role.findByPk(newUser.RoleId);

  await logAudit({
    userId: req?.user?.userId || newUser.UserId,
    action: 'REGISTER',
    entityName: 'User',
    recordId: newUser.UserId,
    newValue: { email: newUser.Email, name: newUser.Name, role: role?.RoleName },
    req
  });

  return {
    userId: newUser.UserId,
    name: newUser.Name,
    email: newUser.Email,
    roleId: newUser.RoleId,
    roleName: role ? role.RoleName : 'Sales Executive',
    department: newUser.Department
  };
}

async function logoutUser({ userId, req }) {
  if (userId) {
    await logAudit({
      userId,
      action: 'LOGOUT',
      entityName: 'Auth',
      recordId: userId,
      newValue: { message: 'User logged out successfully' },
      req
    });
  }
  return true;
}

module.exports = { loginUser, registerUser, logoutUser };

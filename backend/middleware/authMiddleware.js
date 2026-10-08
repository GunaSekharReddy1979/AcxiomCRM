const jwt = require('jsonwebtoken');
const { User, Role } = require('../models');

async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token required. Please log in.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_acxiom_crm_jwt_secure_key_2026');

    const user = await User.findByPk(decoded.userId, {
      include: [{ model: Role, as: 'role' }]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account not found or has been removed.'
      });
    }

    if (!user.IsActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Contact system administrator.'
      });
    }

    // Check account lockout
    if (user.LockoutEnd && new Date(user.LockoutEnd) > new Date()) {
      const remainingMinutes = Math.ceil((new Date(user.LockoutEnd) - new Date()) / (60 * 1000));
      return res.status(403).json({
        success: false,
        message: `Account is temporarily locked due to failed login attempts. Try again in ${remainingMinutes} minute(s).`
      });
    }

    // Attach user DTO to request (Never expose password hash)
    req.user = {
      userId: user.UserId,
      name: user.Name,
      email: user.Email,
      roleId: user.RoleId,
      roleName: user.role ? user.role.RoleName : 'Sales Executive',
      department: user.Department,
      phone: user.Phone
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please log in again.'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid authentication credentials.'
    });
  }
}

module.exports = { authenticateToken };

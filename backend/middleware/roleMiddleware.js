/**
 * Middleware to restrict route access to specific roles
 * @param  {...string} allowedRoles - E.g. 'Admin', 'Manager', 'Sales Executive'
 */
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    const userRole = req.user.roleName;

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to [${allowedRoles.join(', ')}]. Your role is '${userRole}'.`
      });
    }

    next();
  };
}

module.exports = { authorizeRoles };

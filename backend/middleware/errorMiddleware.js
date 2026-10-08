function errorHandler(err, req, res, next) {
  console.error('[Application Error]:', err);

  // Sequelize Unique Constraint Error
  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors && err.errors[0] ? err.errors[0].path : 'Record';
    return res.status(409).json({
      success: false,
      message: `Duplicate entry error: ${field} already exists in the system.`,
      field
    });
  }

  // Sequelize Validation Error
  if (err.name === 'SequelizeValidationError') {
    const messages = err.errors ? err.errors.map(e => e.message) : ['Validation failed'];
    return res.status(400).json({
      success: false,
      message: messages[0] || 'Validation error',
      errors: messages
    });
  }

  // Sequelize Database Error
  if (err.name === 'SequelizeDatabaseError' || err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      success: false,
      message: 'A database constraint violation occurred. Please check referenced records.'
    });
  }

  const statusCode = err.status || err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    message: err.isOperational ? err.message : 'An internal server error occurred. Please contact support.'
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`
  });
}

module.exports = { errorHandler, notFoundHandler };

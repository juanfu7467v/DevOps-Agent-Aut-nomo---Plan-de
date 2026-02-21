const logger = require('./logger');

class AppError extends Error {
  constructor(message, statusCode = 500, details = {}) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }
}

class ErrorHandler {
  static handle(error, req, res) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    const details = error.details || {};

    logger.error(message, {
      statusCode,
      details,
      path: req.path,
      method: req.method,
      stack: error.stack,
    });

    res.status(statusCode).json({
      success: false,
      error: {
        message,
        statusCode,
        details,
        timestamp: new Date().toISOString(),
      },
    });
  }

  static asyncHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  static validationError(message, details = {}) {
    return new AppError(message, 400, { validation: details });
  }

  static notFoundError(resource) {
    return new AppError(`${resource} not found`, 404);
  }

  static unauthorizedError(message = 'Unauthorized') {
    return new AppError(message, 401);
  }

  static forbiddenError(message = 'Forbidden') {
    return new AppError(message, 403);
  }

  static internalError(message = 'Internal Server Error', details = {}) {
    return new AppError(message, 500, details);
  }
}

module.exports = { AppError, ErrorHandler };

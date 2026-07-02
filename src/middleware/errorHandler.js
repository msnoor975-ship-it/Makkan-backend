/**
 * Centralized error handling middleware
 * Catches thrown errors and Zod validation errors
 * Returns consistent JSON error shape: { error: { message, code } }
 */

const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  console.error('Error:', err);

  // Handle Zod validation errors
  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: {
        message: err.errors[0]?.message || 'Validation error',
        code: 'VALIDATION_ERROR',
      },
    });
  }

  // Handle Prisma known errors
  if (err.code && err.code.startsWith('P')) {
    const prismaErrorMap = {
      P2002: 'A unique constraint was violated',
      P2025: 'Record not found',
      P2003: 'Foreign key constraint failed',
    };

    return res.status(400).json({
      error: {
        message: prismaErrorMap[err.code] || 'Database error',
        code: 'DATABASE_ERROR',
      },
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: {
        message: 'Invalid token',
        code: 'INVALID_TOKEN',
      },
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: {
        message: 'Token expired',
        code: 'TOKEN_EXPIRED',
      },
    });
  }

  // Handle custom errors with status code
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      error: {
        message: err.message || 'An error occurred',
        code: err.code || 'CUSTOM_ERROR',
      },
    });
  }

  // Default error response
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    error: {
      message,
      code: 'INTERNAL_ERROR',
    },
  });
};

/**
 * Async handler wrapper to catch errors and pass to next(err)
 * Use this to avoid try/catch in route handlers
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Custom error class for throwing errors with status codes
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code = 'APP_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = {
  errorHandler,
  asyncHandler,
  AppError,
};

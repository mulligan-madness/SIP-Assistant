/**
 * Error handling utilities for consistent error handling across the application
 */
const { getCurrentISODate } = require('./date');

/**
 * Standard error types for the application
 */
const ErrorTypes = {
  VALIDATION: 'VALIDATION_ERROR',
  NETWORK: 'NETWORK_ERROR',
  API: 'API_ERROR',
  DATABASE: 'DATABASE_ERROR',
  AUTHENTICATION: 'AUTHENTICATION_ERROR',
  AUTHORIZATION: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND_ERROR',
  RATE_LIMIT: 'RATE_LIMIT_ERROR',
  LLM_PROVIDER: 'LLM_PROVIDER_ERROR',
  INTERNAL: 'INTERNAL_ERROR'
};

/**
 * Standard HTTP status codes
 */
const StatusCodes = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

/**
 * Map error types to HTTP status codes
 */
const errorTypeToStatusCode = {
  [ErrorTypes.VALIDATION]: StatusCodes.BAD_REQUEST,
  [ErrorTypes.NETWORK]: StatusCodes.SERVICE_UNAVAILABLE,
  [ErrorTypes.API]: StatusCodes.BAD_REQUEST,
  [ErrorTypes.DATABASE]: StatusCodes.INTERNAL_SERVER_ERROR,
  [ErrorTypes.AUTHENTICATION]: StatusCodes.UNAUTHORIZED,
  [ErrorTypes.AUTHORIZATION]: StatusCodes.FORBIDDEN,
  [ErrorTypes.NOT_FOUND]: StatusCodes.NOT_FOUND,
  [ErrorTypes.RATE_LIMIT]: StatusCodes.TOO_MANY_REQUESTS,
  [ErrorTypes.LLM_PROVIDER]: StatusCodes.SERVICE_UNAVAILABLE,
  [ErrorTypes.INTERNAL]: StatusCodes.INTERNAL_SERVER_ERROR
};

/**
 * Application error class
 */
class AppError extends Error {
  /**
   * Create a new application error
   * @param {string} message - Error message
   * @param {string} type - Error type from ErrorTypes
   * @param {Object} details - Additional error details
   * @param {Error} originalError - Original error that caused this error
   */
  constructor(message, type = ErrorTypes.INTERNAL, details = {}, originalError = null) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.details = details;
    this.timestamp = getCurrentISODate();
    this.statusCode = errorTypeToStatusCode[type] || StatusCodes.INTERNAL_SERVER_ERROR;
    this.originalError = originalError;
    
    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Format error for API response
   * @returns {Object} Formatted error object
   */
  toJSON() {
    return {
      error: {
        type: this.type,
        message: this.message,
        timestamp: this.timestamp,
        ...(Object.keys(this.details).length > 0 && { details: this.details })
      }
    };
  }
}

/**
 * Create a validation error
 * @param {string} message - Error message
 * @param {Object} validationErrors - Validation errors
 * @returns {AppError} Validation error
 */
function createValidationError(message, validationErrors = {}) {
  return new AppError(
    message || 'Validation error',
    ErrorTypes.VALIDATION,
    { validationErrors }
  );
}

/**
 * Create a network error
 * @param {string} message - Error message
 * @param {Error} originalError - Original error
 * @returns {AppError} Network error
 */
function createNetworkError(message, originalError = null) {
  return new AppError(
    message || 'Network error',
    ErrorTypes.NETWORK,
    {},
    originalError
  );
}

/**
 * Create an API error
 * @param {string} message - Error message
 * @param {Object} response - API response
 * @param {Error} originalError - Original error
 * @returns {AppError} API error
 */
function createApiError(message, response = {}, originalError = null) {
  return new AppError(
    message || 'API error',
    ErrorTypes.API,
    { response },
    originalError
  );
}

/**
 * Create an LLM provider error
 * @param {string} message - Error message
 * @param {string} provider - Provider name
 * @param {Error} originalError - Original error
 * @returns {AppError} LLM provider error
 */
function createLLMProviderError(message, provider, originalError = null) {
  return new AppError(
    message || `Error with LLM provider: ${provider}`,
    ErrorTypes.LLM_PROVIDER,
    { provider },
    originalError
  );
}

/**
 * Handle errors in async functions with consistent error handling
 * @param {Function} fn - Async function to handle errors for
 * @returns {Function} Function with error handling
 */
function asyncErrorHandler(fn) {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Global error handler middleware for Express
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function globalErrorHandler(err, req, res, next) {
  console.error('Error:', err);

  // If the error is already an AppError, use it
  if (err instanceof AppError) {
    return res.status(err.statusCode).json(err.toJSON());
  }

  // Default error response
  const defaultError = new AppError(
    'An unexpected error occurred',
    ErrorTypes.INTERNAL,
    {},
    err
  );

  res.status(defaultError.statusCode).json(defaultError.toJSON());
}

module.exports = {
  ErrorTypes,
  StatusCodes,
  AppError,
  createValidationError,
  createNetworkError,
  createApiError,
  createLLMProviderError,
  asyncErrorHandler,
  globalErrorHandler
}; 
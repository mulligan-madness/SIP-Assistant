/**
 * Base Service
 * Abstract base class for all services
 */

const { createLLMProviderError, asyncErrorHandler } = require('../utils');

/**
 * Base class for all services
 * @abstract
 */
class BaseService {
  /**
   * Create a new service
   * @param {Object} config - Service configuration
   */
  constructor(config = {}) {
    this.config = config;
    this.name = 'base-service';
    this.initialized = false;
    
    // Validate that this is not being instantiated directly
    if (this.constructor === BaseService) {
      throw new Error('BaseService is an abstract class and cannot be instantiated directly');
    }
  }

  /**
   * Initialize the service
   * @returns {Promise<void>}
   * @abstract
   */
  async initialize() {
    this.initialized = true;
  }

  /**
   * Check if the service is initialized
   * @returns {boolean} Whether the service is initialized
   */
  isInitialized() {
    return this.initialized;
  }

  /**
   * Get the service name
   * @returns {string} The service name
   */
  getServiceName() {
    return this.name;
  }

  /**
   * Log a message with the service name
   * @param {string} message - The message to log
   * @param {Object} data - Additional data to log
   */
  log(message, data = null) {
    if (data) {
      console.log(`[${this.name}] ${message}:`, data);
    } else {
      console.log(`[${this.name}] ${message}`);
    }
  }

  /**
   * Log an error with the service name
   * @param {string} message - The error message
   * @param {Error} error - The error object
   */
  logError(message, error) {
    console.error(`[${this.name}] ${message}:`, error);
  }

  /**
   * Create a route handler with error handling
   * @param {Function} handler - The route handler function
   * @returns {Function} The wrapped handler with error handling
   */
  createHandler(handler) {
    return asyncErrorHandler(handler.bind(this));
  }
}

module.exports = { BaseService }; 
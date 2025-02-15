const debug = require('debug');

class Logger {
  constructor(namespace) {
    this.debug = debug(`forum-scraper:${namespace}`);
    this.error = debug(`forum-scraper:${namespace}:error`);
    this.error.log = console.error.bind(console); // Error logs always show
  }

  log(message, data = null) {
    if (data) {
      this.debug(`${message}:`, data);
    } else {
      this.debug(message);
    }
  }

  logError(message, error) {
    this.error(`${message}:`);
    if (error.response) {
      // API error response
      this.error('Status:', error.response.status);
      this.error('Data:', error.response.data);
    } else if (error.request) {
      // Network error
      this.error('Network error:', error.message);
    } else {
      // Other errors
      this.error('Error:', error.message);
      this.error('Stack:', error.stack);
    }
  }
}

module.exports = { Logger }; 
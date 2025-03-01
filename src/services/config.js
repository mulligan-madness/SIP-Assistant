/**
 * Config Service
 * Handles configuration values and environment variables
 */

require('dotenv').config();

/**
 * Config service for managing application configuration
 */
class ConfigService {
  constructor() {
    this.config = {
      openai: {
        apiKey: process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_MODEL || 'gpt-4o'
      },
      anthropic: {
        apiKey: process.env.ANTHROPIC_API_KEY,
        model: process.env.ANTHROPIC_MODEL || 'claude-3-opus-20240229'
      },
      forum: {
        baseUrl: process.env.FORUM_BASE_URL || 'https://forum.superrare.com'
      },
      server: {
        port: process.env.PORT || 3000,
        environment: process.env.NODE_ENV || 'development'
      }
    };
  }

  /**
   * Get a configuration value by path
   * @param {string} path - Dot notation path to the config value
   * @param {any} defaultValue - Default value if path doesn't exist
   * @returns {any} - The configuration value
   */
  get(path, defaultValue = undefined) {
    const parts = path.split('.');
    let current = this.config;
    
    for (const part of parts) {
      if (current === undefined || current === null) {
        return defaultValue;
      }
      current = current[part];
    }
    
    return current !== undefined ? current : defaultValue;
  }

  /**
   * Set a configuration value
   * @param {string} path - Dot notation path to the config value
   * @param {any} value - The value to set
   */
  set(path, value) {
    const parts = path.split('.');
    let current = this.config;
    
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in current)) {
        current[part] = {};
      }
      current = current[part];
    }
    
    current[parts[parts.length - 1]] = value;
  }
}

// Create and export a singleton instance
const config = new ConfigService();

module.exports = { config }; 
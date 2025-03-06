/**
 * Storage Service
 * Handles data persistence for the application
 */

const fs = require('fs');
const path = require('path');
const { BaseService } = require('./base');
const { createNetworkError } = require('../utils');

/**
 * Storage service for persisting data
 * @extends BaseService
 */
class StorageService extends BaseService {
  /**
   * Create a new storage service
   * @param {Object} config - Service configuration
   * @param {string} config.storageDir - Storage directory path
   */
  constructor(config = {}) {
    super(config);
    
    this.name = 'storage';
    this.storageDir = config.storageDir || path.join(__dirname, '..', '..', 'data');
    this.ensureStorageDir();
    
    this.log(`Storage service initialized with directory: ${this.storageDir}`);
  }

  /**
   * Ensure the storage directory exists
   * @private
   */
  ensureStorageDir() {
    if (!fs.existsSync(this.storageDir)) {
      this.log(`Creating storage directory: ${this.storageDir}`);
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  /**
   * Get an item from storage
   * @param {string} key - The key to retrieve
   * @returns {Promise<any>} - The stored value
   */
  async getItem(key) {
    try {
      const filePath = path.join(this.storageDir, `${key}.json`);
      
      if (!fs.existsSync(filePath)) {
        this.log(`Item not found: ${key}`);
        return null;
      }
      
      this.log(`Getting item: ${key}`);
      const data = fs.readFileSync(filePath, 'utf8');
      return data;
    } catch (error) {
      this.logError(`Error getting item ${key}`, error);
      throw createNetworkError(`Error getting item ${key}: ${error.message}`, error);
    }
  }

  /**
   * Set an item in storage
   * @param {string} key - The key to store
   * @param {any} value - The value to store
   * @returns {Promise<boolean>} - Whether the operation was successful
   */
  async setItem(key, value) {
    try {
      const filePath = path.join(this.storageDir, `${key}.json`);
      this.log(`Setting item: ${key}`);
      fs.writeFileSync(filePath, value);
      return true;
    } catch (error) {
      this.logError(`Error setting item ${key}`, error);
      throw createNetworkError(`Error setting item ${key}: ${error.message}`, error);
    }
  }

  /**
   * Remove an item from storage
   * @param {string} key - The key to remove
   * @returns {Promise<boolean>} - Whether the operation was successful
   */
  async removeItem(key) {
    try {
      const filePath = path.join(this.storageDir, `${key}.json`);
      
      if (fs.existsSync(filePath)) {
        this.log(`Removing item: ${key}`);
        fs.unlinkSync(filePath);
      } else {
        this.log(`Item not found for removal: ${key}`);
      }
      
      return true;
    } catch (error) {
      this.logError(`Error removing item ${key}`, error);
      throw createNetworkError(`Error removing item ${key}: ${error.message}`, error);
    }
  }

  /**
   * Get all keys in storage
   * @returns {Promise<Array<string>>} - The keys
   */
  async keys() {
    try {
      this.log('Getting all keys');
      const files = fs.readdirSync(this.storageDir);
      return files.map(file => path.basename(file, '.json'));
    } catch (error) {
      this.logError('Error getting keys', error);
      throw createNetworkError(`Error getting keys: ${error.message}`, error);
    }
  }

  /**
   * Clear all items in storage
   * @returns {Promise<boolean>} - Whether the operation was successful
   */
  async clear() {
    try {
      this.log('Clearing all items');
      const files = fs.readdirSync(this.storageDir);
      
      for (const file of files) {
        const filePath = path.join(this.storageDir, file);
        fs.unlinkSync(filePath);
      }
      
      return true;
    } catch (error) {
      this.logError('Error clearing storage', error);
      throw createNetworkError(`Error clearing storage: ${error.message}`, error);
    }
  }

  /**
   * Save scrape result to storage
   * @param {Object} data - The scrape result data
   * @returns {Promise<boolean>} - Whether the operation was successful
   */
  async saveScrapeResult(data) {
    try {
      const timestamp = new Date().toISOString();
      const filename = `scrape-${timestamp.replace(/[:.]/g, '-')}`;
      
      this.log(`Saving scrape result with timestamp: ${timestamp}`);
      await this.setItem(filename, JSON.stringify(data, null, 2));
      
      return true;
    } catch (error) {
      this.logError('Error saving scrape result', error);
      throw createNetworkError(`Error saving scrape result: ${error.message}`, error);
    }
  }

  /**
   * Get the latest scrape result
   * @returns {Promise<Object|null>} - The latest scrape result or null if none exists
   */
  async getLatestScrape() {
    try {
      this.log('Getting latest scrape result');
      const keys = await this.keys();
      
      // Filter for scrape files and sort by timestamp (descending)
      const scrapeKeys = keys
        .filter(key => key.startsWith('scrape-'))
        .sort()
        .reverse();
      
      if (scrapeKeys.length === 0) {
        this.log('No scrape results found');
        return null;
      }
      
      const latestKey = scrapeKeys[0];
      this.log(`Latest scrape found: ${latestKey}`);
      
      const data = await this.getItem(latestKey);
      return JSON.parse(data);
    } catch (error) {
      this.logError('Error getting latest scrape', error);
      throw createNetworkError(`Error getting latest scrape: ${error.message}`, error);
    }
  }

  /**
   * Save compressed context to storage
   * @param {string} context - The compressed context
   * @returns {Promise<boolean>} - Whether the operation was successful
   */
  async saveCompressedContext(context) {
    try {
      this.log('Saving compressed context');
      await this.setItem('compressed-context', context);
      
      // Also save a timestamped version for history
      const timestamp = new Date().toISOString();
      const filename = `compressed-context-${timestamp.replace(/[:.]/g, '-')}`;
      await this.setItem(filename, context);
      
      return true;
    } catch (error) {
      this.logError('Error saving compressed context', error);
      throw createNetworkError(`Error saving compressed context: ${error.message}`, error);
    }
  }

  /**
   * Get the compressed context
   * @returns {Promise<string|null>} - The compressed context or null if none exists
   */
  async getCompressedContext() {
    try {
      this.log('Getting compressed context');
      const data = await this.getItem('compressed-context');
      
      if (!data) {
        this.log('No compressed context found');
        return null;
      }
      
      return data;
    } catch (error) {
      this.logError('Error getting compressed context', error);
      throw createNetworkError(`Error getting compressed context: ${error.message}`, error);
    }
  }

  /**
   * Load forum data from storage
   * @returns {Promise<Array|null>} - The forum data or null if none exists
   */
  async loadForumData() {
    try {
      this.log('Loading forum data');
      const latestScrape = await this.getLatestScrape();
      
      if (!latestScrape) {
        this.log('No forum data found');
        return null;
      }
      
      return latestScrape.posts || [];
    } catch (error) {
      this.logError('Error loading forum data', error);
      throw createNetworkError(`Error loading forum data: ${error.message}`, error);
    }
  }
}

// Create a singleton instance
const storage = new StorageService();

module.exports = { StorageService, storage }; 
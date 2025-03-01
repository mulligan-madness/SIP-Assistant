/**
 * Storage Service
 * Handles data persistence for the application
 */

const fs = require('fs');
const path = require('path');
const debug = require('debug')('chatbot:storage');

/**
 * Storage service for persisting data
 */
class Storage {
  constructor() {
    this.storageDir = path.join(__dirname, '..', '..', 'data');
    this.ensureStorageDir();
  }

  /**
   * Ensure the storage directory exists
   * @private
   */
  ensureStorageDir() {
    if (!fs.existsSync(this.storageDir)) {
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
        return null;
      }
      
      const data = fs.readFileSync(filePath, 'utf8');
      return data;
    } catch (error) {
      console.error(`Error getting item ${key}:`, error);
      return null;
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
      fs.writeFileSync(filePath, value);
      return true;
    } catch (error) {
      console.error(`Error setting item ${key}:`, error);
      return false;
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
        fs.unlinkSync(filePath);
      }
      
      return true;
    } catch (error) {
      console.error(`Error removing item ${key}:`, error);
      return false;
    }
  }

  /**
   * Get all keys in storage
   * @returns {Promise<Array<string>>} - The keys
   */
  async keys() {
    try {
      const files = fs.readdirSync(this.storageDir);
      return files.map(file => path.basename(file, '.json'));
    } catch (error) {
      console.error('Error getting keys:', error);
      return [];
    }
  }

  /**
   * Clear all items from storage
   * @returns {Promise<boolean>} - Whether the operation was successful
   */
  async clear() {
    try {
      const files = fs.readdirSync(this.storageDir);
      
      for (const file of files) {
        fs.unlinkSync(path.join(this.storageDir, file));
      }
      
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  }

  /**
   * Save scrape result to storage
   * @param {Object} data - The scrape result
   * @returns {Promise<boolean>} - Whether the operation was successful
   */
  async saveScrapeResult(data) {
    try {
      const timestamp = new Date().toISOString();
      const key = `scrape_${timestamp}`;
      
      await this.setItem(key, JSON.stringify(data));
      await this.setItem('latest_scrape', key);
      
      return true;
    } catch (error) {
      console.error('Error saving scrape result:', error);
      return false;
    }
  }

  /**
   * Get the latest scrape result
   * @returns {Promise<Object>} - The latest scrape result
   */
  async getLatestScrape() {
    try {
      console.log('[Storage] Getting latest scrape key');
      const latestKey = await this.getItem('latest_scrape');
      
      if (!latestKey) {
        console.log('[Storage] No latest scrape key found');
        return null;
      }
      
      console.log(`[Storage] Found latest scrape key: ${latestKey}`);
      const latestData = await this.getItem(latestKey);
      
      if (!latestData) {
        console.log(`[Storage] No data found for key: ${latestKey}`);
        return null;
      }
      
      console.log(`[Storage] Parsing data of length: ${latestData.length}`);
      try {
        const parsed = JSON.parse(latestData);
        console.log(`[Storage] Successfully parsed data, found ${parsed.posts?.length || 0} posts`);
        return parsed;
      } catch (parseError) {
        console.error(`[Storage] Error parsing data:`, parseError);
        console.log(`[Storage] First 100 chars of data: ${latestData.substring(0, 100)}...`);
        throw new Error(`Failed to parse scrape data: ${parseError.message}`);
      }
    } catch (error) {
      console.error('[Storage] Error getting latest scrape:', error);
      return null;
    }
  }

  async saveCompressedContext(context) {
    const filepath = path.join(this.storageDir, 'compressed-context.md');
    const content = `---
title: Compressed SIP Context
date: ${new Date().toISOString()}
---

${context}`;

    try {
      await fs.promises.writeFile(filepath, content);
      debug(`Saved compressed context to ${filepath}`);
      return filepath;
    } catch (error) {
      debug('Error saving compressed context:', error);
      throw error;
    }
  }

  async getCompressedContext() {
    const filepath = path.join(this.storageDir, 'compressed-context.md');
    try {
      if (!fs.existsSync(filepath)) {
        debug('No compressed context file found');
        return null;
      }
      
      const content = await fs.promises.readFile(filepath, 'utf8');
      const contextPart = content.split('---')[2]?.trim();
      debug(`Loaded compressed context from ${filepath}`);
      return contextPart || null;
    } catch (error) {
      debug('Error getting compressed context:', error);
      throw error;
    }
  }

  /**
   * Load forum data from the latest scrape
   * @returns {Promise<Array>} - Array of forum posts
   */
  async loadForumData() {
    try {
      console.log('[Storage] Loading forum data from latest scrape');
      const latestData = await this.getLatestScrape();
      
      if (!latestData || !latestData.posts || !Array.isArray(latestData.posts)) {
        console.log('[Storage] No valid forum data found in latest scrape');
        return [];
      }
      
      console.log(`[Storage] Successfully loaded ${latestData.posts.length} forum posts`);
      return latestData.posts;
    } catch (error) {
      console.error('[Storage] Error loading forum data:', error);
      return [];
    }
  }
}

// Create a singleton instance for backward compatibility
const storage = new Storage();

// Export both the class and the singleton instance for flexibility
module.exports = Storage;
module.exports.storage = storage;

// Add static methods to the Storage class for convenience
Object.getOwnPropertyNames(Storage.prototype).forEach(method => {
  if (method !== 'constructor' && typeof Storage.prototype[method] === 'function') {
    Storage[method] = function(...args) {
      return storage[method](...args);
    };
  }
}); 
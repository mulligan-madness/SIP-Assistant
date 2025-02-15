const fs = require('fs');
const path = require('path');
const debug = require('debug')('chatbot:storage');

class Storage {
  constructor() {
    this.outputDir = path.join(__dirname, '..', 'output');
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async saveScrapeResult(data) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const filename = `forum-data-${timestamp}.json`;
    const filepath = path.join(this.outputDir, filename);

    try {
      await fs.promises.writeFile(filepath, JSON.stringify(data, null, 2));
      debug(`Saved scrape result to ${filepath}`);
      return filepath;
    } catch (error) {
      debug('Error saving scrape result:', error);
      throw error;
    }
  }

  async getLatestScrape() {
    try {
      const files = await fs.promises.readdir(this.outputDir);
      const dataFiles = files
        .filter(f => f.startsWith('forum-data-') && f.endsWith('.json'))
        .sort()
        .reverse();

      if (dataFiles.length === 0) {
        debug('No existing scrape data found');
        return null;
      }

      const latestFile = path.join(this.outputDir, dataFiles[0]);
      const data = JSON.parse(await fs.promises.readFile(latestFile, 'utf8'));
      debug(`Loaded latest scrape from ${latestFile}`);
      return data;
    } catch (error) {
      debug('Error getting latest scrape:', error);
      throw error;
    }
  }
}

module.exports = { Storage }; 
const fs = require('fs').promises;
const path = require('path');
const debug = require('debug')('forum-scraper:storage');

class Storage {
  constructor(outputDir = 'output') {
    this.outputDir = outputDir;
  }

  async saveScrapeResult(data) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const filename = `sip-data-${timestamp}.json`;
    const filepath = path.join(this.outputDir, filename);
    
    await fs.mkdir(this.outputDir, { recursive: true });
    await fs.writeFile(filepath, JSON.stringify(data, null, 2));
    
    return filepath;
  }

  async getLatestScrape() {
    try {
      const files = await fs.readdir(this.outputDir);
      const sipFiles = files
        .filter(f => f.startsWith('sip-data-'))
        .sort();
        
      if (sipFiles.length === 0) return null;
      
      // Try files from newest to oldest until we find a valid one
      for (const file of sipFiles.reverse()) {
        try {
          const content = await fs.readFile(
            path.join(this.outputDir, file), 
            'utf8'
          );
          return JSON.parse(content);
        } catch (error) {
          debug(`Error reading ${file}, trying next file`);
        }
      }
      return null;
    } catch (error) {
      debug('Error accessing storage:', error);
      return null;
    }
  }
}

// Export the Storage class
module.exports = { Storage }; 
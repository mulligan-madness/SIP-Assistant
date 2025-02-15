const { DiscourseScraper } = require('../src/scraper');
const fs = require('fs').promises;
const path = require('path');
const debug = require('debug')('forum-scraper:script');

async function main() {
  try {
    debug('Starting forum scraper');
    const scraper = new DiscourseScraper('https://forum.rare.xyz', { debug: true });
    
    // Test connection first
    const testResult = await scraper.test();
    if (!testResult.success) {
      throw new Error(`Forum connection test failed: ${testResult.message}`);
    }
    
    debug('Scraping forum data...');
    const scrapedData = await scraper.scrapeAll();
    
    // Create output directory if it doesn't exist
    const outputDir = path.join(__dirname, '..', 'output');
    await fs.mkdir(outputDir, { recursive: true });
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const outputPath = path.join(outputDir, `forum-data-${timestamp}.json`);
    
    // Save the scraped data
    await fs.writeFile(
      outputPath,
      JSON.stringify(scrapedData, null, 2)
    );
    
    debug(`Scraping completed. Found ${scrapedData.posts.length} SIP posts`);
    debug(`Data saved to ${outputPath}`);
    
  } catch (error) {
    console.error('Error running scraper:', error);
    process.exit(1);
  }
}

main(); 
const { DiscourseScraper } = require('../src/scraper');
const { Storage } = require('../src/storage');
const debug = require('debug')('forum-scraper:test-live');

async function testLiveForum() {
  try {
    debug('Starting live forum test');
    
    // Initialize storage and scraper
    const storage = new Storage();
    const scraper = new DiscourseScraper('https://forum.rare.xyz', {
      debug: true,
      rateLimit: 2000, // 2 seconds between requests
      maxRetries: 3,
      retryDelay: 2000
    });
    
    // Run the scraper
    debug('Starting forum scrape...');
    const result = await scraper.scrapeAll();
    
    // Save the results
    const savedPath = await storage.saveScrapeResult(result);
    debug(`Saved scrape results to ${savedPath}`);
    
    // Log results
    debug(`Found ${result.posts.length} SIP posts across ${result.totalPages} pages`);
    debug('First 3 SIPs found:');
    result.posts.slice(0, 3).forEach(post => {
      debug(`- ${post.t}`);
      debug(`  Date: ${post.d}`);
      debug(`  Status: ${post.status || 'No status'}`);
      debug(`  URL: ${post.url}`);
      debug(`  Content length: ${post.c.length} chars`);
      debug('  ---');
    });
    
    return result;
  } catch (error) {
    debug('Error testing live forum:', error);
    throw error;
  }
}

// Run the test
testLiveForum()
  .then(result => {
    console.log('\nTest completed successfully!');
    console.log(`Found ${result.posts.length} SIP posts`);
    process.exit(0);
  })
  .catch(error => {
    console.error('\nTest failed:', error);
    process.exit(1);
  }); 
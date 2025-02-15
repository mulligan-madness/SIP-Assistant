const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { DiscourseScraper } = require('../src/scraper');
const { Storage } = require('../src/storage');
const { LLMProviderFactory } = require('../src/providers/factory');

describe('Chatbot Core Functionality', function() {
  this.timeout(30000); // Extended timeout for API calls
  
  let storage;
  let scraper;
  
  before(async () => {
    // Initialize test dependencies
    storage = new Storage();
    scraper = new DiscourseScraper('https://forum.rare.xyz', { debug: true });
  });

  describe('Forum Scraping', () => {
    it('should successfully test forum connection', async () => {
      const testResult = await scraper.test();
      assert.strictEqual(testResult.success, true);
    });

    it('should scrape forum data', async () => {
      const scrapedData = await scraper.scrapeAll();
      assert(scrapedData.posts);
      assert(Array.isArray(scrapedData.posts));
      assert(scrapedData.posts.length > 0);
    });
  });

  describe('Data Storage', () => {
    it('should save and retrieve scrape results', async () => {
      const testData = {
        posts: [
          {
            id: 1,
            title: 'Test SIP',
            content: 'Test content'
          }
        ]
      };
      
      await storage.saveScrapeResult(testData);
      const retrieved = await storage.getLatestScrape();
      assert.deepStrictEqual(retrieved.posts[0], testData.posts[0]);
    });
  });

  describe('File Operations', () => {
    const testOutputDir = path.join(__dirname, '..', 'output');
    
    before(() => {
      // Ensure output directory exists
      if (!fs.existsSync(testOutputDir)) {
        fs.mkdirSync(testOutputDir);
      }
    });
    
    it('should save compressed context', async () => {
      const testContext = '# Test Context\nThis is a test context.';
      const contextPath = path.join(testOutputDir, 'test-compressed-context.md');
      
      fs.writeFileSync(contextPath, testContext);
      assert(fs.existsSync(contextPath));
      
      const savedContent = fs.readFileSync(contextPath, 'utf8');
      assert.strictEqual(savedContent, testContext);
      
      // Clean up test file
      fs.unlinkSync(contextPath);
    });
  });

  // Only run LLM tests if we have API keys configured
  if (process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY) {
    describe('LLM Integration', () => {
      let llmProvider;
      
      before(() => {
        const provider = process.env.OPENAI_API_KEY ? 'openai' : 'anthropic';
        const config = {
          apiKey: provider === 'openai' ? process.env.OPENAI_API_KEY : process.env.ANTHROPIC_API_KEY,
          model: provider === 'openai' ? 'gpt-4' : 'claude-3-sonnet-20240229'
        };
        
        llmProvider = LLMProviderFactory.createProvider(provider, config);
      });

      it('should handle chat messages', async () => {
        const response = await llmProvider.chat([
          { role: 'user', content: 'What is a SIP?' }
        ]);
        assert(response);
        assert(typeof response === 'string');
        assert(response.length > 0);
      });

      it('should handle context compression', async () => {
        const testSips = [
          {
            id: 1,
            title: 'Test SIP 1',
            content: 'Test content 1'
          },
          {
            id: 2,
            title: 'Test SIP 2',
            content: 'Test content 2'
          }
        ];
        
        const response = await llmProvider.chat([
          { 
            role: 'user', 
            content: 'Analyze and summarize these SIPs: ' + JSON.stringify(testSips)
          }
        ]);
        
        assert(response);
        assert(typeof response === 'string');
        assert(response.length > 0);
      });
    });
  }
}); 
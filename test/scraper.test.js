const { DiscourseScraper } = require('../src/scraper');
const { mockForumResponses, setupMockForum } = require('./helpers/mocks');
const assert = require('assert');
const nock = require('nock');

describe('DiscourseScraper', function() {
  this.timeout(10000);
  let scraper;
  
  before(() => {
    // Enable debug mode for tests
    process.env.DEBUG = 'forum-scraper:*';
  });
  
  beforeEach(() => {
    scraper = new DiscourseScraper('https://forum.rare.xyz', { 
      debug: true,
      maxRetries: 2,
      retryDelay: 100
    });
    setupMockForum();
  });
  
  afterEach(() => {
    nock.cleanAll();
  });
  
  describe('Constructor', () => {
    it('should initialize with correct base URL', () => {
      assert.strictEqual(scraper.baseUrl, 'https://forum.rare.xyz');
    });
    
    it('should set default options', () => {
      const defaultScraper = new DiscourseScraper('https://forum.rare.xyz');
      assert.strictEqual(defaultScraper.options.maxRetries, 3);
      assert.strictEqual(defaultScraper.options.retryDelay, 1000);
    });
  });
  
  describe('fetchWithRetry', () => {
    it('should successfully fetch data', async () => {
      const data = await scraper.fetchWithRetry('https://forum.rare.xyz/latest.json');
      assert.deepStrictEqual(data, mockForumResponses.latestPage);
    });
    
    it('should retry on failure', async () => {
      nock.cleanAll(); // Clear existing mocks
      
      // Only set up 2 failed attempts and 1 success since maxRetries is 2
      const scope = nock('https://forum.rare.xyz')
        .get('/failing-endpoint')
        .reply(500, { error: 'Test error' })
        .get('/failing-endpoint')
        .reply(200, { success: true });
      
      const result = await scraper.fetchWithRetry('https://forum.rare.xyz/failing-endpoint');
      assert.deepStrictEqual(result, { success: true });
      
      // Verify all expected requests were made
      assert(scope.isDone(), 'Not all expected requests were made');
    });
    
    it('should throw after max retries', async () => {
      nock('https://forum.rare.xyz')
        .get('/always-fails')
        .times(3)
        .reply(500);
        
      await assert.rejects(
        () => scraper.fetchWithRetry('https://forum.rare.xyz/always-fails'),
        /Request failed with status code 500/
      );
    });
  });
  
  describe('scrapeAll', () => {
    it('should fetch and filter SIP posts', async () => {
      const result = await scraper.scrapeAll();
      
      assert(Array.isArray(result.posts), 'Should return an array of posts');
      assert.strictEqual(result.posts.length, 2, 'Should find exactly 2 SIP posts');
      
      const firstPost = result.posts[0];
      assert.strictEqual(firstPost.id, 1);
      assert.strictEqual(firstPost.t, '[SIP-001] Test Proposal');
      assert(firstPost.d, 'Should have a date');
      assert(firstPost.c, 'Should have content');
      assert(firstPost.url.includes('sip-001-test-proposal'), 'Should have correct URL');
    });
    
    it('should handle pagination', async () => {
      // Mock multiple pages
      nock.cleanAll();
      
      const page1 = {
        topic_list: {
          topics: [
            {
              id: 1,
              title: '[SIP-001] First Page',
              slug: 'sip-001',
              created_at: '2024-02-20T10:00:00Z'
            },
            {
              id: 2,
              title: '[SIP-002] First Page',
              slug: 'sip-002',
              created_at: '2024-02-20T11:00:00Z'
            }
          ],
          more_topics_url: 'page=1'
        }
      };
      
      const page2 = {
        topic_list: {
          topics: [
            {
              id: 3,
              title: '[SIP-003] Second Page',
              slug: 'sip-003',
              created_at: '2024-02-20T12:00:00Z'
            },
            {
              id: 4,
              title: '[SIP-004] Second Page',
              slug: 'sip-004',
              created_at: '2024-02-20T13:00:00Z'
            }
          ],
          more_topics_url: null
        }
      };
      
      nock('https://forum.rare.xyz')
        .get('/latest.json')
        .query({ page: 0 })
        .reply(200, page1)
        .get('/latest.json')
        .query({ page: 1 })
        .reply(200, page2)
        .get(/\/t\/\d+\.json/)
        .times(4)
        .reply(200, mockForumResponses.topicContent);
        
      const result = await scraper.scrapeAll();
      assert.strictEqual(result.posts.length, 4, 'Should find 4 SIP posts across pages');
    });
    
    it('should handle failed content fetches', async () => {
      nock.cleanAll();
      
      nock('https://forum.rare.xyz')
        .get('/latest.json').query(true)
        .reply(200, mockForumResponses.latestPage)
        .get(/\/t\/\d+\.json/)
        .reply(500);
        
      const result = await scraper.scrapeAll();
      assert.strictEqual(result.posts[0].c, '[Content fetch failed]');
    });
  });
  
  describe('test method', () => {
    it('should return success for working forum', async () => {
      const result = await scraper.test();
      assert.strictEqual(result.success, true);
      assert(result.topicsFound > 0);
    });
    
    it('should return failure for non-working forum', async () => {
      nock.cleanAll();
      nock('https://forum.rare.xyz')
        .get('/latest.json').query(true)
        .reply(500);
        
      const result = await scraper.test();
      assert.strictEqual(result.success, false);
      assert(result.message.includes('failed'));
    });
  });
}); 
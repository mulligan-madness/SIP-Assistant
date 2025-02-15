const { DiscourseScraper } = require('../src/scraper');
const assert = require('assert');
const nock = require('nock');

describe('Forum API Integration', function() {
  this.timeout(10000);
  let scraper;
  
  beforeEach(() => {
    scraper = new DiscourseScraper('https://forum.rare.xyz', { 
      debug: true,
      rateLimit: 100, // Faster for tests
      maxRetries: 2
    });
  });
  
  afterEach(() => {
    nock.cleanAll();
  });

  describe('Category API', () => {
    it('should correctly structure category request', async () => {
      const scope = nock('https://forum.rare.xyz')
        .get('/c/proposals/18.json')
        .query(true)
        .reply(200, {
          topic_list: {
            topics: [],
            more_topics_url: null
          }
        });
        
      await scraper.scrapeAll();
      assert(scope.isDone(), 'Category API endpoint was not called correctly');
    });
  });

  describe('Topic API', () => {
    it('should fetch and parse topic content', async () => {
      const mockTopic = {
        post_stream: {
          posts: [{
            cooked: '<p>Test content with <strong>HTML</strong></p>',
            raw: 'Test content with **markdown**'
          }]
        }
      };

      nock('https://forum.rare.xyz')
        .get('/c/proposals/18.json')
        .query(true)
        .reply(200, {
          topic_list: {
            topics: [{
              id: 1,
              title: '[SIP-001] Test',
              slug: 'test',
              created_at: '2024-02-20T10:00:00Z'
            }],
            more_topics_url: null
          }
        })
        .get('/t/1.json')
        .reply(200, mockTopic);

      const result = await scraper.scrapeAll();
      assert(result.posts[0].c, 'Should have content');
      assert(result.posts[0].t, 'Should have title');
    });
  });

  describe('SIP Detection', () => {
    it('should correctly identify SIP posts with various formats', async () => {
      const mockTopics = {
        topic_list: {
          topics: [
            { id: 1, title: '[SIP-001] Format One', slug: 'one' },
            { id: 2, title: 'SIP 002: Format Two', slug: 'two' },
            { id: 3, title: 'SIP|003 Format Three', slug: 'three' },
            { id: 4, title: 'Not a SIP Post', slug: 'not-sip' }
          ],
          more_topics_url: null
        }
      };

      nock('https://forum.rare.xyz')
        .get('/c/proposals/18.json')
        .query(true)
        .reply(200, mockTopics)
        .get('/t/1.json')
        .reply(200, {
          post_stream: { posts: [{ cooked: '<p>Content</p>' }] }
        })
        .get('/t/2.json')
        .reply(200, {
          post_stream: { posts: [{ cooked: '<p>Content</p>' }] }
        })
        .get('/t/3.json')
        .reply(200, {
          post_stream: { posts: [{ cooked: '<p>Content</p>' }] }
        });

      const result = await scraper.scrapeAll();
      const titles = result.posts.map(p => p.t);
      
      // Check that we detect each valid SIP format
      assert(titles.includes('[SIP-001] Format One'), 'Should detect [SIP-XXX] format');
      assert(titles.includes('SIP 002: Format Two'), 'Should detect SIP XXX: format');
      assert(titles.includes('SIP|003 Format Three'), 'Should detect SIP|XXX format');
      
      // Verify we don't pick up non-SIP posts
      assert(!titles.includes('Not a SIP Post'), 'Should not include non-SIP posts');
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const scope = nock('https://forum.rare.xyz')
        .get('/c/proposals/18.json')
        .query(true)
        .reply(200, {
          topic_list: {
            topics: [{
              id: 1,
              title: '[SIP-001] Test',
              slug: 'test'
            }],
            more_topics_url: null
          }
        })
        .get('/t/1.json')
        .reply(500);

      const result = await scraper.scrapeAll();
      assert(result.posts[0].c === '[Content fetch failed]', 'Should handle failed content fetch');
      assert(result.posts[0].t, 'Should still have basic post data');
    });
  });

  describe('Live API Structure Validation', () => {
    it('should validate forum API is accessible', async function() {
      this.timeout(5000);
      nock.restore();
      
      try {
        const response = await scraper.fetchWithRetry(`${scraper.baseUrl}/c/proposals/18.json`);
        assert(response.topic_list, 'Forum API should be accessible');
        nock.activate();
      } catch (error) {
        nock.activate();
        throw error;
      }
    });
  });

  describe('Pagination', () => {
    it('should stop when no more pages are available', async () => {
      const page1 = {
        topic_list: {
          topics: [
            { id: 1, title: '[SIP-001] Test', slug: 'test' }
          ],
          more_topics_url: null  // Explicitly indicate no more pages
        }
      };

      nock('https://forum.rare.xyz')
        .get('/c/proposals/18.json')
        .query({ page: 0 })
        .reply(200, page1)
        .get('/t/1.json')
        .reply(200, {
          post_stream: { posts: [{ cooked: '<p>Content</p>' }] }
        });

      const result = await scraper.scrapeAll();
      assert.strictEqual(result.totalPages, 1, 'Should stop after first page when no more pages');
    });
  });
}); 
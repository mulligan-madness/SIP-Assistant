const axios = require('axios');
const debug = require('debug')('forum-scraper:scraper');

class DiscourseScraper {
  constructor(baseUrl, options = {}) {
    this.baseUrl = baseUrl;
    this.options = {
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 1000,
      debug: options.debug || false,
      rateLimit: options.rateLimit || 1000, // ms between requests
    };
    
    if (this.options.debug) {
      debug.enabled = true;
    }
  }

  async fetchWithRetry(url, attempt = 1) {
    // Add rate limiting
    if (this.lastRequest) {
      const timeSinceLastRequest = Date.now() - this.lastRequest;
      if (timeSinceLastRequest < this.options.rateLimit) {
        await new Promise(resolve => 
          setTimeout(resolve, this.options.rateLimit - timeSinceLastRequest)
        );
      }
    }
    this.lastRequest = Date.now();
    
    try {
      debug(`Attempting to fetch ${url} (attempt ${attempt})`);
      const response = await axios.get(url);
      debug(`Successfully fetched ${url}`);
      return response.data;
    } catch (error) {
      debug(`Attempt ${attempt} failed for ${url}: ${error.message}`);
      
      if (attempt >= this.options.maxRetries) {
        debug(`Failed to fetch ${url} after ${attempt} attempts`);
        throw error;
      }
      
      debug(`Waiting ${this.options.retryDelay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, this.options.retryDelay));
      
      return this.fetchWithRetry(url, attempt + 1);
    }
  }

  async scrapeAll() {
    debug('Starting forum scrape of Governance Proposals category');
    const posts = [];
    let page = 0;
    let hasMore = true;

    while (hasMore) {
      debug(`Fetching page ${page}`);
      try {
        // Use the category-specific URL
        const url = `${this.baseUrl}/c/proposals/18.json?page=${page}`;
        const data = await this.fetchWithRetry(url);
        
        // Check if we have any topics at all
        if (!data.topic_list.topics || data.topic_list.topics.length === 0) {
          debug('No more topics found');
          hasMore = false;
          break;
        }

        const sipPosts = data.topic_list.topics
          .filter(topic => {
            const title = topic.title.toUpperCase();
            return title.includes('[SIP') || title.includes('SIP ') || title.includes('SIP|');
          })
          .map(topic => ({
            id: topic.id,
            t: topic.title,
            d: topic.created_at,
            c: '',
            url: `${this.baseUrl}/t/${topic.slug}/${topic.id}`,
            status: topic.tags ? topic.tags.join(', ') : ''
          }));

        if (sipPosts.length > 0) {
          debug(`Found ${sipPosts.length} SIP posts on page ${page}`);
          for (const post of sipPosts) {
            try {
              const topicUrl = `${this.baseUrl}/t/${post.id}.json`;
              const topicData = await this.fetchWithRetry(topicUrl);
              post.c = topicData.post_stream.posts[0].cooked;
              debug(`Fetched content for SIP: ${post.t}`);
              
              // Add validation
              if (!validateSipPost(post)) {
                debug(`Skipping invalid post: ${post.t}`);
                continue;
              }
            } catch (error) {
              debug(`Error fetching content for post ${post.id}: ${error.message}`);
              post.c = '[Content fetch failed]';
            }
          }
          // Only add valid posts
          posts.push(...sipPosts.filter(validateSipPost));
        }

        // Check if there are more pages
        hasMore = Boolean(data.topic_list.more_topics_url);
        if (!hasMore) {
          debug('No more pages to fetch');
          break;
        }
        
        page++;
        debug(`Moving to page ${page}`);
      } catch (error) {
        debug(`Error scraping page ${page}: ${error.message}`);
        hasMore = false;
      }
    }

    debug(`Scraping completed. Found ${posts.length} total SIP posts`);
    return { 
      posts, 
      timestamp: new Date().toISOString(),
      category: 'Governance Proposals',
      categoryId: 18,
      totalPages: page + 1
    };
  }

  // Test method to verify scraper configuration
  async test() {
    try {
      debug('Running scraper test');
      const testUrl = `${this.baseUrl}/latest.json?page=0`;
      const data = await this.fetchWithRetry(testUrl);
      return {
        success: true,
        message: 'Successfully connected to forum',
        topicsFound: data.topic_list.topics.length
      };
    } catch (error) {
      return {
        success: false,
        message: `Test failed: ${error.message}`,
        error
      };
    }
  }
}

function validateSipPost(post) {
  const required = ['id', 't', 'd', 'c', 'url'];
  const missing = required.filter(field => !post[field]);
  
  if (missing.length > 0) {
    debug(`Post ${post.id} missing required fields: ${missing.join(', ')}`);
    return false;
  }
  
  if (post.c.length < 100) {
    debug(`Post ${post.id} content suspiciously short: ${post.c.length} chars`);
    return false;
  }
  
  return true;
}

module.exports = { DiscourseScraper }; 
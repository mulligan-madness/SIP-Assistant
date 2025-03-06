import { describe, it, expect, beforeEach } from 'vitest'
import nock from 'nock'
import { DiscourseScraper } from '../../src/services/scraper.js'

describe('DiscourseScraper', () => {
  let scraper

  beforeEach(() => {
    nock.cleanAll()
    scraper = new DiscourseScraper('https://test.forum.com')
  })

  it('should fetch and parse forum data correctly', async () => {
    // Mock the basic forum response
    nock('https://test.forum.com')
      .get('/site.json')
      .reply(200, {
        about: {
          title: 'Test Forum'
        }
      })

    // Use fetchWithRetry instead of test method
    const response = await scraper.fetchWithRetry('https://test.forum.com/site.json')
    expect(response).toBeDefined()
    expect(response.about.title).toBe('Test Forum')
  })

  it('should handle errors gracefully', async () => {
    nock('https://test.forum.com')
      .get('/site.json')
      .replyWithError('Network error')

    // Make maxRetries 1 to speed up test
    scraper.options.maxRetries = 1
    
    await expect(scraper.fetchWithRetry('https://test.forum.com/site.json'))
      .rejects.toThrow()
  })
}) 
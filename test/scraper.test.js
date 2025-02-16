import { describe, it, expect, beforeEach } from 'vitest'
import nock from 'nock'
import { DiscourseScraper } from '../src/scraper.js'

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

    const response = await scraper.test()
    expect(response.success).toBe(true)
    expect(response.title).toBe('Test Forum')
  })

  it('should handle errors gracefully', async () => {
    nock('https://test.forum.com')
      .get('/site.json')
      .replyWithError('Network error')

    const response = await scraper.test()
    expect(response.success).toBe(false)
    expect(response.error).toBeDefined()
  })
}) 
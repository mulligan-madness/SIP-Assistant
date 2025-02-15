import { describe, it, expect, beforeEach } from 'vitest'
import nock from 'nock'
import { DiscourseScraper } from '../src/scraper.js'

describe('Forum API Integration', () => {
  let scraper

  beforeEach(() => {
    nock.cleanAll()
    scraper = new DiscourseScraper('https://test.forum.com')
  })

  it('should test forum connection', async () => {
    // Mock the forum API response
    nock('https://test.forum.com')
      .get('/site.json')
      .reply(200, {
        about: {
          title: 'Test Forum',
          description: 'A test forum'
        }
      })

    const testResult = await scraper.test()
    expect(testResult.success).toBe(true)
    expect(testResult.title).toBe('Test Forum')
  }, { timeout: 10000 })

  it('should scrape forum data', async () => {
    // Mock the categories API response
    nock('https://test.forum.com')
      .get('/categories.json')
      .reply(200, {
        category_list: {
          categories: [
            {
              id: 1,
              name: 'Test Category',
              description: 'A test category'
            }
          ]
        }
      })

    // Mock the topics API response
    nock('https://test.forum.com')
      .get('/c/1/l/latest.json')
      .reply(200, {
        topic_list: {
          topics: [
            {
              id: 1,
              title: 'Test Topic',
              posts_count: 1
            }
          ]
        }
      })

    const categories = await scraper.getCategories()
    expect(categories).toBeDefined()
    expect(categories.length).toBeGreaterThan(0)
    expect(categories[0].name).toBe('Test Category')
  }, { timeout: 10000 })
}) 
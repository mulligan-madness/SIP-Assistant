import { describe, it, expect, beforeEach } from 'vitest'
import nock from 'nock'
import { DiscourseScraper } from '../../src/services/scraper.js'

describe('Forum API Integration', () => {
  let scraper

  beforeEach(() => {
    nock.cleanAll()
    scraper = new DiscourseScraper('https://test.forum.com')
  })

  it('should fetch forum metadata', async () => {
    // Mock the forum API response
    nock('https://test.forum.com')
      .get('/site.json')
      .reply(200, {
        about: {
          title: 'Test Forum',
          description: 'A test forum'
        }
      })

    const siteData = await scraper.fetchWithRetry('https://test.forum.com/site.json')
    expect(siteData).toBeDefined()
    expect(siteData.about.title).toBe('Test Forum')
  })

  it('should fetch categories', async () => {
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
  })
}) 
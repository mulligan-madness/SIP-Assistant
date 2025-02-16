import { describe, it, expect, beforeEach } from 'vitest'
import { Storage } from '../src/storage'
import { DiscourseScraper } from '../src/scraper'
import { LLMProviderFactory } from '../src/providers/factory'
import nock from 'nock'

describe('Chatbot Core Functionality', () => {
  let storage;
  let scraper;
  let llmProvider;

  beforeEach(() => {
    storage = new Storage();
    scraper = new DiscourseScraper('https://test.forum.com');
    llmProvider = LLMProviderFactory.createProvider('local', {
      model: 'test-model',
      baseUrl: 'http://localhost:1234'
    });
  });

  it('should initialize storage correctly', async () => {
    expect(storage).toBeDefined();
  }, { timeout: 30000 });

  // Add more tests as needed
}); 
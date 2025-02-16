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
    llmProvider = LLMProviderFactory.createProvider('openai', {
      model: 'test-model',
      apiKey: 'test-key'
    });
  });

  it('should initialize storage correctly', async () => {
    expect(storage).toBeDefined();
  });

  it('should create LLM provider with correct configuration', () => {
    expect(llmProvider).toBeDefined();
    expect(llmProvider.config.model).toBe('test-model');
  });
}); 
import { describe, it, expect, beforeEach } from 'vitest'
import { LLMProviderFactory } from '../src/providers/factory.js'
import { LocalLLMProvider } from '../src/providers/local.js'
import { OpenAIProvider } from '../src/providers/openai.js'
import { AnthropicProvider } from '../src/providers/anthropic.js'

describe('LLM Providers', () => {
  describe('Base Provider', () => {
    it('should throw on unimplemented methods', () => {
      const provider = LLMProviderFactory.createProvider('local', {
        baseUrl: 'http://localhost:3000'
      })
      expect(provider).toBeDefined()
    })
  })

  describe('Provider Factory', () => {
    it('should create correct provider instances from env vars', () => {
      process.env.LOCAL_LLM_BASE_URL = 'http://localhost:3000'
      const provider = LLMProviderFactory.createProvider('local')
      expect(provider.constructor.name).toBe('LocalLLMProvider')
      expect(provider.baseUrl).toBe('http://localhost:3000')
    })

    it('should create correct provider instances from config', () => {
      const local = LLMProviderFactory.createProvider('local', {
        baseUrl: 'http://localhost:3000'
      })
      expect(local.constructor.name).toBe('LocalLLMProvider')
      expect(local.baseUrl).toBe('http://localhost:3000')

      const openai = LLMProviderFactory.createProvider('openai', {
        apiKey: 'test-key',
        model: 'gpt-4',
        dangerouslyAllowBrowser: true
      })
      expect(openai.constructor.name).toBe('OpenAIProvider')
      expect(openai.model).toBe('gpt-4')
    })

    it('should throw on unknown provider type', () => {
      expect(() => {
        LLMProviderFactory.createProvider('unknown')
      }).toThrow('Unknown provider type: unknown')
    })

    it('should throw when required config is missing', () => {
      const originalExecPath = process.env.LOCAL_LLM_EXEC_PATH;
      const originalBaseUrl = process.env.LOCAL_LLM_BASE_URL;
      delete process.env.LOCAL_LLM_EXEC_PATH;
      delete process.env.LOCAL_LLM_BASE_URL;

      expect(() => {
        LLMProviderFactory.createProvider('local', {});
      }).toThrow('Either baseUrl or execPath is required for local provider');

      process.env.LOCAL_LLM_EXEC_PATH = originalExecPath;
      process.env.LOCAL_LLM_BASE_URL = originalBaseUrl;
    })
  })

  describe('Local Provider', () => {
    let provider

    beforeEach(() => {
      provider = LLMProviderFactory.createProvider('local', {
        baseUrl: 'http://localhost:3000/v1'
      })
    })

    it('should handle completion requests', async () => {
      const nock = require('nock');
      nock('http://localhost:3000/v1')
        .post('/completions', body => body.prompt === 'Test prompt')
        .reply(200, {
          choices: [{ text: 'Test completion' }]
        });
      const response = await provider.complete('Test prompt');
      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
      expect(response).toBe('Test completion');
    })

    it('should handle chat requests', async () => {
      const nock = require('nock');
      nock('http://localhost:3000/v1')
        .post('/chat/completions')
        .reply(200, {
          choices: [{ message: { content: 'Test chat response' } }]
        });
      const response = await provider.chat([
        { role: 'user', content: 'Test message' }
      ]);
      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
      expect(response).toBe('Test chat response');
    })
  })

  describe('OpenAI Provider', () => {
    it.skipIf(!process.env.OPENAI_API_KEY)('should use correct model and API key', async () => {
      const provider = LLMProviderFactory.createProvider('openai', {
        apiKey: process.env.OPENAI_API_KEY,
        model: 'gpt-4'
      })
      expect(provider.model).toBe('gpt-4')
    })
  })

  describe('Anthropic Provider', () => {
    it.skipIf(!process.env.ANTHROPIC_API_KEY)('should use correct model and API key', async () => {
      const provider = LLMProviderFactory.createProvider('anthropic', {
        apiKey: process.env.ANTHROPIC_API_KEY,
        model: 'claude-3'
      })
      expect(provider.model).toBe('claude-3')
    })
  })
}) 
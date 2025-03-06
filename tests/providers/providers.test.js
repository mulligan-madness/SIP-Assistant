import { describe, it, expect, beforeEach } from 'vitest'
import { LLMProviderFactory } from '../../src/providers/factory.js'
import { OpenAIProvider } from '../../src/providers/openai.js'
import { AnthropicProvider } from '../../src/providers/anthropic.js'
import { BaseLLMProvider } from '../../src/providers/base.js'

describe('LLM Providers', () => {
  describe('Base Provider', () => {
    it('should throw on unimplemented methods', () => {
      const provider = new BaseLLMProvider();
      expect(provider).toBeDefined();
      expect(() => provider.chat([])).rejects.toThrow('Method not implemented');
      expect(() => provider.complete('')).rejects.toThrow('Method not implemented');
    })
  })

  describe('Provider Factory', () => {
    it('should create correct provider instances from env vars', () => {
      process.env.OPENAI_API_KEY = 'test-key';
      process.env.OPENAI_MODEL = 'gpt-4';
      const provider = LLMProviderFactory.createProvider('openai');
      expect(provider.constructor.name).toBe('OpenAIProvider');
      expect(provider.model).toBe('gpt-4');
    })

    it('should create correct provider instances from config', () => {
      const openai = LLMProviderFactory.createProvider('openai', {
        apiKey: 'test-key',
        model: 'gpt-4',
        dangerouslyAllowBrowser: true
      });
      expect(openai.constructor.name).toBe('OpenAIProvider');
      expect(openai.model).toBe('gpt-4');
    })

    it('should throw on unknown provider type', () => {
      expect(() => {
        LLMProviderFactory.createProvider('unknown');
      }).toThrow('Unknown provider type: unknown');
    })
  })

  describe('OpenAI Provider', () => {
    it.skipIf(!process.env.OPENAI_API_KEY)('should use correct model and API key', async () => {
      const provider = LLMProviderFactory.createProvider('openai', {
        apiKey: process.env.OPENAI_API_KEY,
        model: 'gpt-4',
        dangerouslyAllowBrowser: true
      });
      expect(provider.model).toBe('gpt-4');
    })
  })

  describe('Anthropic Provider', () => {
    it.skipIf(!process.env.ANTHROPIC_API_KEY)('should use correct model and API key', async () => {
      const provider = LLMProviderFactory.createProvider('anthropic', {
        apiKey: process.env.ANTHROPIC_API_KEY,
        model: 'claude-3'
      });
      expect(provider.model).toBe('claude-3');
    })
  })
}) 
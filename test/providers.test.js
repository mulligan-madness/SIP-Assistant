const assert = require('assert');
const { BaseLLMProvider } = require('../src/providers/base');
const { LocalLLMProvider } = require('../src/providers/local');
const { OpenAIProvider } = require('../src/providers/openai');
const { AnthropicProvider } = require('../src/providers/anthropic');
const { LLMProviderFactory } = require('../src/providers/factory');
const nock = require('nock');

describe('LLM Providers', () => {
  let originalEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    // Clear any existing env vars
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.LLM_EXEC_PATH;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Base Provider', () => {
    it('should throw on unimplemented methods', async () => {
      const provider = new BaseLLMProvider();
      await assert.rejects(provider.complete('test'));
      await assert.rejects(provider.chat([]));
    });
  });

  describe('Provider Factory', () => {
    it('should create correct provider instances from env vars', () => {
      process.env.OPENAI_API_KEY = 'test-openai-key';
      process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
      process.env.LLM_EXEC_PATH = '/path/to/lmstudio';

      const local = LLMProviderFactory.createProvider('local');
      assert(local instanceof LocalLLMProvider);
      assert.strictEqual(local.execPath, '/path/to/lmstudio');

      const openai = LLMProviderFactory.createProvider('openai');
      assert(openai instanceof OpenAIProvider);
      assert.strictEqual(openai.apiKey, 'test-openai-key');

      const anthropic = LLMProviderFactory.createProvider('anthropic');
      assert(anthropic instanceof AnthropicProvider);
      assert.strictEqual(anthropic.apiKey, 'test-anthropic-key');
    });

    it('should create correct provider instances from config', () => {
      const local = LLMProviderFactory.createProvider('local', {
        execPath: '/custom/path'
      });
      assert(local instanceof LocalLLMProvider);
      assert.strictEqual(local.execPath, '/custom/path');

      const openai = LLMProviderFactory.createProvider('openai', {
        apiKey: 'custom-openai-key'
      });
      assert(openai instanceof OpenAIProvider);
      assert.strictEqual(openai.apiKey, 'custom-openai-key');

      const anthropic = LLMProviderFactory.createProvider('anthropic', {
        apiKey: 'custom-anthropic-key'
      });
      assert(anthropic instanceof AnthropicProvider);
      assert.strictEqual(anthropic.apiKey, 'custom-anthropic-key');
    });

    it('should throw on unknown provider type', () => {
      assert.throws(() => LLMProviderFactory.createProvider('unknown'));
    });

    it('should throw when required config is missing', () => {
      assert.throws(() => LLMProviderFactory.createProvider('local'), /execPath is required/);
      assert.throws(() => LLMProviderFactory.createProvider('openai'), /apiKey is required/);
      assert.throws(() => LLMProviderFactory.createProvider('anthropic'), /apiKey is required/);
    });
  });

  describe('Local Provider', () => {
    let provider;

    beforeEach(() => {
      nock.cleanAll();
      process.env.LLM_EXEC_PATH = '/path/to/lmstudio';
      provider = LLMProviderFactory.createProvider('local');
    });

    afterEach(() => {
      nock.cleanAll();
    });

    it('should handle completion requests', async () => {
      nock('http://localhost:1234')
        .post('/v1/completions')
        .reply(200, {
          choices: [{ text: 'test response' }]
        });

      const response = await provider.complete('test prompt');
      assert.strictEqual(response, 'test response');
    });

    it('should handle chat requests', async () => {
      nock('http://localhost:1234')
        .post('/v1/chat/completions')
        .reply(200, {
          choices: [{ message: { content: 'test chat response' } }]
        });

      const response = await provider.chat([{ role: 'user', content: 'test' }]);
      assert.strictEqual(response, 'test chat response');
    });
  });

  describe('OpenAI Provider', () => {
    let provider;

    beforeEach(function() {
      if (!process.env.OPENAI_API_KEY) {
        this.skip();
        return;
      }
      provider = LLMProviderFactory.createProvider('openai');
    });

    it('should use correct model and API key', function() {
      if (!provider) this.skip();
      assert.strictEqual(provider.model, process.env.OPENAI_MODEL || 'gpt-4');
      assert.strictEqual(provider.apiKey, process.env.OPENAI_API_KEY);
    });
  });

  describe('Anthropic Provider', () => {
    let provider;

    beforeEach(function() {
      if (!process.env.ANTHROPIC_API_KEY) {
        this.skip();
        return;
      }
      provider = LLMProviderFactory.createProvider('anthropic');
    });

    it('should use correct model and API key', function() {
      if (!provider) this.skip();
      assert.strictEqual(provider.model, process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229');
      assert.strictEqual(provider.apiKey, process.env.ANTHROPIC_API_KEY);
    });
  });
}); 
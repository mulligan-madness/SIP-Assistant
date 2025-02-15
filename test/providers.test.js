const assert = require('assert');
const { BaseLLMProvider } = require('../src/providers/base');
const { LocalLLMProvider } = require('../src/providers/local');
const { OpenAIProvider } = require('../src/providers/openai');
const { AnthropicProvider } = require('../src/providers/anthropic');
const { LLMProviderFactory } = require('../src/providers/factory');

describe('LLM Providers', () => {
  describe('Base Provider', () => {
    it('should throw on unimplemented methods', async () => {
      const provider = new BaseLLMProvider();
      await assert.rejects(provider.complete('test'));
      await assert.rejects(provider.chat([]));
    });
  });

  describe('Provider Factory', () => {
    it('should create correct provider instances', () => {
      const local = LLMProviderFactory.createProvider('local');
      assert(local instanceof LocalLLMProvider);

      const openai = LLMProviderFactory.createProvider('openai', { apiKey: 'test' });
      assert(openai instanceof OpenAIProvider);

      const anthropic = LLMProviderFactory.createProvider('anthropic', { apiKey: 'test' });
      assert(anthropic instanceof AnthropicProvider);
    });

    it('should throw on unknown provider type', () => {
      assert.throws(() => LLMProviderFactory.createProvider('unknown'));
    });
  });

  describe('Local Provider', () => {
    let provider;

    beforeEach(() => {
      provider = new LocalLLMProvider({
        execPath: '/path/to/lmstudio',
        model: 'test-model'
      });
    });

    it('should handle completion requests', async () => {
      // Mock the local LLM implementation
      provider.complete = async (prompt) => 'test response';
      const response = await provider.complete('test prompt');
      assert.strictEqual(response, 'test response');
    });

    it('should handle chat requests', async () => {
      // Mock the chat implementation
      provider.chat = async (messages) => 'test chat response';
      const response = await provider.chat([{ role: 'user', content: 'test' }]);
      assert.strictEqual(response, 'test chat response');
    });
  });

  describe('OpenAI Provider', () => {
    let provider;

    beforeEach(() => {
      provider = new OpenAIProvider({
        apiKey: 'test-key',
        model: 'gpt-4'
      });
    });

    it('should use correct model and API key', () => {
      assert.strictEqual(provider.model, 'gpt-4');
      assert(provider.client);
    });

    // Add more OpenAI-specific tests
  });

  describe('Anthropic Provider', () => {
    let provider;

    beforeEach(() => {
      provider = new AnthropicProvider({
        apiKey: 'test-key',
        model: 'claude-2'
      });
    });

    it('should use correct model and API key', () => {
      assert.strictEqual(provider.model, 'claude-2');
      assert(provider.client);
    });

    // Add more Anthropic-specific tests
  });
}); 
const assert = require('assert');
const { LLMProviderFactory } = require('../src/providers/factory');

describe('LLM Integration Tests', function() {
  this.timeout(10000); // Longer timeout for API calls
  
  describe('local Provider Integration', () => {
    let provider;
    
    before(function() {
      if (!process.env.LLM_EXEC_PATH) {
        this.skip();
        return;
      }
      provider = LLMProviderFactory.createProvider('local', {
        execPath: process.env.LLM_EXEC_PATH
      });
    });

    it('should handle completion requests', async function() {
      if (!provider) this.skip();
      const response = await provider.complete('Say hello');
      assert(response && typeof response === 'string');
    });

    it('should handle chat requests', async function() {
      if (!provider) this.skip();
      const response = await provider.chat([
        { role: 'user', content: 'Say hello' }
      ]);
      assert(response && typeof response === 'string');
    });

    it('should handle errors gracefully', async function() {
      if (!provider) this.skip();
      await assert.rejects(
        provider.chat([{ role: 'invalid', content: 'test' }])
      );
    });
  });

  describe('openai Provider Integration', () => {
    let provider;
    
    before(function() {
      if (!process.env.OPENAI_API_KEY) {
        this.skip();
        return;
      }
      provider = LLMProviderFactory.createProvider('openai', {
        apiKey: process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo'
      });
    });

    it('should handle completion requests', async function() {
      if (!provider) this.skip();
      const response = await provider.complete('Say hello');
      assert(response && typeof response === 'string');
    });

    it('should handle chat requests', async function() {
      if (!provider) this.skip();
      const response = await provider.chat([
        { role: 'user', content: 'Say hello' }
      ]);
      assert(response && typeof response === 'string');
    });

    it('should handle errors gracefully', async function() {
      if (!provider) this.skip();
      await assert.rejects(
        provider.chat([{ role: 'invalid', content: 'test' }])
      );
    });
  });

  describe('anthropic Provider Integration', () => {
    let provider;
    
    before(function() {
      if (!process.env.ANTHROPIC_API_KEY) {
        this.skip();
        return;
      }
      provider = LLMProviderFactory.createProvider('anthropic', {
        apiKey: process.env.ANTHROPIC_API_KEY,
        model: process.env.ANTHROPIC_MODEL || 'claude-2'
      });
    });

    it('should handle completion requests', async function() {
      if (!provider) this.skip();
      const response = await provider.complete('Say hello');
      assert(response && typeof response === 'string');
    });

    it('should handle chat requests', async function() {
      if (!provider) this.skip();
      const response = await provider.chat([
        { role: 'user', content: 'Say hello' }
      ]);
      assert(response && typeof response === 'string');
    });

    it('should handle errors gracefully', async function() {
      if (!provider) this.skip();
      await assert.rejects(
        provider.chat([{ role: 'invalid', content: 'test' }])
      );
    });
  });
}); 
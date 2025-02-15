const assert = require('assert');
const { LLMProviderFactory } = require('../src/providers/factory');

describe('LLM Integration Tests', function() {
  this.timeout(10000); // Longer timeout for API calls
  
  const providers = ['local', 'openai', 'anthropic'];
  
  providers.forEach(providerType => {
    describe(`${providerType} Provider Integration`, () => {
      let provider;
      
      before(() => {
        // Skip if required env vars aren't set
        if (providerType !== 'local' && !process.env.LLM_API_KEY) {
          this.skip();
        }
        
        provider = LLMProviderFactory.createProvider(providerType, {
          apiKey: process.env.LLM_API_KEY,
          model: process.env.LLM_MODEL,
          execPath: process.env.LLM_EXEC_PATH
        });
      });

      it('should handle completion requests', async () => {
        const response = await provider.complete('Say hello');
        assert(response && typeof response === 'string');
      });

      it('should handle chat requests', async () => {
        const response = await provider.chat([
          { role: 'user', content: 'Say hello' }
        ]);
        assert(response && typeof response === 'string');
      });

      it('should handle errors gracefully', async () => {
        await assert.rejects(
          provider.chat([{ role: 'invalid', content: 'test' }])
        );
      });
    });
  });
}); 
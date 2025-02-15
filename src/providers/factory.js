const { LocalLLMProvider } = require('./local');
const { OpenAIProvider } = require('./openai');
const { AnthropicProvider } = require('./anthropic');

class LLMProviderFactory {
  static createProvider(type, config = {}) {
    switch (type.toLowerCase()) {
      case 'local':
        return new LocalLLMProvider(config);
      case 'openai':
        return new OpenAIProvider(config);
      case 'anthropic':
        return new AnthropicProvider(config);
      default:
        throw new Error(`Unknown provider type: ${type}`);
    }
  }
}

module.exports = { LLMProviderFactory }; 
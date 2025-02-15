const { LocalLLMProvider } = require('./local');
const { OpenAIProvider } = require('./openai');
const { AnthropicProvider } = require('./anthropic');

class LLMProviderFactory {
  static validateConfig(type, config) {
    switch (type.toLowerCase()) {
      case 'local':
        if (!config.execPath && !process.env.LLM_EXEC_PATH) {
          throw new Error('execPath is required for local provider (set in config or LLM_EXEC_PATH env var)');
        }
        break;
      case 'openai':
        if (!config.apiKey && !process.env.OPENAI_API_KEY) {
          throw new Error('apiKey is required for OpenAI provider (set in config or OPENAI_API_KEY env var)');
        }
        break;
      case 'anthropic':
        if (!config.apiKey && !process.env.ANTHROPIC_API_KEY) {
          throw new Error('apiKey is required for Anthropic provider (set in config or ANTHROPIC_API_KEY env var)');
        }
        break;
      default:
        throw new Error(`Unknown provider type: ${type}`);
    }
  }

  static createProvider(type, config = {}) {
    this.validateConfig(type, config);
    const finalConfig = { ...config };

    switch (type.toLowerCase()) {
      case 'local':
        finalConfig.execPath = config.execPath || process.env.LLM_EXEC_PATH;
        finalConfig.host = config.host || process.env.LLM_HOST || 'localhost';
        finalConfig.port = config.port || process.env.LLM_PORT || 1234;
        finalConfig.model = config.model || process.env.LLM_MODEL || 'phi-4';
        finalConfig.baseUrl = `http://${finalConfig.host}:${finalConfig.port}/v1`;
        return new LocalLLMProvider(finalConfig);
        
      case 'openai':
        finalConfig.apiKey = config.apiKey || process.env.OPENAI_API_KEY;
        finalConfig.model = config.model || process.env.OPENAI_MODEL;
        return new OpenAIProvider(finalConfig);
        
      case 'anthropic':
        finalConfig.apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY;
        finalConfig.model = config.model || process.env.ANTHROPIC_MODEL;
        return new AnthropicProvider(finalConfig);
        
      default:
        throw new Error(`Unknown provider type: ${type}`);
    }
  }
}

module.exports = { LLMProviderFactory }; 
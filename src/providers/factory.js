const { OpenAIProvider } = require('./openai');
const { AnthropicProvider } = require('./anthropic');
const { createLLMProviderError } = require('../utils');

// Import agent providers
const { RetrievalAgentProvider } = require('./agents/retrievalAgentProvider');
const { InterviewAgentProvider } = require('./agents/interviewAgentProvider');
const { DraftingAgentProvider } = require('./agents/draftingAgentProvider');

/**
 * Factory for creating LLM providers
 */
class LLMProviderFactory {
  /**
   * Validate provider configuration
   * @param {string} type - Provider type
   * @param {Object} config - Provider configuration
   * @throws {Error} If configuration is invalid
   */
  static validateConfig(type, config) {
    // Check if this is an agent provider type
    if (type.toLowerCase().includes('agent')) {
      // Agent provider validation
      const llmType = config.llmProvider || 'openai';
      const llmConfig = config.llmConfig || {};
      
      // Validate the underlying LLM provider
      this.validateConfig(llmType, llmConfig);
      return;
    }
    
    // Basic provider validation
    switch (type.toLowerCase()) {
      case 'openai':
        if (!config.apiKey && !process.env.OPENAI_API_KEY) {
          throw createLLMProviderError(
            'apiKey is required for OpenAI provider (set in config or OPENAI_API_KEY env var)',
            'openai'
          );
        }
        break;
      case 'anthropic':
        if (!config.apiKey && !process.env.ANTHROPIC_API_KEY) {
          throw createLLMProviderError(
            'apiKey is required for Anthropic provider (set in config or ANTHROPIC_API_KEY env var)',
            'anthropic'
          );
        }
        break;
      default:
        throw createLLMProviderError(`Unknown provider type: ${type}`, type);
    }
  }

  /**
   * Create a provider instance
   * @param {string} type - Provider type
   * @param {Object} config - Provider configuration
   * @returns {BaseLLMProvider} Provider instance
   */
  static createProvider(type, config = {}) {
    console.log(`[PROVIDER] Creating provider of type: ${type}`);
    
    // Redact API keys for logging
    const safeConfig = JSON.parse(JSON.stringify(config));
    if (safeConfig.apiKey) safeConfig.apiKey = '[REDACTED]';
    if (safeConfig.llmConfig?.apiKey) safeConfig.llmConfig.apiKey = '[REDACTED]';
    
    console.log(`[PROVIDER] Provider config:`, JSON.stringify(safeConfig, null, 2));
    
    this.validateConfig(type, config);
    const finalConfig = { ...config };

    // Check if this is an agent provider request
    if (type.toLowerCase().includes('agent')) {
      console.log(`[PROVIDER] Creating agent provider: ${type}`);
      return this._createAgentProvider(type, finalConfig);
    }

    // Create the appropriate provider
    switch (type.toLowerCase()) {
      case 'openai':
        return new OpenAIProvider(finalConfig);
      case 'anthropic':
        return new AnthropicProvider(finalConfig);
      default:
        throw createLLMProviderError(`Unknown provider type: ${type}`, type);
    }
  }

  /**
   * Create an agent provider
   * @param {string} type - Agent provider type
   * @param {Object} config - Agent provider configuration
   * @returns {BaseAgentProvider} Agent provider instance
   * @private
   */
  static _createAgentProvider(type, config) {
    // Create the underlying LLM provider
    const llmType = config.llmProvider || 'openai';
    const llmConfig = config.llmConfig || {};
    const llmProvider = this.createProvider(llmType, llmConfig);
    
    // Create the appropriate agent provider
    switch (type.toLowerCase()) {
      case 'retrieval-agent':
      case 'retrievalagent':
        return new RetrievalAgentProvider(llmProvider, config);
      case 'interview-agent':
      case 'interviewagent':
        return new InterviewAgentProvider(llmProvider, config);
      case 'drafting-agent':
      case 'draftingagent':
        return new DraftingAgentProvider(llmProvider, config);
      default:
        throw createLLMProviderError(`Unknown agent provider type: ${type}`, 'agent');
    }
  }
}

module.exports = { LLMProviderFactory }; 
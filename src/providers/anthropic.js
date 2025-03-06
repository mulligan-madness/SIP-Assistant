const { BaseLLMProvider } = require('./base');
const Anthropic = require('@anthropic-ai/sdk');
const { createLLMProviderError, createNetworkError } = require('../utils');

/**
 * Anthropic Provider for language model interactions
 * @extends BaseLLMProvider
 */
class AnthropicProvider extends BaseLLMProvider {
  /**
   * Create a new Anthropic provider
   * @param {Object} config - Provider configuration
   * @param {string} config.apiKey - Anthropic API key
   * @param {string} config.model - Anthropic model to use
   * @param {number} config.temperature - Temperature for generation
   * @param {string} config.systemPrompt - Default system prompt
   */
  constructor(config = {}) {
    super(config);
    
    // Set provider name
    this.name = 'anthropic';
    
    // Extract Anthropic specific config
    this.apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY;
    if (!this.apiKey) {
      throw createLLMProviderError('Anthropic API key is required', 'anthropic');
    }
    
    this.model = config.model || process.env.ANTHROPIC_MODEL || 'claude-3-opus-20240229';
    this.temperature = config.temperature !== undefined ? config.temperature : 0.7;
    this.systemPrompt = config.systemPrompt || 'You are a helpful assistant.';
    
    // Initialize Anthropic client
    this.client = new Anthropic({ apiKey: this.apiKey });
    
    console.log(`[ANTHROPIC] Initialized with model: ${this.model}`);
  }

  /**
   * Debug logging utility with namespace
   * @param {string} message - The message to log
   * @private
   */
  _debugLog(message) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[ANTHROPIC] ${message}`);
    }
  }

  /**
   * Complete a prompt with the Anthropic API
   * @param {string} prompt - The prompt to complete
   * @param {Object} options - Additional options
   * @returns {Promise<string>} - The model's completion
   */
  async complete(prompt, options = {}) {
    this._debugLog('Sending completion request');
    try {
      const temperature = options.temperature !== undefined ? options.temperature : this.temperature;
      const systemPrompt = options.systemPrompt || this.systemPrompt;
      
      const response = await this.client.messages.create({
        model: this.model,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 4096,
        temperature: temperature
      });
      
      this._debugLog('Received completion response');
      return response.content[0].text;
    } catch (error) {
      this._debugLog(`Error in completion request: ${error.message}`);
      
      // Check if it's a network error
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
        throw createNetworkError(`Anthropic API network error: ${error.message}`, error);
      }
      
      throw createLLMProviderError(
        `Anthropic API Error: ${error.message}`,
        'anthropic',
        error
      );
    }
  }

  /**
   * Chat with the Anthropic API
   * @param {Array} messages - The conversation messages
   * @param {Object} options - Additional options
   * @returns {Promise<string>} - The model's response
   */
  async chat(messages, options = {}) {
    this._debugLog(`Making chat request with ${messages.length} messages`);
    
    try {
      // Get options
      const temperature = options.temperature !== undefined ? options.temperature : this.temperature;
      const systemPrompt = options.systemPrompt || this.systemPrompt;
      
      // Extract system message if present
      const userSystemMessage = messages.find(m => m.role === 'system')?.content;
      const finalSystemPrompt = userSystemMessage || systemPrompt;
      
      const userMessages = messages.filter(m => m.role !== 'system').map(m => ({
        role: m.role,
        content: m.content
      }));
      
      this._debugLog(`Using model: ${this.model}`);
      this._debugLog(`System message: ${finalSystemPrompt.substring(0, 100)}${finalSystemPrompt.length > 100 ? '...' : ''}`);
      
      if (process.env.NODE_ENV === 'development') {
        this._debugLog(`First few user messages: ${JSON.stringify(userMessages.slice(0, 2), null, 2)}`);
      }

      this._debugLog('Sending request to Anthropic API');
      const response = await this.client.messages.create({
        model: this.model,
        messages: userMessages,
        system: finalSystemPrompt,
        max_tokens: 4096,
        temperature: temperature
      });
      
      this._debugLog('Received response from Anthropic API');
      
      if (process.env.NODE_ENV === 'development') {
        this._debugLog(`Response preview: ${response.content[0].text.substring(0, 100)}${response.content[0].text.length > 100 ? '...' : ''}`);
      }
      
      return response.content[0].text;
    } catch (error) {
      this._debugLog(`Error in chat request: ${error.message}`);
      console.error(`[ANTHROPIC] Error in chat request:`, error);
      
      // Check if it's a network error
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
        throw createNetworkError(`Anthropic API network error: ${error.message}`, error);
      }
      
      throw createLLMProviderError(
        `Anthropic API Error: ${error.message}`,
        'anthropic',
        error
      );
    }
  }
  
  /**
   * Check if this provider supports a specific capability
   * @param {string} capability - The capability to check
   * @returns {boolean} - Whether the capability is supported
   */
  supportsCapability(capability) {
    // Anthropic supports all basic capabilities
    return ['chat', 'complete'].includes(capability);
  }
}

module.exports = { AnthropicProvider }; 
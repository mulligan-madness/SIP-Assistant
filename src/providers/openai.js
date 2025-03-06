const { BaseLLMProvider } = require('./base');
const { OpenAI } = require('openai');
const debug = require('debug')('chatbot:openai');

/**
 * OpenAI Provider for language model interactions
 */
class OpenAIProvider extends BaseLLMProvider {
  constructor(config = {}) {
    super(config);
    
    // Extract OpenAI specific config
    this.apiKey = config.apiKey || process.env.OPENAI_API_KEY;
    this.model = config.model || process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
    this.temperature = config.temperature !== undefined ? config.temperature : 0.7;
    this.systemPrompt = config.systemPrompt || 'You are a helpful assistant.';
    
    // Initialize OpenAI client
    this.client = new OpenAI({ apiKey: this.apiKey });
    
    console.log(`[OPENAI] Initialized with model: ${this.model}`);
  }

  /**
   * Debug logging utility with namespace
   * @param {string} message - The message to log
   * @private
   */
  _debugLog(message) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[OPENAI] ${message}`);
    }
  }

  /**
   * Send a chat request to the OpenAI API
   * @param {Array} messages - The conversation messages
   * @param {Object} options - Additional options
   * @returns {Promise<string>} - The model's response
   */
  async chat(messages, options = {}) {
    try {
      // Get system prompt from options or use default
      const systemPrompt = options.systemPrompt || this.systemPrompt || 'You are a helpful assistant.';
      const temperature = options.temperature !== undefined ? options.temperature : this.temperature;
      
      // Ensure messages is an array
      const messagesArray = Array.isArray(messages) ? messages : [];
      
      // Debug logging
      this._debugLog(`Making chat request with ${messagesArray.length} messages`);
      this._debugLog(`Using model: ${this.model}`);
      
      if (process.env.NODE_ENV === 'development') {
        // Log system prompt preview
        const previewLength = Math.min(100, systemPrompt.length);
        this._debugLog(`System prompt (${systemPrompt.length} chars): ${systemPrompt.substring(0, previewLength)}...`);
        
        // Check if it contains document content
        const hasDocuments = systemPrompt.includes('DOCUMENT') || systemPrompt.includes('RELEVANT');
        this._debugLog(`Contains document content: ${hasDocuments ? 'YES' : 'NO'}`);
      }
      
      // Prepare messages with system prompt
      const messagesWithSystem = [
        { role: 'system', content: systemPrompt },
        ...messagesArray.filter(m => m && m.role !== 'system') // Filter out any existing system messages
      ];

      // Make the API call
      this._debugLog('Sending request to OpenAI API');
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: messagesWithSystem,
        temperature: temperature
      });
      
      this._debugLog('Received response from OpenAI API');
      
      // Return the response text
      if (response && response.choices && response.choices.length > 0) {
        const responseText = response.choices[0].message.content;
        const preview = responseText.substring(0, 50) + (responseText.length > 50 ? '...' : '');
        this._debugLog(`Response preview: ${preview}`);
        return responseText;
      } else {
        throw new Error('Unexpected response format from OpenAI API');
      }
    } catch (error) {
      console.error('[OPENAI] Error in chat request:', error);
      throw new Error(`OpenAI API Error: ${error.message}`);
    }
  }

  /**
   * Complete a prompt with the OpenAI API
   * @param {string} prompt - The prompt to complete
   * @returns {Promise<string>} - The model's completion
   */
  async complete(prompt) {
    try {
      this._debugLog(`Making completion request with prompt: ${prompt.substring(0, 50)}...`);
      
      // Format as a chat message for gpt-3.5-turbo and gpt-4
      const messages = [
        { role: 'system', content: this.systemPrompt },
        { role: 'user', content: prompt }
      ];
      
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: messages
      });
      
      return response.choices[0].message.content;
    } catch (error) {
      console.error('[OPENAI] Error in completion request:', error);
      throw new Error(`OpenAI API Error: ${error.message}`);
    }
  }
}

module.exports = { OpenAIProvider }; 
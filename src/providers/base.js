/**
 * Base LLM Provider
 * Abstract base class for all LLM providers (OpenAI, Anthropic, etc.)
 */

/**
 * Base class for all LLM providers
 * @abstract
 */
class BaseLLMProvider {
  /**
   * Create a new LLM provider
   * @param {Object} config - Provider configuration
   */
  constructor(config = {}) {
    this.config = config;
    this.name = 'base';
    
    // Validate that this is not being instantiated directly
    if (this.constructor === BaseLLMProvider) {
      throw new Error('BaseLLMProvider is an abstract class and cannot be instantiated directly');
    }
  }

  /**
   * Complete a prompt with the LLM
   * @param {string} prompt - The prompt to complete
   * @param {Object} options - Additional options for completion
   * @returns {Promise<string>} - The completion result
   * @abstract
   */
  async complete(prompt, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Chat with the LLM using a message array
   * @param {Array} messages - Array of message objects with role and content
   * @param {Object} options - Additional options for chat
   * @returns {Promise<Object>} - The chat response
   * @abstract
   */
  async chat(messages, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Get the name of this provider
   * @returns {string} - The provider name
   */
  getProviderName() {
    return this.name;
  }

  /**
   * Check if this provider supports a specific capability
   * @param {string} capability - The capability to check ('retrieve', 'interview', 'draft')
   * @returns {boolean} - Whether the capability is supported
   */
  supportsCapability(capability) {
    return false; // Base implementation doesn't support any capabilities
  }

  /**
   * Get a capability implementation if supported
   * @param {string} capability - The capability to get
   * @returns {Function|null} - The capability implementation or null if not supported
   */
  getCapability(capability) {
    return null; // Base implementation doesn't provide any capabilities
  }

  // Agent capability methods with default implementations
  
  /**
   * Retrieval agent capability - finds relevant documents based on a query
   * @param {string} query - The search query
   * @param {Object} options - Additional options for retrieval
   * @returns {Promise<Array>} - Array of relevant documents with metadata
   */
  async retrieve(query, options = {}) {
    throw new Error('Retrieval capability not implemented');
  }

  /**
   * Interview agent capability - conducts interactive dialogues
   * @param {Array} messages - The conversation history
   * @param {Object} context - Additional context for the interview
   * @param {Object} options - Additional options for the interview
   * @returns {Promise<string>} - The agent's response
   */
  async interview(messages, context = {}, options = {}) {
    throw new Error('Interview capability not implemented');
  }

  /**
   * Drafting agent capability - generates structured content
   * @param {Object} research - Research findings to incorporate
   * @param {Array} insights - Insights from interviews
   * @param {Object} template - Template to follow
   * @param {Object} options - Additional options for drafting
   * @returns {Promise<Object>} - The generated draft
   */
  async draft(research, insights, template, options = {}) {
    throw new Error('Drafting capability not implemented');
  }
}

module.exports = { BaseLLMProvider }; 
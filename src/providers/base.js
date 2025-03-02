class BaseLLMProvider {
  async complete(prompt) {
    throw new Error('Method not implemented');
  }

  async chat(messages) {
    throw new Error('Method not implemented');
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

  /**
   * Check if this provider supports a specific agent capability
   * @param {string} capability - The capability to check ('retrieve', 'interview', 'draft')
   * @returns {boolean} - Whether the capability is supported
   */
  supportsCapability(capability) {
    return false; // Base implementation doesn't support any capabilities
  }
}

module.exports = { BaseLLMProvider }; 
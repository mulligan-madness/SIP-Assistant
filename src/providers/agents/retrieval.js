const { BaseAgentProvider } = require('./base');

/**
 * Retrieval Agent Provider
 * Specialized provider for finding relevant documents based on semantic search
 */
class RetrievalAgentProvider extends BaseAgentProvider {
  constructor(llmProvider, config = {}) {
    // Set up a specialized system prompt for retrieval
    const retrievalSystemPrompt = config.systemPrompt || 
      'You are a specialized retrieval agent. Your purpose is to find the most relevant documents ' +
      'based on semantic similarity to the user\'s query. You excel at understanding the intent ' +
      'behind queries and matching them with the most appropriate information sources.';
    
    super(llmProvider, {
      ...config,
      systemPrompt: retrievalSystemPrompt
    });
    
    // Will be implemented in Sprint 4
    this.vectorService = null; // Placeholder for vector service
  }

  /**
   * Retrieval capability - finds relevant documents based on a query
   * @param {string} query - The search query
   * @param {Object} options - Additional options for retrieval
   * @returns {Promise<Array>} - Array of relevant documents with metadata
   */
  async retrieve(query, options = {}) {
    // This will be implemented in Sprint 4
    throw new Error('Retrieval capability will be implemented in Sprint 4');
  }

  /**
   * Check if this provider supports a specific capability
   * @param {string} capability - The capability to check
   * @returns {boolean} - Whether the capability is supported
   */
  supportsCapability(capability) {
    return capability === 'retrieve';
  }
}

module.exports = { RetrievalAgentProvider }; 
const { BaseAgentProvider } = require('./base');

/**
 * Research Agent Provider
 * Specialized provider for analyzing documents and extracting insights
 */
class ResearchAgentProvider extends BaseAgentProvider {
  constructor(llmProvider, config = {}) {
    // Set up a specialized system prompt for research
    const researchSystemPrompt = config.systemPrompt || 
      'You are a specialized research agent. Your purpose is to analyze documents, ' +
      'extract key themes and insights, identify gaps in information, and synthesize ' +
      'findings into a comprehensive research report. You excel at understanding complex ' +
      'information and presenting it in a clear, structured format.';
    
    super(llmProvider, {
      ...config,
      systemPrompt: researchSystemPrompt
    });
  }

  /**
   * Research capability - analyzes documents to extract insights
   * @param {Array} documents - Documents to analyze
   * @param {string} topic - The research topic
   * @param {Object} options - Additional options for research
   * @returns {Promise<Object>} - Research report with findings
   */
  async research(documents, topic, options = {}) {
    // This will be implemented in Sprint 5
    throw new Error('Research capability will be implemented in Sprint 5');
  }

  /**
   * Check if this provider supports a specific capability
   * @param {string} capability - The capability to check
   * @returns {boolean} - Whether the capability is supported
   */
  supportsCapability(capability) {
    return capability === 'research';
  }
}

module.exports = { ResearchAgentProvider }; 
const { BaseAgentProvider } = require('./base');

/**
 * Drafting Agent Provider
 * Specialized provider for generating structured governance proposals
 */
class DraftingAgentProvider extends BaseAgentProvider {
  constructor(llmProvider, config = {}) {
    // Set up a specialized system prompt for drafting
    const draftingSystemPrompt = config.systemPrompt || 
      'You are a specialized drafting agent. Your purpose is to generate well-structured, ' +
      'compliant governance proposals based on research findings and user insights. ' +
      'You excel at organizing information logically, maintaining consistent formatting, ' +
      'and ensuring all necessary sections are included according to governance standards.';
    
    super(llmProvider, {
      ...config,
      systemPrompt: draftingSystemPrompt
    });
  }

  /**
   * Drafting capability - generates structured content
   * @param {Object} research - Research findings to incorporate
   * @param {Array} insights - Insights from interviews
   * @param {Object} template - Template to follow
   * @param {Object} options - Additional options for drafting
   * @returns {Promise<Object>} - The generated draft
   */
  async draft(research, insights, template, options = {}) {
    // This will be implemented in Sprint 7
    throw new Error('Drafting capability will be implemented in Sprint 7');
  }

  /**
   * Simulates critique of a draft to improve it
   * @param {Object} draft - The draft to critique
   * @param {Object} options - Options for the critique
   * @returns {Promise<Object>} - Critique results
   */
  async simulateCritique(draft, options = {}) {
    // This will be implemented in Sprint 7
    throw new Error('Critique simulation will be implemented in Sprint 7');
  }

  /**
   * Check if this provider supports a specific capability
   * @param {string} capability - The capability to check
   * @returns {boolean} - Whether the capability is supported
   */
  supportsCapability(capability) {
    return capability === 'draft';
  }
}

module.exports = { DraftingAgentProvider }; 
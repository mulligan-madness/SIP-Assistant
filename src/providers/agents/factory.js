/**
 * Agent Factory
 * Creates and manages specialized agent providers
 */

const { InterviewAgentProvider } = require('./interviewAgentProvider');
const { RetrievalAgentProvider } = require('./retrievalAgentProvider');
const { DraftingAgentProvider } = require('./draftingAgentProvider');
const { createLLMProviderError } = require('../../utils');
const { BaseLLMProvider } = require('../base');

/**
 * Factory for creating and managing specialized agent providers
 */
class AgentFactory {
  /**
   * Create a new agent factory
   */
  constructor() {
    this.agents = {};
  }

  /**
   * Validate that the provider is a valid LLM provider
   * @param {BaseLLMProvider} llmProvider - The LLM provider to validate
   * @private
   */
  _validateProvider(llmProvider) {
    if (!llmProvider) {
      throw createLLMProviderError('LLM provider is required for agent creation', 'agent');
    }
    
    if (!(llmProvider instanceof BaseLLMProvider)) {
      throw createLLMProviderError('Provider must be an instance of BaseLLMProvider', 'agent');
    }
  }

  /**
   * Create an Interview Agent with optional Retrieval Agent integration
   * @param {BaseLLMProvider} llmProvider - The LLM provider to use
   * @param {Object} options - Configuration options
   * @returns {InterviewAgentProvider} - The created Interview Agent
   */
  createInterviewAgent(llmProvider, options = {}) {
    this._validateProvider(llmProvider);
    
    // Create a Retrieval Agent if integration is requested
    let retrievalAgent = null;
    if (options.integrateRetrieval) {
      retrievalAgent = this.createRetrievalAgent(llmProvider, options.retrievalOptions || {});
    }

    // Create the Interview Agent with the Retrieval Agent
    const interviewAgent = new InterviewAgentProvider(llmProvider, {
      ...options,
      retrievalAgent
    });

    // Store the agent for later reference
    this.agents['interview'] = interviewAgent;

    return interviewAgent;
  }

  /**
   * Create a Retrieval Agent
   * @param {BaseLLMProvider} llmProvider - The LLM provider to use
   * @param {Object} options - Configuration options
   * @returns {RetrievalAgentProvider} - The created Retrieval Agent
   */
  createRetrievalAgent(llmProvider, options = {}) {
    this._validateProvider(llmProvider);
    
    // Create the Retrieval Agent
    const retrievalAgent = new RetrievalAgentProvider(llmProvider, options);

    // Store the agent for later reference
    this.agents['retrieval'] = retrievalAgent;

    return retrievalAgent;
  }

  /**
   * Create a Drafting Agent
   * @param {BaseLLMProvider} llmProvider - The LLM provider to use
   * @param {Object} options - Configuration options
   * @returns {DraftingAgentProvider} - The created Drafting Agent
   */
  createDraftingAgent(llmProvider, options = {}) {
    this._validateProvider(llmProvider);
    
    // Create the Drafting Agent
    const draftingAgent = new DraftingAgentProvider(llmProvider, options);

    // Store the agent for later reference
    this.agents['drafting'] = draftingAgent;

    return draftingAgent;
  }

  /**
   * Get an existing agent by type
   * @param {string} type - The type of agent to get
   * @returns {Object} - The requested agent or null if not found
   */
  getAgent(type) {
    return this.agents[type] || null;
  }
}

// Create a singleton instance
const agentFactory = new AgentFactory();

module.exports = { agentFactory, AgentFactory }; 
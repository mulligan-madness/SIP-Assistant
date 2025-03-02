/**
 * Agent Factory
 * Creates and manages specialized agent providers
 */

const { InterviewAgentProvider } = require('./interview');
const { RetrievalAgentProvider } = require('./retrieval');

/**
 * Factory for creating and managing specialized agent providers
 */
class AgentFactory {
  constructor() {
    this.agents = {};
  }

  /**
   * Create an Interview Agent with optional Retrieval Agent integration
   * @param {Object} llmProvider - The LLM provider to use
   * @param {Object} options - Configuration options
   * @returns {InterviewAgentProvider} - The created Interview Agent
   */
  createInterviewAgent(llmProvider, options = {}) {
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
   * @param {Object} llmProvider - The LLM provider to use
   * @param {Object} options - Configuration options
   * @returns {RetrievalAgentProvider} - The created Retrieval Agent
   */
  createRetrievalAgent(llmProvider, options = {}) {
    // Create the Retrieval Agent
    const retrievalAgent = new RetrievalAgentProvider(llmProvider, options);

    // Store the agent for later reference
    this.agents['retrieval'] = retrievalAgent;

    return retrievalAgent;
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

module.exports = { agentFactory }; 
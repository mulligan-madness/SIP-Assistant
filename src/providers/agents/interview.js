const { BaseAgentProvider } = require('./base');

/**
 * Interview Agent Provider
 * Specialized provider for conducting interactive dialogues
 */
class InterviewAgentProvider extends BaseAgentProvider {
  constructor(llmProvider, config = {}) {
    // Set up a specialized system prompt for interviewing
    const interviewSystemPrompt = config.systemPrompt || 
      'You are a specialized interview agent. Your purpose is to conduct dynamic, ' +
      'insightful conversations that draw out knowledge and ideas from the user. ' +
      'You excel at asking thoughtful follow-up questions, exploring topics deeply, ' +
      'and helping users articulate their thoughts clearly.';
    
    super(llmProvider, {
      ...config,
      systemPrompt: interviewSystemPrompt
    });
  }

  /**
   * Interview capability - conducts interactive dialogues
   * @param {Array} messages - The conversation history
   * @param {Object} context - Additional context for the interview
   * @param {Object} options - Additional options for the interview
   * @returns {Promise<string>} - The agent's response
   */
  async interview(messages, context = {}, options = {}) {
    // This will be implemented in Sprint 6
    throw new Error('Interview capability will be implemented in Sprint 6');
  }

  /**
   * Check if this provider supports a specific capability
   * @param {string} capability - The capability to check
   * @returns {boolean} - Whether the capability is supported
   */
  supportsCapability(capability) {
    return capability === 'interview';
  }
}

module.exports = { InterviewAgentProvider }; 
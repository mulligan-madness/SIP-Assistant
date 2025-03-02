const { BaseAgentProvider } = require('./base');
const { CORE_INTERVIEW_PROMPT, createInterviewPrompt } = require('./prompts/interview');

/**
 * Interview Agent Provider
 * Specialized provider for conducting interactive dialogues using Socratic questioning
 */
class InterviewAgentProvider extends BaseAgentProvider {
  constructor(llmProvider, config = {}) {
    // Use our specialized Socratic questioning prompt
    const interviewSystemPrompt = config.systemPrompt || CORE_INTERVIEW_PROMPT;
    
    super(llmProvider, {
      ...config,
      systemPrompt: interviewSystemPrompt,
      // Lower temperature for more focused questioning
      temperature: config.temperature !== undefined ? config.temperature : 0.5
    });
    
    // Initialize state tracking
    this.insights = [];
    this.topicsForExploration = [];
    this.contradictions = [];
  }

  /**
   * Interview capability - conducts interactive dialogues using Socratic questioning
   * @param {Array} messages - The conversation history
   * @param {Object} context - Additional context for the interview
   * @param {Array} context.documents - Relevant documents from the retrieval agent
   * @param {Object} options - Additional options for the interview
   * @returns {Promise<string>} - The agent's response
   */
  async interview(messages, context = {}, options = {}) {
    this._logOperation('interview', { messageCount: messages.length });
    
    // Create a copy of messages to avoid modifying the original
    const enhancedMessages = [...messages];
    
    // If we have documents from the retrieval agent, incorporate them
    if (context.documents && context.documents.length > 0) {
      // Create an enhanced system prompt with document references
      const enhancedPrompt = createInterviewPrompt(context.documents, {
        additionalContext: context.additionalContext
      });
      
      // Update the system prompt for this conversation
      this.setSystemPrompt(enhancedPrompt);
    }
    
    // Add a reminder to ask Socratic questions if this is a response
    if (enhancedMessages.length > 0 && enhancedMessages[enhancedMessages.length - 1].role === 'user') {
      enhancedMessages.push({
        role: 'system',
        content: 'Remember to use Socratic questioning to draw out implicit knowledge and help the user develop their understanding. Ask thoughtful, open-ended questions.'
      });
    }
    
    // Get a response from the LLM
    const response = await this.llmProvider.chat(enhancedMessages, {
      temperature: options.temperature || this.temperature,
      systemPrompt: this.getSystemPrompt()
    });
    
    // Update our state tracking (in a real implementation, this would analyze the response)
    this._updateStateTracking(enhancedMessages, response);
    
    return response;
  }
  
  /**
   * Update state tracking based on the conversation
   * @param {Array} messages - The conversation history
   * @param {string} response - The agent's response
   * @private
   */
  _updateStateTracking(messages, response) {
    // This is a simplified implementation
    // In a real implementation, we would:
    // 1. Extract insights from user messages
    // 2. Identify topics that need further exploration
    // 3. Detect contradictions in user statements
    
    // For now, just log that we're tracking state
    this._logOperation('updateStateTracking', { 
      messageCount: messages.length,
      responseLength: response.length
    });
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
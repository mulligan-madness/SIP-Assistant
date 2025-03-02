const { BaseAgentProvider } = require('./base');
const { CORE_INTERVIEW_PROMPT, createInterviewPrompt } = require('./prompts/interview');
const { InterviewState } = require('./state/interviewState');
const { analyzeConversation } = require('./state/conversationAnalyzer');

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
    this.state = new InterviewState();
    this.enableStateTracking = config.enableStateTracking !== false;
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
    
    // Update state tracking before generating a response
    if (this.enableStateTracking) {
      this._updateStateTracking(enhancedMessages);
      
      // If we have unresolved contradictions, add a hint to address them
      const unresolvedContradictions = this.state.getContradictions({ status: 'unresolved' });
      if (unresolvedContradictions.length > 0) {
        const contradiction = unresolvedContradictions[0]; // Focus on one at a time
        enhancedMessages.push({
          role: 'system',
          content: `The user has made potentially contradictory statements: "${contradiction.statement1}" and "${contradiction.statement2}". Consider asking a clarifying question about this topic.`
        });
      }
      
      // If we have pending topics with high priority, suggest exploring them
      const pendingTopics = this.state.getTopicsForExploration({ status: 'pending', priority: 'high' });
      if (pendingTopics.length > 0) {
        enhancedMessages.push({
          role: 'system',
          content: `Consider exploring the topic of "${pendingTopics[0].topic}" which seems important but hasn't been fully discussed.`
        });
      }
    }
    
    // Get a response from the LLM
    const response = await this.llmProvider.chat(enhancedMessages, {
      temperature: options.temperature || this.temperature,
      systemPrompt: this.getSystemPrompt()
    });
    
    // Update state with the agent's response
    if (this.enableStateTracking) {
      // Add the agent's response to the conversation for analysis
      const fullConversation = [
        ...enhancedMessages,
        { role: 'assistant', content: response }
      ];
      
      // Update state with the full conversation including the response
      this._updateStateTracking(fullConversation);
    }
    
    return response;
  }
  
  /**
   * Update state tracking based on the conversation
   * @param {Array} messages - The conversation history
   * @private
   */
  _updateStateTracking(messages) {
    if (!this.enableStateTracking) return;
    
    // Use the conversation analyzer to update state
    analyzeConversation(messages, this.state);
    
    // Log state tracking update
    this._logOperation('updateStateTracking', { 
      messageCount: messages.length,
      stateSummary: this.state.getSummary()
    });
  }

  /**
   * Get the current state of the interview
   * @returns {Object} - The current state
   */
  getState() {
    return this.state.export();
  }
  
  /**
   * Import a previously saved state
   * @param {Object} state - The state to import
   */
  importState(state) {
    this.state.import(state);
  }

  /**
   * Get insights extracted from the conversation
   * @param {Object} filters - Optional filters for insights
   * @returns {Array} - Array of insights
   */
  getInsights(filters = {}) {
    return this.state.getInsights(filters);
  }
  
  /**
   * Get topics identified for further exploration
   * @param {Object} filters - Optional filters for topics
   * @returns {Array} - Array of topics
   */
  getTopicsForExploration(filters = {}) {
    return this.state.getTopicsForExploration(filters);
  }
  
  /**
   * Get contradictions detected in the conversation
   * @param {Object} filters - Optional filters for contradictions
   * @returns {Array} - Array of contradictions
   */
  getContradictions(filters = {}) {
    return this.state.getContradictions(filters);
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
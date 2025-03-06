const { 
  INTERVIEW_AGENT_PROMPT, 
  buildInterviewPromptWithDocuments 
} = require('./prompts/interviewPromptTemplates');
const { BaseAgentProvider } = require('./base');
const { InterviewState } = require('./state/interviewState');
const { analyzeConversation } = require('./state/conversationAnalyzer');

/**
 * Interview Agent Provider
 * Specialized provider for answering questions and conducting interactive dialogues
 */
class InterviewAgentProvider extends BaseAgentProvider {
  constructor(llmProvider, config = {}) {
    // Use our specialized system prompt
    const interviewSystemPrompt = config.systemPrompt || INTERVIEW_AGENT_PROMPT;
    
    super(llmProvider, {
      ...config,
      systemPrompt: interviewSystemPrompt,
      // Temperature for more balanced responses
      temperature: config.temperature !== undefined ? config.temperature : 0.3
    });
    
    // Initialize interview state tracking if enabled
    this.enableStateTracking = config.enableStateTracking !== false;
    this.state = new InterviewState();
    
    // Store the retrieval agent if provided
    this.retrievalAgent = config.retrievalAgent || null;
    
    // Debug flag for verbose logging
    this.debug = config.debug || false;
    
    if (this.retrievalAgent) {
      console.log('[AGENT] Interview agent initialized with retrieval agent');
    }
  }

  /**
   * Interview the user - answer questions and facilitate exploration
   * @param {Array} messages - The conversation history
   * @param {Object} context - Additional context
   * @param {Object} options - Additional options
   * @returns {Promise<string>} - The agent's response
   */
  async interview(messages, context = {}, options = {}) {
    this._logOperation('interview', { messageCount: messages.length });
    
    // Create a copy of messages to avoid modifying the original
    const messagesCopy = [...messages];
    
    // --- RETRIEVE RELEVANT DOCUMENTS ---
    let documents = [];
    if (this.retrievalAgent && messages.length > 0) {
      // Get the most recent user question
      const userMessages = messages.filter(m => m.role === 'user');
      if (userMessages.length > 0) {
        const latestUserMessage = userMessages[userMessages.length - 1].content;
        
        if (this.debug) {
          console.log(`[AGENT_COMMUNICATION] Retrieving documents for: "${latestUserMessage}"`);
        }
        
        // Retrieve documents based on the user's question
        documents = await this.retrievalAgent.retrieve(latestUserMessage, {
          threshold: 0.55, // Lower threshold for better recall
          limit: 7        // Increase limit for more comprehensive results
        });
        
        if (this.debug && documents.length > 0) {
          console.log(`[AGENT_COMMUNICATION] Found ${documents.length} relevant documents`);
          documents.forEach((doc, i) => {
            console.log(`  ${i+1}. ${doc.metadata?.title || 'Untitled'} (Score: ${doc.score?.toFixed(2) || 'N/A'})`);
          });
        }
      }
    }
    
    // --- BUILD THE ENHANCED SYSTEM PROMPT WITH DOCUMENTS ---
    const enhancedSystemPrompt = buildInterviewPromptWithDocuments(documents, {
      additionalContext: context.additionalContext
    });
    
    // --- UPDATE STATE TRACKING ---
    if (this.enableStateTracking) {
      this._updateStateTracking(messages);
    }
    
    // --- GET RESPONSE FROM THE LLM ---
    const response = await this.llmProvider.chat(messagesCopy, {
      ...context,
      systemPrompt: enhancedSystemPrompt
    });
    
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
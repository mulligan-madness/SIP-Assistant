/**
 * Interview State Tracking
 * Provides lightweight state management for the Interview Agent
 */

/**
 * InterviewState class for tracking conversation insights, topics, and contradictions
 */
class InterviewState {
  constructor() {
    // Initialize state tracking arrays
    this.insights = [];
    this.topicsForExploration = [];
    this.contradictions = [];
    this.lastUpdated = new Date();
  }

  /**
   * Add an insight extracted from the conversation
   * @param {string} insight - The insight text
   * @param {string} source - Source of the insight (user, agent, document)
   * @param {Object} metadata - Additional metadata about the insight
   * @returns {Object} - The created insight object
   */
  addInsight(insight, source = 'user', metadata = {}) {
    const insightObj = {
      insight,
      source,
      timestamp: new Date().toISOString(),
      ...metadata
    };
    
    this.insights.push(insightObj);
    this.lastUpdated = new Date();
    return insightObj;
  }

  /**
   * Add a topic that needs further exploration
   * @param {string} topic - The topic to explore
   * @param {string} priority - Priority level (high, medium, low)
   * @param {Object} metadata - Additional metadata about the topic
   * @returns {Object} - The created topic object
   */
  addTopicForExploration(topic, priority = 'medium', metadata = {}) {
    const topicObj = {
      topic,
      priority,
      status: 'pending',
      created: new Date().toISOString(),
      ...metadata
    };
    
    this.topicsForExploration.push(topicObj);
    this.lastUpdated = new Date();
    return topicObj;
  }

  /**
   * Update a topic's status
   * @param {string} topic - The topic to update
   * @param {string} status - New status (pending, in_progress, completed)
   * @returns {boolean} - Whether the update was successful
   */
  updateTopicStatus(topic, status) {
    const topicIndex = this.topicsForExploration.findIndex(t => t.topic === topic);
    if (topicIndex === -1) return false;
    
    this.topicsForExploration[topicIndex].status = status;
    this.topicsForExploration[topicIndex].lastUpdated = new Date().toISOString();
    this.lastUpdated = new Date();
    return true;
  }

  /**
   * Flag a potential contradiction in user statements
   * @param {string} statement1 - First contradictory statement
   * @param {string} statement2 - Second contradictory statement
   * @param {Object} metadata - Additional metadata about the contradiction
   * @returns {Object} - The created contradiction object
   */
  flagContradiction(statement1, statement2, metadata = {}) {
    const contradictionObj = {
      statement1,
      statement2,
      status: 'unresolved',
      identified: new Date().toISOString(),
      ...metadata
    };
    
    this.contradictions.push(contradictionObj);
    this.lastUpdated = new Date();
    return contradictionObj;
  }

  /**
   * Resolve a contradiction
   * @param {number} index - Index of the contradiction to resolve
   * @param {string} resolution - How the contradiction was resolved
   * @returns {boolean} - Whether the update was successful
   */
  resolveContradiction(index, resolution) {
    if (index < 0 || index >= this.contradictions.length) return false;
    
    this.contradictions[index].status = 'resolved';
    this.contradictions[index].resolution = resolution;
    this.contradictions[index].resolvedAt = new Date().toISOString();
    this.lastUpdated = new Date();
    return true;
  }

  /**
   * Get all insights
   * @param {Object} filters - Optional filters for insights
   * @returns {Array} - Array of insights matching filters
   */
  getInsights(filters = {}) {
    let filteredInsights = [...this.insights];
    
    if (filters.source) {
      filteredInsights = filteredInsights.filter(i => i.source === filters.source);
    }
    
    return filteredInsights;
  }

  /**
   * Get topics for exploration
   * @param {Object} filters - Optional filters for topics
   * @returns {Array} - Array of topics matching filters
   */
  getTopicsForExploration(filters = {}) {
    let filteredTopics = [...this.topicsForExploration];
    
    if (filters.status) {
      filteredTopics = filteredTopics.filter(t => t.status === filters.status);
    }
    
    if (filters.priority) {
      filteredTopics = filteredTopics.filter(t => t.priority === filters.priority);
    }
    
    return filteredTopics;
  }

  /**
   * Get contradictions
   * @param {Object} filters - Optional filters for contradictions
   * @returns {Array} - Array of contradictions matching filters
   */
  getContradictions(filters = {}) {
    let filteredContradictions = [...this.contradictions];
    
    if (filters.status) {
      filteredContradictions = filteredContradictions.filter(c => c.status === filters.status);
    }
    
    return filteredContradictions;
  }

  /**
   * Get a summary of the current state
   * @returns {Object} - Summary of the current state
   */
  getSummary() {
    return {
      insightCount: this.insights.length,
      pendingTopics: this.topicsForExploration.filter(t => t.status === 'pending').length,
      unresolvedContradictions: this.contradictions.filter(c => c.status === 'unresolved').length,
      lastUpdated: this.lastUpdated
    };
  }

  /**
   * Export the full state as a serializable object
   * @returns {Object} - The full state
   */
  export() {
    return {
      insights: this.insights,
      topicsForExploration: this.topicsForExploration,
      contradictions: this.contradictions,
      lastUpdated: this.lastUpdated.toISOString()
    };
  }

  /**
   * Import state from a serialized object
   * @param {Object} state - The state to import
   */
  import(state) {
    if (state.insights) this.insights = state.insights;
    if (state.topicsForExploration) this.topicsForExploration = state.topicsForExploration;
    if (state.contradictions) this.contradictions = state.contradictions;
    if (state.lastUpdated) this.lastUpdated = new Date(state.lastUpdated);
  }
}

module.exports = { InterviewState }; 
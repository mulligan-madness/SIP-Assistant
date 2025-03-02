/**
 * Conversation Analyzer
 * Utilities for analyzing conversation content to extract insights, topics, and contradictions
 */

/**
 * Simple keyword-based analysis to identify potential topics for exploration
 * @param {string} text - The text to analyze
 * @returns {Array} - Array of potential topics
 */
function identifyTopics(text) {
  // This is a simplified implementation
  // In a real implementation, this would use more sophisticated NLP techniques
  
  const topics = [];
  
  // Look for phrases that indicate topics
  const topicIndicators = [
    { regex: /budget|allocation|funding|tokens/i, topic: 'Budget allocation', priority: 'high' },
    { regex: /timeline|schedule|deadline|milestones/i, topic: 'Project timeline', priority: 'medium' },
    { regex: /governance|voting|decision/i, topic: 'Governance process', priority: 'high' },
    { regex: /metrics|success|measure|outcome/i, topic: 'Success metrics', priority: 'medium' },
    { regex: /team|contributors|developers/i, topic: 'Team composition', priority: 'medium' },
    { regex: /risks|challenges|obstacles/i, topic: 'Risk assessment', priority: 'high' }
  ];
  
  // Check for each topic indicator
  topicIndicators.forEach(indicator => {
    if (indicator.regex.test(text) && !topics.some(t => t.topic === indicator.topic)) {
      topics.push({
        topic: indicator.topic,
        priority: indicator.priority,
        confidence: 'medium' // In a real implementation, this would be calculated
      });
    }
  });
  
  return topics;
}

/**
 * Extract potential insights from text
 * @param {string} text - The text to analyze
 * @returns {Array} - Array of potential insights
 */
function extractInsights(text) {
  // This is a simplified implementation
  // In a real implementation, this would use more sophisticated NLP techniques
  
  const insights = [];
  
  // Look for phrases that indicate insights
  const insightIndicators = [
    { regex: /I (think|believe|feel) that/i, confidence: 'medium' },
    { regex: /My goal is/i, confidence: 'high' },
    { regex: /The (main|primary) purpose/i, confidence: 'high' },
    { regex: /We need to/i, confidence: 'medium' },
    { regex: /It's important to/i, confidence: 'medium' }
  ];
  
  // Split text into sentences
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  // Check each sentence for insight indicators
  sentences.forEach(sentence => {
    for (const indicator of insightIndicators) {
      if (indicator.regex.test(sentence)) {
        insights.push({
          insight: sentence.trim(),
          confidence: indicator.confidence
        });
        break; // Only add each sentence once
      }
    }
  });
  
  return insights;
}

/**
 * Detect potential contradictions in a conversation
 * @param {Array} messages - The conversation messages
 * @returns {Array} - Array of potential contradictions
 */
function detectContradictions(messages) {
  // This is a simplified implementation
  // In a real implementation, this would use more sophisticated NLP techniques
  
  const contradictions = [];
  const userMessages = messages.filter(m => m.role === 'user').map(m => m.content);
  
  // Simple contradiction patterns
  const contradictionPatterns = [
    { 
      pattern1: /allocate\s+100%/i, 
      pattern2: /allocate\s+(\d+)%.*(\d+)%/i,
      description: 'Allocation percentage contradiction'
    },
    { 
      pattern1: /no risks/i, 
      pattern2: /risks? (include|are)/i,
      description: 'Risk assessment contradiction'
    },
    { 
      pattern1: /team (is complete|has all)/i, 
      pattern2: /need (more|additional) team members/i,
      description: 'Team composition contradiction'
    }
  ];
  
  // Check for contradictions across user messages
  for (let i = 0; i < userMessages.length; i++) {
    for (let j = i + 1; j < userMessages.length; j++) {
      for (const pattern of contradictionPatterns) {
        const match1 = pattern.pattern1.test(userMessages[i]);
        const match2 = pattern.pattern2.test(userMessages[j]);
        
        if ((match1 && match2) || (pattern.pattern1.test(userMessages[j]) && pattern.pattern2.test(userMessages[i]))) {
          contradictions.push({
            statement1: userMessages[i],
            statement2: userMessages[j],
            description: pattern.description,
            confidence: 'medium'
          });
        }
      }
    }
  }
  
  return contradictions;
}

/**
 * Analyze a conversation to update state
 * @param {Array} messages - The conversation messages
 * @param {Object} state - The InterviewState object to update
 */
function analyzeConversation(messages, state) {
  if (!messages || messages.length === 0 || !state) return;
  
  // Process only user messages for insights and topics
  const userMessages = messages.filter(m => m.role === 'user');
  
  userMessages.forEach(message => {
    // Extract insights
    const insights = extractInsights(message.content);
    insights.forEach(insight => {
      state.addInsight(insight.insight, 'user', { confidence: insight.confidence });
    });
    
    // Identify topics
    const topics = identifyTopics(message.content);
    topics.forEach(topic => {
      // Only add if not already present
      if (!state.getTopicsForExploration().some(t => t.topic === topic.topic)) {
        state.addTopicForExploration(topic.topic, topic.priority, { confidence: topic.confidence });
      }
    });
  });
  
  // Detect contradictions across all messages
  const contradictions = detectContradictions(messages);
  contradictions.forEach(contradiction => {
    // Only add if not already present (simplified check)
    if (!state.getContradictions().some(c => 
      c.statement1.includes(contradiction.statement1) && 
      c.statement2.includes(contradiction.statement2)
    )) {
      state.flagContradiction(
        contradiction.statement1, 
        contradiction.statement2, 
        { 
          description: contradiction.description,
          confidence: contradiction.confidence
        }
      );
    }
  });
}

module.exports = {
  identifyTopics,
  extractInsights,
  detectContradictions,
  analyzeConversation
}; 
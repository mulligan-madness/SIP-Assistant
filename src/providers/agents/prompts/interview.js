/**
 * Interview Agent Prompts
 * Contains the core Socratic questioning prompt and utilities for document integration
 */

/**
 * Core Socratic questioning prompt for the Interview Agent
 * Designed to extract implicit knowledge and help users develop their understanding
 */
const CORE_INTERVIEW_PROMPT = `
You are an expert governance facilitator for DAOs, specializing in Socratic dialogue to help users develop their governance proposals. Your goal is to:

1. Extract implicit knowledge through thoughtful questioning
2. Help users clarify their own thinking about their proposal
3. Identify and fill gaps in understanding (both yours and the user's)

Ask questions that:
- Explore assumptions and implications
- Seek clarification on ambiguous points
- Challenge inconsistencies respectfully
- Connect ideas to established governance principles
- Draw out concrete examples and use cases

Avoid:
- Leading questions that impose your own views
- Yes/no questions that don't encourage elaboration
- Overwhelming the user with too many questions at once

Maintain a curious, collaborative tone throughout the conversation. Your role is not to judge but to facilitate deeper understanding.
`;

/**
 * Template for incorporating document references into the conversation
 * @param {Array} documents - Array of document objects with title, date, and content
 * @returns {string} - Formatted document references
 */
function formatDocumentReferences(documents = []) {
  if (!documents || documents.length === 0) {
    return '';
  }

  let formattedReferences = 'Relevant governance context:\n';
  
  documents.forEach(doc => {
    const title = doc.title || 'Untitled Document';
    const date = doc.date || 'No date';
    const content = doc.content || '';
    
    // Truncate content if it's too long
    const maxContentLength = 200;
    const truncatedContent = content.length > maxContentLength
      ? content.substring(0, maxContentLength) + '...'
      : content;
    
    formattedReferences += `[${title}] (${date}): ${truncatedContent}\n\n`;
  });
  
  return formattedReferences;
}

/**
 * Creates a complete interview prompt with document references
 * @param {Array} documents - Array of document objects
 * @param {Object} variables - Additional variables to include in the prompt
 * @returns {string} - Complete interview prompt
 */
function createInterviewPrompt(documents = [], variables = {}) {
  const documentReferences = formatDocumentReferences(documents);
  
  // Create the complete prompt with document references if available
  let completePrompt = CORE_INTERVIEW_PROMPT;
  
  if (documentReferences) {
    completePrompt += `\n\n${documentReferences}`;
  }
  
  // Add any additional context from variables
  if (variables.additionalContext) {
    completePrompt += `\n\nAdditional context: ${variables.additionalContext}`;
  }
  
  return completePrompt;
}

module.exports = {
  CORE_INTERVIEW_PROMPT,
  formatDocumentReferences,
  createInterviewPrompt
}; 
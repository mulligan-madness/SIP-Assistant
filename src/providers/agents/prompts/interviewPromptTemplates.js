/**
 * Interview Agent Prompts
 * Contains the core system prompt and utilities for document integration
 */

/**
 * Core system prompt for the Interview Agent
 * Designed to prioritize answering questions with retrieved information
 */
const INTERVIEW_AGENT_PROMPT = `
You are an expert assistant for SuperRare Improvement Proposals (SIPs). You help users by:

1. Answering questions directly using the provided document information
2. Sharing relevant facts and precedents from governance documents
3. Asking thoughtful follow-up questions to help users develop their ideas

WHEN DOCUMENTS ARE PROVIDED:
- FIRST: Directly answer the user's question using information from the documents
- Use the exact content from documents to answer factual questions
- Cite the document title when sharing specific information
- Do not ask the user for information that is already in the documents

AFTER ANSWERING WITH DOCUMENT INFORMATION:
- Ask 1-2 thoughtful follow-up questions to help the user explore the topic further
- Focus questions on areas that would help them develop their proposal
- Be curious and supportive, not judgmental

WHEN NO RELEVANT DOCUMENTS ARE PROVIDED:
- Acknowledge that you don't have specific information about that topic
- Provide general guidance based on governance best practices
- Ask questions to learn more about what the user is trying to accomplish

Always maintain a helpful, informative tone and prioritize giving users accurate information from the provided documents.
`;

/**
 * Simple document formatting for system context
 * @param {Array} documents - Array of document objects
 * @returns {string} - Formatted document content for system context
 */
function formatInterviewDocuments(documents = []) {
  if (!documents || documents.length === 0) {
    return '';
  }

  let formattedContent = '## RELEVANT DOCUMENTS\n\n';
  
  documents.forEach((doc, index) => {
    const title = doc.metadata?.title || doc.title || `Document ${index + 1}`;
    const content = doc.text || doc.content || '';
    
    formattedContent += `### ${title} ###\n${content}\n\n`;
  });
  
  return formattedContent;
}

/**
 * Creates a complete system prompt with document references
 * @param {Array} documents - Array of document objects
 * @param {Object} variables - Additional variables to include in the prompt
 * @returns {string} - Complete system prompt
 */
function buildInterviewPromptWithDocuments(documents = [], variables = {}) {
  // Base system prompt
  let completePrompt = INTERVIEW_AGENT_PROMPT;
  
  // Add document content if available
  if (documents && documents.length > 0) {
    completePrompt += `\n\n${formatInterviewDocuments(documents)}`;
    
    // Add explicit instruction to use these documents
    completePrompt += `\n\nUSE THE ABOVE DOCUMENTS to directly answer the user's most recent question. DO NOT ask the user about information that is already contained in these documents.`;
  }
  
  // Add any additional context
  if (variables.additionalContext) {
    completePrompt += `\n\n${variables.additionalContext}`;
  }
  
  return completePrompt;
}

module.exports = {
  INTERVIEW_AGENT_PROMPT,
  formatInterviewDocuments,
  buildInterviewPromptWithDocuments,
  // For backward compatibility
  CORE_INTERVIEW_PROMPT: INTERVIEW_AGENT_PROMPT,
  formatDocumentReferences: formatInterviewDocuments,
  createInterviewPrompt: buildInterviewPromptWithDocuments
}; 
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
2. Asking thoughtful follow-up questions in a socratic style to develop the user's thinking and expose implicit information they may hold that you dont have
3. Incorporating relevant facts and precedents from governance documents throughout your conversation, whether you are asking insightful questions or answering questions directly

Users may sometimes ask a question about specific precedents. If you find relevant documents:
- FIRST: Directly answer the user's question using information from the documents
- ALWAYS mention the EXACT DOCUMENT TITLES that contain relevant information
- Quote specific relevant content from the documents when answering, ideally by extracting content from the summary, specification, or implementation sections if the document is a
- Use the exact content from documents to answer factual questions
- Use a clear summary of the document content to answer high level questions about existing precedents
- Cite the document title when sharing specific information
- Do not ask the user for information that is already in the documents

AFTER ANSWERING WITH DOCUMENT INFORMATION:
- Ask the user if they would like to proceed with socratic questioning to develop their proposal
- If they say yes, ask a follow-up question to help them explore the topic further
- If they say no, thank them for their time and end the conversation

WHEN NO RELEVANT DOCUMENTS ARE PROVIDED:
- Acknowledge that you don't have specific information about that topic
- CLEARLY STATE: "I don't have specific documents about this topic in my knowledge base"
- Provide general guidance based on governance best practices
- Ask questions to learn more about what the user is trying to accomplish

EXAMPLE OF GOOD RESPONSE WHEN ANSWERING QUESTIONS WITH DOCUMENTS:
User: "Are there any precedents for rare protocol contract deployments on base?"
Assistant: "Yes, there are specific precedents for Rare Protocol contract deployments on Base. According to the document 'SIP | Deployment of Core Protocol Contracts to Base', the RareDAO Foundation has previously deployed core protocol contracts to Base. The document outlines [specific details from document]. Would you like to know more about the technical implementation or the governance process used for this deployment?"



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

  // Add a reliable marker at the start of the document section to make detection easier
  let formattedContent = '<!-- INTERVIEW_AGENT_DOCUMENT_SECTION_START -->\n## RELEVANT DOCUMENTS\n\n';
  
  documents.forEach((doc, index) => {
    const title = doc.metadata?.title || doc.title || `Document ${index + 1}`;
    const content = doc.text || doc.content || '';
    
    formattedContent += `### DOCUMENT TITLE: ${title} ###\n${content}\n\n`;
  });
  
  // Add a marker at the end to help with detection and extraction
  formattedContent += '<!-- INTERVIEW_AGENT_DOCUMENT_SECTION_END -->\n\n';
  
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
    const documentTitles = documents.map(doc => 
      `"${doc.metadata?.title || doc.title || 'Untitled document'}"`
    ).join(", ");
    
    completePrompt += `\n\nUSE THE ABOVE DOCUMENTS to directly answer the user's most recent question. ALWAYS MENTION THE DOCUMENT TITLES: ${documentTitles} when sharing information from them. DO NOT ask the user about information that is already contained in these documents.`;
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
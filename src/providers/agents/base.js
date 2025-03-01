const { BaseLLMProvider } = require('../base');

/**
 * Base class for all agent providers
 * Extends the BaseLLMProvider with agent-specific functionality
 */
class BaseAgentProvider extends BaseLLMProvider {
  /**
   * Create a new agent provider
   * @param {BaseLLMProvider} llmProvider - The underlying LLM provider to use
   * @param {Object} config - Configuration for the agent
   */
  constructor(llmProvider, config = {}) {
    super();
    this.llmProvider = llmProvider;
    this.config = config;
    
    // Default system prompt that can be overridden by specific agents
    this.systemPrompt = config.systemPrompt || 'You are a helpful assistant.';
    
    // Default temperature for agent operations
    this.temperature = config.temperature !== undefined ? config.temperature : 0.7;
    
    // Track operation history for debugging and analysis
    this.operationHistory = [];
  }

  /**
   * Delegate the complete method to the underlying LLM provider
   * @param {string} prompt - The prompt to complete
   * @returns {Promise<string>} - The completion
   */
  async complete(prompt) {
    return this.llmProvider.complete(prompt);
  }

  /**
   * Delegate the chat method to the underlying LLM provider
   * @param {Array} messages - The messages to process
   * @returns {Promise<string>} - The response
   */
  async chat(messages) {
    // Add the system prompt if not already present
    if (!messages.some(m => m.role === 'system')) {
      messages = [
        { role: 'system', content: this.systemPrompt },
        ...messages
      ];
    }
    
    return this.llmProvider.chat(messages);
  }

  /**
   * Format a prompt for the agent
   * @param {string} template - The prompt template
   * @param {Object} variables - Variables to insert into the template
   * @returns {string} - The formatted prompt
   */
  formatPrompt(template, variables = {}) {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      result = result.replace(new RegExp(placeholder, 'g'), value);
    }
    return result;
  }

  /**
   * Parse a structured response from the LLM
   * @param {string} response - The raw response from the LLM
   * @param {string} format - The expected format ('json', 'markdown', etc.)
   * @returns {any} - The parsed response
   */
  parseResponse(response, format = 'text') {
    switch (format.toLowerCase()) {
      case 'json':
        try {
          // Extract JSON if it's wrapped in markdown code blocks
          if (response.includes('```json')) {
            const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
            if (jsonMatch && jsonMatch[1]) {
              return JSON.parse(jsonMatch[1]);
            }
          }
          
          // Try to parse the whole response as JSON
          return JSON.parse(response);
        } catch (error) {
          console.error('Failed to parse JSON response:', error);
          return { error: 'Failed to parse response', raw: response };
        }
        
      case 'markdown':
        // Return the raw markdown
        return response;
        
      case 'text':
      default:
        // Return the raw text
        return response;
    }
  }

  /**
   * Check if this provider supports a specific capability
   * @param {string} capability - The capability to check
   * @returns {boolean} - Whether the capability is supported
   */
  supportsCapability(capability) {
    // To be overridden by specific agent providers
    return false;
  }

  /**
   * Log an operation for history tracking
   * @param {string} operation - The operation name
   * @param {Object} details - Operation details
   * @private
   */
  _logOperation(operation, details = {}) {
    this.operationHistory.push({
      timestamp: new Date(),
      operation,
      details
    });
  }

  /**
   * Get the operation history for this agent
   * @param {number} limit - Maximum number of entries to return
   * @returns {Array} - Operation history
   */
  getOperationHistory(limit = 10) {
    return this.operationHistory.slice(-limit);
  }

  /**
   * Create a structured prompt for the agent based on a template
   * @param {string} templateName - The name of the template to use
   * @param {Object} variables - Variables to insert into the template
   * @returns {string} - The formatted prompt
   */
  createPrompt(templateName, variables = {}) {
    // Common templates that can be used by different agents
    const templates = {
      summarize: `
        Please summarize the following information:
        ---
        {{content}}
        ---
        Provide a concise summary that captures the key points.
      `,
      extractThemes: `
        Please extract the main themes from the following content:
        ---
        {{content}}
        ---
        Identify 3-5 key themes and provide a brief explanation for each.
      `,
      generateQuestions: `
        Based on the following context:
        ---
        {{context}}
        ---
        Generate {{count}} insightful questions that would help explore this topic further.
      `,
      structureContent: `
        Please structure the following content according to the {{templateName}} template:
        ---
        {{content}}
        ---
        Ensure all required sections are included and properly formatted.
      `
    };

    // Get the template or use the input as a custom template
    const template = templates[templateName] || templateName;
    return this.formatPrompt(template, variables);
  }

  /**
   * Process content in chunks to handle large inputs
   * @param {string} content - The content to process
   * @param {Function} processor - Function to process each chunk
   * @param {number} chunkSize - Maximum size of each chunk
   * @returns {Promise<Array>} - Array of processed results
   */
  async processInChunks(content, processor, chunkSize = 4000) {
    // Split content into chunks
    const chunks = [];
    for (let i = 0; i < content.length; i += chunkSize) {
      chunks.push(content.substring(i, i + chunkSize));
    }
    
    // Process each chunk
    const results = [];
    for (let i = 0; i < chunks.length; i++) {
      const result = await processor(chunks[i], i, chunks.length);
      results.push(result);
    }
    
    return results;
  }
}

module.exports = { BaseAgentProvider }; 
const { BaseAgentProvider } = require('./base');
const VectorService = require('../../services/vector');
const { documentService } = require('../../services/document');

/**
 * Retrieval Agent Provider
 * Specialized provider for finding relevant documents based on semantic search
 */
class RetrievalAgentProvider extends BaseAgentProvider {
  constructor(llmProvider, config = {}) {
    // Set up a specialized system prompt for retrieval
    const retrievalSystemPrompt = config.systemPrompt || 
      'You are a specialized retrieval agent. Your purpose is to find the most relevant documents ' +
      'based on semantic similarity to the user\'s query. You excel at understanding the intent ' +
      'behind queries and matching them with the most appropriate information sources.';
    
    super(llmProvider, {
      ...config,
      systemPrompt: retrievalSystemPrompt
    });
    
    // Initialize vector service
    this.vectorService = new VectorService();
    this.documentService = documentService;
    
    // Default search options
    this.defaultSearchOptions = {
      limit: config.limit || 5,
      threshold: config.threshold || 0.7
    };
  }

  /**
   * Retrieval capability - finds relevant documents based on a query
   * @param {string} query - The search query
   * @param {Object} options - Additional options for retrieval
   * @returns {Promise<Array>} - Array of relevant documents with metadata
   */
  async retrieve(query, options = {}) {
    try {
      this._logOperation('retrieve', { query, options });
      
      // Merge default options with provided options
      const searchOptions = {
        ...this.defaultSearchOptions,
        ...options
      };
      
      // Enhance the query using the LLM if needed
      let enhancedQuery = query;
      if (options.enhanceQuery) {
        enhancedQuery = await this._enhanceQuery(query);
      }
      
      // Perform vector search
      const results = await this.vectorService.search(enhancedQuery, searchOptions);
      
      // Format results with citations
      const formattedResults = results.map(result => ({
        id: result.id,
        text: result.text,
        metadata: result.metadata,
        score: result.score,
        citation: this.documentService.formatCitation(result.metadata)
      }));
      
      return formattedResults;
    } catch (error) {
      console.error('Error in retrieve operation:', error);
      throw error;
    }
  }

  /**
   * Enhance a query using the LLM to improve search results
   * @param {string} query - The original query
   * @returns {Promise<string>} - The enhanced query
   * @private
   */
  async _enhanceQuery(query) {
    try {
      const messages = [
        { role: 'system', content: 'You are a query enhancement specialist. Your task is to reformulate the given query to make it more effective for semantic search. Expand abbreviations, add synonyms, and clarify ambiguous terms. Return ONLY the enhanced query text without any explanation.' },
        { role: 'user', content: `Enhance this search query for semantic search: "${query}"` }
      ];
      
      const enhancedQuery = await this.llmProvider.chat(messages);
      return enhancedQuery.trim();
    } catch (error) {
      console.error('Error enhancing query:', error);
      return query; // Fall back to original query on error
    }
  }

  /**
   * Summarize a set of retrieved documents
   * @param {Array} documents - The retrieved documents
   * @param {string} originalQuery - The original query
   * @returns {Promise<string>} - A summary of the documents
   */
  async summarizeResults(documents, originalQuery) {
    try {
      if (!documents || documents.length === 0) {
        return 'No relevant documents found.';
      }
      
      // Prepare document texts with citations
      const documentTexts = documents.map(doc => 
        `Document: ${doc.text}\nCitation: ${doc.citation}\n---`
      ).join('\n');
      
      const messages = [
        { role: 'system', content: 'You are a document summarization specialist. Your task is to summarize the provided documents in relation to the original query. Focus on the most relevant information, maintain factual accuracy, and include proper citations.' },
        { role: 'user', content: `Original Query: ${originalQuery}\n\nDocuments to summarize:\n${documentTexts}\n\nPlease provide a concise summary of these documents in relation to the query.` }
      ];
      
      const summary = await this.llmProvider.chat(messages);
      return summary;
    } catch (error) {
      console.error('Error summarizing results:', error);
      return 'Error generating summary.';
    }
  }

  /**
   * Check if this provider supports a specific capability
   * @param {string} capability - The capability to check
   * @returns {boolean} - Whether the capability is supported
   */
  supportsCapability(capability) {
    return capability === 'retrieve' || capability === 'summarize';
  }
}

module.exports = { RetrievalAgentProvider }; 
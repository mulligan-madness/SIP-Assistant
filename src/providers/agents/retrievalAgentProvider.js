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
    
    // Default search options - use a lower threshold for better recall
    this.defaultSearchOptions = {
      limit: config.limit || 7, // Increased limit for more comprehensive results
      threshold: config.threshold || 0.55  // Lower threshold for better recall
    };
    
    console.log(`[AGENT_COMMUNICATION] Retrieval agent initialized with threshold: ${this.defaultSearchOptions.threshold}`);
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
      
      // Always try to enhance the query for better results
      let enhancedQuery = query;
      
      // Normalize query - remove punctuation and lowercase
      const normalizedQuery = query.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      // Perform vector search
      let results = await this.vectorService.search(normalizedQuery, searchOptions);
      
      // If we didn't find enough results with the normalized query, try with key terms
      if (results.length < 2) {
        // Extract key terms from the query
        const words = normalizedQuery.split(/\s+/);
        
        if (words.length > 2) {
          // Filter out common stop words and keep meaningful terms
          const keyTerms = words
            .filter(word => 
              word.length > 3 && 
              !/^(the|and|that|this|with|from|have|what|when|where|which|would|could|should|about|there|their|they|been|because|does|into|through|during|before|after|above|below|between|under|over)$/i.test(word)
            )
            .join(' ');
          
          if (keyTerms && keyTerms !== normalizedQuery) {
            // Try with key terms and lower threshold
            const keyTermsResults = await this.vectorService.search(keyTerms, {
              ...searchOptions,
              threshold: Math.max(0.5, searchOptions.threshold - 0.05)
            });
            
            // Merge results, avoiding duplicates
            if (keyTermsResults.length > 0) {
              const existingIds = new Set(results.map(doc => doc.id));
              results = [
                ...results,
                ...keyTermsResults.filter(doc => !existingIds.has(doc.id))
              ];
            }
          }
        }
      }
      
      // Sort results by similarity score
      results.sort((a, b) => b.score - a.score);
      
      // Limit to requested number
      if (results.length > searchOptions.limit) {
        results = results.slice(0, searchOptions.limit);
      }
      
      // Format documents for better readability
      const formattedResults = results.map(doc => {
        // Ensure we have text content
        let content = doc.text || doc.content || '';
        
        // Clean HTML tags for better readability
        content = content
          .replace(/<\/?[^>]+(>|$)/g, ' ') // Remove HTML tags
          .replace(/&[a-z]+;/g, ' ')       // Remove HTML entities
          .replace(/\s+/g, ' ')           // Normalize whitespace
          .trim();
        
        // Ensure the title is available
        const title = doc.metadata?.title || doc.title || `Document ${doc.id || 'Unknown'}`;
        
        return {
          ...doc,
          text: content,
          content: content,
          metadata: {
            ...doc.metadata,
            title
          }
        };
      });
      
      return formattedResults;
    } catch (error) {
      console.error(`[Retrieval Agent] Error retrieving documents: ${error.message}`);
      this._logOperation('retrieval_error', { query, error: error.message });
      return [];
    }
  }

  /**
   * Check if this provider supports a specific capability
   * @param {string} capability - The capability to check
   * @returns {boolean} - Whether the capability is supported
   */
  supportsCapability(capability) {
    return capability === 'retrieve';
  }
}

module.exports = { RetrievalAgentProvider };
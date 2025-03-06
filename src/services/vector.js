/**
 * Vector Service
 * Handles vector embeddings and similarity search for the retrieval agent
 */

const { OpenAI } = require('openai');
const { BaseService } = require('./base');
const { createLLMProviderError, createNetworkError } = require('../utils');

// Initialize OpenAI client for embeddings
const openai = process.env.NODE_ENV === 'test' ? 
  {
    // Mock OpenAI client for testing
    embeddings: {
      create: async () => ({
        data: [{ embedding: Array(1536).fill(0.1) }]
      })
    }
  } : 
  new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

// In-memory vector store for development
// In production, this would be replaced with a proper vector database like Pinecone or Weaviate
let vectorStore = {
  vectors: [],
  metadata: []
};

/**
 * Vector Service for handling embeddings and similarity search
 * @extends BaseService
 */
class VectorService extends BaseService {
  /**
   * Create a new vector service
   * @param {Object} config - Service configuration
   */
  constructor(config = {}) {
    super(config);
    
    this.name = 'vector';
    this.embeddingModel = config.embeddingModel || 'text-embedding-3-small';
    this.vectorDimension = 1536; // Dimension of the embedding vectors
    this.similarityThreshold = config.similarityThreshold || 0.1;
    
    // Load vectors from storage if available
    this._loadVectors();
    
    this.log(`Vector service initialized with model: ${this.embeddingModel}`);
  }

  /**
   * Initialize the vector service
   * @returns {Promise<void>}
   */
  async initialize() {
    // If already initialized, just return
    if (this.initialized) {
      this.log('Already initialized, skipping initialization');
      return;
    }
    
    try {
      this.log('Initializing vector service...');
      
      // Load vectors from storage
      await this._loadVectors();
      
      // Set initialized flag
      this.initialized = true;
      
      this.log(`Vector service initialized with ${vectorStore.vectors.length} vectors`);
    } catch (error) {
      this.logError('Failed to initialize vector service', error);
      throw createLLMProviderError(`Failed to initialize vector service: ${error.message}`, 'vector', error);
    }
  }

  /**
   * Get the number of vectors in the store
   * @returns {number} The number of vectors
   */
  getVectorCount() {
    return vectorStore.vectors.length;
  }

  /**
   * Generate embeddings for a text
   * @param {string} text - The text to embed
   * @returns {Promise<Array<number>>} - The embedding vector
   */
  async generateEmbedding(text) {
    try {
      this.log(`Generating embedding for text (length: ${text.length} chars)`);
      this.log(`Using model: ${this.embeddingModel}`);
      
      const startTime = Date.now();
      const response = await openai.embeddings.create({
        model: this.embeddingModel,
        input: text
      });
      const duration = Date.now() - startTime;
      
      this.log(`Embedding generated successfully in ${duration}ms`);
      return response.data[0].embedding;
    } catch (error) {
      this.logError('Error generating embedding', error);
      
      // Check if it's a network error
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
        throw createNetworkError(`Vector service network error: ${error.message}`, error);
      }
      
      throw createLLMProviderError(`Error generating embedding: ${error.message}`, 'vector', error);
    }
  }

  /**
   * Add a document to the vector store
   * @param {string} text - The document text
   * @param {Object} metadata - The document metadata
   * @returns {Promise<Object>} - The added document
   */
  async addDocument(text, metadata = {}) {
    try {
      this.log(`Adding document to vector store: ${metadata.title || 'Untitled'}`);
      
      // Generate embedding for the document
      const embedding = await this.generateEmbedding(text);
      
      // Add to vector store
      vectorStore.vectors.push(embedding);
      vectorStore.metadata.push({
        ...metadata,
        text,
        timestamp: new Date().toISOString()
      });
      
      this.log(`Document added successfully. Vector store now has ${vectorStore.vectors.length} documents`);
      
      // Save vectors to storage
      await this._saveVectors();
      
      return {
        id: vectorStore.vectors.length - 1,
        text,
        metadata
      };
    } catch (error) {
      this.logError('Error adding document to vector store', error);
      
      if (error.name === 'AppError') {
        throw error;
      }
      
      throw createLLMProviderError(`Error adding document to vector store: ${error.message}`, 'vector', error);
    }
  }

  /**
   * Add multiple documents to the vector store
   * @param {Array<Object>} documents - The documents to add
   * @returns {Promise<Array<Object>>} - The added documents
   */
  async addDocuments(documents) {
    try {
      this.log(`Adding ${documents.length} documents to vector store`);
      
      const results = [];
      for (const doc of documents) {
        const result = await this.addDocument(doc.text, doc.metadata);
        results.push(result);
      }
      
      this.log(`Added ${results.length} documents successfully`);
      return results;
    } catch (error) {
      this.logError('Error adding documents to vector store', error);
      
      if (error.name === 'AppError') {
        throw error;
      }
      
      throw createLLMProviderError(`Error adding documents to vector store: ${error.message}`, 'vector', error);
    }
  }

  /**
   * Search for similar documents
   * @param {string} query - The search query
   * @param {Object} options - Search options
   * @param {number} options.limit - Maximum number of results
   * @param {number} options.threshold - Similarity threshold
   * @returns {Promise<Array<Object>>} - The search results
   */
  async search(query, options = {}) {
    try {
      const limit = options.limit || 5;
      const threshold = options.threshold || this.similarityThreshold;
      
      this.log(`Searching for: "${query}" (limit: ${limit}, threshold: ${threshold})`);
      
      // Check if we have vectors
      if (vectorStore.vectors.length === 0) {
        this.log('Vector store is empty, returning empty results');
        return [];
      }
      
      // Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(query);
      
      // Calculate similarity scores
      const results = vectorStore.vectors.map((embedding, index) => {
        const similarity = this._cosineSimilarity(queryEmbedding, embedding);
        return {
          id: index,
          text: vectorStore.metadata[index].text,
          metadata: vectorStore.metadata[index],
          score: similarity
        };
      });
      
      // Filter by threshold and sort by similarity
      const filteredResults = results
        .filter(result => result.score >= threshold)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
      
      this.log(`Found ${filteredResults.length} results above threshold ${threshold}`);
      return filteredResults;
    } catch (error) {
      this.logError('Error searching vector store', error);
      
      if (error.name === 'AppError') {
        throw error;
      }
      
      throw createLLMProviderError(`Error searching vector store: ${error.message}`, 'vector', error);
    }
  }

  /**
   * Clear the vector store
   * @returns {Promise<void>}
   */
  async clear() {
    try {
      this.log('Clearing vector store');
      
      vectorStore.vectors = [];
      vectorStore.metadata = [];
      
      // Save empty vectors to storage
      await this._saveVectors();
      
      this.log('Vector store cleared successfully');
    } catch (error) {
      this.logError('Error clearing vector store', error);
      
      if (error.name === 'AppError') {
        throw error;
      }
      
      throw createLLMProviderError(`Error clearing vector store: ${error.message}`, 'vector', error);
    }
  }

  /**
   * Get debug information about the vector store
   * @returns {Object} Debug information
   */
  getDebugInfo() {
    const documentTypes = {};
    
    // Count document types
    vectorStore.metadata.forEach(meta => {
      const type = meta.type || 'unknown';
      documentTypes[type] = (documentTypes[type] || 0) + 1;
    });
    
    // Get sample titles
    const sampleTitles = vectorStore.metadata
      .slice(0, 5)
      .map(meta => meta.title || 'Untitled');
    
    return {
      totalDocuments: vectorStore.vectors.length,
      documentTypes,
      sampleTitles,
      embeddingModel: this.embeddingModel,
      vectorDimension: this.vectorDimension
    };
  }

  /**
   * Calculate cosine similarity between two vectors
   * @param {Array<number>} vecA - First vector
   * @param {Array<number>} vecB - Second vector
   * @returns {number} Cosine similarity
   * @private
   */
  _cosineSimilarity(vecA, vecB) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    
    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);
    
    if (normA === 0 || normB === 0) {
      return 0;
    }
    
    return dotProduct / (normA * normB);
  }

  /**
   * Load vectors from storage
   * @returns {Promise<void>}
   * @private
   */
  async _loadVectors() {
    try {
      this.log('Loading vectors from storage');
      
      // In a real implementation, this would load from a database or file
      // For now, we're just using in-memory storage
      
      this.log(`Loaded ${vectorStore.vectors.length} vectors from storage`);
    } catch (error) {
      this.logError('Error loading vectors from storage', error);
      
      // Don't throw here, just log the error
      // We'll start with an empty vector store
    }
  }

  /**
   * Save vectors to storage
   * @returns {Promise<void>}
   * @private
   */
  async _saveVectors() {
    try {
      this.log(`Saving ${vectorStore.vectors.length} vectors to storage`);
      
      // In a real implementation, this would save to a database or file
      // For now, we're just using in-memory storage
      
      this.log('Vectors saved successfully');
    } catch (error) {
      this.logError('Error saving vectors to storage', error);
      
      // Don't throw here, just log the error
    }
  }
}

module.exports = VectorService; 
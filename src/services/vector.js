/**
 * Vector Service
 * Handles vector embeddings and similarity search for the retrieval agent
 */

const { OpenAI } = require('openai');
const Storage = require('./storage');

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
 */
class VectorService {
  constructor() {
    this.initialized = false;
    this.embeddingModel = 'text-embedding-3-small';
    this.vectorDimension = 1536; // Dimension of the embedding vectors
    
    // Load vectors from storage if available
    this._loadVectors();
  }

  /**
   * Initialize the vector service
   */
  async initialize() {
    // If already initialized, just return
    if (this.initialized) {
      console.log('[VectorService] Already initialized, skipping initialization');
      return;
    }
    
    try {
      console.log('[VectorService] Initializing vector service...');
      
      // Load vectors from storage
      await this._loadVectors();
      
      // Set initialized flag
      this.initialized = true;
      
      console.log(`[VectorService] Vector service initialized with ${vectorStore.vectors.length} vectors`);
    } catch (error) {
      console.error('[VectorService] Failed to initialize vector service:', error);
      throw error;
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
      console.log(`[VectorService] Generating embedding for text (length: ${text.length} chars)`);
      console.log(`[VectorService] Using model: ${this.embeddingModel}`);
      
      const startTime = Date.now();
      const response = await openai.embeddings.create({
        model: this.embeddingModel,
        input: text
      });
      const duration = Date.now() - startTime;
      
      console.log(`[VectorService] Embedding generated successfully in ${duration}ms`);
      return response.data[0].embedding;
    } catch (error) {
      console.error('[VectorService] Error generating embedding:', error);
      console.error('[VectorService] Error details:', {
        message: error.message,
        status: error.status,
        type: error.type
      });
      throw error;
    }
  }

  /**
   * Add a document to the vector store
   * @param {string} text - The document text
   * @param {Object} metadata - Metadata about the document
   * @returns {Promise<string>} - The document ID
   */
  async addDocument(text, metadata = {}) {
    try {
      const embedding = await this.generateEmbedding(text);
      const id = metadata.id || `doc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      vectorStore.vectors.push({
        id,
        embedding
      });
      
      vectorStore.metadata.push({
        id,
        text,
        ...metadata
      });
      
      await this._saveVectors();
      return id;
    } catch (error) {
      console.error('Error adding document:', error);
      throw error;
    }
  }

  /**
   * Add a forum post to the vector store
   * @param {Object} post - The forum post object
   * @param {string} post.title - The post title
   * @param {string} post.content - The post content
   * @param {string} post.url - The post URL
   * @param {string} post.id - The post ID
   * @param {string} post.date - The post date
   * @returns {Promise<string>} - The document ID
   */
  async addForumPost(post) {
    if (!post.title || !post.content) {
      throw new Error('Post must have title and content');
    }
    
    // Combine title and content for better search results
    const text = `Title: ${post.title}\n\nContent: ${post.content}`;
    
    const metadata = {
      id: post.id || `forum_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      title: post.title,
      url: post.url,
      date: post.date,
      source: 'Forum Post',
      type: 'forum'
    };
    
    return this.addDocument(text, metadata);
  }

  /**
   * Add multiple documents to the vector store
   * @param {Array<{text: string, metadata: Object}>} documents - The documents to add
   * @returns {Promise<Array<string>>} - The document IDs
   */
  async addDocuments(documents) {
    const ids = [];
    
    for (const doc of documents) {
      const id = await this.addDocument(doc.text, doc.metadata);
      ids.push(id);
    }
    
    return ids;
  }

  /**
   * Find similar documents to a query
   * @param {string} query - The query text
   * @param {Object} options - Search options
   * @param {number} options.limit - Maximum number of results
   * @param {number} options.threshold - Similarity threshold (0-1)
   * @returns {Promise<Array<{id: string, text: string, metadata: Object, score: number}>>} - The search results
   */
  async search(query, options = {}) {
    const limit = options.limit || 5;
    const threshold = options.threshold || 0.7;
    
    console.log(`[VectorService] Starting search for query: "${query}" (limit: ${limit}, threshold: ${threshold})`);
    console.log(`[VectorService] Vector store has ${vectorStore.vectors.length} documents`);
    
    try {
      console.log(`[VectorService] Generating embedding for query...`);
      const queryEmbedding = await this.generateEmbedding(query);
      console.log(`[VectorService] Embedding generated successfully`);
      
      const results = [];
      
      // Calculate similarity scores
      console.log(`[VectorService] Calculating similarity scores for ${vectorStore.vectors.length} documents...`);
      for (let i = 0; i < vectorStore.vectors.length; i++) {
        const docVector = vectorStore.vectors[i];
        const docMetadata = vectorStore.metadata[i];
        
        const similarity = this._cosineSimilarity(queryEmbedding, docVector.embedding);
        
        if (similarity >= threshold) {
          results.push({
            id: docVector.id,
            text: docMetadata.text,
            metadata: docMetadata,
            score: similarity
          });
        }
      }
      
      console.log(`[VectorService] Found ${results.length} documents above threshold ${threshold}`);
      
      // Sort by similarity score (descending)
      results.sort((a, b) => b.score - a.score);
      
      // Return top results
      const topResults = results.slice(0, limit);
      console.log(`[VectorService] Returning top ${topResults.length} results`);
      
      return topResults;
    } catch (error) {
      console.error('[VectorService] Error searching vectors:', error);
      throw error;
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   * @param {Array<number>} vec1 - First vector
   * @param {Array<number>} vec2 - Second vector
   * @returns {number} - Cosine similarity (0-1)
   */
  _cosineSimilarity(vec1, vec2) {
    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;
    
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      mag1 += vec1[i] * vec1[i];
      mag2 += vec2[i] * vec2[i];
    }
    
    mag1 = Math.sqrt(mag1);
    mag2 = Math.sqrt(mag2);
    
    if (mag1 === 0 || mag2 === 0) return 0;
    
    return dotProduct / (mag1 * mag2);
  }

  /**
   * Save vectors to storage
   * @private
   */
  async _saveVectors() {
    try {
      const storage = new Storage();
      await storage.setItem('vectorStore', JSON.stringify(vectorStore));
    } catch (error) {
      console.error('Error saving vectors:', error);
    }
  }

  /**
   * Load vectors from storage
   * @private
   */
  async _loadVectors() {
    try {
      console.log('[VectorService] Loading vectors from storage...');
      const storage = new Storage();
      const storedVectors = await storage.getItem('vectorStore');
      
      if (storedVectors) {
        vectorStore = JSON.parse(storedVectors);
        console.log(`[VectorService] Loaded ${vectorStore.vectors.length} vectors from storage`);
        
        // Log some basic stats about the vectors
        if (vectorStore.vectors.length > 0) {
          console.log(`[VectorService] First vector ID: ${vectorStore.vectors[0].id}`);
          console.log(`[VectorService] Vector dimension: ${vectorStore.vectors[0].embedding.length}`);
        }
        
        if (vectorStore.metadata.length > 0) {
          const metadataSample = vectorStore.metadata[0];
          console.log(`[VectorService] Sample metadata:`, {
            id: metadataSample.id,
            title: metadataSample.title || 'N/A',
            type: metadataSample.type || 'N/A'
          });
        }
      } else {
        console.log('[VectorService] No vectors found in storage');
      }
    } catch (error) {
      console.error('[VectorService] Error loading vectors:', error);
    }
  }

  /**
   * Clear all vectors from the store
   */
  async clearVectors() {
    vectorStore = {
      vectors: [],
      metadata: []
    };
    
    await this._saveVectors();
    console.log('Vector store cleared');
  }
  
  /**
   * Clear only forum post data from the vector store
   */
  async clearForumData() {
    // Filter out forum post data
    const nonForumVectors = vectorStore.vectors.filter((v, i) => 
      !vectorStore.metadata[i].type || vectorStore.metadata[i].type !== 'forum'
    );
    
    const nonForumMetadata = vectorStore.metadata.filter(m => 
      !m.type || m.type !== 'forum'
    );
    
    const oldCount = vectorStore.vectors.length;
    
    vectorStore = {
      vectors: nonForumVectors,
      metadata: nonForumMetadata
    };
    
    await this._saveVectors();
    console.log(`Cleared forum data from vector store. Removed ${oldCount - nonForumVectors.length} entries.`);
  }

  /**
   * Reindex forum data after a scrape
   * @param {Array} posts - Array of forum posts to index
   * @returns {Promise<{indexed: number, skipped: number}>} - Indexing results
   */
  async reindexForumData(posts) {
    console.log(`[VectorService] Reindexing ${posts.length} forum posts`);
    
    // First clear existing forum data
    await this.clearForumData();
    
    // Then add all posts
    let indexed = 0;
    let skipped = 0;
    
    for (const post of posts) {
      try {
        // Map the short field names to the expected names
        const processedPost = {
          title: post.title || post.t,
          content: post.content || post.c,
          url: post.url,
          id: post.id,
          date: post.date || post.d
        };
        
        if (!processedPost.title || !processedPost.content || processedPost.content.trim() === '') {
          skipped++;
          continue;
        }
        
        await this.addForumPost(processedPost);
        indexed++;
      } catch (error) {
        console.error(`[VectorService] Error indexing post:`, error);
        skipped++;
      }
    }
    
    console.log(`[VectorService] Reindexing complete: ${indexed} indexed, ${skipped} skipped`);
    return { indexed, skipped };
  }

  /**
   * Get debug information about the vector store
   * @returns {Object} Debug information about the vector store
   */
  async getDebugInfo() {
    console.log('[VectorService] Getting debug info about vector store');
    
    try {
      // Create a safe copy of vectors without the actual embeddings
      const safeVectors = vectorStore.vectors.map(v => ({
        id: v.id,
        embeddingSize: v.embedding ? v.embedding.length : 0
      }));
      
      // Get metadata
      const metadata = vectorStore.metadata;
      
      // Calculate some stats
      const stats = {
        totalVectors: vectorStore.vectors.length,
        totalMetadata: vectorStore.metadata.length,
        documentTypes: {}
      };
      
      // Count document types
      for (const meta of vectorStore.metadata) {
        const type = meta.type || 'unknown';
        stats.documentTypes[type] = (stats.documentTypes[type] || 0) + 1;
      }
      
      console.log('[VectorService] Debug info prepared:', {
        vectorCount: stats.totalVectors,
        metadataCount: stats.totalMetadata,
        documentTypes: stats.documentTypes
      });
      
      return {
        vectors: safeVectors,
        metadata: metadata,
        stats: stats
      };
    } catch (error) {
      console.error('[VectorService] Error getting debug info:', error);
      return {
        error: error.message,
        vectors: [],
        metadata: [],
        stats: { totalVectors: 0, totalMetadata: 0, documentTypes: {} }
      };
    }
  }
}

// Export the class for instantiation by consumers
module.exports = VectorService; 
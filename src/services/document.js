/**
 * Document Service
 * Handles document processing, chunking, and indexing for the vector store
 */

const { LLMProviderFactory } = require('../providers/factory');
const VectorService = require('./vector');

/**
 * Document Service for processing and indexing documents
 */
class DocumentService {
  constructor() {
    this.vectorService = new VectorService();
    this.chunkSize = 1000; // Default chunk size in characters
    this.chunkOverlap = 200; // Default overlap between chunks
  }

  /**
   * Process a document and add it to the vector store
   * @param {string} text - The document text
   * @param {Object} metadata - Metadata about the document
   * @returns {Promise<Array<string>>} - The chunk IDs
   */
  async processDocument(text, metadata = {}) {
    try {
      // Log document info for debugging
      if (!text) {
        console.warn(`Received document with undefined or empty text. Metadata: ${JSON.stringify(metadata)}`);
      }
      
      // Split the document into chunks
      const chunks = this.chunkText(text, this.chunkSize, this.chunkOverlap);
      
      // Create enhanced metadata for each chunk
      const chunkDocuments = chunks.map((chunk, index) => ({
        text: chunk,
        metadata: {
          ...metadata,
          chunkIndex: index,
          totalChunks: chunks.length,
          chunkId: `${metadata.id || 'doc'}_chunk_${index}`
        }
      }));
      
      // Add chunks to vector store
      const chunkIds = await this.vectorService.addDocuments(chunkDocuments);
      return chunkIds;
    } catch (error) {
      console.error('Error processing document:', error);
      throw error;
    }
  }

  /**
   * Process multiple documents and add them to the vector store
   * @param {Array<{text: string, metadata: Object}>} documents - The documents to process
   * @returns {Promise<Array<string>>} - The chunk IDs
   */
  async processDocuments(documents) {
    const chunks = await this.splitDocuments(documents);
    const chunkDocuments = chunks.map(chunk => ({
      text: chunk.text,
      metadata: chunk.metadata
    }));
    
    try {
      const chunkIds = await this.vectorService.addDocuments(chunkDocuments);
      return chunkIds;
    } catch (error) {
      console.error('Error processing documents:', error);
      throw error;
    }
  }

  /**
   * Split text into chunks with overlap
   * @param {string} text - The text to chunk
   * @param {number} size - The chunk size in characters
   * @param {number} overlap - The overlap between chunks
   * @returns {Array<string>} - The text chunks
   */
  chunkText(text, size = this.chunkSize, overlap = this.chunkOverlap) {
    // Handle undefined or empty text
    if (!text) {
      console.warn('Received undefined or empty text in chunkText method');
      return [];
    }
    
    const chunks = [];
    
    // Simple character-based chunking
    // In a production system, this would be more sophisticated
    // (e.g., respecting sentence/paragraph boundaries)
    let i = 0;
    while (i < text.length) {
      const chunk = text.slice(i, i + size);
      chunks.push(chunk);
      i += size - overlap;
    }
    
    return chunks;
  }

  /**
   * Extract metadata from text content
   * @param {string} text - The document text
   * @returns {Object} - Extracted metadata
   */
  extractMetadata(text) {
    // Simple metadata extraction
    // In a production system, this would be more sophisticated
    const metadata = {
      wordCount: text.split(/\s+/).length,
      charCount: text.length,
      createdAt: new Date().toISOString()
    };
    
    // Try to extract a title from the first line
    const firstLine = text.split('\n')[0].trim();
    if (firstLine && firstLine.length < 100) {
      metadata.title = firstLine;
    }
    
    return metadata;
  }

  /**
   * Create a citation for a document
   * @param {Object} metadata - The document metadata
   * @returns {string} - Formatted citation
   */
  formatCitation(metadata) {
    if (!metadata) return 'Unknown source';
    
    let citation = '';
    
    if (metadata.title) {
      citation += `"${metadata.title}"`;
    }
    
    if (metadata.source) {
      citation += citation ? ` from ${metadata.source}` : metadata.source;
    }
    
    if (metadata.author) {
      citation += citation ? ` by ${metadata.author}` : metadata.author;
    }
    
    if (metadata.date) {
      citation += citation ? ` (${metadata.date})` : metadata.date;
    }
    
    if (metadata.url) {
      citation += citation ? ` - ${metadata.url}` : metadata.url;
    }
    
    return citation || 'Unknown source';
  }
}

// Create and export a singleton instance
const documentService = new DocumentService();

module.exports = { documentService }; 
const express = require('express');
const { body, validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const { LLMProviderFactory } = require('../providers/factory');
const Storage = require('./storage');
const { DiscourseScraper } = require('./scraper');
const VectorService = require('./vector');
const { documentService } = require('./document');
const { ChatService } = require('./chat');

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Input validation middleware
const validateChatInput = [
  body('message').trim().notEmpty().withMessage('Message cannot be empty'),
  body('sessionId').trim().notEmpty().withMessage('Session ID is required'),
  body('messageHistory').optional().isArray().withMessage('Message history must be an array'),
];

const validateProviderInput = [
  body('provider').isIn(['1', '2']).withMessage('Invalid provider selection'),
];

// Add validation for retrieval endpoints
const validateRetrievalInput = [
  body('query').trim().notEmpty().withMessage('Query cannot be empty'),
  body('limit').optional().isInt({ min: 1, max: 20 }).withMessage('Limit must be between 1 and 20'),
  body('threshold').optional().isFloat({ min: 0, max: 1 }).withMessage('Threshold must be between 0 and 1'),
];

class ApiService {
  constructor(app) {
    this.app = app;
    this.sipData = [];
    this.compressedContext = null;
    this.isInitialized = false;
    this.llmInitialized = false;
    this.compressedContextPath = path.join(__dirname, '..', '..', 'output', 'compressed-context.md');
    
    // Initialize the vector service
    this.vectorService = new VectorService();
    
    this.setupMiddleware();
    this.setupRoutes();
    
    // Initialize vector service
    this.initializeVectorService();

    // Add early in constructor or initialization
    this.checkEnvironmentConfig();
  }

  setupMiddleware() {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "cdnjs.cloudflare.com"],
          styleSrc: ["'self'", "'unsafe-inline'", "cdnjs.cloudflare.com"],
          imgSrc: ["'self'", "data:", "blob:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'", "data:"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
    }));
    
    this.app.use(cors({
      origin: process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : process.env.FRONTEND_URL,
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type']
    }));
    
    // Rate limiting
    this.app.use('/api/', limiter);
    
    // Request size limits
    this.app.use(express.json({ limit: '1mb' }));
    
    // Centralized error handling
    this.app.use((err, req, res, next) => {
      console.error(err.stack);
      const statusCode = err.status || 500;
      const userMessage = err.userMessage || 'An unexpected error occurred';
      
      // Log error details for monitoring
      console.error({
        timestamp: new Date().toISOString(),
        error: err.message,
        stack: err.stack,
        statusCode,
        path: req.path
      });

      res.status(statusCode).json({
        error: err.message,
        userMessage
      });
    });
    
    // Serve static files from the Vue.js build directory
    this.app.use(express.static(path.join(__dirname, '..', '..', 'dist')));
    
    // Modified middleware to check initialization
    this.app.use('/api', (req, res, next) => {
      if (!this.llmInitialized && req.path !== '/init-llm' && req.path !== '/status') {
        return res.status(503).json({
          error: 'LLM not initialized',
          userMessage: 'Please wait while the system initializes.'
        });
      }
      next();
    });
  }

  setupRoutes() {
    // New endpoint to initialize LLM
    this.app.post('/api/init-llm', validateProviderInput, async (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation error',
          userMessage: errors.array()[0].msg
        });
      }

      try {
        const { provider } = req.body;
        if (!['1', '2'].includes(provider)) {
          return res.status(400).json({
            error: 'Invalid provider',
            userMessage: 'Please select a valid provider (1 or 2)'
          });
        }

        const providerConfig = {
          '1': {
            provider: 'openai',
            config: {
              apiKey: process.env.OPENAI_API_KEY,
              model: process.env.OPENAI_MODEL
            }
          },
          '2': {
            provider: 'anthropic',
            config: {
              apiKey: process.env.ANTHROPIC_API_KEY,
              model: process.env.ANTHROPIC_MODEL
            }
          }
        };

        global.llmProvider = LLMProviderFactory.createProvider(
          providerConfig[provider].provider,
          providerConfig[provider].config
        );

        this.llmInitialized = true;
        res.json({ success: true, provider: providerConfig[provider].provider });
      } catch (error) {
        next(error);
      }
    });

    // Modified status endpoint to check for existing context
    this.app.get('/api/status', (req, res) => {
      let existingContextAvailable = false;
      try {
        fs.accessSync(this.compressedContextPath);
        existingContextAvailable = true;
      } catch (err) {
        // File doesn't exist
      }

      res.json({
        llmInitialized: this.llmInitialized,
        dataLoaded: this.sipData.length > 0,
        contextCompressed: !!this.compressedContext,
        existingContextAvailable
      });
    });

    // New endpoint to load or rescrape data
    this.app.post('/api/load-data', async (req, res) => {
      try {
        const { rescrape } = req.body || {};

        console.log(`[API] /api/load-data called with rescrape=${rescrape}`);

        if (rescrape) {
          const scraper = new DiscourseScraper(process.env.FORUM_BASE_URL, { debug: true });
          console.log(`[API] Starting forum scrape from ${process.env.FORUM_BASE_URL}`);
          const scrapedData = await scraper.scrapeAll();
          console.log(`[API] Scrape completed, saving ${scrapedData.posts?.length || 0} posts`);
          await Storage.saveScrapeResult(scrapedData);
          this.sipData = scrapedData.posts;
          res.json({ success: true, message: 'Data rescraped successfully', count: this.sipData.length });
        } else {
          console.log('[API] Attempting to load data from storage');
          const latestData = await Storage.getLatestScrape();
          if (latestData) {
            console.log(`[API] Loaded ${latestData.posts?.length || 0} posts from storage`);
            this.sipData = latestData.posts;
            res.json({ success: true, message: 'Data loaded from storage', count: this.sipData.length });
          } else {
            console.log('[API] No stored data found, returning 404');
            res.status(404).json({ success: false, message: 'No stored data found. Please rescrape.' });
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
        // Log full error details
        console.error('[API] Detailed error:', {
          message: error.message,
          stack: error.stack,
          code: error.code,
          name: error.name,
          config: error.config
        });
        res.status(500).json({ success: false, message: 'Error loading data', error: error.message });
      }
    });

    // New endpoint to add documents to vector store
    this.app.post('/api/vector/add-documents', async (req, res) => {
      try {
        const { documents } = req.body;
        
        if (!Array.isArray(documents) || documents.length === 0) {
          return res.status(400).json({
            error: 'Invalid documents',
            userMessage: 'Please provide an array of documents'
          });
        }
        
        const chunkIds = await documentService.processDocuments(documents);
        
        res.json({
          success: true,
          message: `Added ${documents.length} documents (${chunkIds.length} chunks) to vector store`,
          chunkIds
        });
      } catch (error) {
        console.error('Error adding documents:', error);
        res.status(500).json({
          success: false,
          message: 'Error adding documents to vector store',
          error: error.message
        });
      }
    });

    // New endpoint to search the vector store
    this.app.post('/api/vector/search', validateRetrievalInput, async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }
        
        const { query, limit = 5, threshold = 0.7 } = req.body;
        
        const results = await this.vectorService.search(query, {
          limit: parseInt(limit, 10),
          threshold: parseFloat(threshold)
        });
        
        res.json({
          success: true,
          results
        });
      } catch (error) {
        console.error('Error searching vector store:', error);
        res.status(500).json({
          success: false,
          message: 'Error searching vector store',
          error: error.message
        });
      }
    });

    // New endpoint to use the retrieval agent
    this.app.post('/api/agent/retrieve', validateRetrievalInput, async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation error',
          userMessage: errors.array()[0].msg
        });
      }
      
      try {
        if (!global.llmProvider) {
          return res.status(400).json({
            error: 'LLM not initialized',
            userMessage: 'Please initialize the LLM provider first'
          });
        }
        
        const { query, limit, threshold, enhanceQuery, summarize } = req.body;
        
        // Create retrieval agent
        const retrievalAgent = LLMProviderFactory.createAgentProvider(
          'retrieval',
          global.llmProvider,
          {
            limit: limit || 5,
            threshold: threshold || 0.7
          }
        );
        
        // Retrieve documents
        const results = await retrievalAgent.retrieve(query, {
          enhanceQuery: enhanceQuery || false
        });
        
        // Generate summary if requested
        let summary = null;
        if (summarize && results.length > 0) {
          summary = await retrievalAgent.summarizeResults(results, query);
        }
        
        res.json({
          success: true,
          query,
          results,
          summary
        });
      } catch (error) {
        console.error('Error using retrieval agent:', error);
        res.status(500).json({
          success: false,
          message: 'Error using retrieval agent',
          error: error.message
        });
      }
    });

    // Function to send progress to all connected SSE clients
    function sendIndexingProgressToAll(type, data) {
      const app = this
      if (!app.locals || !app.locals.sseClients) return
      
      const payload = JSON.stringify({
        type,
        timestamp: Date.now(),
        ...data
      })
      
      for (const client of app.locals.sseClients) {
        client.write(`data: ${payload}\n\n`)
      }
    }

    // Create the vector store indexer for forum data
    this.app.post('/api/vector/index-forum-data', async (req, res) => {
      try {
        console.log('Starting forum data indexing')
        const Storage = require('./storage')
        const storage = new Storage()
        const posts = await storage.loadForumData()
        
        if (!posts || posts.length === 0) {
          return res.json({ success: false, message: 'No forum posts available to index' })
        }
        
        console.log(`Found ${posts.length} forum posts to index`)
        
        // Track clients connected to SSE
        req.app.locals.sseClients = req.app.locals.sseClients || new Set()
        
        // Set total posts count for progress tracking
        req.app.locals.indexingProgress = {
          total: posts.length,
          processed: 0,
          status: 'Starting indexing process',
          startTime: Date.now()
        }
        
        // Helper function to send progress updates
        const sendProgress = (type, data) => {
          if (!req.app.locals.sseClients) return
          
          const payload = JSON.stringify({
            type,
            timestamp: Date.now(),
            ...data
          })
          
          for (const client of req.app.locals.sseClients) {
            client.write(`data: ${payload}\n\n`)
          }
        }
        
        // Notify all clients that indexing is starting
        sendProgress('init', {
          total: posts.length
        })
        
        const VectorService = require('./vector')
        const vector = new VectorService()
        await vector.clearForumData()
        
        // Process posts in batches to avoid overwhelming the system
        const batchSize = 5
        let skippedCount = 0
        
        for (let i = 0; i < posts.length; i += batchSize) {
          const batch = posts.slice(i, i + batchSize)
          const batchStartMsg = `Processing batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(posts.length/batchSize)}`
          
          // Update progress for batch start
          req.app.locals.indexingProgress.status = batchStartMsg
          req.app.locals.indexingProgress.processed = i
          
          sendProgress('progress', {
            processed: i,
            status: batchStartMsg,
            log: batchStartMsg
          })
          
          // Process each post in the batch
          for (const post of batch) {
            // Map the short field names to the expected names
            const processedPost = {
              title: post.title || post.t,
              content: post.content || post.c,
              url: post.url,
              id: post.id,
              date: post.date || post.d
            };
            
            if (!processedPost.title || !processedPost.content || processedPost.content.trim() === '') {
              skippedCount++
              sendProgress('progress', {
                processed: req.app.locals.indexingProgress.processed,
                log: `Skipping post with empty or missing content: ${processedPost.title || 'Untitled'}`,
                logType: 'warning'
              })
              continue
            }
            
            try {
              await vector.addForumPost(processedPost)
              
              // Update progress
              req.app.locals.indexingProgress.processed += 1
              
              // Send individual post progress every few posts to avoid overwhelming the client
              if (req.app.locals.indexingProgress.processed % 3 === 0 || 
                  req.app.locals.indexingProgress.processed === posts.length) {
                sendProgress('progress', {
                  processed: req.app.locals.indexingProgress.processed,
                  status: `Indexed ${req.app.locals.indexingProgress.processed} of ${posts.length}`,
                  log: `Added post: ${processedPost.title} (${processedPost.url})`
                })
              }
            } catch (err) {
              console.error(`Error indexing post: ${processedPost.title}`, err)
              sendProgress('progress', {
                processed: req.app.locals.indexingProgress.processed,
                log: `Error indexing post: ${processedPost.title} - ${err.message}`,
                logType: 'error'
              })
            }
          }
          
          // Small delay between batches to allow for UI updates
          await new Promise(resolve => setTimeout(resolve, 100))
        }
        
        // Send completion event
        const endTime = Date.now()
        const duration = ((endTime - req.app.locals.indexingProgress.startTime) / 1000).toFixed(2)
        
        sendProgress('complete', {
          processed: posts.length - skippedCount,
          total: posts.length,
          skipped: skippedCount,
          status: 'Indexing complete',
          log: `Indexed ${posts.length - skippedCount} posts in ${duration} seconds (${skippedCount} skipped)`
        })
        
        console.log(`Indexed ${posts.length - skippedCount} forum posts (${skippedCount} skipped)`)
        res.json({ success: true, message: `Indexed ${posts.length - skippedCount} forum posts (${skippedCount} skipped)` })
      } catch (error) {
        console.error('Error indexing forum data:', error)
        
        // Notify clients of error
        if (req.app.locals.sseClients) {
          const sendProgress = (type, data) => {
            const payload = JSON.stringify({
              type,
              timestamp: Date.now(),
              ...data
            })
            
            for (const client of req.app.locals.sseClients) {
              client.write(`data: ${payload}\n\n`)
            }
          }
          
          sendProgress('error', {
            message: `Error indexing forum data: ${error.message}`
          })
        }
        
        res.status(500).json({ success: false, message: 'Error indexing forum data', error: error.message })
      }
    })

    // Server-Sent Events endpoint for index progress
    this.app.get('/api/vector/index-progress', (req, res) => {
      // Set headers for SSE
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')
      
      // Send initial data if we already have progress info
      if (req.app.locals.indexingProgress) {
        const data = JSON.stringify({
          type: 'init',
          ...req.app.locals.indexingProgress
        })
        res.write(`data: ${data}\n\n`)
      }
      
      // Set client connection timeout (optional)
      req.setTimeout(0)
      
      // Store the client connection
      req.app.locals.sseClients = req.app.locals.sseClients || new Set()
      req.app.locals.sseClients.add(res)
      
      // Remove client when they disconnect
      req.on('close', () => {
        if (req.app.locals.sseClients) {
          req.app.locals.sseClients.delete(res)
        }
      })
    })

    // Chat endpoint to process user messages
    this.app.post('/api/chat', validateChatInput, async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation error',
          userMessage: errors.array()[0].msg
        });
      }

      try {
        if (!global.llmProvider) {
          return res.status(400).json({
            error: 'LLM not initialized',
            userMessage: 'Please initialize the LLM provider first'
          });
        }

        const { message, sessionId, messageHistory } = req.body;
        console.log('Sending chat request to:', '/api/chat');
        console.log('Request payload:', { 
          message: message.substring(0, 50) + (message.length > 50 ? '...' : ''), 
          sessionId,
          messageHistoryLength: messageHistory ? messageHistory.length : 0
        });

        const chatService = new ChatService();
        const response = await chatService.processMessage(
          message, 
          sessionId,
          this.compressedContext,
          this.sipData,
          messageHistory
        );

        res.json({ 
          success: true, 
          message: response,
          sessionId
        });
      } catch (error) {
        console.error('Error processing chat message:', error);
        res.status(500).json({
          success: false,
          message: 'Error processing your message',
          error: error.message
        });
      }
    });

    // New endpoint to clear vector store
    this.app.post('/api/vector/clear', async (req, res) => {
      try {
        await this.vectorService.clearVectors();
        res.json({ success: true, message: 'Vector store cleared' });
      } catch (error) {
        console.error('Error clearing vector store:', error);
        res.status(500).json({
          success: false,
          message: 'Error clearing vector store',
          error: error.message
        });
      }
    });

    // Catch-all route to serve the Vue.js app
    this.app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '..', '..', 'dist', 'index.html'));
    });
  }

  // Method to set the compressed context
  setCompressedContext(context) {
    this.compressedContext = context;
  }

  // Method to set the initialization status
  setInitialized(status) {
    this.isInitialized = status;
  }

  // Method to set the LLM initialization status
  setLLMInitialized(status) {
    this.llmInitialized = status;
  }

  // Method to get the compressed context
  getCompressedContext() {
    return this.compressedContext;
  }

  // Method to get the SIP data
  getSIPData() {
    return this.sipData;
  }

  // Method to set the SIP data
  setSIPData(data) {
    this.sipData = data;
  }

  async initializeVectorService() {
    try {
      await this.vectorService.initialize();
      console.log('Vector service initialized');
    } catch (error) {
      console.error('Failed to initialize vector service:', error);
    }
  }

  /**
   * Check if essential environment variables are configured
   * @private
   */
  checkEnvironmentConfig() {
    // Check forum URL config
    if (!process.env.FORUM_BASE_URL) {
      console.warn('[API] Warning: FORUM_BASE_URL is not configured in .env file');
    } else {
      console.log(`[API] Using forum URL: ${process.env.FORUM_BASE_URL}`);
    }

    // Check model config
    if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
      console.warn('[API] Warning: No LLM API keys configured in .env file');
    }

    // Log environment mode
    console.log(`[API] Running in ${process.env.NODE_ENV} mode`);
  }
}

module.exports = { ApiService }; 
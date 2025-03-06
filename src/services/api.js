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
const { agentFactory } = require('../providers/agents/factory');

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

// Add these validation rules after the existing validation rules
const validateInterviewInput = [
  body('message').trim().notEmpty().withMessage('Message cannot be empty'),
  body('sessionId').trim().notEmpty().withMessage('Session ID is required'),
  body('messageHistory').optional().isArray().withMessage('Message history must be an array'),
  body('useRetrieval').optional().isBoolean().withMessage('useRetrieval must be a boolean'),
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
    
    // Initialize the chat service
    this.chatService = null; // Will be set later
    
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
        existingContextAvailable,
        needsVectorReindex: req.app.locals.needsVectorReindex || false
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
          
          // Set a flag to indicate that vector reindexing is needed
          req.app.locals.needsVectorReindex = true;
          
          // Automatically trigger vector reindexing
          console.log('[API] Automatically triggering vector reindexing after forum scrape');
          
          try {
            // Use the VectorService to reindex forum data directly
            const result = await this.vectorService.reindexForumData(scrapedData.posts);
            console.log(`[API] Vector reindexing completed: ${result.indexed} indexed, ${result.skipped} skipped`);
            
            // Clear the reindexing flag since we've handled it
            req.app.locals.needsVectorReindex = false;
            
            res.json({ 
              success: true, 
              message: 'Data rescraped and vector store reindexed successfully', 
              count: this.sipData.length,
              reindexed: true,
              indexStats: result
            });
          } catch (reindexError) {
            console.error('[API] Error reindexing vector store:', reindexError);
            
            // Keep the flag set so the frontend knows reindexing is still needed
            res.json({ 
              success: true, 
              message: 'Data rescraped successfully, but vector reindexing failed', 
              count: this.sipData.length,
              needsVectorReindex: true,
              reindexError: reindexError.message
            });
          }
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

    // New endpoint to check if vector store is initialized
    this.app.get('/api/vector/status', async (req, res) => {
      try {
        const isInitialized = this.vectorService.initialized;
        const vectorCount = this.vectorService.getVectorCount ? 
          await this.vectorService.getVectorCount() : 
          (vectorStore?.vectors?.length || 0);
        
        res.json({
          success: true,
          initialized: isInitialized,
          vectorCount: vectorCount,
          needsIndexing: vectorCount === 0
        });
      } catch (error) {
        console.error('[API] Error checking vector store status:', error);
        res.status(500).json({
          success: false,
          message: 'Error checking vector store status',
          error: error.message
        });
      }
    });

    // New endpoint to search the vector store
    this.app.post('/api/vector/search', validateRetrievalInput, async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          console.log('[API] Vector search validation errors:', errors.array());
          return res.status(400).json({ errors: errors.array() });
        }
        
        const { query, limit = 5, threshold = 0.7 } = req.body;
        console.log(`[API] Vector search request received: query="${query}", limit=${limit}, threshold=${threshold}`);
        
        console.log('[API] Calling vector service search method...');
        const startTime = Date.now();
        const results = await this.vectorService.search(query, {
          limit: parseInt(limit, 10),
          threshold: parseFloat(threshold)
        });
        const duration = Date.now() - startTime;
        console.log(`[API] Vector search completed in ${duration}ms, found ${results.length} results`);
        
        res.json({
          success: true,
          results
        });
        console.log('[API] Vector search response sent successfully');
      } catch (error) {
        console.error('[API] Error searching vector store:', error);
        res.status(500).json({
          success: false,
          message: 'Error searching vector store',
          error: error.message
        });
      }
    });

    // New endpoint to get debug info about the vector store
    this.app.get('/api/vector/debug', async (req, res) => {
      try {
        console.log('[API] Vector store debug request received');
        
        // Get internal vector store data for debugging
        const vectorStore = this.vectorService.getDebugInfo ? 
          await this.vectorService.getDebugInfo() : 
          { message: 'Debug info not available' };
        
        // Return basic stats about the vector store
        res.json({
          success: true,
          totalDocuments: vectorStore.vectors?.length || 0,
          documentTypes: vectorStore.metadata ? 
            [...new Set(vectorStore.metadata.map(m => m.type || 'unknown'))] : 
            [],
          sampleTitles: vectorStore.metadata ? 
            vectorStore.metadata.slice(0, 5).map(m => m.title || 'Untitled') : 
            []
        });
        
        console.log('[API] Vector store debug response sent successfully');
      } catch (error) {
        console.error('[API] Error getting vector store debug info:', error);
        res.status(500).json({
          success: false,
          message: 'Error getting vector store debug info',
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
        
        // Check if this is a reindexing operation after a forum scrape
        const isReindexing = req.app.locals.needsVectorReindex === true;
        const actionType = isReindexing ? 'reindexing' : 'indexing';
        
        // Set total posts count for progress tracking
        req.app.locals.indexingProgress = {
          total: posts.length,
          processed: 0,
          status: `Starting ${actionType} process`,
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
        
        let processed = 0;
        let skippedCount = 0;
        
        if (isReindexing) {
          // Use the dedicated reindexing method for better performance and clarity
          console.log(`[API] ${actionType} forum data after scrape`);
          sendProgress('progress', {
            processed: 0,
            status: `Starting ${actionType} process`,
            log: `Starting ${actionType} of ${posts.length} forum posts`
          });
          
          // Process in batches with progress updates
          const batchSize = 10;
          
          for (let i = 0; i < posts.length; i += batchSize) {
            const batch = posts.slice(i, i + batchSize);
            const batchStartMsg = `Processing batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(posts.length/batchSize)}`;
            
            sendProgress('progress', {
              processed: processed,
              status: batchStartMsg,
              log: batchStartMsg
            });
            
            // Process batch
            for (const post of batch) {
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
                  skippedCount++;
                  continue;
                }
                
                await vector.addForumPost(processedPost);
                processed++;
                
                // Update progress periodically
                if (processed % 3 === 0 || processed === posts.length) {
                  sendProgress('progress', {
                    processed: processed,
                    status: `${actionType} ${processed} of ${posts.length}`,
                    log: `Added post: ${processedPost.title}`
                  });
                }
              } catch (err) {
                console.error(`Error ${actionType} post:`, err);
                skippedCount++;
                sendProgress('progress', {
                  log: `Error processing post: ${err.message}`,
                  logType: 'error'
                });
              }
            }
            
            // Small delay between batches
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } else {
          // Use the existing method for regular indexing
          await vector.clearForumData()
          
          // Process posts in batches to avoid overwhelming the system
          const batchSize = 5
          
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
                processed++;
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
                skippedCount++;
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
        }
        
        // Send completion event
        const endTime = Date.now()
        const duration = ((endTime - req.app.locals.indexingProgress.startTime) / 1000).toFixed(2)
        
        sendProgress('complete', {
          processed: processed,
          total: posts.length,
          skipped: skippedCount,
          status: 'Indexing complete',
          log: `${actionType} ${processed} posts in ${duration} seconds (${skippedCount} skipped)`
        })
        
        // Clear the reindexing flag
        req.app.locals.needsVectorReindex = false;
        
        console.log(`${actionType} complete: ${processed} forum posts processed (${skippedCount} skipped)`)
        res.json({ 
          success: true, 
          message: `${actionType} complete: ${processed} forum posts processed (${skippedCount} skipped)`,
          wasReindexing: isReindexing
        })
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
    this.app.post('/api/chat', validateChatInput, async (req, res, next) => {
      try {
        // Validate that the LLM is initialized
        if (!global.llmProvider) {
          return res.status(400).json({
            success: false,
            message: 'LLM provider not initialized',
            error: 'Please initialize the LLM provider first.'
          });
        }

        // Extract parameters from request
        const { message, sessionId, messageHistory } = req.body;
        
        // Log the incoming request
        console.log('Sending chat request to: /api/chat');
        console.log('Request payload:', {
          message: message.length > 30 ? message.substring(0, 30) + '...' : message,
          sessionId,
          messageHistoryLength: messageHistory ? messageHistory.length : 0
        });
        
        try {
          // Process the message
          const response = await this.chatService.processMessage(
            message, 
            sessionId, 
            this.compressedContext,
            this.sipData,
            messageHistory
          );
          
          // Return the response
          return res.json({
            success: true,
            response,
            messageHistory: this.chatService.getChatHistory(sessionId)
          });
        } catch (error) {
          console.error('Error processing chat message:', error);
          
          return res.status(500).json({
            success: false,
            message: 'Error processing your message',
            error: error.message
          });
        }
      } catch (error) {
        console.error('Unexpected error in chat endpoint:', error);
        next(error);
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

    // Interview Agent endpoint
    this.app.post('/api/interview', validateInterviewInput, async (req, res, next) => {
      try {
        // Validate that the LLM is initialized
        if (!global.llmProvider) {
          return res.status(400).json({
            error: 'LLM provider not initialized',
            message: 'Please initialize the LLM provider first.'
          });
        }

        // Extract parameters from request
        const { message, sessionId, messageHistory = [], useRetrieval = true } = req.body;
        
        console.log(`[API] /api/interview called with sessionId=${sessionId}, useRetrieval=${useRetrieval}`);
        
        // Initialize the Interview Agent if not already done
        let interviewAgent = agentFactory.getAgent('interview');
        if (!interviewAgent) {
          console.log('[API] Initializing Interview Agent');
          
          // Create a Retrieval Agent first if needed
          if (useRetrieval) {
            console.log('[API] Initializing Retrieval Agent for Interview Agent');
            agentFactory.createRetrievalAgent(global.llmProvider, {
              debug: true
            });
          }
          
          // Create the Interview Agent with Retrieval integration
          interviewAgent = agentFactory.createInterviewAgent(global.llmProvider, {
            debug: true,
            enableStateTracking: true,
            integrateRetrieval: useRetrieval
          });
          
          console.log('[API] Interview Agent initialized');
        }
        
        // Initialize or update session state
        if (!this.interviewSessions) {
          this.interviewSessions = {};
        }
        
        if (!this.interviewSessions[sessionId]) {
          this.interviewSessions[sessionId] = {
            messages: [],
            state: null
          };
        }
        
        // Use message history from frontend if provided and longer than our history
        if (messageHistory && Array.isArray(messageHistory) && messageHistory.length > 0) {
          // If the frontend history is newer or longer, use it
          if (messageHistory.length >= this.interviewSessions[sessionId].messages.length) {
            console.log(`[API] Using message history from frontend with ${messageHistory.length} messages`);
            this.interviewSessions[sessionId].messages = [...messageHistory];
          } 
          // Ensure the current message is in the history
          else {
            // Add the current user message if it's not already there
            const userMessage = { role: 'user', content: message };
            if (!this.interviewSessions[sessionId].messages.some(m => 
              m.role === 'user' && m.content === message)) {
              this.interviewSessions[sessionId].messages.push(userMessage);
            }
          }
        } 
        // Just add the current message if no history provided
        else if (message) {
          this.interviewSessions[sessionId].messages.push({
            role: 'user',
            content: message
          });
        }
        
        // Get the updated messages array
        const messages = this.interviewSessions[sessionId].messages;
        
        try {
          // Generate a response from the interview agent
          const response = await interviewAgent.interview(messages, {
            sessionId
          }, {
            debug: true,
            sessionId
          });
          
          // Add the assistant's response to the history
          this.interviewSessions[sessionId].messages.push({
            role: 'assistant',
            content: response
          });
          
          // Get the updated state
          this.interviewSessions[sessionId].state = interviewAgent.getState();
          
          return res.json({
            response,
            state: this.interviewSessions[sessionId].state,
            messageHistory: this.interviewSessions[sessionId].messages
          });
        } catch (error) {
          console.error('[API] Error in interview agent:', error);
          return res.status(500).json({
            error: 'Interview agent error',
            message: error.message
          });
        }
      } catch (error) {
        console.error('[API] Error in interview endpoint:', error);
        next(error);
      }
    });

    // Get interview state endpoint
    this.app.get('/api/interview/state/:sessionId', async (req, res, next) => {
      try {
        const { sessionId } = req.params;
        
        if (!this.interviewSessions || !this.interviewSessions[sessionId]) {
          return res.status(404).json({
            error: 'Session not found',
            userMessage: 'No interview session found with the provided ID'
          });
        }
        
        res.json({
          state: this.interviewSessions[sessionId].state,
          messageHistory: this.interviewSessions[sessionId].messages
        });
      } catch (error) {
        console.error('[API] Error getting interview state:', error);
        next(error);
      }
    });

    // Clear interview session endpoint
    this.app.post('/api/interview/clear/:sessionId', async (req, res, next) => {
      try {
        const { sessionId } = req.params;
        
        if (this.interviewSessions && this.interviewSessions[sessionId]) {
          delete this.interviewSessions[sessionId];
        }
        
        res.json({
          success: true,
          message: 'Interview session cleared'
        });
      } catch (error) {
        console.error('[API] Error clearing interview session:', error);
        next(error);
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
      console.log('[API] Initializing vector service...');
      await this.vectorService.initialize();
      
      // Log vector store status
      const vectorCount = this.vectorService.getVectorCount();
      console.log(`[API] Vector service initialized with ${vectorCount} vectors`);
      
      // If we have no vectors, we'll wait for the frontend to trigger indexing
      // This allows the server to start quickly even if there's no vector data yet
      if (vectorCount === 0) {
        console.log('[API] Vector store is empty. Waiting for indexing request from frontend.');
      }
    } catch (error) {
      console.error('[API] Failed to initialize vector service:', error);
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

  setChatService(chatService) {
    this.chatService = chatService;
  }
}

module.exports = { ApiService }; 
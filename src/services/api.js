const express = require('express');
const { body, validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const { LLMProviderFactory } = require('../providers/factory');
const { Storage } = require('./storage');
const { DiscourseScraper } = require('./scraper');

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Input validation middleware
const validateChatInput = [
  body('message').trim().notEmpty().withMessage('Message cannot be empty'),
  body('sessionId').trim().notEmpty().withMessage('Session ID is required'),
];

const validateProviderInput = [
  body('provider').isIn(['1', '2', '3']).withMessage('Invalid provider selection'),
];

class ApiService {
  constructor(app) {
    this.app = app;
    this.sipData = [];
    this.compressedContext = null;
    this.isInitialized = false;
    this.llmInitialized = false;
    this.compressedContextPath = path.join(__dirname, '..', '..', 'output', 'compressed-context.md');
    
    this.setupMiddleware();
    this.setupRoutes();
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
        if (!['1', '2', '3'].includes(provider)) {
          return res.status(400).json({
            error: 'Invalid provider',
            userMessage: 'Please select a valid provider (1, 2, or 3)'
          });
        }

        const providerConfig = {
          '1': {
            provider: 'local',
            config: {
              model: process.env.LOCAL_LLM_MODEL || 'phi-4',
              temperature: 0.7,
              maxTokens: 15000,
              baseUrl: process.env.LOCAL_LLM_BASE_URL,
              execPath: process.env.LOCAL_LLM_EXEC_PATH
            }
          },
          '2': {
            provider: 'openai',
            config: {
              apiKey: process.env.OPENAI_API_KEY,
              model: process.env.OPENAI_MODEL
            }
          },
          '3': {
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
        const storage = new Storage();
        const { rescrape } = req.body || {};

        if (rescrape) {
          const scraper = new DiscourseScraper(process.env.FORUM_BASE_URL, { debug: true });
          const scrapedData = await scraper.scrapeAll();
          await storage.saveScrapeResult(scrapedData);
          this.sipData = scrapedData.posts;
          res.json({ success: true, message: 'Data rescraped successfully', count: this.sipData.length });
        } else {
          const latestData = await storage.getLatestScrape();
          if (latestData) {
            this.sipData = latestData.posts;
            res.json({ success: true, message: 'Data loaded from storage', count: this.sipData.length });
          } else {
            res.status(404).json({ success: false, message: 'No stored data found. Please rescrape.' });
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
        res.status(500).json({ success: false, message: 'Error loading data', error: error.message });
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
}

module.exports = { ApiService }; 
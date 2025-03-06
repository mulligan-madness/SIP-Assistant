/**
 * Server Service
 * Handles server initialization and management
 */

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const helmet = require('helmet');
const { BaseService } = require('./base');
const { LLMProviderFactory } = require('../providers/factory');
const { storage } = require('./storage');
const { DiscourseScraper } = require('./scraper');
const { ChatService } = require('./chat');
const { globalErrorHandler, getCurrentISODate } = require('../utils');

/**
 * Server service for handling server initialization and management
 * @extends BaseService
 */
class ServerService extends BaseService {
  /**
   * Create a new server service
   * @param {Object} config - Service configuration
   */
  constructor(config = {}) {
    super(config);
    
    this.name = 'server';
    this.app = config.app || express();
    this.port = config.port || process.env.PORT || 3000;
    this.apiService = null;
    this.chatService = new ChatService();
    
    // Server state
    this.sipData = [];
    this.compressedContext = null;
    this.isInitialized = false;
    this.llmInitialized = false;
    
    // Setup middleware
    this.setupMiddleware();
    
    this.log('Server service initialized');
  }

  /**
   * Setup middleware for the Express app
   */
  setupMiddleware() {
    // Request logging middleware
    this.app.use((req, res, next) => {
      const start = Date.now();
      this.log(`${req.method} ${req.url}`);
      
      if (req.body && Object.keys(req.body).length > 0) {
        this.log('Request body:', JSON.stringify(req.body, null, 2));
      }
      
      // Capture the original res.json method
      const originalJson = res.json;
      
      // Override res.json to log the response
      res.json = function(body) {
        const duration = Date.now() - start;
        console.log(`[${getCurrentISODate()}] Response (${duration}ms):`, JSON.stringify(body, null, 2));
        
        // Call the original method
        return originalJson.call(this, body);
      };
      
      next();
    });

    // Basic middleware
    this.app.use(bodyParser.json());
    this.app.use(cors({
      origin: process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : process.env.FRONTEND_URL,
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type']
    }));
    
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
    
    // Add global error handler
    this.app.use(globalErrorHandler);
  }

  /**
   * Set the API service
   * @param {Object} apiService - The API service
   */
  setApiService(apiService) {
    this.apiService = apiService;
    
    // Update the API service with server state
    if (this.apiService) {
      this.apiService.setChatService(this.chatService);
      this.apiService.setSIPData(this.sipData);
      this.apiService.setCompressedContext(this.compressedContext);
      this.apiService.setInitialized(this.isInitialized);
      this.apiService.setLLMInitialized(this.llmInitialized);
    }
  }

  /**
   * Initialize the server
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      this.log('Starting server initialization...');
      
      // Initialize OpenAI provider by default
      await this.initializeLLMProvider();
      
      // Initialize storage and data
      await this.initializeData();
      
      // Set initialized flag
      this.isInitialized = true;
      if (this.apiService) {
        this.apiService.setInitialized(true);
      }
      
      this.log('Server initialization complete!');
      super.initialize();
    } catch (error) {
      this.logError('Error during server initialization', error);
      throw error;
    }
  }

  /**
   * Initialize the LLM provider
   * @returns {Promise<void>}
   */
  async initializeLLMProvider() {
    try {
      this.log('Initializing LLM provider...');
      
      // Get configuration from environment variables
      const openaiConfig = {
        apiKey: process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo'
      };
      
      // Create the provider
      global.llmProvider = LLMProviderFactory.createProvider(
        'openai',
        openaiConfig
      );
      
      this.llmInitialized = true;
      if (this.apiService) {
        this.apiService.setLLMInitialized(true);
      }
      
      this.log(`LLM provider initialized: ${global.llmProvider.getProviderName()}`);
    } catch (error) {
      this.logError('Error initializing LLM provider', error);
      throw error;
    }
  }

  /**
   * Initialize data from storage or scrape
   * @returns {Promise<void>}
   */
  async initializeData() {
    try {
      this.log('Initializing data...');
      
      // Get latest scrape data
      const latestData = await storage.getLatestScrape();

      if (latestData) {
        this.log('Using existing scrape data');
        this.sipData = latestData.posts;
        if (this.apiService) {
          this.apiService.setSIPData(this.sipData);
        }
      } else {
        this.log('No existing scrape data, performing new scrape');
        await this.performScrape();
      }

      // Load or generate compressed context
      this.compressedContext = await storage.getCompressedContext();
      
      if (!this.compressedContext && this.sipData.length > 0) {
        this.log('No compressed context found, generating new one');
        this.compressedContext = await this.chatService.compressSIPDataWithLLM(this.sipData);
      }
      
      if (this.apiService) {
        this.apiService.setCompressedContext(this.compressedContext);
      }
      
      this.log('Data initialization complete');
    } catch (error) {
      this.logError('Error initializing data', error);
      throw error;
    }
  }

  /**
   * Perform a scrape of the forum
   * @returns {Promise<void>}
   */
  async performScrape() {
    try {
      this.log('Performing forum scrape...');
      
      const forumBaseUrl = process.env.FORUM_BASE_URL;
      const scraper = new DiscourseScraper(forumBaseUrl, { debug: true });
      const scrapedData = await scraper.scrapeAll();
      
      await storage.saveScrapeResult(scrapedData);
      this.sipData = scrapedData.posts;
      
      if (this.apiService) {
        this.apiService.setSIPData(this.sipData);
      }
      
      this.log(`Scrape complete, found ${this.sipData.length} posts`);
    } catch (error) {
      this.logError('Error performing scrape', error);
      throw error;
    }
  }

  /**
   * Start the server
   * @returns {Promise<void>}
   */
  async start() {
    return new Promise((resolve) => {
      this.app.listen(this.port, async () => {
        this.log(`Server listening at http://localhost:${this.port}`);
        
        try {
          await this.initialize();
          resolve();
        } catch (error) {
          this.logError('Failed to initialize server', error);
          // We still resolve the promise to allow the server to start
          // even if initialization fails
          resolve();
        }
      });
      
      // Handle graceful shutdown
      process.on('SIGTERM', () => {
        this.log('SIGTERM received, shutting down gracefully');
        process.exit(0);
      });
      
      process.on('SIGINT', () => {
        this.log('SIGINT received, shutting down gracefully');
        process.exit(0);
      });
    });
  }

  /**
   * Get the Express app
   * @returns {Object} The Express app
   */
  getApp() {
    return this.app;
  }
}

module.exports = { ServerService }; 
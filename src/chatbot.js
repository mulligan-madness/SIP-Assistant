const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const { config } = require('./services/config');
const { ApiService } = require('./services/api');
const { ChatService } = require('./services/chat');
const { storage } = require('./services/storage');
const { DiscourseScraper } = require('./services/scraper');
const { LLMProviderFactory } = require('./providers/factory');
const cors = require('cors');

// Load environment variables
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.error('.env file not found at:', envPath);
  process.exit(1);
}
require('dotenv').config({ path: envPath });

// Initialize Express app
const app = express();
const port = config.get('server.port', 3000);

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Request body:', JSON.stringify(req.body, null, 2));
  }
  
  // Capture the original res.json method
  const originalJson = res.json;
  
  // Override res.json to log the response
  res.json = function(body) {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] Response (${duration}ms):`, JSON.stringify(body, null, 2));
    
    // Call the original method
    return originalJson.call(this, body);
  };
  
  next();
});

// Basic middleware - ApiService will add more comprehensive middleware
app.use(bodyParser.json());
app.use(cors({
  origin: process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : process.env.FRONTEND_URL,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

// Initialize services - These services will handle all the API routes
const apiService = new ApiService(app);
const chatService = new ChatService();

// Set chat service in API service
apiService.setChatService(chatService);

// Initialize server state variables that the ApiService will need
let sipData = [];
let compressedContext = null;
let isInitialized = false;
let llmInitialized = false;
const compressedContextPath = path.join(__dirname, '..', 'data', 'compressed-context.md');

// Update the API service with these variables
apiService.setSIPData(sipData);
apiService.setCompressedContext(compressedContext);
apiService.setInitialized(isInitialized);
apiService.setLLMInitialized(llmInitialized);

// Automatic initialization function
async function autoInitialize() {
  try {
    console.log('Starting server auto-initialization...');
    
    // Initialize OpenAI provider by default
    const openaiConfig = {
      apiKey: config.get('openai.apiKey'),
      model: config.get('openai.model')
    };
    
    global.llmProvider = LLMProviderFactory.createProvider(
      'openai',
      openaiConfig
    );
    llmInitialized = true;
    apiService.setLLMInitialized(true);

    // Initialize storage and data
    const latestData = await storage.getLatestScrape();

    if (latestData) {
      sipData = latestData.posts;
      apiService.setSIPData(sipData);
    } else {
      const forumBaseUrl = config.get('forum.baseUrl');
      const scraper = new DiscourseScraper(forumBaseUrl, { debug: true });
      const scrapedData = await scraper.scrapeAll();
      await storage.saveScrapeResult(scrapedData);
      sipData = scrapedData.posts;
      apiService.setSIPData(sipData);
    }

    // Load or generate compressed context
    compressedContext = await storage.getCompressedContext();
    
    if (!compressedContext && sipData.length > 0) {
      compressedContext = await chatService.compressSIPDataWithLLM(sipData);
    }
    
    apiService.setCompressedContext(compressedContext);
    isInitialized = true;
    apiService.setInitialized(true);
    
    console.log('Server auto-initialization complete!');
  } catch (err) {
    console.error('Error during auto-initialization:', err);
    throw err;
  }
}

// Start the server
app.listen(port, async () => {
  console.log(`SIP-Assistant server listening at http://localhost:${port}`);
  
  try {
    await autoInitialize();
  } catch (err) {
    console.error('Failed to auto-initialize server:', err);
  }
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

module.exports = app;
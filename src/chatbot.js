const express = require('express');
const bodyParser = require('body-parser');
const { body, validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');
const { configService } = require('./services/config');
const { ApiService } = require('./services/api');
const { ChatService } = require('./services/chat');
const { Storage } = require('./services/storage');
const { DiscourseScraper } = require('./services/scraper');
const { LLMProviderFactory } = require('./providers/factory');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// Load environment variables
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.error('.env file not found at:', envPath);
  process.exit(1);
}
require('dotenv').config({ path: envPath });

// Initialize Express app
const app = express();
const port = configService.getConfigValue('server.port');

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

// Middleware
app.use(bodyParser.json());

// Security middleware
app.use(helmet({
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
app.use(cors({
  origin: process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : process.env.FRONTEND_URL,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Request size limits
app.use(express.json({ limit: '1mb' }));

// Input validation middleware
const validateChatInput = [
  body('message').trim().notEmpty().withMessage('Message cannot be empty'),
  body('sessionId').trim().notEmpty().withMessage('Session ID is required'),
];

const validateProviderInput = [
  body('provider').isIn(['1', '2']).withMessage('Invalid provider selection'),
];

// Centralized error handling
app.use((err, req, res, next) => {
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

// Initialize services
const apiService = new ApiService(app);
const chatService = new ChatService();
const storage = new Storage();

// Initialize server state
let sipData = [];
let compressedContext = null;
let isInitialized = false;
let llmInitialized = false;
const compressedContextPath = path.join(__dirname, '..', 'output', 'compressed-context.md');

// Serve static files from the Vue.js build directory
app.use(express.static(path.join(__dirname, '..', 'dist')));

// Modified middleware to check initialization
app.use('/api', (req, res, next) => {
  if (!llmInitialized && req.path !== '/init-llm' && req.path !== '/status') {
    return res.status(503).json({
      error: 'LLM not initialized',
      userMessage: 'Please wait while the system initializes.'
    });
  }
  next();
});

// Automatic initialization function
async function autoInitialize() {
  try {
    console.log('Starting server auto-initialization...');
    
    // Initialize OpenAI provider by default
    const openaiConfig = configService.getProviderConfig('openai');
    
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
      const forumConfig = configService.getForumConfig();
      const scraper = new DiscourseScraper(forumConfig.baseUrl, forumConfig.scrapeOptions);
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

// New endpoint to initialize LLM
app.post('/api/init-llm', validateProviderInput, async (req, res, next) => {
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

    llmInitialized = true;
    res.json({ success: true, provider: providerConfig[provider].provider });
  } catch (error) {
    next(error);
  }
});

// Modified status endpoint to check for existing context
app.get('/api/status', (req, res) => {
  let existingContextAvailable = false;
  try {
    fs.accessSync(compressedContextPath);
    existingContextAvailable = true;
  } catch (err) {
    // File doesn't exist
  }

  res.json({
    llmInitialized,
    dataLoaded: sipData.length > 0,
    contextCompressed: !!compressedContext,
    existingContextAvailable
  });
});

// New endpoint to load or rescrape data
app.post('/api/load-data', async (req, res) => {
  try {
    const { rescrape } = req.body;
    const storage = new Storage();
    const scraper = new DiscourseScraper(process.env.FORUM_BASE_URL, { debug: true });

    if (rescrape) {
      console.log('Starting fresh forum scrape...');
      const scrapedData = await scraper.scrapeAll();
      await storage.saveScrapeResult(scrapedData);
      sipData = scrapedData.posts;
      console.log('Forum scrape completed successfully');
    } else {
      const latestData = await storage.getLatestScrape();
      if (!latestData) {
        return res.status(404).json({
          error: 'No existing data',
          userMessage: 'No existing data found. Please scrape the forum.'
        });
      }
      sipData = latestData.posts;
      console.log('Using existing SIP data');
    }

    res.json({
      success: true,
      count: sipData.length
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to load data',
      userMessage: error.message
    });
  }
});

// New endpoint to generate compressed context
app.post('/api/generate-context', async (req, res) => {
  try {
    if (!llmInitialized) {
      return res.status(503).json({
        error: 'LLM not initialized',
        userMessage: 'Please initialize the LLM provider first.'
      });
    }

    if (sipData.length === 0) {
      return res.status(503).json({
        error: 'No data loaded',
        userMessage: 'Please load or scrape the forum data first.'
      });
    }

    console.log('Generating new compressed context...');
    compressedContext = await chatService.compressSIPDataWithLLM(sipData);
    apiService.setCompressedContext(compressedContext);

    res.json({
      success: true,
      preview: compressedContext.substring(0, 500) + '...'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to generate context',
      userMessage: error.message
    });
  }
});

// New endpoint to load existing context
app.post('/api/load-context', async (req, res) => {
  try {
    if (!fs.existsSync(compressedContextPath)) {
      return res.status(404).json({
        error: 'No existing context',
        userMessage: 'No existing context found. Please generate new context.'
      });
    }

    const existingContext = fs.readFileSync(compressedContextPath, 'utf8');
    compressedContext = existingContext.split('---')[2].trim();
    console.log('Loaded existing compressed context');

    res.json({
      success: true,
      preview: compressedContext.substring(0, 500) + '...'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to load existing context',
      userMessage: error.message
    });
  }
});

// Server restart endpoint
app.post('/api/restart', async (req, res) => {
  try {
    // Send response before restarting
    res.json({ success: true, message: 'Server restarting...' });
    
    // Wait a moment to ensure response is sent
    setTimeout(() => {
      if (process.env.NODE_ENV === 'production') {
        console.log('Restarting server in production mode...');
        process.exit(0); // PM2 or similar process manager will restart the server
      } else {
        console.log('Development mode: Server restart simulated, not exiting process.');
      }
    }, 1000);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to restart server',
      userMessage: error.message
    });
  }
});

// Chat endpoint
app.post('/api/chat', validateChatInput, async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation error',
      userMessage: errors.array()[0].msg
    });
  }

  try {
    const { message, sessionId } = req.body;
    
    const result = await chatService.processMessage(
      message, 
      sessionId, 
      compressedContext, 
      sipData
    );
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get chat history endpoint
app.get('/api/chat/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const history = chatService.getChatHistory(sessionId);
  res.json({ history });
});

// Clear chat history endpoint
app.post('/api/chat/:sessionId/clear', (req, res) => {
  const { sessionId } = req.params;
  const result = chatService.clearChatHistory(sessionId);
  res.json(result);
});

// Save chat history endpoint
app.post('/api/chat/:sessionId/save', async (req, res) => {
  const { sessionId } = req.params;
  const result = await chatService.saveChatToFile(sessionId);
  res.json(result);
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

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
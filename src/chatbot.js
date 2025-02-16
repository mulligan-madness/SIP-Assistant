const path = require('path');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const readline = require('readline');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const Spinner = require('./utils/spinner');
const { DiscourseScraper } = require('./scraper');
const { Storage } = require('./storage');
const { LLMProviderFactory } = require('./providers/factory');
const helmet = require('helmet');
const cors = require('cors');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

// Load environment variables
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.error('.env file not found at:', envPath);
  process.exit(1);
}
require('dotenv').config({ path: envPath });

const app = express();
const port = 3000;

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
  body('provider').isIn(['1', '2', '3']).withMessage('Invalid provider selection'),
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
    // Initialize OpenAI provider by default
    const openaiConfig = {
      provider: 'openai',
      config: {
        apiKey: process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_MODEL
      }
    };

    global.llmProvider = LLMProviderFactory.createProvider(
      openaiConfig.provider,
      openaiConfig.config
    );
    llmInitialized = true;

    // Initialize storage and data
    const storage = new Storage();
    const latestData = await storage.getLatestScrape();

    if (latestData) {
      sipData = latestData.posts;
    } else {
      const scraper = new DiscourseScraper(process.env.FORUM_BASE_URL, { debug: true });
      const scrapedData = await scraper.scrapeAll();
      await storage.saveScrapeResult(scrapedData);
      sipData = scrapedData.posts;
    }

    // Load or generate compressed context
    let existingContextExists = false;
    try {
      fs.accessSync(compressedContextPath);
      existingContextExists = true;
    } catch (err) {
      // File doesn't exist
    }

    if (existingContextExists) {
      compressedContext = fs.readFileSync(compressedContextPath, 'utf8').split('---')[2].trim();
    } else {
      compressedContext = await compressSIPDataWithLLM(sipData);
      saveCompressedContext();
    }

    isInitialized = true;
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
    compressedContext = await compressSIPDataWithLLM(sipData);
    saveCompressedContext();

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
app.post('/chat', validateChatInput, async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation error',
      userMessage: errors.array()[0].msg
    });
  }

  if (!llmInitialized || !compressedContext) {
    return res.status(503).json({
      error: 'Server not fully initialized',
      userMessage: 'Please complete the initialization steps before chatting.'
    });
  }
  
  try {
    // Get or create chat history for this session
    const sessionId = req.body.sessionId || 'default';
    if (!chatHistories.has(sessionId)) {
      chatHistories.set(sessionId, []);
    }
    const history = chatHistories.get(sessionId);

    if (!req.body || !req.body.message) {
      return res.status(400).json({ 
        error: 'Missing message in request body',
        userMessage: 'Please provide a message to chat about.'
      });
    }

    // Prepare messages
    const messages = [
      { role: 'system', content: compressedContext },
      ...history,
      { role: 'user', content: req.body.message }
    ];

    try {
      const response = await global.llmProvider.chat(messages);
      
      // Update history with this exchange
      history.push(
        { role: 'user', content: req.body.message },
        { role: 'assistant', content: response }
      );

      res.json({ response });
    } catch (error) {
      throw error;
    }
  } catch (error) {
    console.error('Chat processing error:', error);
    
    let userMessage = 'An unexpected error occurred. Please try again later.';
    let statusCode = 500;
    
    if (error.code === 'ECONNREFUSED') {
      statusCode = 503;
      userMessage = 'Could not connect to LMStudio. Please ensure LMStudio is running and the API is enabled.';
    } else if (error.response?.status === 429) {
      statusCode = 429;
      userMessage = 'The service is currently busy. Please try again in a moment.';
    } else if (error.message.includes('API key')) {
      statusCode = 401;
      userMessage = 'There was an authentication error with the AI service.';
    } else if (error.message.includes('timeout')) {
      statusCode = 504;
      userMessage = 'The request timed out. Please try again.';
    }

    res.status(statusCode).json({ 
      error: 'Error processing chat request',
      userMessage
    });
  }
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

// Start the server only if this file is run directly
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    autoInitialize().catch(err => {
      console.error('Failed to auto-initialize:', err);
      process.exit(1);
    });
  });
}

// Export the app for testing
module.exports = app;

// Add readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promisify readline question
const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// Ensure readline is closed on process exit
process.on('exit', () => {
  if (rl) rl.close();
});

process.on('SIGINT', () => {
  if (rl) rl.close();
  process.exit();
});

// Helper function to save compressed context
function saveCompressedContext() {
  const markdownContent = `---
  timestamp: ${new Date().toISOString()}
  type: sip-analysis
  version: 1.1
  source: forum.rare.xyz/c/proposals/18
  ---

  # SuperRare Improvement Proposals Analysis

  ## Instructions for Language Models

  You are a SIP drafting assistant. Users have complete knowledge of SuperRare - focus only on helping write and edit SIPs.
  
  Initial Formatting instructions:
  - When writing, use markdown formatting following the template below.
  - Use as few sections as possible, but always include summary, background, motivation, specification, benefits, drawbacks, and implementation (in that order).
  - No additional sections (no Abstract, Vote, Timeline, etc.)

  Use this exact template for all responses unless otherwise specified:
  \`\`\`markdown
  # Summary
  [Write a clear, concise overview of the proposal]
  
  # Background
  [Provide relevant context and history]
  
  # Motivation
  [Explain the reasoning and goals]
  
  # Specification
  [Detail the technical implementation and parameters]
  
  # Benefits
  [List the advantages and positive outcomes]
  
  # Drawbacks
  [Address potential risks and disadvantages]
  
  # Implementation
  [Describe the concrete steps and procedures]
  \`\`\`
  
  Important Context for LLMs:
  - This analysis is derived from actual SIPs on the SuperRare forum
  - When users ask about SIP structure, prioritize this guidance over general knowledge
  - The patterns described here are specific to SuperRare's governance process
  - When helping draft SIPs, only include the sections specified in the template
  - If a user's question falls outside this analysis, acknowledge that explicitly

  Collaborative Drafting Instructions:
  - Your role is strictly to assist with writing and editing
  - When a user requests changes to a draft SIP, always return the complete SIP with the requested changes
  - Accept and incorporate feedback iteratively, maintaining consistency across sections
  - If a user asks to expand or add detail to a section, preserve the existing content while adding the requested information
  - When making edits, ensure they align with the overall proposal's goals and other sections
  - If a change would impact other sections, highlight those dependencies
  - Always maintain proper formatting and section structure during edits
  - Provide clear explanations of changes made when returning the edited version
  - Only suggest improvements directly related to writing clarity and completeness

  When editing:
  - Always return the complete SIP
  - Preserve existing content when adding details
  - Maintain consistency across sections
  - Keep formatting exactly as shown
  - Format all responses in proper markdown

  Common Use Cases:
  1. Answering questions about SIP structure and requirements
  2. Helping users draft new SIP proposals
  3. Reviewing existing SIPs for completeness
  4. Explaining the governance process
  5. Providing examples of successful SIPs
  6. Making iterative improvements to draft SIPs
  7. Expanding sections based on feedback
  8. Refining technical specifications
  9. Clarifying implementation details
  10. Strengthening proposal rationale

  ## Analysis

  The Specification section requires:
  - Comprehensive technical details
  - All relevant parameters and their values
  - Interface descriptions where applicable
  - Data structures and schemas if relevant
  - Security considerations
  - Integration requirements
  - Testing procedures
  - If the proposal is not technical, comprehensively discuss the specific details of the proposal, defining key concepts and processes necessary for implementation and the reader's understanding.

  ${compressedContext}
  `;

  fs.writeFileSync(compressedContextPath, markdownContent);
  console.log('Saved new compressed context to disk as markdown');
}

async function compressSIPDataWithLLM(sips, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Compression attempt ${attempt}/${maxRetries}`);
      
      // Sort SIPs by date
      const recentSips = sips
        .slice()
        .sort((a, b) => new Date(b.d) - new Date(a.d))
        .slice(0, 15); // Only take 15 most recent SIPs
      
      console.log('\nAnalyzing 15 most recent SIPs:');
      recentSips.forEach(sip => {
        console.log(`${sip.t} (${sip.status || 'No status'})`);
      });
      console.log('\n');
      
      const spinner = new Spinner('Analyzing SIPs and generating compression...');
      spinner.start();
      
      try {
        const analysisPrompt = `Review these SuperRare Improvement Proposals (SIPs) and provide a high-level overview of RareDAO. Focus on:

        Important: Do not include any analysis or references to:
        - Space Race program or related proposals
        - Regular transparency reports
        - Routine operational updates
        - Temperature checks or preliminary polls
        Your analysis should describe RareDAO's core functions and activities.

        Provide a concise overview of:
        1. Core Business Activities
        - Main protocol functions
        - Key revenue streams
        - Market positioning
        
        2. Treasury Operations
        - Major treasury activities
        - Investment approaches
        - Resource allocation patterns
        
        3. Protocol Development
        - Technical infrastructure
        - Major protocol upgrades
        - Integration patterns
        
        4. Governance Focus
        - Key governance priorities
        - Major policy decisions
        - Strategic directions

        Analyze all ${recentSips.length} SIPs as reference:
        ${recentSips
          .filter(sip => {
            const lowerTitle = sip.t.toLowerCase();
            const lowerContent = sip.c.toLowerCase();
            return !(
              lowerTitle.includes('space') || 
              lowerContent.includes('space race') ||
              lowerTitle.includes('transparency') ||
              lowerContent.includes('transparency report') ||
              lowerTitle.includes('monthly update') ||
              lowerContent.includes('monthly update') ||
              lowerTitle.includes('temperature') ||
              lowerContent.includes('temperature check') ||
              lowerTitle.includes('temp check') ||
              lowerContent.includes('temp check')
            );
          })
          .map(sip => `
        Title: ${sip.t}
        Date: ${sip.d}
        Content: ${sip.c}`).join('\n\n')}

        Provide a concise overview of RareDAO's operations and focus areas based on these proposals. This will be used as context for future proposal drafting.`;

        const response = await global.llmProvider.complete(analysisPrompt);
        
        spinner.stop();
        return response;
        
      } catch (error) {
        spinner.stop();
        throw error;
      }
      
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error);
      if (attempt === maxRetries) {
        throw new Error(`Failed to compress SIP data after ${maxRetries} attempts`);
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}

// Store chat histories by session
const chatHistories = new Map();
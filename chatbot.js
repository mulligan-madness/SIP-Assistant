const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const Spinner = require('./utils/spinner');
const { DiscourseScraper } = require('./src/scraper');
const { Storage } = require('./src/storage');
const { LLMProviderFactory } = require('./src/providers/factory');
const config = require('./config');
const { Logger } = require('./src/utils/logger');
const logger = new Logger('chat');
const debug = require('debug')('chatbot:llm');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use((req, res, next) => {
  console.log('Incoming request:', req.method, req.path);
  next();
});

// Root endpoint first
app.get('/', (req, res) => {
  console.log('Root endpoint hit');
  // Let the static middleware handle serving index.html
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Then static middleware
app.use(express.static('public'));

// Test endpoint
app.get('/test', (req, res) => {
  console.log('Test endpoint hit');
  res.json({ message: 'Server is working!' });
});

// Load the scraped SIP data
let sipDataPath = path.join(__dirname, 'output', 'forum-data-2025-02-13-113208-compressed.json');
const compressedContextPath = path.join(__dirname, 'output', 'compressed-context.md');
let sipData = [];
let compressedContext = null;

// Add readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promisify readline question
const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// Add function to run forum scraper
async function runForumScraper() {
  const spinner = new Spinner('Scraping forum for new SIPs...');
  
  try {
    spinner.start();
    
    // Create scraper instance
    const scraper = new DiscourseScraper('https://forum.rare.xyz', { debug: true });
    
    // Test connection first
    const testResult = await scraper.test();
    if (!testResult.success) {
      throw new Error(`Forum connection test failed: ${testResult.message}`);
    }
    
    // Run the scraper
    const scrapedData = await scraper.scrapeAll();
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const outputPath = path.join(__dirname, 'output', `forum-data-${timestamp}-compressed.json`);
    
    // Save the scraped data
    await fs.promises.writeFile(
      outputPath,
      JSON.stringify(scrapedData, null, 2)
    );
    
    spinner.stop();
    console.log(`\nScraping completed. Found ${scrapedData.posts.length} SIP posts`);
    console.log(`Data saved to ${outputPath}`);
    
    // Update the sipDataPath to use the newly created file
    sipDataPath = outputPath;
    return true;
    
  } catch (error) {
    spinner.stop();
    console.error('Error running forum scraper:', error);
    return false;
  }
}

// Modify initialization function
async function initializeData() {
  try {
    const storage = new Storage();
    
    // Ask about scraping the forum
    const scrapeAnswer = await question(
      'Would you like to scrape the forum for new SIPs?\n' +
      '1. Yes, scrape forum\n' +
      '2. No, use existing data\n' +
      'Enter 1 or 2: '
    );

    if (scrapeAnswer === '1') {
      const scraper = new DiscourseScraper('https://forum.rare.xyz', { 
        debug: true,
        rateLimit: 2000 
      });
      
      // Test connection first
      console.log('Testing forum connection...');
      const testResult = await scraper.test();
      if (!testResult.success) {
        console.error('Forum connection test failed:', testResult.message);
        console.log('Falling back to existing data...');
      } else {
        console.log('Forum connection successful. Starting scrape...');
        const scrapedData = await scraper.scrapeAll();
        await storage.saveScrapeResult(scrapedData);
        sipData = scrapedData.posts;
        console.log(`Scraping completed. Found ${sipData.length} SIP posts`);
      }
    }

    // If no scrape or scrape failed, load latest data
    if (!sipData || sipData.length === 0) {
      const latestData = await storage.getLatestScrape();
      if (!latestData) {
        throw new Error('No existing SIP data found');
      }
      sipData = latestData.posts;
      console.log('Loaded existing SIP data');
    }

    console.log('Number of SIPs loaded:', sipData.length);

    // Ask about LLM provider FIRST
    const defaultProvider = process.env.LLM_PROVIDER || 'local';
    console.log(`Default provider from environment: ${defaultProvider}`);

    // Define provider config BEFORE using it
    const providerConfig = {
      local: {
        provider: 'local',
        config: {
          baseUrl: 'http://100.85.125.254:1234/v1',
          model: 'phi-4',
          temperature: 0.7,
          maxTokens: 15000
        }
      },
      openai: {
        provider: 'openai',
        config: {
          apiKey: process.env.OPENAI_API_KEY,
          model: 'o1-mini-2024-09-12'
        }
      },
      anthropic: {
        provider: 'anthropic',
        config: {
          apiKey: process.env.ANTHROPIC_API_KEY,
          model: 'claude-3-5-sonnet-20241022'
        }
      }
    };

    const providerAnswer = await question(
      '\nWhich LLM provider would you like to use?\n' +
      `1. Local (LMStudio - ${providerConfig.local.config.model}) ${defaultProvider === 'local' ? '[default]' : ''}\n` +
      `2. OpenAI (${providerConfig.openai.config.model}) ${defaultProvider === 'openai' ? '[default]' : ''}\n` +
      `3. Anthropic (${providerConfig.anthropic.config.model}) ${defaultProvider === 'anthropic' ? '[default]' : ''}\n` +
      'Enter 1, 2, or 3 (or press Enter for default): '
    );

    // Use default if no input
    const choice = providerAnswer.trim() || defaultProvider;

    // Update provider selection
    let chosenConfig;
    switch(choice) {
      case '1':
        chosenConfig = providerConfig.local;
        break;
      case '2':
        chosenConfig = providerConfig.openai;
        break;
      case '3':
        chosenConfig = providerConfig.anthropic;
        break;
      default:
        throw new Error('Invalid provider selection');
    }

    global.llmProvider = LLMProviderFactory.createProvider(
      chosenConfig.provider, 
      chosenConfig.config
    );

    console.log(`Using ${chosenConfig.provider.toUpperCase()} provider`);

    // THEN check for existing compressed context
    let existingContextExists = false;
    try {
      fs.accessSync(compressedContextPath);
      existingContextExists = true;
    } catch (err) {
      // File doesn't exist
    }

    if (existingContextExists) {
      const answer = await question(
        'Found existing compressed context. Would you like to:\n' +
        '1. Load existing compression\n' +
        '2. Generate new compression\n' +
        'Enter 1 or 2: '
      );

      if (answer === '1') {
        const existingContext = fs.readFileSync(compressedContextPath, 'utf8');
        // Extract content after frontmatter (everything after the first ---)
        compressedContext = existingContext.split('---')[2].trim();
        console.log('Loaded existing compressed context');
      } else {
        console.log('Generating new compression...');
        compressedContext = await compressSIPDataWithLLM(sipData);
        saveCompressedContext();
      }
    } else {
      console.log('No existing compressed context found, generating new one...');
      compressedContext = await compressSIPDataWithLLM(sipData);
      saveCompressedContext();
    }

    // Log the first part of the compressed context
    console.log('Compressed context preview:', 
      compressedContext.substring(0, 500) + '...');

    rl.close();

  } catch (err) {
    console.error('Error initializing data:', err);
    process.exit(1);
  }
}

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

// Call initialization when starting the server
initializeData().then(() => {
  app.listen(port, () => {
    console.log(`Chatbot server running at http://localhost:${port}`);
  });
});

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

// Update the chat endpoint
app.post('/chat', async (req, res) => {
  try {
    logger.log('Received chat request', { message: req.body.message });
    debug('LLM Provider details:', {
      type: global.llmProvider?.constructor.name,
      config: global.llmProvider?.config,
      initialized: !!global.llmProvider
    });

    // Get or create chat history for this session
    const sessionId = req.body.sessionId || 'default';
    if (!chatHistories.has(sessionId)) {
      chatHistories.set(sessionId, []);
    }
    const history = chatHistories.get(sessionId);

    if (!req.body || !req.body.message) {
      logger.logError('Missing message in request');
      return res.status(400).json({ 
        error: 'Missing message in request body',
        userMessage: 'Please provide a message to chat about.'
      });
    }

    if (!global.llmProvider) {
      logger.logError('LLM provider not initialized');
      debug('Provider initialization failed. Current state:', {
        provider: global.llmProvider,
        env: {
          LLM_PROVIDER: process.env.LLM_PROVIDER,
          OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
          ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY
        }
      });
      return res.status(500).json({ 
        error: 'LLM provider not initialized',
        userMessage: 'The chat service is not properly initialized. Please try refreshing the page or contact support.'
      });
    }

    if (!compressedContext) {
      logger.logError('Context not initialized');
      return res.status(500).json({ 
        error: 'Context not initialized',
        userMessage: 'The chat service is still loading. Please try again in a moment.'
      });
    }

    // Prepare messages BEFORE logging them
    const messages = [
      { role: 'system', content: compressedContext },
      ...history,
      { role: 'user', content: req.body.message }
    ];

    // Add logging for LLM provider type
    logger.log('Using LLM provider:', global.llmProvider.constructor.name);
    debug('Provider configuration:', {
      type: global.llmProvider.constructor.name,
      baseUrl: global.llmProvider.config?.baseUrl,
      model: global.llmProvider.config?.model
    });

    debug('Preparing chat request:', {
      messageCount: messages.length,
      lastMessage: req.body.message,
      systemMessagePreview: messages[0].content.substring(0, 100) + '...'
    });

    // For local provider, test connection before sending request
    if (global.llmProvider.constructor.name === 'LocalProvider') {
      try {
        debug('Testing LMStudio connection...');
        // Test connection to LMStudio
        const testResponse = await axios.get('http://localhost:1234/v1/models');
        debug('LMStudio connection test response:', testResponse.data);
        logger.log('Successfully connected to LMStudio');
      } catch (error) {
        debug('LMStudio connection test failed:', {
          error: error.message,
          code: error.code,
          response: error.response?.data
        });
        logger.logError('Failed to connect to LMStudio:', error);
        return res.status(503).json({
          error: 'LMStudio Connection Error',
          userMessage: 'Could not connect to LMStudio. Please ensure LMStudio is running on port 1234 and try again.',
          details: error.message
        });
      }
    }

    logger.log('Sending request to LLM provider');
    
    try {
      debug('Calling provider.chat() with messages');
      const response = await global.llmProvider.chat(messages);
      debug('Received successful response from LLM');
      
      // Update history with this exchange
      history.push(
        { role: 'user', content: req.body.message },
        { role: 'assistant', content: response }
      );

      logger.log('Received response from LLM');
      res.json({ response });
    } catch (error) {
      debug('LLM request failed:', {
        error: error.message,
        code: error.code,
        response: error.response?.data,
        stack: error.stack
      });
      throw error; // Re-throw to be caught by outer catch block
    }

  } catch (error) {
    debug('Chat processing error:', {
      error: error.message,
      code: error.code,
      type: error.constructor.name,
      provider: global.llmProvider?.constructor.name,
      stack: error.stack
    });
    logger.logError('Chat processing error:', error);
    
    // Enhanced error handling with more specific messages
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
      details: error.message,
      userMessage,
      provider: global.llmProvider?.constructor.name,
      debug: {
        errorType: error.constructor.name,
        errorCode: error.code,
        providerType: global.llmProvider?.constructor.name,
        providerConfig: {
          baseUrl: global.llmProvider?.config?.baseUrl,
          model: global.llmProvider?.config?.model
        },
        stack: error.stack
      }
    });
  }
});
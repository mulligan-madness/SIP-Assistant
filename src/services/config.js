const path = require('path');
const fs = require('fs');
const debug = require('debug')('chatbot:config');

class ConfigService {
  constructor() {
    this.config = {
      server: {
        port: process.env.PORT || 3000,
        host: process.env.HOST || 'localhost'
      },
      providers: {
        local: {
          model: process.env.LOCAL_LLM_MODEL || 'phi-4',
          temperature: parseFloat(process.env.LOCAL_LLM_TEMPERATURE) || 0.7,
          maxTokens: parseInt(process.env.LOCAL_LLM_MAX_TOKENS) || 15000,
          baseUrl: process.env.LOCAL_LLM_BASE_URL,
          execPath: process.env.LOCAL_LLM_EXEC_PATH
        },
        openai: {
          apiKey: process.env.OPENAI_API_KEY,
          model: process.env.OPENAI_MODEL || 'gpt-4o',
          temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7,
          maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 4000
        },
        anthropic: {
          apiKey: process.env.ANTHROPIC_API_KEY,
          model: process.env.ANTHROPIC_MODEL || 'claude-3-opus-20240229',
          temperature: parseFloat(process.env.ANTHROPIC_TEMPERATURE) || 0.7,
          maxTokens: parseInt(process.env.ANTHROPIC_MAX_TOKENS) || 4000
        }
      },
      forum: {
        baseUrl: process.env.FORUM_BASE_URL,
        scrapeOptions: {
          maxRetries: parseInt(process.env.SCRAPE_MAX_RETRIES) || 3,
          retryDelay: parseInt(process.env.SCRAPE_RETRY_DELAY) || 1000,
          debug: process.env.SCRAPE_DEBUG === 'true',
          rateLimit: parseInt(process.env.SCRAPE_RATE_LIMIT) || 1000
        }
      },
      paths: {
        output: path.join(__dirname, '..', '..', 'output'),
        dist: path.join(__dirname, '..', '..', 'dist')
      },
      security: {
        rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
        rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 100, // 100 requests per window
        corsOrigin: process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : process.env.FRONTEND_URL
      }
    };
    
    this.validateConfig();
    this.ensureDirectories();
  }
  
  // Validate the configuration
  validateConfig() {
    const requiredVars = [
      { key: 'FORUM_BASE_URL', path: 'forum.baseUrl' }
    ];
    
    // Check for required environment variables
    const missingVars = requiredVars.filter(v => !this.getConfigValue(v.path));
    
    if (missingVars.length > 0) {
      const missingKeys = missingVars.map(v => v.key).join(', ');
      debug(`Missing required environment variables: ${missingKeys}`);
      console.warn(`Warning: Missing required environment variables: ${missingKeys}`);
    }
    
    // Validate provider configurations
    const providers = ['local', 'openai', 'anthropic'];
    let validProviders = 0;
    
    for (const provider of providers) {
      const providerConfig = this.config.providers[provider];
      let isValid = true;
      
      if (provider === 'local') {
        if (!providerConfig.baseUrl && !providerConfig.execPath) {
          debug(`Local provider missing baseUrl or execPath`);
          isValid = false;
        }
      } else {
        if (!providerConfig.apiKey) {
          debug(`${provider} provider missing API key`);
          isValid = false;
        }
      }
      
      if (isValid) {
        validProviders++;
      }
    }
    
    if (validProviders === 0) {
      debug('No valid provider configurations found');
      console.warn('Warning: No valid provider configurations found. At least one provider must be properly configured.');
    }
  }
  
  // Ensure required directories exist
  ensureDirectories() {
    const directories = [
      this.config.paths.output
    ];
    
    for (const dir of directories) {
      if (!fs.existsSync(dir)) {
        debug(`Creating directory: ${dir}`);
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }
  
  // Get a configuration value by path (e.g., 'server.port')
  getConfigValue(path) {
    const parts = path.split('.');
    let value = this.config;
    
    for (const part of parts) {
      if (value === undefined || value === null) return undefined;
      value = value[part];
    }
    
    return value;
  }
  
  // Get the entire configuration
  getConfig() {
    return this.config;
  }
  
  // Get provider configuration
  getProviderConfig(provider) {
    return this.config.providers[provider];
  }
  
  // Get server configuration
  getServerConfig() {
    return this.config.server;
  }
  
  // Get forum configuration
  getForumConfig() {
    return this.config.forum;
  }
  
  // Get path configuration
  getPathConfig() {
    return this.config.paths;
  }
  
  // Get security configuration
  getSecurityConfig() {
    return this.config.security;
  }
}

// Create a singleton instance
const configService = new ConfigService();

module.exports = { configService }; 
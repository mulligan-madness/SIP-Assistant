const { OpenAIProvider } = require('./openai');
const { AnthropicProvider } = require('./anthropic');

// Import agent providers
const { RetrievalAgentProvider } = require('./agents/retrieval');
const { ResearchAgentProvider } = require('./agents/research');
const { InterviewAgentProvider } = require('./agents/interview');
const { DraftingAgentProvider } = require('./agents/drafting');

class LLMProviderFactory {
  static validateConfig(type, config) {
    // Check if this is an agent provider type
    if (type.toLowerCase().includes('agent')) {
      // Agent provider validation
      const llmType = config.llmProvider || 'openai';
      const llmConfig = config.llmConfig || {};
      
      // Validate the underlying LLM provider
      this.validateConfig(llmType, llmConfig);
      return;
    }
    
    // Basic provider validation
    switch (type.toLowerCase()) {
      case 'openai':
        if (!config.apiKey && !process.env.OPENAI_API_KEY) {
          throw new Error('apiKey is required for OpenAI provider (set in config or OPENAI_API_KEY env var)');
        }
        break;
      case 'anthropic':
        if (!config.apiKey && !process.env.ANTHROPIC_API_KEY) {
          throw new Error('apiKey is required for Anthropic provider (set in config or ANTHROPIC_API_KEY env var)');
        }
        break;
      // Agent provider validation will be added here as we implement each agent
      default:
        throw new Error(`Unknown provider type: ${type}`);
    }
  }

  static createProvider(type, config = {}) {
    console.log(`[PROVIDER] Creating provider of type: ${type}`);
    console.log(`[PROVIDER] Provider config:`, JSON.stringify(config, (key, value) => 
      key === 'apiKey' ? '[REDACTED]' : value, 2));
    
    this.validateConfig(type, config);
    const finalConfig = { ...config };

    // Check if this is an agent provider request
    if (type.toLowerCase().includes('agent')) {
      console.log(`[PROVIDER] Creating agent provider: ${type}`);
      return this.createAgentProvider(type, finalConfig);
    }

    // Standard provider creation
    switch (type.toLowerCase()) {
      case 'openai':
        finalConfig.apiKey = config.apiKey || process.env.OPENAI_API_KEY;
        finalConfig.model = config.model || process.env.OPENAI_MODEL;
        console.log(`[PROVIDER] Created OpenAIProvider with model: ${finalConfig.model}`);
        return new OpenAIProvider(finalConfig);
        
      case 'anthropic':
        finalConfig.apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY;
        finalConfig.model = config.model || process.env.ANTHROPIC_MODEL;
        console.log(`[PROVIDER] Created AnthropicProvider with model: ${finalConfig.model}`);
        return new AnthropicProvider(finalConfig);
        
      default:
        console.error(`[PROVIDER] Unknown provider type: ${type}`);
        throw new Error(`Unknown provider type: ${type}`);
    }
  }

  /**
   * Creates an agent-specific provider
   * @param {string} type - The agent type (e.g., 'retrievalAgent')
   * @param {Object} config - Configuration for the agent
   * @returns {BaseLLMProvider} - An agent provider instance
   */
  static createAgentProvider(type, config) {
    // The underlying LLM provider to use for this agent
    const llmType = config.llmProvider || 'openai';
    const llmConfig = config.llmConfig || {};
    
    // Create the base LLM provider that the agent will use
    const baseLLMProvider = this.createProvider(llmType, llmConfig);
    
    // Create the appropriate agent provider
    switch (type.toLowerCase()) {
      case 'retrievalagent':
        return new RetrievalAgentProvider(baseLLMProvider, config);
        
      case 'researchagent':
        return new ResearchAgentProvider(baseLLMProvider, config);
        
      case 'interviewagent':
        return new InterviewAgentProvider(baseLLMProvider, config);
        
      case 'draftingagent':
        return new DraftingAgentProvider(baseLLMProvider, config);
        
      default:
        throw new Error(`Unknown agent type: ${type}`);
    }
  }

  /**
   * Gets a provider that supports a specific capability
   * @param {string} capability - The capability needed ('retrieve', 'research', 'interview', 'draft')
   * @param {Object} config - Configuration for the provider
   * @returns {BaseLLMProvider} - A provider that supports the requested capability
   */
  static getProviderWithCapability(capability, config = {}) {
    // Map capabilities to appropriate agent types
    const capabilityMap = {
      'retrieve': 'retrievalAgent',
      'research': 'researchAgent',
      'interview': 'interviewAgent',
      'draft': 'draftingAgent'
    };
    
    const agentType = capabilityMap[capability];
    if (!agentType) {
      throw new Error(`Unknown capability: ${capability}`);
    }
    
    return this.createAgentProvider(agentType, config);
  }
}

module.exports = { LLMProviderFactory }; 
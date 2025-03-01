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
   * @param {string} type - The agent type (e.g., 'retrieval', 'research')
   * @param {BaseLLMProvider} llmProvider - The underlying LLM provider to use
   * @param {Object} config - Configuration for the agent
   * @returns {BaseLLMProvider} - An agent provider instance
   */
  static createAgentProvider(type, llmProvider, config = {}) {
    console.log(`[PROVIDER] Creating agent provider: ${type}`);
    
    // If llmProvider is a config object instead of a provider instance,
    // create the provider first
    if (typeof llmProvider === 'object' && !llmProvider.complete && !llmProvider.chat) {
      const llmType = llmProvider.provider || 'openai';
      const llmConfig = llmProvider.config || {};
      llmProvider = this.createProvider(llmType, llmConfig);
    }
    
    // Create the appropriate agent provider
    switch (type.toLowerCase()) {
      case 'retrieval':
      case 'retrievalagent':
        console.log(`[PROVIDER] Created RetrievalAgentProvider`);
        return new RetrievalAgentProvider(llmProvider, config);
        
      case 'research':
      case 'researchagent':
        console.log(`[PROVIDER] Created ResearchAgentProvider`);
        return new ResearchAgentProvider(llmProvider, config);
        
      case 'interview':
      case 'interviewagent':
        console.log(`[PROVIDER] Created InterviewAgentProvider`);
        return new InterviewAgentProvider(llmProvider, config);
        
      case 'drafting':
      case 'draftingagent':
        console.log(`[PROVIDER] Created DraftingAgentProvider`);
        return new DraftingAgentProvider(llmProvider, config);
        
      default:
        console.error(`[PROVIDER] Unknown agent type: ${type}`);
        throw new Error(`Unknown agent type: ${type}`);
    }
  }

  /**
   * Gets a provider that supports a specific capability
   * @param {string} capability - The capability needed ('retrieve', 'research', 'interview', 'draft')
   * @param {BaseLLMProvider} llmProvider - The underlying LLM provider to use
   * @param {Object} config - Configuration for the provider
   * @returns {BaseLLMProvider} - A provider that supports the requested capability
   */
  static getProviderWithCapability(capability, llmProvider, config = {}) {
    // Map capabilities to appropriate agent types
    const capabilityMap = {
      'retrieve': 'retrieval',
      'research': 'research',
      'interview': 'interview',
      'draft': 'drafting'
    };
    
    const agentType = capabilityMap[capability];
    if (!agentType) {
      console.error(`[PROVIDER] Unknown capability: ${capability}`);
      throw new Error(`Unknown capability: ${capability}`);
    }
    
    return this.createAgentProvider(agentType, llmProvider, config);
  }
}

module.exports = { LLMProviderFactory }; 
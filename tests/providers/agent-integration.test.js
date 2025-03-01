/**
 * Integration tests for the agent provider framework
 * 
 * These tests verify that the agent provider framework integrates
 * properly with the existing provider system.
 */

const { LLMProviderFactory } = require('../../src/providers/factory');
const { BaseLLMProvider } = require('../../src/providers/base');
const { BaseAgentProvider } = require('../../src/providers/agents/base');

// Set test environment
process.env.NODE_ENV = 'test';
process.env.OPENAI_API_KEY = 'test-key';

describe('Agent Provider Integration', () => {
  test('agent provider should delegate to underlying LLM provider', async () => {
    // Create a test implementation of BaseLLMProvider
    class TestProvider extends BaseLLMProvider {
      constructor() {
        super();
        this.completeCalled = false;
        this.chatCalled = false;
      }
      
      async complete(prompt) {
        this.completeCalled = true;
        this.lastPrompt = prompt;
        return 'Test completion response';
      }
      
      async chat(messages) {
        this.chatCalled = true;
        this.lastMessages = messages;
        return 'Test chat response';
      }
    }
    
    // Create a test provider
    const testLLM = new TestProvider();
    
    // Create an agent provider that uses the test LLM
    const agent = new BaseAgentProvider(testLLM, {
      systemPrompt: 'Test system prompt'
    });
    
    // Test complete delegation
    const completeResult = await agent.complete('Test prompt');
    expect(testLLM.completeCalled).toBe(true);
    expect(testLLM.lastPrompt).toBe('Test prompt');
    expect(completeResult).toBe('Test completion response');
    
    // Test chat delegation with system prompt
    const chatResult = await agent.chat([{ role: 'user', content: 'Test message' }]);
    expect(testLLM.chatCalled).toBe(true);
    expect(testLLM.lastMessages[0].role).toBe('system');
    expect(testLLM.lastMessages[0].content).toBe('Test system prompt');
    expect(testLLM.lastMessages[1].role).toBe('user');
    expect(testLLM.lastMessages[1].content).toBe('Test message');
    expect(chatResult).toBe('Test chat response');
  });
  
  test('factory should create agent providers with correct configuration', () => {
    // Override validateConfig for testing
    const originalValidateConfig = LLMProviderFactory.validateConfig;
    LLMProviderFactory.validateConfig = (type, config) => {
      // Skip validation for testing
      return;
    };
    
    // Override createProvider to return a mock for testing
    const originalCreateProvider = LLMProviderFactory.createProvider;
    LLMProviderFactory.createProvider = (type, config) => {
      if (type === 'openai') {
        return new BaseLLMProvider(); // Mock OpenAI provider
      }
      return originalCreateProvider(type, config);
    };
    
    try {
      // Test creating an agent provider
      const agent = LLMProviderFactory.createAgentProvider('retrievalAgent', {
        llmProvider: 'openai',
        llmConfig: {
          model: 'gpt-4'
        },
        customOption: 'test'
      });
      
      // Verify the agent was created with the right configuration
      expect(agent.constructor.name).toBe('RetrievalAgentProvider');
      expect(agent.config.customOption).toBe('test');
      expect(agent.supportsCapability('retrieve')).toBe(true);
      
      // Test getting a provider by capability
      const researchProvider = LLMProviderFactory.getProviderWithCapability('research');
      expect(researchProvider.constructor.name).toBe('ResearchAgentProvider');
      expect(researchProvider.supportsCapability('research')).toBe(true);
    } finally {
      // Restore original methods
      LLMProviderFactory.validateConfig = originalValidateConfig;
      LLMProviderFactory.createProvider = originalCreateProvider;
    }
  });
  
  test('agent provider utility methods should work correctly', async () => {
    const agent = new BaseAgentProvider(new BaseLLMProvider());
    
    // Test operation history tracking
    agent._logOperation('test', { param: 'value' });
    const history = agent.getOperationHistory();
    expect(history.length).toBe(1);
    expect(history[0].operation).toBe('test');
    expect(history[0].details.param).toBe('value');
    
    // Test createPrompt with built-in template
    const summaryPrompt = agent.createPrompt('summarize', { content: 'Test content' });
    expect(summaryPrompt).toContain('Test content');
    expect(summaryPrompt).toContain('summarize');
    
    // Test createPrompt with custom template
    const customPrompt = agent.createPrompt('Custom {{value}} template', { value: 'test' });
    expect(customPrompt).toBe('Custom test template');
    
    // Test processInChunks
    const processor = (chunk, index) => `Chunk ${index}: ${chunk}`;
    const chunks = await agent.processInChunks('abcdefghij', processor, 2);
    expect(chunks).toEqual([
      'Chunk 0: ab',
      'Chunk 1: cd',
      'Chunk 2: ef',
      'Chunk 3: gh',
      'Chunk 4: ij'
    ]);
  });
}); 
const { LLMProviderFactory } = require('../../src/providers/factory');
const { BaseLLMProvider } = require('../../src/providers/base');
const { BaseAgentProvider } = require('../../src/providers/agents/base');
const { RetrievalAgentProvider } = require('../../src/providers/agents/retrieval');
const { ResearchAgentProvider } = require('../../src/providers/agents/research');
const { InterviewAgentProvider } = require('../../src/providers/agents/interview');
const { DraftingAgentProvider } = require('../../src/providers/agents/drafting');

// Set test environment
process.env.NODE_ENV = 'test';
process.env.OPENAI_API_KEY = 'test-key';

describe('Agent Provider Framework', () => {
  describe('BaseLLMProvider', () => {
    test('should have agent capability methods', () => {
      const provider = new BaseLLMProvider();
      expect(typeof provider.retrieve).toBe('function');
      expect(typeof provider.research).toBe('function');
      expect(typeof provider.interview).toBe('function');
      expect(typeof provider.draft).toBe('function');
      expect(typeof provider.supportsCapability).toBe('function');
    });

    test('should not support any capabilities by default', () => {
      const provider = new BaseLLMProvider();
      expect(provider.supportsCapability('retrieve')).toBe(false);
      expect(provider.supportsCapability('research')).toBe(false);
      expect(provider.supportsCapability('interview')).toBe(false);
      expect(provider.supportsCapability('draft')).toBe(false);
    });
  });

  describe('BaseAgentProvider', () => {
    test('should format prompts correctly', () => {
      const mockLLM = new BaseLLMProvider();
      const agent = new BaseAgentProvider(mockLLM, {});
      
      const template = 'Hello {{name}}, welcome to {{place}}!';
      const variables = { name: 'John', place: 'SIP-Assistant' };
      
      const result = agent.formatPrompt(template, variables);
      expect(result).toBe('Hello John, welcome to SIP-Assistant!');
    });

    test('should parse JSON responses correctly', () => {
      const mockLLM = new BaseLLMProvider();
      const agent = new BaseAgentProvider(mockLLM, {});
      
      // Test JSON in code block
      const jsonInCodeBlock = '```json\n{"key": "value"}\n```';
      expect(agent.parseResponse(jsonInCodeBlock, 'json')).toEqual({ key: 'value' });
      
      // Test raw JSON
      const rawJson = '{"key": "value"}';
      expect(agent.parseResponse(rawJson, 'json')).toEqual({ key: 'value' });
    });
  });

  describe('Agent Providers', () => {
    test('each agent should support its specific capability', () => {
      const mockLLM = new BaseLLMProvider();
      
      const retrievalAgent = new RetrievalAgentProvider(mockLLM, {});
      expect(retrievalAgent.supportsCapability('retrieve')).toBe(true);
      expect(retrievalAgent.supportsCapability('research')).toBe(false);
      
      const researchAgent = new ResearchAgentProvider(mockLLM, {});
      expect(researchAgent.supportsCapability('research')).toBe(true);
      expect(researchAgent.supportsCapability('retrieve')).toBe(false);
      
      const interviewAgent = new InterviewAgentProvider(mockLLM, {});
      expect(interviewAgent.supportsCapability('interview')).toBe(true);
      expect(interviewAgent.supportsCapability('research')).toBe(false);
      
      const draftingAgent = new DraftingAgentProvider(mockLLM, {});
      expect(draftingAgent.supportsCapability('draft')).toBe(true);
      expect(draftingAgent.supportsCapability('interview')).toBe(false);
    });
  });
}); 
/**
 * Test for the integration between the Interview Agent and the Retrieval Agent
 * Run with: node src/providers/agents/test-integration.js
 */

// Load environment variables from .env file
require('dotenv').config();

const { agentFactory } = require('./factory');
const { OpenAIProvider } = require('../openai');

// Mock LLM provider for testing without API calls
class MockLLMProvider {
  async chat(messages, options = {}) {
    console.log('Mock LLM received messages:', JSON.stringify(messages.slice(0, 2), null, 2));
    console.log('Mock LLM options:', JSON.stringify(options, null, 2));
    return 'This is a mock response. In a real implementation, this would be a Socratic question from the LLM.';
  }
  
  async complete(prompt) {
    console.log('Mock LLM received prompt:', prompt.substring(0, 100) + '...');
    return `
      1. Budget allocation precedents in governance
      2. Success metrics for ecosystem development
      3. Risk management strategies for token distribution
    `;
  }
}

// Test the integration using the agent factory
async function testAgentFactoryIntegration() {
  console.log('\n=== Testing Agent Factory Integration ===\n');
  
  // Create a mock LLM provider
  const mockLLM = new MockLLMProvider();
  
  // Create an Interview Agent with Retrieval integration
  console.log('Creating Interview Agent with Retrieval integration...');
  const interviewAgent = agentFactory.createInterviewAgent(mockLLM, {
    debug: true,
    enableStateTracking: true,
    integrateRetrieval: true,
    retrievalOptions: {
      limit: 3,
      threshold: 0.7
    }
  });
  
  console.log('Interview Agent created successfully');
  
  // Verify that both agents were created
  const retrievalAgent = agentFactory.getAgent('retrieval');
  console.log('Retrieval Agent exists:', !!retrievalAgent);
  
  // Test a simple conversation
  const messages = [
    { role: 'user', content: 'I want to create a proposal for allocating 100,000 tokens to ecosystem development.' }
  ];
  
  console.log('\n--- Testing interview with retrieval integration ---');
  const response = await interviewAgent.interview(messages, {}, { identifyKnowledgeGaps: true });
  console.log('Response:', response);
  
  // Get the state
  const state = interviewAgent.getState();
  console.log('\n--- Interview State ---');
  console.log('Insights:', state.insights.length);
  console.log('Topics for exploration:', state.topicsForExploration.length);
  console.log('Contradictions:', state.contradictions.length);
  
  console.log('\n=== Integration test completed ===');
}

// Run the test with real providers if specified
async function runWithRealProviders() {
  console.log('\n=== Testing with real providers ===\n');
  
  // Check if we have the necessary API keys
  if (!process.env.OPENAI_API_KEY) {
    console.error('Error: OPENAI_API_KEY environment variable is required for real testing');
    return;
  }
  
  // Create real LLM provider
  const llmProvider = new OpenAIProvider({
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
    debug: true
  });
  
  // Create an Interview Agent with Retrieval integration
  console.log('Creating Interview Agent with Retrieval integration using real LLM...');
  const interviewAgent = agentFactory.createInterviewAgent(llmProvider, {
    debug: true,
    enableStateTracking: true,
    integrateRetrieval: true
  });
  
  console.log('Interview Agent created successfully with real LLM');
  
  // Test a simple conversation
  const messages = [
    { role: 'user', content: 'I want to create a proposal for allocating 100,000 tokens to ecosystem development.' }
  ];
  
  console.log('\n--- Testing interview with real LLM ---');
  const response = await interviewAgent.interview(messages, {}, { identifyKnowledgeGaps: true });
  console.log('Response:', response);
  
  console.log('\n=== Real provider test completed ===');
}

// Run the tests
async function runTests() {
  // First run with mock providers
  await testAgentFactoryIntegration();
  
  // Check if we should use real providers
  if (process.argv.includes('real')) {
    await runWithRealProviders();
  }
}

runTests().catch(error => {
  console.error('Test failed:', error);
}); 
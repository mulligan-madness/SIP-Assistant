/**
 * Test for the Interview Agent integration with Retrieval Agent
 * Run with: node src/providers/agents/test-interview-retrieval.js
 */

// Load environment variables from .env file
require('dotenv').config();

const { InterviewAgentProvider } = require('./interview');
const { RetrievalAgentProvider } = require('./retrieval');
const { OpenAIProvider } = require('../openai');
const { createInterviewPrompt } = require('./prompts/interview');

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

// Mock Retrieval Agent for testing
class MockRetrievalAgent {
  async retrieve(query, options = {}) {
    console.log('Mock Retrieval Agent received query:', query);
    
    // Return mock documents based on the query
    return [
      {
        id: 'doc1',
        title: 'SIP-123: Treasury Allocation Guidelines',
        date: '2023-01-15',
        content: 'The standard allocation for development grants is 15-20% of quarterly treasury outflows.'
      },
      {
        id: 'doc2',
        title: 'SIP-45: Ecosystem Development Fund',
        date: '2022-06-30',
        content: 'Projects requesting ecosystem funding must provide clear deliverables and success metrics.'
      }
    ];
  }
}

// Test the integration between Interview Agent and Retrieval Agent
async function testInterviewRetrievalIntegration() {
  console.log('\n=== Testing Interview Agent integration with Retrieval Agent ===\n');
  
  // Create a mock LLM provider
  const mockLLM = new MockLLMProvider();
  
  // Create a mock Retrieval Agent
  const mockRetrievalAgent = new MockRetrievalAgent();
  
  // Create an Interview Agent with the Retrieval Agent
  const interviewAgent = new InterviewAgentProvider(mockLLM, {
    debug: true,
    enableStateTracking: true,
    retrievalAgent: mockRetrievalAgent
  });
  
  // Test conversation
  const messages = [
    { role: 'user', content: 'I want to create a proposal for allocating 100,000 tokens to ecosystem development.' }
  ];
  
  console.log('--- Test 1: Basic document retrieval ---');
  const response1 = await interviewAgent.interview(messages, {}, { identifyKnowledgeGaps: false });
  console.log('Response:', response1);
  
  console.log('\n--- Test 2: Knowledge gap identification ---');
  const response2 = await interviewAgent.interview(messages, {}, { identifyKnowledgeGaps: true });
  console.log('Response:', response2);
  
  console.log('\n--- Test 3: Direct document request ---');
  const documents = await interviewAgent.requestRelevantDocuments(messages);
  console.log(`Retrieved ${documents.length} documents:`);
  documents.forEach((doc, i) => {
    console.log(`  ${i+1}. ${doc.title} (${doc.date})`);
  });
  
  console.log('\n--- Test 4: Knowledge gap identification ---');
  const { gaps, documents: gapDocuments } = await interviewAgent.identifyKnowledgeGaps(messages);
  console.log(`Identified ${gaps.length} knowledge gaps:`);
  gaps.forEach((gap, i) => {
    console.log(`  ${i+1}. ${gap}`);
  });
  console.log(`Retrieved ${gapDocuments.length} documents for knowledge gaps`);
  
  console.log('\n=== Tests completed ===');
}

// Run the tests with real providers if specified
async function runWithRealProviders() {
  console.log('\n=== Testing with real providers ===\n');
  
  // Check if we have the necessary API keys
  if (!process.env.OPENAI_API_KEY) {
    console.error('Error: OPENAI_API_KEY environment variable is required for real testing');
    return;
  }
  
  // Create real providers
  const llmProvider = new OpenAIProvider({
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
    debug: true
  });
  
  // We would need a real vector database for the Retrieval Agent
  // For now, we'll use a mock Retrieval Agent
  const retrievalAgent = new MockRetrievalAgent();
  
  // Create an Interview Agent with the real LLM and mock Retrieval Agent
  const interviewAgent = new InterviewAgentProvider(llmProvider, {
    debug: true,
    enableStateTracking: true,
    retrievalAgent: retrievalAgent
  });
  
  // Test conversation
  const messages = [
    { role: 'user', content: 'I want to create a proposal for allocating 100,000 tokens to ecosystem development.' }
  ];
  
  console.log('--- Test with real LLM: Knowledge gap identification ---');
  const { gaps, documents } = await interviewAgent.identifyKnowledgeGaps(messages);
  console.log(`Identified ${gaps.length} knowledge gaps:`);
  gaps.forEach((gap, i) => {
    console.log(`  ${i+1}. ${gap}`);
  });
  
  console.log('\n=== Real provider tests completed ===');
}

// Run the tests
async function runTests() {
  // First run with mock providers
  await testInterviewRetrievalIntegration();
  
  // Check if we should use real providers
  if (process.argv.includes('real')) {
    await runWithRealProviders();
  }
}

runTests().catch(error => {
  console.error('Test failed:', error);
}); 
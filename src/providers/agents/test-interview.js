/**
 * Simple test for the Interview Agent
 * Run with: node src/providers/agents/test-interview.js
 * 
 * To test with a real OpenAI provider:
 * OPENAI_API_KEY=your_key node src/providers/agents/test-interview.js real
 */

const { InterviewAgentProvider } = require('./interview');
const { OpenAIProvider } = require('../openai');
const { createInterviewPrompt, formatDocumentReferences } = require('./prompts/interview');

// Mock LLM provider for testing without API calls
class MockLLMProvider {
  async chat(messages, options = {}) {
    console.log('Mock LLM received messages:', JSON.stringify(messages, null, 2));
    console.log('Mock LLM options:', JSON.stringify(options, null, 2));
    return 'This is a mock response. In a real implementation, this would be a Socratic question from the LLM.';
  }
}

// Test with mock documents
const mockDocuments = [
  {
    title: 'SIP-123: Treasury Allocation Guidelines',
    date: '2023-01-15',
    content: 'The standard allocation for development grants is 15-20% of quarterly treasury outflows.'
  },
  {
    title: 'SIP-45: Ecosystem Development Fund',
    date: '2022-06-30',
    content: 'Projects requesting ecosystem funding must provide clear deliverables and success metrics.'
  }
];

// Test the prompt formatting function
function testPromptFormatting() {
  console.log('\n--- Testing Prompt Formatting ---');
  
  // Test with empty documents
  const emptyFormatted = formatDocumentReferences([]);
  console.log('Empty documents formatting:', emptyFormatted === '' ? 'PASS' : 'FAIL');
  
  // Test with mock documents
  const formatted = formatDocumentReferences(mockDocuments);
  console.log('Document formatting sample:');
  console.log(formatted);
  
  // Test complete prompt creation
  const completePrompt = createInterviewPrompt(mockDocuments, {
    additionalContext: 'Test context'
  });
  
  // Verify the prompt contains expected elements
  const hasDocuments = completePrompt.includes('SIP-123');
  const hasContext = completePrompt.includes('Test context');
  const hasSocraticGuidance = completePrompt.includes('Extract implicit knowledge');
  
  console.log('Complete prompt contains documents:', hasDocuments ? 'PASS' : 'FAIL');
  console.log('Complete prompt contains context:', hasContext ? 'PASS' : 'FAIL');
  console.log('Complete prompt contains Socratic guidance:', hasSocraticGuidance ? 'PASS' : 'FAIL');
}

async function runTest() {
  // First test the prompt formatting
  testPromptFormatting();
  
  // Check if we should use a real provider
  const useRealProvider = process.argv.includes('real');
  
  console.log(`\n=== Testing Interview Agent with ${useRealProvider ? 'Real' : 'Mock'} LLM ===`);
  
  // Create the appropriate LLM provider
  let llmProvider;
  if (useRealProvider) {
    if (!process.env.OPENAI_API_KEY) {
      console.error('Error: OPENAI_API_KEY environment variable is required for real testing');
      process.exit(1);
    }
    
    llmProvider = new OpenAIProvider({
      apiKey: process.env.OPENAI_API_KEY,
      model: 'gpt-4-turbo',
      debug: true
    });
    console.log('Using OpenAI provider with GPT-4 Turbo');
  } else {
    llmProvider = new MockLLMProvider();
    console.log('Using mock LLM provider');
  }
  
  // Create an interview agent with the selected LLM
  const interviewAgent = new InterviewAgentProvider(llmProvider, { debug: true });
  
  // Test conversation without documents
  console.log('\n--- Test 1: Basic conversation without documents ---');
  const messages1 = [
    { role: 'user', content: 'I want to create a proposal for allocating 100,000 tokens to ecosystem development.' }
  ];
  
  const response1 = await interviewAgent.interview(messages1);
  console.log('Response:', response1);
  
  // Test conversation with documents
  console.log('\n--- Test 2: Conversation with document context ---');
  const messages2 = [
    { role: 'user', content: 'I want to create a proposal for allocating 100,000 tokens to ecosystem development.' }
  ];
  
  const context = {
    documents: mockDocuments,
    additionalContext: 'The user is a governance facilitator for SuperRare DAO.'
  };
  
  const response2 = await interviewAgent.interview(messages2, context);
  console.log('Response:', response2);
  
  console.log('\n=== Tests completed ===');
}

// Run the tests
runTest().catch(error => {
  console.error('Test failed:', error);
}); 
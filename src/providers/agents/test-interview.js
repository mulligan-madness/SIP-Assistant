/**
 * Simple test for the Interview Agent
 * Run with: node src/providers/agents/test-interview.js
 * 
 * To test with a real OpenAI provider:
 * OPENAI_API_KEY=your_key node src/providers/agents/test-interview.js real
 */

// Load environment variables from .env file
require('dotenv').config();

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

// Test the state tracking functionality
async function testStateTracking() {
  console.log('\n--- Testing State Tracking ---');
  
  // Create a mock LLM provider
  const mockLLM = new MockLLMProvider();
  
  // Create an interview agent with state tracking enabled
  const interviewAgent = new InterviewAgentProvider(mockLLM, { 
    debug: true,
    enableStateTracking: true
  });
  
  // Test conversation with statements that should trigger state tracking
  const messages = [
    { 
      role: 'user', 
      content: 'I think that we should allocate 100% of the budget to marketing efforts. My goal is to increase awareness of our project.'
    },
    {
      role: 'assistant',
      content: 'That\'s an interesting approach. Have you considered how this allocation might affect other areas of the project?'
    },
    {
      role: 'user',
      content: 'We need to allocate 30% to development and 70% to marketing. There are no risks in this approach.'
    }
  ];
  
  // Process the conversation
  await interviewAgent.interview(messages);
  
  // Check if insights were extracted
  const insights = interviewAgent.getInsights();
  console.log('Insights extracted:', insights.length > 0 ? 'PASS' : 'FAIL');
  console.log(`Found ${insights.length} insights:`);
  insights.forEach((insight, i) => {
    console.log(`  ${i+1}. "${insight.insight}" (${insight.source})`);
  });
  
  // Check if topics were identified
  const topics = interviewAgent.getTopicsForExploration();
  console.log('Topics identified:', topics.length > 0 ? 'PASS' : 'FAIL');
  console.log(`Found ${topics.length} topics for exploration:`);
  topics.forEach((topic, i) => {
    console.log(`  ${i+1}. ${topic.topic} (Priority: ${topic.priority})`);
  });
  
  // Check if contradictions were detected
  const contradictions = interviewAgent.getContradictions();
  console.log('Contradictions detected:', contradictions.length > 0 ? 'PASS' : 'FAIL');
  console.log(`Found ${contradictions.length} potential contradictions:`);
  contradictions.forEach((contradiction, i) => {
    console.log(`  ${i+1}. "${contradiction.statement1}" vs "${contradiction.statement2}"`);
  });
  
  // Test state export/import
  const exportedState = interviewAgent.getState();
  console.log('State export successful:', Object.keys(exportedState).length > 0 ? 'PASS' : 'FAIL');
  
  // Create a new agent and import the state
  const newAgent = new InterviewAgentProvider(mockLLM, { debug: true });
  newAgent.importState(exportedState);
  
  // Verify the imported state
  const importedInsights = newAgent.getInsights();
  console.log('State import successful:', importedInsights.length === insights.length ? 'PASS' : 'FAIL');
}

async function runTest() {
  // First test the prompt formatting
  testPromptFormatting();
  
  // Test state tracking functionality
  await testStateTracking();
  
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
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo',
      debug: true
    });
    console.log(`Using OpenAI provider with model: ${process.env.OPENAI_MODEL || 'gpt-4-turbo'}`);
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
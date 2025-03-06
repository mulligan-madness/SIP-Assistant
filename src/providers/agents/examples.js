/**
 * Examples of using the Agent Provider Framework
 * 
 * This file contains example code for using the different agent providers.
 * It is not meant to be imported or used directly in the application,
 * but rather serves as documentation and reference.
 */

const { LLMProviderFactory } = require('../factory');

/**
 * Example using the Retrieval Agent
 */
async function retrievalAgentExample() {
  // Create a retrieval agent using the factory
  const retrievalAgent = LLMProviderFactory.createProvider('retrievalAgentProvider', {
    llmProvider: 'openai',
    llmConfig: {
      model: 'gpt-4'
    }
  });
  
  // Use the agent to retrieve relevant documents
  const query = 'What are the best practices for DAO governance?';
  const documents = await retrievalAgent.retrieve(query);
  
  // Process the results
  console.log(`Found ${documents.length} documents about "${query}"`);
  documents.forEach((doc, i) => {
    console.log(`Document ${i+1}: ${doc.title}`);
    console.log(`Content: ${doc.text.substring(0, 100)}...`);
  });
}

/**
 * Example using the Interview Agent
 */
async function interviewAgentExample() {
  // Create an interview agent using the factory
  const interviewAgent = LLMProviderFactory.createProvider('interviewAgentProvider', {
    llmProvider: 'openai',
    llmConfig: {
      model: 'gpt-4'
    }
  });
  
  // Example conversation
  const messages = [
    { role: 'user', content: 'I want to create a governance proposal for my DAO.' },
    { role: 'assistant', content: 'That sounds interesting! What specific aspect of governance are you looking to address?' },
    { role: 'user', content: 'I think we need better treasury management.' }
  ];
  
  // Additional context (optional)
  const context = {
    documents: [
      { title: 'Treasury Management Guide', content: 'Best practices for DAO treasury management...' }
    ]
  };
  
  // Use the interview capability
  const response = await interviewAgent.interview(messages, context, {
    identifyKnowledgeGaps: true
  });
  
  // Process the response
  console.log('Interview Agent Response:', response);
  
  // Get insights from the conversation
  const insights = interviewAgent.getInsights();
  console.log(`Extracted ${insights.length} insights from the conversation`);
}

/**
 * Example: Creating and using a Drafting Agent
 */
async function draftingAgentExample() {
  // Create a drafting agent
  const draftingAgent = LLMProviderFactory.createProvider('draftingAgent');
  
  // Sample research findings
  const research = {
    themes: ['Transparency', 'Security', 'Community involvement'],
    gaps: ['No clear implementation timeline', 'Funding details missing'],
    recommendations: ['Include specific milestones', 'Add budget breakdown']
  };
  
  // Sample insights from interviews
  const insights = [
    'Community members want more visibility into decision-making',
    'Previous proposals lacked technical details',
    'Concerns about voting power concentration'
  ];
  
  // Template to follow
  const template = {
    name: 'StandardProposal',
    sections: ['Summary', 'Background', 'Proposal', 'Implementation', 'Timeline', 'Budget']
  };
  
  // Use the drafting capability
  try {
    const draft = await draftingAgent.draft(research, insights, template, {
      format: 'markdown',
      includeCitations: true
    });
    
    console.log('Generated draft:', draft);
    
    // Simulate critique to improve the draft
    const critique = await draftingAgent.simulateCritique(draft, {
      perspectives: ['Technical', 'Governance', 'Community']
    });
    
    console.log('Critique results:', critique);
  } catch (error) {
    console.error('Drafting not yet implemented:', error.message);
  }
}

/**
 * Example: Getting a provider by capability
 */
async function capabilityExample() {
  // Get a provider that supports the 'retrieve' capability
  const provider = LLMProviderFactory.getProviderWithCapability('retrieve');
  
  console.log('Provider supports retrieve:', provider.supportsCapability('retrieve'));
  console.log('Provider type:', provider.constructor.name);
}

// Example usage
async function runExamples() {
  await retrievalAgentExample();
  await interviewAgentExample();
}

runExamples().catch(console.error);

module.exports = {
  retrievalAgentExample,
  interviewAgentExample,
  draftingAgentExample,
  capabilityExample
}; 
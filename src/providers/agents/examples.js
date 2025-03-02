/**
 * Examples of using the Agent Provider Framework
 * 
 * This file contains example code for using the different agent providers.
 * It is not meant to be imported or used directly in the application,
 * but rather serves as documentation and reference.
 */

const { LLMProviderFactory } = require('../factory');

/**
 * Example: Creating and using a Retrieval Agent
 */
async function retrievalAgentExample() {
  // Create a retrieval agent with OpenAI as the underlying provider
  const retrievalAgent = LLMProviderFactory.createProvider('retrievalAgent', {
    llmProvider: 'openai',
    llmConfig: {
      model: 'gpt-4',
      temperature: 0.2 // Lower temperature for more focused retrieval
    }
  });
  
  // Use the retrieval capability
  try {
    const results = await retrievalAgent.retrieve('governance proposal standards', {
      limit: 5,
      minRelevance: 0.75
    });
    
    console.log('Retrieved documents:', results);
  } catch (error) {
    console.error('Retrieval not yet implemented:', error.message);
  }
}

/**
 * Example: Creating and using an Interview Agent
 */
async function interviewAgentExample() {
  // Create an interview agent
  const interviewAgent = LLMProviderFactory.createProvider('interviewAgent', {
    temperature: 0.8 // Higher temperature for more creative questions
  });
  
  // Sample conversation history
  const messages = [
    { role: 'user', content: 'I want to create a governance proposal for my DAO.' },
    { role: 'assistant', content: 'That sounds interesting! What kind of DAO are you working with?' },
    { role: 'user', content: 'It\'s a DeFi protocol DAO with about 500 token holders.' }
  ];
  
  // Additional context for the interview
  const context = {
    topic: 'DAO Governance',
    userBackground: 'DeFi protocol founder',
    previousProposals: ['Treasury allocation', 'Protocol upgrade']
  };
  
  // Use the interview capability
  try {
    const response = await interviewAgent.interview(messages, context, {
      questionCount: 3,
      focusArea: 'proposal structure'
    });
    
    console.log('Interview response:', response);
  } catch (error) {
    console.error('Interview not yet implemented:', error.message);
  }
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

// These examples would be run in a real application
// retrievalAgentExample();
// interviewAgentExample();
// draftingAgentExample();
// capabilityExample();

module.exports = {
  retrievalAgentExample,
  interviewAgentExample,
  draftingAgentExample,
  capabilityExample
}; 
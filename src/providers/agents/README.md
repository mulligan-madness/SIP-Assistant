# Agents Directory

This directory contains specialized agent provider implementations that extend the base LLM provider with specific capabilities.

## File Naming Convention

Agent implementation files follow the naming convention `<agentType>AgentProvider.js` to clearly indicate:
1. Which agent capability they implement
2. That they are provider implementations, not prompt templates

## Current Directories

- `prompts/` - Contains prompt templates and utilities used by the agent providers
- `state/` - Contains state tracking classes for maintaining context across interactions

## Current Files

### Agent Providers
- `interviewAgentProvider.js` - Implementation of the Interview Agent for Socratic questioning
- `retrievalAgentProvider.js` - Implementation of the Retrieval Agent for finding relevant documents
- `draftingAgentProvider.js` - Implementation of the Drafting Agent for generating structured content

### Prompt Templates
- `prompts/interviewPromptTemplates.js` - Templates and utilities for the Interview Agent

## Best Practices

- Keep agent implementation separate from prompt templates
- Use clear naming conventions to avoid confusion
- Implement a consistent interface across all agent providers
- Include detailed logging for debugging agent interactions

## Architecture

The agent provider framework follows these key principles:

1. **Delegation Pattern**: Each agent provider wraps an underlying LLM provider and delegates basic operations to it.
2. **Capability-Based Design**: Providers expose specific capabilities through well-defined methods.
3. **Composition Over Inheritance**: Agents compose functionality by using other providers rather than through deep inheritance.

## Agent Types

The framework includes the following agent types:

### Retrieval Agent
- **Purpose**: Find relevant documents based on semantic search
- **Key Method**: `retrieve(query, options)`
- **Implementation Timeline**: Sprint 4

### Interview Agent
- **Purpose**: Conduct interactive dialogues to extract knowledge
- **Key Method**: `interview(messages, context, options)`
- **Implementation Timeline**: Sprint 6

### Drafting Agent
- **Purpose**: Generate structured governance proposals
- **Key Method**: `draft(research, insights, template, options)`
- **Implementation Timeline**: Sprint 7

## Usage Examples

### Creating an Agent Provider

```javascript
const { LLMProviderFactory } = require('../factory');

// Create a retrieval agent using OpenAI as the underlying provider
const retrievalAgent = LLMProviderFactory.createProvider('retrievalAgent', {
  llmProvider: 'openai',
  llmConfig: {
    model: 'gpt-4'
  }
});

// Use the agent's capabilities
const results = await retrievalAgent.retrieve('governance proposal standards');
```

### Getting a Provider by Capability

```javascript
const { LLMProviderFactory } = require('../factory');

// Get a provider that supports the 'retrieve' capability
const retrieveProvider = LLMProviderFactory.getProviderWithCapability('retrieve', {
  llmProvider: 'anthropic',
  llmConfig: {
    model: 'claude-3-opus-20240229'
  }
});

// Use the retrieve capability
const results = await retrieveProvider.retrieve('DAO Governance');
```

## Extending the Framework

To add a new agent type:

1. Create a new file in the `agents/` directory
2. Extend the `BaseAgentProvider` class
3. Implement the specific capability methods
4. Override `supportsCapability()` to return true for your capability
5. Update the factory to support creating your agent type

## Implementation Status

- ✅ Base framework (Sprint 3)
- 🔄 Retrieval Agent (Planned for Sprint 4)
- 🔄 Interview Agent (Planned for Sprint 6)
- 🔄 Drafting Agent (Planned for Sprint 7) 
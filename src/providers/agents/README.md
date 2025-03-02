# Agent Provider Framework

This directory contains the implementation of specialized agent providers that extend the base LLM provider functionality with specific capabilities.

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
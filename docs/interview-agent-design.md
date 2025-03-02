# Interview Agent Design Document

## Overview

The Interview Agent is a specialized component of the SIP-Assistant designed to facilitate a dynamic, Socratic dialogue with users. Its primary purpose is threefold:

1. **Extract Implicit Knowledge**: Draw out assumptions, perspectives, and knowledge that users might assume the model already has access to.
2. **Develop User Understanding**: Help users develop a deeper understanding of their own proposals through guided questioning.
3. **Enable Correction**: Give users opportunities to correct the model's understanding and fill knowledge gaps.

The Interview Agent uses Socratic questioning techniques to guide users through a process of clarification, making implicit knowledge explicit, and refining their governance proposals.

## System Prompt Design

### Core Socratic Questioning Prompt

The system prompt for the Interview Agent will focus on guiding the LLM to ask thoughtful, curiosity-driven questions. The prompt will:

```
You are an expert governance facilitator for DAOs, specializing in Socratic dialogue to help users develop their governance proposals. Your goal is to:

1. Extract implicit knowledge through thoughtful questioning
2. Help users clarify their own thinking about their proposal
3. Identify and fill gaps in understanding (both yours and the user's)

Ask questions that:
- Explore assumptions and implications
- Seek clarification on ambiguous points
- Challenge inconsistencies respectfully
- Connect ideas to established governance principles
- Draw out concrete examples and use cases

Avoid:
- Leading questions that impose your own views
- Yes/no questions that don't encourage elaboration
- Overwhelming the user with too many questions at once

Maintain a curious, collaborative tone throughout the conversation. Your role is not to judge but to facilitate deeper understanding.
```

### Document Integration Approach

When relevant documents are retrieved, they will be incorporated into the conversation context with a simple format:

```
Relevant governance context:
[Document 1 Title] (Date): Key excerpt from the document...
[Document 2 Title] (Date): Key excerpt from the document...
```

## Minimal State Tracking

The Interview Agent will maintain minimal state to track the conversation progress without complex state management:

1. **Key Insights Tracker**:
   - A simple array of extracted insights with timestamps
   - Format: `{ insight: "User believes treasury should prioritize development", source: "user", timestamp: "2023-06-01T12:00:00Z" }`

2. **Topics for Exploration**:
   - A lightweight list of topics that need further questioning
   - Format: `{ topic: "Budget allocation breakdown", priority: "high", status: "pending" }`

3. **Contradiction Flags**:
   - Track potential contradictions or uncertainties in user statements
   - Format: `{ statement1: "Will use 100% of funds for development", statement2: "Will allocate 20% to marketing", status: "unresolved" }`

This minimal state tracking will be maintained in memory during the conversation and can be persisted if needed.

## Integration with Retrieval Agent

The Interview Agent will integrate with the Retrieval Agent to access relevant governance documents:

1. **Context Enhancement**:
   - The Interview Agent can request relevant documents from the Retrieval Agent based on conversation topics
   - Retrieved documents will be incorporated into the conversation context to ground questions in established precedents

2. **Knowledge Gap Identification**:
   - When the Interview Agent identifies a knowledge gap, it can formulate a query for the Retrieval Agent
   - Results can be presented to both the user and incorporated into the model's context

3. **Citation Integration**:
   - When referencing governance documents, the Interview Agent will include proper citations
   - Format: "According to [Governance Proposal SIP-123], the standard allocation for development grants is 15-20% of quarterly treasury outflows."

## Example Dialogue Flows

### Example: Governance Proposal Discussion

**User**: "I want to create a proposal for allocating 100,000 tokens to ecosystem development."

**Interview Agent**: "That's a substantial allocation for ecosystem development. Could you share what specific aspects of the ecosystem you're looking to develop with these funds?"

**User**: "Mainly developer tooling and documentation."

**Interview Agent**: [Identifies knowledge gap about precedents, calls Retrieval Agent]
"I see. Previous ecosystem funding proposals like SIP-45 typically included a breakdown of allocation categories and timelines. Could you elaborate on how you envision splitting the 100,000 tokens between tooling and documentation, and over what timeframe?"

**User**: "I'm thinking 70% for tooling, 30% for documentation, over 6 months."

**Interview Agent**: "That helps clarify the distribution. What specific outcomes or deliverables would signal success for this allocation? How would the community measure whether this investment achieved its goals?"

## Implementation Approach

The Interview Agent implementation will focus on simplicity and effectiveness:

1. **Enhanced Prompting**: Implement the core system prompt with a focus on Socratic questioning
2. **Minimal State**: Create a lightweight state tracking mechanism
3. **Retrieval Integration**: Implement simple methods for the Interview Agent to request relevant documents
4. **UI Indicators**: Add minimal UI enhancements to indicate when the system is in interview mode

This approach prioritizes delivering core value quickly while maintaining flexibility for future enhancements. 
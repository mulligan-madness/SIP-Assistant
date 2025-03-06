# Product Requirements Document (PRD) for SIP-Assistant

## 1. Introduction

Governance proposal drafting for DAOs is currently a labor-intensive, manually driven process. As a Governance Facilitator & Foundation Manager for SuperRare and RareDAO, you engage in a complex, iterative process—researching historical forum posts, extracting context, drafting proposals based on strict DAO standards, and simulating community critique to refine your output. This process is difficult to scale, error-prone, and relies heavily on your unique expertise.

**Vision:**  
The SIP-Assistant aims to revolutionize this process by automating and standardizing governance proposal drafting. By leveraging a network of specialized AI agents and a robust retrieval-augmented generation (RAG) pipeline, the tool will not only streamline your workflow but also cultivate individual and collective wisdom. In the long run, this system will serve as a "precedent library" (like those in big law firms) and a platform that scales expertise across diverse domains—not just DAO governance.

---

## 2. User Story: AI-Assisted Governance Proposal Drafting

### User Persona
- **Name:** Governance Facilitator & Foundation Manager  
- **Organizations:** SuperRare and RareDAO  
- **Role & Responsibilities:**  
  - Oversee governance processes, including proposal drafting and community engagement.
  - Ensure proposals are well-structured, adhere to DAO standards, and include verifiable citations.
  - Strive to improve efficiency and scale expertise using AI assistance.

### Current Workflow & Challenges

1. **Building Context & Researching Precedents:**  
   - Engage in freeform dialogue with AI to brainstorm and clarify ideas.
   - Manually navigate and scrape forum posts to extract relevant discussions.
   - Compile and compress historical context into JSON files for citation.
   - **Challenges:**  
     - Time-consuming and error-prone manual data retrieval.  
     - Difficulty maintaining full contextual citations without information overload.

2. **Drafting & Structuring the Proposal:**  
   - Direct the AI to synthesize gathered context into a structured proposal that complies with DAO templates.
   - Iteratively refine language and structure based on personal review.
   - **Challenges:**  
     - Controlling AI output to ensure strict adherence to governance standards.  
     - Maintaining logical flow and ensuring that all necessary sections are present.

3. **Critique & Refinement:**  
   - Simulate community critique to anticipate objections and refine the draft.
   - Adjust and iterate on the proposal until it meets internal and external standards.
   - **Challenges:**  
     - Manual simulation of nuanced feedback.  
     - Integrating feedback with direct citations from historical data.

### Vision for Automation
- **AI-empowered agents** will automate the retrieval of relevant historical data, synthesize context, engage in a dialogical process to draw out and develop your implicit knowledge, and generate a well-structured, compliant proposal—all while maintaining a rigorous citation framework.
- **Long-Term Impact:**  
  - Scale individual expertise to a collective level.
  - Create a dynamic "precedent library" that not only serves governance but can be extended to other domains where historical precedent and expert dialogue are critical.

---

## 3. System Overview & Architecture

### Core Components

- **Frontend (Vue.js):**  
  - **Current Role:** Provides the chat interface and basic UI for interacting with the system.
  - **Future Role:** A modular interface that supports multiple panels (chat, research, drafting, and feedback) with simple component communication through Vue's built-in reactivity system.
    - The research panel will start as a simple, minimalist display of retrieval results with basic citation information and document expansion capabilities. This MVP approach will allow for quick validation of the core retrieval functionality before adding more complex features.

- **Backend (Node.js):**  
  - **Current Role:** Hosts a basic chatbot and forum scraper.
  - **Future Role:** Extends the existing provider framework to support new agent capabilities while maintaining the clean abstraction layer already in place.

- **AI Capabilities:**  
  - **Current Role:** Basic chat functionality with multiple provider options (OpenAI, Anthropic, Local).
  - **Future Role:** Enhanced capabilities leveraging the existing provider architecture to add specialized agent functionality:
    - **Retrieval Agent**
    - **Interviewing Agent**
    - **Drafting Agent** (integrating iterative critique)

- **Integration Layer:**  
  - Lightweight integration between components using direct API calls and the existing provider framework.
  - Simple, focused approach prioritizing quick delivery of functionality.

---

## 4. Detailed Description of the Four Core Agent Capabilities

### 1. Retrieval Agent
**Role:**  
Automate the retrieval of semantically relevant historical governance data from a vectorized database.

**Functionality:**  
- **Input:** User query describing the governance topic.
- **Process:**  
  - Generate query embeddings using a language model.
  - Query the vector database (e.g., Pinecone or Weaviate) to fetch semantically similar documents.
  - Rank and filter results based on relevance.
- **Output:** A collection of relevant governance documents with contextual metadata and citations.

### 2. Interviewing Agent (Dialogical Process Avatar)
**Role:**  
Facilitate a dynamic, iterative dialogue with the user to draw out and develop both implicit and explicit knowledge through focused Socratic questioning. The agent helps users clarify their own thinking, makes implicit knowledge explicit, and allows users to correct the model's understanding.

**Functionality:**  
- **Enhanced Prompting:**  
  - Leverage specialized system prompts that guide the LLM to ask thoughtful, curiosity-driven questions.
  - Use a single, robust prompt template focused on effective Socratic questioning for all governance proposals.
  - Incorporate relevant documents from the Retrieval Agent directly into the conversation context to ground questions in established precedents.

- **Minimal State Tracking:**  
  - Track key insights extracted during the conversation without complex state management.
  - Maintain a lightweight list of topics that need further exploration.
  - Focus on essential information only, avoiding complex state mechanisms.

- **Knowledge & Creativity Development:**  
  - Engage in collaborative dialogue that not only extracts information but helps the user refine and expand on their ideas.
  - Serve as the interactive "face" of the process, making the conversation natural and evolving.
  - Reference relevant governance documents to ground the discussion in established precedents.
  - Help users develop a deeper understanding of their own proposals through guided questioning.

- **Direct Document Retrieval:**
  - Directly search for relevant documents based on the user's explicit queries.
  - Use multiple fallback strategies to improve retrieval success when direct queries fail.
  - Present documents with proper citations to provide factual grounding for the conversation.
  - Maintain simple, direct integration with the Retrieval Agent focused on reliability.

- **Output:** A set of refined ideas and contextual insights that feed into the drafting process, with clear connections to relevant governance documents and a deeper understanding of the user's implicit knowledge.

### 3. Drafting Agent (Including Iterative Critique)
**Role:**  
Generate a well-structured, DAO-compliant governance proposal by integrating inputs from the Retrieval and Interviewing Agents, while also incorporating iterative feedback.

**Functionality:**  
- **Input:**  
  - The retrieved documents from the Retrieval Agent.
  - The user's responses from the Interviewing Agent.
- **Process:**  
  - Map inputs to a predefined DAO governance template.
  - Generate a draft proposal and iteratively refine it based on simulated critique.
  - Incorporate automated checks for compliance with governance standards and logical consistency.
- **Output:** A structured, well-formatted draft proposal complete with citations and a log of iterative improvements.

---

## 5. Implementation Approach

**Philosophy:**  
Build for speed and learning, not premature scaling. The implementation will prioritize delivering core value quickly, embracing selective technical debt where it makes sense, and using the simplest viable solutions.

**Key Principles:**
- Implement one valuable feature at a time
- Leverage existing code wherever possible
- Avoid speculative architecture
- Prioritize features that deliver direct user value
- Test with real users early and often

**Integration Strategy:**
- Use direct API calls between components
- Leverage existing provider abstractions rather than creating new ones
- Keep the system monolithic initially for simplicity and speed
- Avoid implementing complex state management until necessary

### MVP Philosophy: Start Simple, Get Working

The implementation will follow a strict MVP approach:

- **Remove Complexity:** Intentionally remove features that add complexity but don't provide immediate core value
- **Focus on Reliability:** Ensure basic functionality works reliably before adding sophisticated features
- **Direct Integration:** Use straightforward, direct integration between components
- **Visible Logging:** Implement detailed logging to provide visibility into system behavior
- **Empirical Evolution:** Add complexity only after real-world testing proves it's necessary
- **Fallback Strategies:** Implement simple fallback mechanisms for when primary approaches fail
- **User-Driven:** Let actual user feedback drive feature prioritization

This approach prioritizes getting a working system that delivers value quickly, rather than a sophisticated system that takes longer to develop and debug. Features like knowledge gap identification will be considered for future versions after the core functionality is proven.

---

## 6. Implementation Strategy: Enhance & Extend

### Enhance What Works:

1. **Frontend (Vue.js):**
   - Improve the existing `ChatInterface.vue` component by extracting reusable parts
   - Use Vue's basic reactivity system for state management (avoid adding Vuex/Pinia complexity)
   - Add new UI panels as simple components while maintaining the overall app structure
   - Leverage existing styling and UX patterns for consistency

2. **Backend (Node.js):**
   - Extend the existing provider framework (maintain the `LLMProviderFactory` pattern)
   - Refactor `chatbot.js` into logical modules without changing the overall architecture
   - Improve error handling and logging throughout
   - Maintain the existing API structure while adding new endpoints

3. **General Improvements:**
   - Focus testing on critical user paths rather than comprehensive coverage
   - Apply ESLint/Prettier to ensure code consistency
   - Document key interfaces and architectural decisions

### Build New Capabilities:

1. **Vector Search Implementation:**
   - Implement vector search directly in Node.js initially (possibly using third-party services)
   - Add a VectorProvider that follows the same patterns as existing providers

2. **Agent Capabilities:**
   - Build agent capabilities sequentially, starting with the Retrieval Agent
   - Implement each agent as a provider extension that follows existing patterns
   - Add specialized prompts and processing logic for each agent type
   - Integrate agents directly into the existing backend before separating them

3. **Deployment Approach:**
   - Start with a simple deployment model (single-service)
   - Use environment variables for configuration
   - Add monitoring for critical paths
   - Consider serverless options for simplicity initially

---

## 7. Implementation Roadmap

### Phase 1: Foundation & First Agent
- **Frontend:**  
  - Extract logical components from `ChatInterface.vue`
  - Add a simple Research Results panel
  - Implement minimalist UI for retrieval results with basic citation display
- **Backend:**  
  - Extract logical modules from `chatbot.js`
  - Set up vector embeddings and storage
  - Implement the Retrieval Agent capability with basic error handling and caching
- **Testing:**  
  - Add tests for the critical retrieval functionality
  - Manual testing of UI components
  - Include user validation methods for core functionality

### Phase 2: Research & Analysis
- **Backend:**
  - Implement the simplified Interviewing Agent capability
  - Connect the Retrieval Agent to the vector database
  - Focus on direct document retrieval without complex knowledge gap analysis
- **Frontend:**
  - Add research visualization components
  - Implement UI for navigating research reports
  - Create a simple mode toggle for Interview mode

### Phase 3: Interactive Interview & Drafting
- **Backend:**
  - Optimize the Interviewing Agent based on user feedback
  - Create the Drafting Agent
  - Add proposal templates and validation
- **Frontend:**
  - Create a basic interviewing interface with clear mode indication
  - Build a drafting workspace UI
  - Add basic document reference display
- **User Testing:**
  - Conduct targeted user testing on the simplified implementation
  - Gather feedback on the direct retrieval approach
  - Iterate based on real user needs rather than complex assumptions

### Phase 4: Optimization & Scaling (If Needed)
- Extract high-load components to separate services if performance indicates it's necessary
- Implement containerization if multiple services are required
- Add automated scaling and monitoring
- Enhance the test suite based on actual usage patterns

---

## 8. Refined Project Structure

While maintaining the existing structure, we'll organize new code in a logical way:

```
SIP-Assistant/
├── src/                  # All source code
│   ├── components/       # Vue components (modular, focused)
│   │   ├── base.js       # Base provider definition
│   │   ├── factory.js    # Factory pattern (extended)
│   │   ├── agents/       # Agent-specific provider implementations
│   ├── services/         # Extracted business logic
│   │   ├── chat.js       # Chat handling
│   │   ├── scraper.js    # Forum scraping
│   │   ├── vector.js     # Vector operations
│   ├── utils/            # Shared utilities
│   ├── chatbot.js        # Main application entry point (refactored)
├── tests/                # Focused tests for critical paths
├── docs/                 # Documentation
└── public/               # Static assets
```

### Data Flow Overview
1. **User Interaction:**  
   - The user interacts with the chat UI in the frontend.
2. **Backend Processing:**
   - The system routes requests to the appropriate provider/agent
   - Each agent performs its specialized function and returns results
3. **Response Flow:**
   - Results are displayed in the appropriate UI panel
   - The chat history maintains context between interactions

---

## 9. Core Functionality Overview

- **Automated Retrieval:**  
  Efficient, semantically driven extraction of governance-related data.
- **Contextual Research:**  
  Summarization and gap analysis of historical precedents.
- **Dialogical Interaction:**  
  An Interviewing Agent that actively extracts and develops user insights.
- **Proposal Drafting:**  
  Generation of structured, compliant governance proposals with built-in iterative refinement.
- **Seamless Integration:**  
  A cohesive system that ties together all functionality through a clean, simple architecture.

---

## 10. Conclusion

This detailed PRD outlines a practical roadmap for transforming the SIP-Assistant from its current minimal state to a powerful, multi-capability system that automates governance proposal drafting. By extending and enhancing the existing codebase in a thoughtful, incremental way, we'll create a valuable tool that delivers immediate benefits while establishing a foundation for future expansion.

The approach emphasizes building to learn, delivering value quickly, and avoiding premature optimization—principles that will help ensure the project's success while maintaining development momentum.

This document is intended to serve as both a strategic guide and a practical roadmap, fully integrable into your file structure for reference within development environments like Cursor.
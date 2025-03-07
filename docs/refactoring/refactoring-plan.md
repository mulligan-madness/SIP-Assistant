# SIP Assistant Refactoring Plan

## Overview

This document outlines the comprehensive plan for refactoring the SIP Assistant codebase to improve its architecture, maintainability, and adherence to established best practices. It serves as a living document to track progress across multiple development sessions.

## ⚠️ IMPORTANT: PROGRESS TRACKING INSTRUCTIONS ⚠️

**THESE INSTRUCTIONS MUST BE FOLLOWED BY ALL CONTRIBUTORS INCLUDING FUTURE CHAT SESSIONS:**

1. When a task is completed:
   - Change `[ ]` to `[x]` for the completed task
   - Add completion information in this exact format: `- [x] Task description - Completed by @username on YYYY-MM-DD`
   - Add any relevant notes indented below the task

2. When working on a task:
   - Mark it as in progress: `- [-] Task description - In progress by @username since YYYY-MM-DD` 

3. When updating this document:
   - Also update the "Last updated" date at the bottom of this file
   - Keep all formatting consistent with these guidelines
   - Never remove the progress tracking instructions

4. Example format:
   ```markdown
   - [x] Completed task - Completed by @username on YYYY-MM-DD
       - Note: Additional implementation details here
   - [-] Task in progress - In progress by @username since YYYY-MM-DD
   - [ ] Pending task
   ```

**EVERY CHAT SESSION MUST COMPLY WITH THESE TRACKING INSTRUCTIONS**

## Approach

We will follow a **code-first approach** to refactoring:

1. First, implement structural code changes
2. Then update tests to match the new structure
3. Use updated tests to validate refactored code

This approach is more efficient than fixing tests before refactoring code, as it prevents duplicated work and ensures tests target the final codebase structure.

## Current Status

- [x] **Phase 1: Test Infrastructure Consolidation** - Completed on 2024-03-06
  - [x] Remove empty test directory - Completed by @AI-Assistant on 2024-03-06
  - [x] Update package.json for Vitest - Completed by @AI-Assistant on 2024-03-06
  - [x] Configure vitest.config.js - Completed by @AI-Assistant on 2024-03-06
  - [x] Update documentation - Completed by @AI-Assistant on 2024-03-06

## Refactoring Tasks

### Phase 2: Directory Structure Reorganization

**Reference**: See [Code Organization Best Practices](../best-practices/code-organization.md)

- [x] Consolidate utility functions - Completed by @Claude on 2024-03-07
  - [x] Move duplicate utility functions to a central location - Completed by @Claude on 2024-03-07
      - Created centralized date.js, error.js, and common.js utility files
      - Added index.js to export all utilities from a single entry point
  - [x] Standardize error handling helpers - Completed by @Claude on 2024-03-07
      - Created AppError class and error type constants
      - Added helper functions for creating specific error types
      - Added global error handler middleware
  - [x] Update imports across the codebase - Completed by @Claude on 2024-03-07
      - Updated ResearchPanel.vue to use the new date utility
      - Updated chatbot.js to use the new error handling and date utilities

- [x] Reorganize provider directory - Completed by @Claude on 2024-03-07
  - [x] Ensure consistent interfaces for all providers - Completed by @Claude on 2024-03-07
      - Updated BaseLLMProvider with proper constructor and interface methods
      - Added better documentation and abstract class pattern
      - Added capability management methods
  - [x] Implement proper inheritance hierarchy - Completed by @Claude on 2024-03-07
      - Updated OpenAI and Anthropic providers to follow consistent patterns
      - Improved error handling in providers using new error utilities
      - Enhanced BaseAgentProvider with better validation and delegation
  - [x] Add missing provider documentation - Completed by @Claude on 2024-03-07
      - Added JSDoc comments to all provider classes and methods
      - Improved factory classes with better documentation
      - Added parameter validation and type checking

- [x] Reorganize services - Completed by @Claude on 2024-03-07
  - [x] Clear separation of concerns between services - Completed by @Claude on 2024-03-07
      - Created BaseService abstract class for consistent service interfaces
      - Added standardized logging and error handling to services
      - Implemented proper inheritance for service classes
  - [x] Move business logic from chatbot.js to appropriate services - Completed by @Claude on 2024-03-07
      - Created ServerService to handle server initialization and management
      - Moved server initialization logic from chatbot.js to ServerService
      - Simplified chatbot.js to be a thin entry point
  - [x] Standardize error handling in services - Completed by @Claude on 2024-03-07
      - Updated StorageService to use standardized error handling
      - Updated ChatService to use standardized error handling
      - Updated VectorService to use standardized error handling

### Phase 3: Component Refactoring

**Reference**: See [Component Design Best Practices](../best-practices/component-design.md)

- [x] Break down large components - Completed by @Claude on 2024-03-07
  - [x] Identify components exceeding 300 lines - Completed by @Claude on 2024-03-07
      - Identified ResearchPanel.vue (743 lines), ChatInterface.vue (556 lines), and IndexingIndicator.vue (335 lines)
  - [x] Extract reusable sub-components - Completed by @Claude on 2024-03-07
      - Created SearchForm.vue, DocumentCard.vue, HelpSection.vue, StatusDisplay.vue, and PanelHeader.vue from ResearchPanel.vue
      - Reduced ResearchPanel.vue from 743 lines to approximately 362 lines
  - [x] Implement proper props validation - Completed by @Claude on 2024-03-07
      - Added JSDoc comments and prop validation to all new components
      - Enhanced validation in Message.vue, MessageList.vue, ThinkingIndicator.vue, MessageInput.vue, and ControlButtons.vue
      - Added proper event documentation with JSDoc comments

- [-] Improve component communication - In progress by @Claude since 2024-03-07
  - [x] Replace direct parent-child communication with proper events - Completed by @Claude on 2024-03-07
      - Implemented proper event documentation with JSDoc comments in all components
      - Added detailed event type information and property documentation
      - Standardized event naming across components
  - [x] Use composition for complex UI elements - Completed by @Claude on 2024-03-07
      - Created MessagesContainer component to encapsulate MessageList and ThinkingIndicator
      - Created ChatFooter component to encapsulate MessageInput and ControlButtons
      - Created ChatLayout component with named slots for flexible layout composition
      - Updated ChatInterface to use the new component composition structure
  - [x] Standardize event naming - Completed by @Claude on 2024-03-07
      - Updated event names to follow consistent kebab-case naming convention
      - Standardized event names across components (e.g., toggle-panel, reference-document)
      - Replaced direct $emit calls with handler methods for better maintainability
      - Updated all affected components to use the new event names

- [x] Complete component refactoring - Completed by @Claude on 2024-03-07
  - [x] Break down IndexingIndicator.vue into smaller components - Completed by @Claude on 2024-03-07
      - Created StatusBar.vue, LogViewer.vue, and ProgressDisplay.vue components
      - Reduced IndexingIndicator.vue from 361 lines to 142 lines
      - Improved component composition and separation of concerns
  - [x] Further reduce ChatInterface.vue size - Completed by @Claude on 2024-03-07
      - Extracted state management logic into useChatState.js composable
      - Moved API communication logic to ChatApiService service
      - Created useUIUtils.js for UI utility functions
      - Created useChat.js composable to combine state and API logic
      - Reduced ChatInterface.vue from 524 lines to 98 lines
  - [x] Ensure all components follow Single Responsibility Principle - Completed by @Claude on 2024-03-07
      - Reviewed all components for adherence to SRP
      - Refactored DataManagementSettings.vue to separate concerns
      - Created ForumScraper.vue and ContextGenerator.vue components
      - Improved component organization and maintainability

### Phase 4: Backend Architecture Improvements

**Reference**: See [Backend Architecture Best Practices](../best-practices/backend-architecture.md)

- [ ] Implement service-oriented architecture
  - [ ] Define clear service interfaces
  - [ ] Implement dependency injection
  - [ ] Remove circular dependencies

- [ ] Standardize API design
  - [ ] Ensure RESTful endpoint consistency
  - [ ] Implement proper validation middleware
  - [ ] Standardize error responses

- [ ] Improve error handling
  - [ ] Implement global error handler
  - [ ] Add structured logging
  - [ ] Add request tracking

- [ ] Fix chat interface message display issues
  - [ ] Diagnose why user messages don't display in the chat interface
  - [ ] Fix loading indicators not appearing during message processing
  - [ ] Resolve system response display issues
  - [ ] Implement proper error handling for API communication failures
  - [ ] Add comprehensive logging for message flow debugging
  - [ ] Refactor the bloated API service (1100+ lines) to improve maintainability

### Phase 5: Test Updates and Expansion

**Reference**: See [Testing Best Practices](../best-practices/testing.md)

- [ ] Fix import paths in existing tests
  - [ ] Update all test imports to match new structure
  - [ ] Fix failing tests

- [ ] Expand test coverage
  - [ ] Add missing unit tests
  - [ ] Add integration tests for critical paths
  - [ ] Ensure 80%+ code coverage

- [ ] Improve test organization
  - [ ] Audit all existing tests, ensure their relevance to desired behavior and business logic, and remove unnecessary tests
  - [ ] Ensure tests mirror source code structure
  - [ ] Standardize test naming conventions
  - [ ] Add proper test documentation

## Implementation Guidelines

When implementing these refactoring tasks:

1. **Make incremental changes**: Small, focused PRs are easier to review
2. **Maintain backward compatibility**: Ensure existing functionality continues to work
3. **Follow best practices**: Reference the docs/best-practices guides
4. **Document decisions**: Add comments for non-obvious implementation choices
5. **Update documentation**: Keep docs in sync with code changes

## Next Steps

Phase 3: Component Refactoring is now complete. We have successfully:
1. Broken down large components into smaller, more focused components
2. Implemented proper props validation with JSDoc comments
3. Improved component communication with proper events
4. Used composition for complex UI elements
5. Standardized event naming across the application

### Phase 3 Post-Implementation Issues

During user testing after Phase 3, we encountered and fixed the following issues:

- [x] Fixed OpenAI API key loading issue - Completed by @Claude on 2024-03-08
    - Added proper environment variable loading order in chatbot.js
    - Added debug logging for environment variable status
    - Ensured dotenv is loaded before any service imports
    - Added validation and error handling for missing API keys

- [x] Fixed Storage service usage in API service - Completed by @Claude on 2024-03-08
    - Updated import to use the correct class name: `const { StorageService } = require('./storage')`
    - Fixed static method calls to use instance methods instead
    - Created proper StorageService instances before calling methods
    - Ensured consistent usage of the StorageService across the API service

- [x] Fixed VectorService method calls in API service - Completed by @Claude on 2024-03-08
    - Updated incorrect method call from `clearForumData()` to `clear()`
    - Updated incorrect method call from `addForumPost()` to `addDocument()`
    - Properly formatted document metadata when adding to vector store
    - Ensured proper method names are used when calling VectorService methods
    - Verified that the VectorService API is used correctly throughout the application

- [x] Disabled chat history persistence in localStorage - Completed by @Claude on 2024-03-08
    - Modified useChatState.js to prevent saving chat history to localStorage
    - Ensured chat history is cleared on page refresh for better privacy
    - Maintained the API interface to avoid breaking changes
    - Updated documentation to reflect the intentional removal of persistence

- [x] Implemented persistent vector storage - Completed by @Claude on 2024-03-08
    - Updated VectorService to properly save vectors to disk using StorageService
    - Implemented proper loading of vectors from storage on application startup
    - Eliminated the need to re-index forum data on each page refresh
    - Improved user experience by preserving vector embeddings between sessions
    - Added better error handling and logging for vector storage operations

- [x] Added missing logging methods to ApiService - Completed by @Claude on 2024-03-08
    - Added log() and logError() methods to the ApiService class
    - Fixed TypeError when calling non-existent logError method
    - Ensured consistent logging format across all services
    - Improved error handling and debugging capabilities

- [x] Fixed vector storage serialization issue - Completed by @Claude on 2024-03-08
    - Added proper JSON serialization when saving vector data to storage
    - Fixed TypeError caused by trying to write JavaScript objects directly to files
    - Implemented proper JSON parsing when loading vector data from storage
    - Improved error handling for serialization/deserialization operations
    - Ensured vector data persistence works correctly across application restarts

- [x] Fixed automatic forum data indexing after scrape - Completed by @Claude on 2024-03-08
    - Replaced call to non-existent reindexForumData method with direct implementation
    - Reused existing indexing logic from the index-forum-data endpoint
    - Implemented batch processing to handle large numbers of forum posts
    - Added proper error handling and progress tracking
    - Ensured vector store is properly updated after forum data scraping

- [x] Fixed forum post field mapping for indexing - Completed by @Claude on 2024-03-08
    - Updated API service to correctly map between scraper field format (t, c, d) and expected format (title, content)
    - Fixed issue where all posts were being skipped during indexing due to field name mismatch
    - Improved error handling and logging for post processing
    - Added support for both field naming conventions to ensure compatibility
    - Ensured forum posts are properly indexed in the vector store

The next phase is Phase 4: Backend Architecture Improvements, which will focus on:
1. Implementing service-oriented architecture
2. Standardizing API design
3. Improving error handling
4. Fixing chat interface message display issues

---

*Last updated: 2024-03-09* 
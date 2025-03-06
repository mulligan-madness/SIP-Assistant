# Agent Prompts Directory

This directory contains prompt templates and utilities for formatting content used by different agent providers.

## File Naming Convention

Files in this directory follow the naming convention `<agentType>PromptTemplates.js` to clearly indicate:
1. Which agent they belong to
2. That they contain prompt templates, not agent implementations

## Current Files

- `interviewPromptTemplates.js` - Contains templates and utilities for the Interview Agent
  - Core system prompt for Socratic questioning
  - Document formatting utilities
  - Functions to combine prompts with retrieved documents

## Usage

These templates are imported by the corresponding agent provider implementations (e.g., `interviewAgentProvider.js`) and used to construct the prompts sent to language models.

## Best Practices

- Keep prompt templates separate from agent implementation logic
- Use clear naming to avoid confusion
- Include both the primary function and any helper utilities in the same file
- Maintain backward compatibility exports for existing code 
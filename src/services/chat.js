const axios = require('axios');
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { BaseService } = require('./base');
const { LLMProviderFactory } = require('../providers/factory');
const { storage } = require('./storage');
const { createLLMProviderError, createNetworkError } = require('../utils');

/**
 * Chat service for handling conversations with LLM providers
 * @extends BaseService
 */
class ChatService extends BaseService {
  /**
   * Create a new chat service
   * @param {Object} config - Service configuration
   */
  constructor(config = {}) {
    super(config);
    
    this.name = 'chat';
    this.chatHistory = {};
    this.maxHistoryLength = config.maxHistoryLength || 20;
    this.maxContextLength = config.maxContextLength || 8000;
    
    this.log('Chat service initialized');
  }

  /**
   * Process a chat message and generate a response
   * @param {string} message - The user message
   * @param {string} sessionId - The session ID
   * @param {string} compressedContext - The compressed context
   * @param {Array} sipData - The SIP data
   * @param {Array} messageHistory - The message history from the frontend
   * @returns {Promise<string>} - The LLM response
   */
  async processMessage(message, sessionId, compressedContext, sipData, messageHistory = null) {
    try {
      this.log(`Processing message for session ${sessionId}: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`);
      
      // Initialize chat history for this session if it doesn't exist
      if (!this.chatHistory[sessionId]) {
        this.chatHistory[sessionId] = [];
        this.log(`Initialized new chat history for session ${sessionId}`);
      }
      
      // If message history is provided from the frontend, use it to sync the server-side history
      if (messageHistory && Array.isArray(messageHistory)) {
        this.log(`Received message history from frontend with ${messageHistory.length} messages`);
        
        // Only update the chat history if the incoming history is longer
        // This prevents losing context if multiple clients are active
        if (messageHistory.length > this.chatHistory[sessionId].length) {
          this.log(`Using frontend message history (${messageHistory.length} messages) instead of server history (${this.chatHistory[sessionId].length} messages)`);
          this.chatHistory[sessionId] = messageHistory;
        } else {
          this.log(`Keeping server message history (${this.chatHistory[sessionId].length} messages) as it's longer than frontend history (${messageHistory.length} messages)`);
          
          // Add the latest user message if it's not already in the history
          const latestUserMessage = messageHistory[messageHistory.length - 1];
          if (latestUserMessage && latestUserMessage.role === 'user') {
            const existingMessage = this.chatHistory[sessionId].find(
              m => m.role === 'user' && m.content === latestUserMessage.content
            );
            
            if (!existingMessage) {
              this.chatHistory[sessionId].push(latestUserMessage);
              this.log(`Added latest user message to existing server history`);
            }
          }
        }
      } else {
        // If no message history is provided, add the user message to the existing history
        this.chatHistory[sessionId].push({
          role: 'user',
          content: message
        });
        this.log(`Added user message to history. History length: ${this.chatHistory[sessionId].length}`);
      }
      
      // Prepare the messages array for the LLM
      const messages = this.prepareMessagesForLLM(sessionId, compressedContext, sipData);
      this.log(`Prepared messages for LLM. Total messages: ${messages.length}`);
      
      // Get response from LLM
      if (!global.llmProvider) {
        throw createLLMProviderError('LLM provider not initialized', 'unknown');
      }
      
      this.log(`Sending request to LLM provider: ${global.llmProvider.getProviderName()}`);
      const llmResponse = await global.llmProvider.chat(messages);
      this.log(`Received response from LLM: "${llmResponse.substring(0, 50)}${llmResponse.length > 50 ? '...' : ''}"`);
      
      // Add assistant response to history
      this.chatHistory[sessionId].push({
        role: 'assistant',
        content: llmResponse
      });
      this.log(`Added assistant response to history. History length: ${this.chatHistory[sessionId].length}`);
      
      // Trim history if it gets too long
      this.trimChatHistory(sessionId);
      
      return llmResponse;
    } catch (error) {
      this.logError('Error processing message', error);
      
      if (error.name === 'AppError') {
        // If it's already an AppError, rethrow it
        throw error;
      }
      
      // Check if it's a network error
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
        throw createNetworkError(`Chat service network error: ${error.message}`, error);
      }
      
      // Otherwise, wrap it in an LLM provider error
      throw createLLMProviderError(
        `Error processing message: ${error.message}`,
        global.llmProvider ? global.llmProvider.getProviderName() : 'unknown',
        error
      );
    }
  }
  
  /**
   * Prepare messages array for the LLM, including system context
   * @param {string} sessionId - The session ID
   * @param {string} compressedContext - The compressed context
   * @param {Array} sipData - The SIP data
   * @returns {Array} - The messages array for the LLM
   */
  prepareMessagesForLLM(sessionId, compressedContext, sipData) {
    const systemPrompt = this.generateSystemPrompt(compressedContext, sipData);
    
    return [
      { role: 'system', content: systemPrompt },
      ...this.chatHistory[sessionId]
    ];
  }
  
  /**
   * Generate the system prompt with context
   * @param {string} compressedContext - The compressed context
   * @param {Array} sipData - The SIP data
   * @returns {string} - The system prompt
   */
  generateSystemPrompt(compressedContext, sipData) {
    let prompt = `You are SIP-Assistant, an AI designed to help with SuperRare Improvement Proposals (SIPs).
Your goal is to assist users in drafting, understanding, and improving governance proposals.
Be helpful, informative, and concise. If you don't know something, say so rather than making up information.
Today's date is ${new Date().toISOString().split('T')[0]}.

You have access to the following information:`;

    // Add compressed context if available
    if (compressedContext) {
      prompt += `\n\n## COMPRESSED CONTEXT\n${compressedContext}`;
    }

    // Add SIP data summary if available
    if (sipData && sipData.length > 0) {
      const sipCount = sipData.length;
      const recentSips = sipData.slice(-3).map(post => post.title || 'Untitled SIP').join(', ');
      
      prompt += `\n\n## SIP DATA SUMMARY
You have access to ${sipCount} SIPs from the SuperRare governance forum.
Recent SIPs include: ${recentSips}`;
    }

    return prompt;
  }
  
  /**
   * Trim chat history if it gets too long
   * @param {string} sessionId - The session ID
   */
  trimChatHistory(sessionId) {
    if (!this.chatHistory[sessionId]) return;
    
    if (this.chatHistory[sessionId].length > this.maxHistoryLength) {
      // Keep the most recent messages, but always keep the first system message if present
      const systemMessage = this.chatHistory[sessionId].find(m => m.role === 'system');
      let trimmedHistory = this.chatHistory[sessionId].slice(-this.maxHistoryLength);
      
      // If there was a system message and it's not in the trimmed history, add it back
      if (systemMessage && !trimmedHistory.find(m => m.role === 'system')) {
        trimmedHistory = [systemMessage, ...trimmedHistory.slice(1)];
      }
      
      this.chatHistory[sessionId] = trimmedHistory;
      this.log(`Trimmed chat history to ${this.chatHistory[sessionId].length} messages`);
    }
  }
  
  /**
   * Get chat history for a session
   * @param {string} sessionId - The session ID
   * @returns {Array} - The chat history
   */
  getChatHistory(sessionId) {
    return this.chatHistory[sessionId] || [];
  }
  
  /**
   * Clear chat history for a session
   * @param {string} sessionId - The session ID
   */
  clearChatHistory(sessionId) {
    if (this.chatHistory[sessionId]) {
      this.chatHistory[sessionId] = [];
      this.log(`Cleared chat history for session ${sessionId}`);
    }
  }
  
  /**
   * Compress SIP data with LLM
   * @param {Array} sipData - The SIP data to compress
   * @returns {Promise<string>} - The compressed context
   */
  async compressSIPDataWithLLM(sipData) {
    try {
      this.log(`Compressing ${sipData.length} SIP posts with LLM`);
      
      if (!global.llmProvider) {
        throw createLLMProviderError('LLM provider not initialized', 'unknown');
      }
      
      // Prepare the SIP data for compression
      const sipDataText = this.prepareSIPDataForCompression(sipData);
      
      // Create the compression prompt
      const prompt = `I need you to create a compressed summary of the following SuperRare Improvement Proposals (SIPs).
This summary will be used as context for future conversations, so include the most important information.
Focus on key governance concepts, proposal patterns, and important decisions.

Here are the SIPs to compress:

${sipDataText}

Create a concise but comprehensive summary that captures the essential information.
Format your response as markdown with appropriate headings and structure.
Do not include any preamble or conclusion - just the compressed summary itself.`;
      
      this.log('Sending compression request to LLM');
      const response = await global.llmProvider.complete(prompt);
      this.log(`Received compressed context (${response.length} chars)`);
      
      // Save the compressed context
      await storage.saveCompressedContext(response);
      this.log('Saved compressed context to storage');
      
      return response;
    } catch (error) {
      this.logError('Error compressing SIP data', error);
      
      if (error.name === 'AppError') {
        // If it's already an AppError, rethrow it
        throw error;
      }
      
      // Check if it's a network error
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
        throw createNetworkError(`Chat service network error: ${error.message}`, error);
      }
      
      // Otherwise, wrap it in an LLM provider error
      throw createLLMProviderError(
        `Error compressing SIP data: ${error.message}`,
        global.llmProvider ? global.llmProvider.getProviderName() : 'unknown',
        error
      );
    }
  }
  
  /**
   * Prepare SIP data for compression
   * @param {Array} sipData - The SIP data
   * @returns {string} - The prepared SIP data text
   */
  prepareSIPDataForCompression(sipData) {
    // Sort by date
    const sortedData = [...sipData].sort((a, b) => {
      return new Date(a.d || 0) - new Date(b.d || 0);
    });
    
    // Format each SIP
    const formattedSips = sortedData.map((post, index) => {
      const title = post.title || `Untitled SIP ${index + 1}`;
      const date = post.d ? new Date(post.d).toISOString().split('T')[0] : 'Unknown date';
      const author = post.u || 'Unknown author';
      
      // Truncate content if too long
      let content = post.c || '';
      if (content.length > 1000) {
        content = content.substring(0, 1000) + '... (truncated)';
      }
      
      return `## SIP: ${title}
Date: ${date}
Author: ${author}

${content}

---`;
    });
    
    return formattedSips.join('\n\n');
  }
}

// CLI chat functionality
class ChatCLI {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    this.chatService = new ChatService();
  }
  
  // Promisify readline question
  askQuestion(query) {
    return new Promise((resolve) => this.rl.question(query, resolve));
  }
  
  // Start the CLI chat
  async startChat() {
    console.log('\nSIP Assistant: Hello! I can help you write SIP proposals. What would you like to discuss?\n');
    
    // Create a recursive function to keep the conversation going
    const promptUser = async () => {
      const input = await this.askQuestion('You: ');
      
      if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
        console.log('\nSIP Assistant: Goodbye! Have a great day!\n');
        this.rl.close();
        return;
      }
      
      try {
        const response = await axios.post('http://localhost:3000/api/chat', {
          message: input,
          sessionId: 'cli-session'
        });
        
        if (!response.data || !response.data.response) {
          throw new Error('Invalid response format from server');
        }
        
        // Extract and display the assistant's message
        const assistantMessage = response.data.response;
        console.log('\nSIP Assistant:', assistantMessage, '\n');
        
        // Ask if user wants to save the conversation
        const saveResponse = await this.askQuestion('Would you like to save this response? (y/n): ');
        if (saveResponse.toLowerCase() === 'y') {
          const result = await this.chatService.saveChatToFile('cli-session');
          console.log(result.message);
        }
        console.log(); // Add newline after save prompt
        
      } catch (error) {
        const errorMessage = error.response?.data?.error || 'Could not connect to the chatbot server. Make sure it\'s running on port 3000.';
        console.log('\nError:', errorMessage, '\n');
      }
      
      // Continue the conversation
      promptUser();
    };
    
    promptUser();
  }
}

module.exports = { ChatService, ChatCLI }; 
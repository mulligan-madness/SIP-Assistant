import { ref, watch } from 'vue';
import { useChatState } from './useChatState';
import { useUIUtils } from './useUIUtils';
import { ChatApiService } from '../services/chatApi';

/**
 * Composable for chat functionality
 * @returns {Object} Chat functionality
 */
export function useChat() {
  // Get chat state and UI utilities
  const chatState = useChatState();
  const uiUtils = useUIUtils();
  
  // References
  const messagesContainer = ref(null);
  let thinkingInterval = null;
  
  // Initialize chat
  const initialize = async () => {
    // Load chat history
    chatState.loadHistory();
    
    // Check server status
    await checkServerStatus();
    
    // Watch for server initialization
    watch(chatState.serverInitialized, (initialized) => {
      if (initialized) {
        chatState.addMessage(
          '👋 Welcome to the SIP Chat Assistant! I can help you with:\n\n' +
          '- Understanding SuperRare Improvement Proposals (SIPs)\n' +
          '- Explaining specific SIP details and requirements\n' +
          '- Providing guidance on SIP formatting and structure\n\n' +
          'Feel free to ask any questions!'
        );
      }
    });
  };
  
  /**
   * Check server status
   */
  const checkServerStatus = async () => {
    try {
      const data = await ChatApiService.checkServerStatus();
      
      if (data.llmInitialized && data.contextCompressed) {
        chatState.serverInitialized.value = true;
        // Remove initialization message if it exists
        chatState.messages.value = chatState.messages.value.filter(m => 
          !m.content.includes('Starting up the SIP Chat Assistant') &&
          !m.content.includes('server is still initializing')
        );
      } else {
        // Server is still initializing
        setTimeout(checkServerStatus, 2000);
      }
    } catch (error) {
      console.error('Error checking server status:', error);
      setTimeout(checkServerStatus, 2000);
    } finally {
      chatState.initializationChecked.value = true;
    }
  };
  
  /**
   * Send a message to the chat
   * @param {string} messageText - Message text
   */
  const sendMessage = async (messageText) => {
    if (!chatState.serverInitialized.value) {
      chatState.addMessage('⏳ The server is still initializing. Please wait a moment and try again.');
      scrollToBottom();
      return;
    }

    // Add user message
    chatState.addMessage(messageText, 'user');
    scrollToBottom();
    
    // Start loading state
    chatState.isLoading.value = true;
    chatState.resetThinkingTime();
    thinkingInterval = setInterval(chatState.updateThinkingTime, 1000);

    try {
      // Send message to API
      const response = await ChatApiService.sendMessage(
        messageText,
        chatState.sessionId.value,
        chatState.messages.value,
        chatState.isInterviewMode.value
      );
      
      // Add bot response
      if (response.content && response.content.trim() !== '') {
        chatState.addMessage(response.content);
        scrollToBottom();
      } else {
        console.warn('Empty or invalid response content after processing');
        chatState.addMessage('The server returned an empty response. Please try again.');
        scrollToBottom();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      chatState.addMessage(`Error: ${error.message || 'Unknown error occurred'}`);
      scrollToBottom();
    } finally {
      chatState.isLoading.value = false;
      clearInterval(thinkingInterval);
    }
  };
  
  /**
   * Toggle chat mode between normal and interview
   */
  const toggleChatMode = async () => {
    const isInterview = chatState.toggleChatMode();
    scrollToBottom();
    
    // Clear the session if switching back to normal mode
    try {
      if (!isInterview) {
        await ChatApiService.clearInterviewSession(chatState.sessionId.value);
      }
    } catch (error) {
      console.error('Error toggling chat mode:', error);
    }
  };
  
  /**
   * Scroll to the bottom of the messages container
   */
  const scrollToBottom = () => {
    if (messagesContainer.value) {
      uiUtils.scrollToBottom(messagesContainer.value.$el);
    }
  };
  
  /**
   * Export chat history to a file
   */
  const exportHistory = () => {
    const historyText = chatState.messages.value
      .map(m => `${m.type.toUpperCase()}: ${m.content}`)
      .join('\n\n');
    
    uiUtils.exportToFile(historyText, 'chat-history.txt');
  };
  
  /**
   * Send a predefined message to enforce section headers
   */
  const enforceSectionHeaders = () => {
    sendMessage("Please redraft your response to only include the following sections: Title, Summary, Motivation, Specification, Benefits, Drawbacks, Implementation. Please do not include roadmaps or timelines, rather the specific administrative actions which would be necessary to execute immediately upon passage of the proposal.");
  };
  
  /**
   * Send a predefined message to request pretty text
   */
  const askForPrettyText = () => {
    sendMessage("Please provide your response as formatted markdown text.");
  };
  
  /**
   * Send a predefined message to request raw markdown
   */
  const askForMarkdown = () => {
    sendMessage("Please provide your response as raw markdown code.");
  };
  
  /**
   * Handle document reference from research panel
   * @param {Object} reference - Reference object
   */
  const handleReference = (reference) => {
    if (!reference || !reference.text) return;
    
    // Create a reference message to insert into the input
    const referenceText = `> ${reference.citation}\n\nPlease consider this information: "${reference.text.substring(0, 150)}${reference.text.length > 150 ? '...' : ''}"`;
    
    // Get the message input component and update its value
    const messageInput = document.querySelector('.message-input__textarea');
    if (messageInput) {
      messageInput.value = messageInput.value 
        ? `${messageInput.value}\n\n${referenceText}`
        : referenceText;
      
      // Focus the input
      messageInput.focus();
    }
  };
  
  return {
    // State from chatState
    ...chatState,
    
    // UI utilities
    renderMarkdown: uiUtils.renderMarkdown,
    
    // References
    messagesContainer,
    
    // Methods
    initialize,
    sendMessage,
    toggleChatMode,
    scrollToBottom,
    exportHistory,
    enforceSectionHeaders,
    askForPrettyText,
    askForMarkdown,
    handleReference
  };
} 
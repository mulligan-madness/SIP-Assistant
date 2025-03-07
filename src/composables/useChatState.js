import { ref, computed } from 'vue';

/**
 * Composable for managing chat state
 * @returns {Object} Chat state and methods
 */
export function useChatState() {
  // Chat messages
  const messages = ref([]);
  const sessionId = ref(Math.random().toString(36).substring(7));
  
  // UI state
  const isLoading = ref(false);
  const thinkingTime = ref('0:00');
  const showSettings = ref(false);
  const showResearch = ref(false);
  const isInterviewMode = ref(false);
  const serverInitialized = ref(false);
  const initializationChecked = ref(false);
  
  // Computed properties
  const isDevelopment = computed(() => process.env.NODE_ENV === 'development');
  
  /**
   * Add a message to the chat
   * @param {string} content - Message content
   * @param {string} type - Message type ('user', 'bot', or 'system')
   */
  const addMessage = (content, type = 'bot') => {
    messages.value.push({ type, content });
    
    // No longer saving to localStorage
    // Chat history will be cleared on page refresh
  };
  
  /**
   * Clear all messages
   */
  const clearMessages = () => {
    messages.value = [];
  };
  
  /**
   * Save chat history to localStorage
   * This method is now a no-op to prevent saving chat history
   */
  const saveHistory = () => {
    // Intentionally empty - we don't save chat history to localStorage anymore
    // This ensures chat history is cleared on page refresh
  };
  
  /**
   * Load chat history from localStorage
   * This method is now a no-op since we don't save chat history
   */
  const loadHistory = () => {
    // Intentionally empty - we don't load chat history from localStorage anymore
    // This ensures a fresh chat on each page load
  };
  
  /**
   * Update the thinking time display
   */
  const updateThinkingTime = () => {
    let seconds = parseInt(thinkingTime.value.split(':')[1]);
    let minutes = parseInt(thinkingTime.value.split(':')[0]);
    
    seconds++;
    if (seconds >= 60) {
      minutes++;
      seconds = 0;
    }
    
    thinkingTime.value = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  /**
   * Reset the thinking time
   */
  const resetThinkingTime = () => {
    thinkingTime.value = '0:00';
  };
  
  /**
   * Toggle settings visibility
   */
  const toggleSettings = () => {
    showSettings.value = !showSettings.value;
  };
  
  /**
   * Toggle research panel visibility
   */
  const toggleResearch = () => {
    showResearch.value = !showResearch.value;
    return showResearch.value;
  };
  
  /**
   * Toggle chat mode between normal and interview
   */
  const toggleChatMode = () => {
    isInterviewMode.value = !isInterviewMode.value;
    
    // Add an indicator message
    addMessage(
      isInterviewMode.value 
        ? '🔄 Switched to Interview Mode: I\'ll ask Socratic questions to help you explore your ideas.'
        : '🔄 Switched to Chat Mode: I\'ll provide direct answers and assistance.',
      'system'
    );
    
    return isInterviewMode.value;
  };
  
  return {
    // State
    messages,
    sessionId,
    isLoading,
    thinkingTime,
    showSettings,
    showResearch,
    isInterviewMode,
    serverInitialized,
    initializationChecked,
    isDevelopment,
    
    // Methods
    addMessage,
    clearMessages,
    saveHistory,
    loadHistory,
    updateThinkingTime,
    resetThinkingTime,
    toggleSettings,
    toggleResearch,
    toggleChatMode
  };
} 
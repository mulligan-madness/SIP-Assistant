<template>
  <div class="chat">
    <div class="chat__header">
      <h1 class="chat__title">SIP Chat Assistant</h1>
      <button 
        class="chat__settings-button"
        @click="toggleSettings"
        aria-label="Settings"
      >
        <svg class="chat__settings-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
        <span v-if="isDevelopment" class="chat__debug-label">
          Settings ({{ showSettings ? 'Open' : 'Closed' }})
        </span>
      </button>
    </div>

    <div class="chat__messages" ref="messagesContainer">
      <div v-for="(message, index) in messages" 
           :key="index" 
           :class="['chat__message', `chat__message--${message.type}`]"
           v-html="message.type === 'bot' ? renderMarkdown(message.content) : message.content">
      </div>
      <div v-if="isLoading" class="chat__message chat__message--thinking">
        <span>Thinking</span>
        <div class="chat__thinking-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <span class="chat__thinking-timer">{{ thinkingTime }}</span>
      </div>
    </div>
    
    <div class="chat__input-area">
      <textarea 
        v-model="inputMessage"
        class="chat__input"
        placeholder="Ask about SuperRare Improvement Proposals..."
        @keydown.enter.prevent="handleEnter"
        ref="inputField"
        rows="1"
      ></textarea>
      <button 
        class="chat__send-button"
        @click="sendMessage" 
        :disabled="isLoading || !inputMessage.trim()"
      >
        Send
      </button>
    </div>
    
    <div class="chat__controls">
      <button class="chat__control-button" @click="exportHistory">
        Export Chat History
      </button>
      <button class="chat__control-button" @click="enforceSectionHeaders">
        Enforce Section Headers
      </button>
      <button class="chat__control-button" @click="askForPrettyText">
        Ask for Pretty Text
      </button>
      <button class="chat__control-button" @click="askForMarkdown">
        Ask for Markdown
      </button>
    </div>

    <Transition name="fade">
      <SettingsModal 
        v-if="showSettings"
        :show="showSettings"
        @close="handleSettingsClose"
      />
    </Transition>
  </div>
</template>

<script>
import { ref, onMounted, watch, computed } from 'vue'
import { marked } from 'marked'
import Prism from 'prismjs'
import SettingsModal from './SettingsModal.vue'

export default {
  name: 'ChatInterface',
  components: {
    SettingsModal
  },
  setup() {
    const isDevelopment = computed(() => process.env.NODE_ENV === 'development')
    
    if (isDevelopment.value) {
      console.log('ChatInterface setup starting')
    }

    // State management
    const messages = ref([])
    const inputMessage = ref('')
    const isLoading = ref(false)
    const thinkingTime = ref('0:00')
    const messagesContainer = ref(null)
    const inputField = ref(null)
    const showSettings = ref(false)
    const serverInitialized = ref(false)
    const initializationChecked = ref(false)
    let thinkingInterval = null
    const sessionId = ref(Math.random().toString(36).substring(7))

    // State change handlers
    const toggleSettings = () => {
      if (isDevelopment.value) {
        console.log('Toggle settings called, current value:', showSettings.value)
      }
      showSettings.value = !showSettings.value
    }

    const handleSettingsClose = () => {
      if (isDevelopment.value) {
        console.log('Settings modal closing')
      }
      showSettings.value = false
    }

    // Watchers
    watch(showSettings, (newValue) => {
      if (isDevelopment.value) {
        console.log('showSettings changed to:', newValue)
      }
    })

    watch(messages, () => {
      scrollToBottom()
    }, { deep: true })

    watch(serverInitialized, (initialized) => {
      if (initialized) {
        messages.value.push({
          type: 'bot',
          content: '👋 Welcome to the SIP Chat Assistant! I can help you with:\n\n' +
                  '- Understanding SuperRare Improvement Proposals (SIPs)\n' +
                  '- Explaining specific SIP details and requirements\n' +
                  '- Providing guidance on SIP formatting and structure\n\n' +
                  'Feel free to ask any questions!'
        })
      }
    })

    // Lifecycle hooks
    onMounted(() => {
      if (isDevelopment.value) {
        console.log('ChatInterface mounted')
      }
      if (inputField.value) {
        inputField.value.focus()
      }
      checkServerStatus()
    })

    // Function to check server status
    const checkServerStatus = async () => {
      try {
        const base = (window.location.origin && window.location.origin !== 'null') ? window.location.origin : 'http://localhost';
        const response = await fetch(base + '/api/status');
        const data = await response.json();
        
        if (data.llmInitialized && data.contextCompressed) {
          serverInitialized.value = true;
          // Remove initialization message if it exists
          messages.value = messages.value.filter(m => 
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
        initializationChecked.value = true;
      }
    };

    const renderMarkdown = (content) => {
      const rendered = marked(content, { breaks: true })
      setTimeout(() => {
        Prism.highlightAll()
      }, 0)
      return rendered
    }

    const updateThinkingTime = () => {
      let seconds = parseInt(thinkingTime.value.split(':')[1])
      let minutes = parseInt(thinkingTime.value.split(':')[0])
      
      seconds++
      if (seconds >= 60) {
        minutes++
        seconds = 0
      }
      
      thinkingTime.value = `${minutes}:${seconds.toString().padStart(2, '0')}`
    }

    const scrollToBottom = () => {
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
      }
    }

    const sendMessage = async () => {
      if (!inputMessage.value.trim() || isLoading.value) return;
      if (!serverInitialized.value) {
        messages.value.push({ 
          type: 'bot', 
          content: '⏳ The server is still initializing. Please wait a moment and try again.'
        });
        scrollToBottom();
        return;
      }

      const userMessage = inputMessage.value.trim();
      messages.value.push({ type: 'user', content: userMessage });
      inputMessage.value = ''; // Clear input immediately after pushing message
      scrollToBottom();
      
      isLoading.value = true;
      thinkingTime.value = '0:00';
      thinkingInterval = setInterval(updateThinkingTime, 1000);

      try {
        const response = await fetch('/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            message: userMessage,
            sessionId: sessionId.value
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.userMessage || errorData.error || 'Network response was not ok');
        }
        
        const data = await response.json();
        messages.value.push({ type: 'bot', content: data.response });
        scrollToBottom();

        // Save to localStorage
        const history = {
          messages: messages.value,
          sessionId: sessionId.value,
          timestamp: new Date().toISOString()
        };
        localStorage.setItem('chatHistory', JSON.stringify(history));
      } catch (error) {
        console.error('Chat error:', error);
        messages.value.push({ 
          type: 'bot', 
          content: '❌ Error: ' + (error.message || 'Something went wrong. Please try again.')
        });
        scrollToBottom();
      } finally {
        isLoading.value = false;
        clearInterval(thinkingInterval);
      }
    };

    const handleEnter = (e) => {
      if (e.shiftKey) return;
      e.preventDefault(); // Prevent newline
      sendMessage();
    };

    const exportHistory = () => {
      const historyText = messages.value
        .map(m => `${m.type.toUpperCase()}: ${m.content}`)
        .join('\n\n')
      
      const blob = new Blob([historyText], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'chat-history.txt'
      a.click()
      URL.revokeObjectURL(url)
    }

    const enforceSectionHeaders = () => {
      inputMessage.value = "Please redraft your response to only include the following sections: Title, Summary, Motivation, Specification, Benefits, Drawbacks, Implementation. Please do not include roadmaps or timelines, rather the specific administrative actions which would be necessary to execute immediately upon passage of the proposal."
      sendMessage()
    }

    const askForPrettyText = () => {
      inputMessage.value = "Please provide your response as formatted markdown text."
      sendMessage()
    }

    const askForMarkdown = () => {
      inputMessage.value = "Please provide your response as raw markdown code."
      sendMessage()
    }

    return {
      messages,
      inputMessage,
      isLoading,
      thinkingTime,
      messagesContainer,
      inputField,
      showSettings,
      serverInitialized,
      initializationChecked,
      isDevelopment,
      toggleSettings,
      handleSettingsClose,
      sendMessage,
      handleEnter,
      exportHistory,
      enforceSectionHeaders,
      askForPrettyText,
      askForMarkdown,
      renderMarkdown
    }
  }
}
</script>

<style scoped>
/* Base component */
.chat {
  max-width: 800px;
  margin: 0 auto;
  background: var(--surface-color);
  border-radius: 8px;
  box-shadow: 0 2px 4px var(--shadow-color);
  padding: 20px;
  height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

/* Header section */
.chat__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 0 10px;
  position: relative;
}

.chat__title {
  margin: 0;
  font-size: 1.8rem;
  color: var(--text-color);
}

.chat__settings-button {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 8px;
  background: var(--button-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  z-index: 100;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px var(--button-shadow);
}

.chat__settings-button:hover {
  transform: rotate(30deg);
  background: var(--button-secondary-hover);
  box-shadow: 0 2px 4px var(--button-shadow);
}

.chat__settings-icon {
  width: 24px;
  height: 24px;
  color: var(--text-color);
}

.chat__debug-label {
  position: absolute;
  top: -20px;
  right: 0;
  background: yellow;
  color: red;
  font-size: 12px;
  padding: 2px 4px;
  border-radius: 4px;
  font-weight: bold;
}

/* Messages section */
.chat__messages {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  margin-bottom: 20px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  min-height: 0;
}

.chat__message {
  max-width: 70%;
  margin: 10px 0;
  padding: 12px;
  border-radius: 8px;
  line-height: 1.4;
}

.chat__message--user {
  background: var(--primary-color);
  color: white;
  margin-left: auto;
  margin-right: 0;
}

.chat__message--bot {
  background: var(--surface-color);
  color: var(--text-color);
  margin-right: auto;
  margin-left: 0;
}

.chat__message--thinking {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text-secondary);
}

/* Input area */
.chat__input-area {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  width: 100%;
  align-items: flex-start;
}

.chat__input {
  flex: 1;
  padding: 10px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 16px;
  font-family: inherit;
  resize: none;
  min-height: 40px;
  max-height: 200px;
  overflow-y: auto;
  line-height: 1.4;
  margin: 0;
  background: #2c2c2e;
  color: var(--text-color);
}

.chat__send-button {
  height: 44px;
  min-width: 100px;
  background: var(--button-primary);
  color: var(--button-text-primary);
  border: none;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px var(--button-shadow);
}

.chat__send-button:hover:not(:disabled) {
  background: var(--button-primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 3px 6px var(--button-shadow);
}

.chat__send-button:disabled {
  background: var(--button-disabled);
  color: var(--button-text-secondary);
  box-shadow: none;
  cursor: not-allowed;
}

/* Controls section */
.chat__controls {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  width: 100%;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

.chat__control-button {
  flex: 1;
  min-width: 180px;
  height: 44px;
  padding: 8px 16px;
  background: var(--button-secondary);
  color: var(--button-text-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  white-space: nowrap;
  box-shadow: 0 1px 2px var(--button-shadow);
}

.chat__control-button:hover {
  background: var(--button-primary);
  color: var(--button-text-primary);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px var(--button-shadow);
}

/* Animations */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Responsive design */
@media (min-width: 768px) {
  .chat__controls {
    flex-wrap: nowrap;
  }
  
  .chat__control-button {
    min-width: 140px;
  }
}
</style> 
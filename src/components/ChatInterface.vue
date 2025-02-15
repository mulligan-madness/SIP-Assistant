<template>
  <div class="chat">
    <h1>SIP Chat Assistant</h1>
    <div class="messages" ref="messagesContainer">
      <div v-for="(message, index) in messages" :key="index" 
           :class="['message', message.type === 'user' ? 'user-message' : 'bot-message']"
           v-html="message.type === 'bot' ? renderMarkdown(message.content) : message.content">
      </div>
      <div v-if="isLoading" class="message bot-message thinking">
        <span>Thinking</span>
        <div class="thinking-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <span class="thinking-timer">{{ thinkingTime }}</span>
      </div>
    </div>
    
    <div class="input-area">
      <textarea 
        v-model="inputMessage"
        placeholder="Ask about SuperRare Improvement Proposals..."
        @keydown.enter.prevent="handleEnter"
        ref="inputField"
        rows="1"
      ></textarea>
      <button @click="sendMessage" :disabled="isLoading">Send</button>
    </div>
    
    <div class="chat-controls">
      <button @click="exportHistory">Export Chat History</button>
      <button @click="enforceSectionHeaders">Enforce Section Headers</button>
      <button @click="askForPrettyText">Ask for Pretty Text</button>
      <button @click="askForMarkdown">Ask for Markdown</button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue'
import { marked } from 'marked'
import Prism from 'prismjs'

export default {
  name: 'ChatInterface',
  setup() {
    const messages = ref([])
    const inputMessage = ref('')
    const isLoading = ref(false)
    const thinkingTime = ref('0:00')
    const messagesContainer = ref(null)
    const inputField = ref(null)
    let thinkingInterval = null
    const sessionId = ref(Math.random().toString(36).substring(7))

    // Add server status tracking
    const serverInitialized = ref(false)
    const initializationChecked = ref(false)

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
      inputMessage.value = "Please ensure your response includes clear section headers."
      sendMessage()
    }

    const askForPrettyText = () => {
      inputMessage.value = "Please format your response to be visually appealing and easy to read."
      sendMessage()
    }

    const askForMarkdown = () => {
      inputMessage.value = "Please provide your response in markdown format."
      sendMessage()
    }

    watch(messages, () => {
      scrollToBottom()
    }, { deep: true })

    onMounted(() => {
      if (inputField.value) {
        inputField.value.focus()
      }
      
      // Start checking server status
      checkServerStatus()
    })

    // Watch for server initialization
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

    return {
      messages,
      inputMessage,
      isLoading,
      thinkingTime,
      messagesContainer,
      inputField,
      sendMessage,
      handleEnter,
      renderMarkdown,
      exportHistory,
      enforceSectionHeaders,
      askForPrettyText,
      askForMarkdown,
      serverInitialized
    }
  }
}
</script>

<style scoped>
.chat {
  max-width: 800px;
  margin: 0 auto;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  padding: 20px;
  height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

h1 {
  margin-top: 0;
  margin-bottom: 20px;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  margin-bottom: 20px;
  border: 1px solid #eee;
  border-radius: 4px;
  min-height: 0;
}

.message {
  max-width: 70%;
  margin: 10px 0;
  padding: 12px;
  border-radius: 8px;
  line-height: 1.4;
}

.user-message {
  background: #1976d2;
  color: white;
  margin-left: auto;
  margin-right: 0;
}

.bot-message {
  background: #f5f5f5;
  color: #333;
  margin-right: auto;
  margin-left: 0;
}

.input-area {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  width: 100%;
  align-items: flex-start;
}

textarea {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  font-family: inherit;
  resize: none;
  min-height: 40px;
  max-height: 200px;
  overflow-y: auto;
  line-height: 1.4;
  margin: 0;
}

button {
  padding: 10px 20px;
  background: #1976d2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  white-space: nowrap;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

button:hover:not(:disabled) {
  background: #1565c0;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.thinking {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #666;
}

.thinking-dots {
  display: flex;
  gap: 4px;
}

.thinking-dots span {
  width: 8px;
  height: 8px;
  background: #1976d2;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out;
}

.thinking-dots span:nth-child(1) { animation-delay: -0.32s; }
.thinking-dots span:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

.thinking-timer {
  margin-left: 8px;
  font-family: monospace;
}

.chat-controls {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  width: 100%;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #eee;
}

.chat-controls button {
  flex: 1;
  min-width: 180px;
  height: 44px;
  padding: 8px 16px;
  background: #f8f9fa;
  color: #1976d2;
  border: 1px solid #1976d2;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  white-space: nowrap;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chat-controls button:hover:not(:disabled) {
  background: #1976d2;
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(25, 118, 210, 0.1);
}

.input-area button {
  height: 44px;
  min-width: 100px;
  background: #1976d2;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(25, 118, 210, 0.1);
}

.input-area button:hover:not(:disabled) {
  background: #1565c0;
  transform: translateY(-1px);
  box-shadow: 0 3px 6px rgba(21, 101, 192, 0.2);
}

.input-area button:disabled {
  background: #e0e0e0;
  color: #9e9e9e;
  box-shadow: none;
  cursor: not-allowed;
}

@media (min-width: 768px) {
  .chat-controls {
    flex-wrap: nowrap;
  }
  
  .chat-controls button {
    min-width: 140px;
  }
}

:deep(pre[class*="language-"]) {
  position: relative;
  border-radius: 6px;
  margin: 1em 0;
}

:deep(.copy-button) {
  position: absolute;
  top: 5px;
  right: 5px;
  padding: 4px 8px;
  font-size: 12px;
  background: #2d2d2d;
  border: 1px solid #444;
  border-radius: 4px;
  color: #fff;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
}

:deep(pre[class*="language-"]:hover .copy-button) {
  opacity: 1;
}

:deep(.copy-button:hover) {
  background: #444;
}

:deep(.copy-button.copied) {
  background: #4CAF50;
}
</style> 
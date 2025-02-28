<template>
  <div class="chat">
    <!-- Chat Header -->
    <ChatHeader 
      :showSettings="showSettings" 
      @toggle-settings="toggleSettings"
    />
    
    <!-- Messages Container -->
    <div class="chat__messages" ref="messagesContainer">
      <MessageList 
        :messages="messages"
        @copy="handleCopy"
      />
      <ThinkingIndicator 
        :isLoading="isLoading"
        :thinkingTime="thinkingTime"
      />
    </div>
    
    <!-- Input Area -->
    <MessageInput 
      :isLoading="isLoading"
      @send="handleSendMessage"
    />
    
    <!-- Control Buttons -->
    <ControlButtons 
      @export="exportHistory"
      @enforce="enforceSectionHeaders"
      @pretty="askForPrettyText"
      @markdown="askForMarkdown"
      @research="toggleResearch"
    />

    <!-- Research Panel -->
    <ResearchPanel 
      :visible="showResearch"
      :researchData="researchData"
      @toggle="toggleResearch"
    />

    <!-- Settings Modal -->
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

// Import new components
import ChatHeader from './chat/ChatHeader.vue'
import MessageList from './chat/MessageList.vue'
import ThinkingIndicator from './chat/ThinkingIndicator.vue'
import MessageInput from './chat/MessageInput.vue'
import ControlButtons from './chat/ControlButtons.vue'
import ResearchPanel from './research/ResearchPanel.vue'

export default {
  name: 'ChatInterface',
  components: {
    SettingsModal,
    ChatHeader,
    MessageList,
    ThinkingIndicator,
    MessageInput,
    ControlButtons,
    ResearchPanel
  },
  setup() {
    const isDevelopment = computed(() => process.env.NODE_ENV === 'development')
    
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
    const showResearch = ref(false)
    const researchData = ref({
      documents: [
        {
          title: "SIP-15: Governance Framework",
          source: "SuperRare Forum",
          date: "2022-05-12",
          excerpt: "This proposal outlines the governance framework for the SuperRare DAO, including voting mechanisms and proposal requirements."
        },
        {
          title: "SIP-23: Treasury Management",
          source: "SuperRare Forum",
          date: "2022-08-03",
          excerpt: "A comprehensive approach to managing the DAO treasury, including diversification strategies and spending guidelines."
        }
      ],
      themes: [
        {
          title: "Decentralized Decision Making",
          description: "Recurring theme around the importance of decentralized governance and inclusive decision-making processes.",
          tags: ["governance", "voting", "decentralization"]
        },
        {
          title: "Financial Sustainability",
          description: "Focus on ensuring long-term financial health of the DAO through responsible treasury management.",
          tags: ["treasury", "finance", "sustainability"]
        }
      ],
      recommendations: [
        {
          title: "Enhance Voting Mechanisms",
          description: "Consider implementing a two-phase voting system to allow for more deliberation on complex proposals.",
          priority: "high"
        },
        {
          title: "Regular Treasury Reports",
          description: "Implement quarterly treasury reports to increase transparency and accountability.",
          priority: "medium"
        },
        {
          title: "Documentation Updates",
          description: "Update governance documentation to reflect recent changes in the proposal submission process.",
          priority: "low"
        }
      ]
    })
    let thinkingInterval = null
    const sessionId = ref(Math.random().toString(36).substring(7))

    // State change handlers
    const toggleSettings = () => {
      showSettings.value = !showSettings.value
    }

    const handleSettingsClose = () => {
      showSettings.value = false
    }

    const toggleResearch = () => {
      showResearch.value = !showResearch.value
    }

    // Watchers
    watch(showSettings, (newValue) => {
      // Settings visibility changed
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

    const handleSendMessage = async (messageText) => {
      if (!serverInitialized.value) {
        messages.value.push({ 
          type: 'bot', 
          content: '⏳ The server is still initializing. Please wait a moment and try again.'
        });
        scrollToBottom();
        return;
      }

      messages.value.push({ type: 'user', content: messageText });
      scrollToBottom();
      
      isLoading.value = true;
      thinkingTime.value = '0:00';
      thinkingInterval = setInterval(updateThinkingTime, 1000);

      try {
        const response = await fetch('/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            message: messageText,
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
      handleSendMessage("Please redraft your response to only include the following sections: Title, Summary, Motivation, Specification, Benefits, Drawbacks, Implementation. Please do not include roadmaps or timelines, rather the specific administrative actions which would be necessary to execute immediately upon passage of the proposal.")
    }

    const askForPrettyText = () => {
      handleSendMessage("Please provide your response as formatted markdown text.")
    }

    const askForMarkdown = () => {
      handleSendMessage("Please provide your response as raw markdown code.")
    }

    const handleCopy = (content) => {
      // Copy functionality handled by component
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
      showResearch,
      researchData,
      isDevelopment,
      toggleSettings,
      handleSettingsClose,
      handleSendMessage,
      exportHistory,
      enforceSectionHeaders,
      askForPrettyText,
      askForMarkdown,
      renderMarkdown,
      handleCopy,
      toggleResearch
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

/* Animations */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style> 
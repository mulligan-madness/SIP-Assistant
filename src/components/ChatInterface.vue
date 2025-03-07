<template>
  <ChatLayout>
    <template #header>
      <!-- Chat Header -->
      <ChatHeader 
        :showSettings="showSettings" 
        :isInterviewMode="isInterviewMode"
        @open-settings="toggleSettings"
        @toggle-mode="toggleChatMode"
      />
    </template>
    
    <template #content>
      <!-- Messages Container -->
      <MessagesContainer
        ref="messagesContainer"
        :messages="messages"
        :isLoading="isLoading"
        :thinkingTime="thinkingTime"
        @copy="handleCopy"
      />
    </template>
    
    <template #footer>
      <!-- Chat Footer -->
      <ChatFooter
        :isLoading="isLoading"
        :isResearchActive="showResearch"
        @send="handleSendMessage"
        @export="exportHistory"
        @enforce="enforceSectionHeaders"
        @pretty="askForPrettyText"
        @markdown="askForMarkdown"
        @research="toggleResearch"
      />
    </template>

    <template #panels>
      <!-- Research Panel -->
      <ResearchPanel 
        :visible="showResearch"
        @toggle-panel="toggleResearch"
        @reference-document="handleReference"
      />
    </template>

    <template #modals>
      <!-- Settings Modal -->
      <Transition name="fade">
        <SettingsModal 
          v-if="showSettings"
          :show="showSettings"
          @close="handleSettingsClose"
        />
      </Transition>
    </template>
  </ChatLayout>
</template>

<script setup>
import { onMounted } from 'vue'
import SettingsModal from './SettingsModal.vue'
import ChatLayout from './chat/ChatLayout.vue'
import ChatHeader from './chat/ChatHeader.vue'
import MessagesContainer from './chat/MessagesContainer.vue'
import ChatFooter from './chat/ChatFooter.vue'
import ResearchPanel from './research/ResearchPanel.vue'
import { useChat } from '../composables/useChat'

/**
 * Main chat interface component
 * @component
 */

// Use the chat composable
const {
  // State
  messages,
  isLoading,
  thinkingTime,
  showSettings,
  showResearch,
  isInterviewMode,
  isDevelopment,
  
  // References
  messagesContainer,
  
  // Methods
  initialize,
  toggleSettings,
  toggleResearch,
  handleSendMessage,
  toggleChatMode,
  exportHistory,
  enforceSectionHeaders,
  askForPrettyText,
  askForMarkdown,
  handleReference,
  renderMarkdown
} = useChat()

// Handle settings close
const handleSettingsClose = () => {
  toggleSettings()
}

// Handle copy
const handleCopy = (content) => {
  // Copy functionality handled by component
}

// Initialize on mount
onMounted(() => {
  initialize()
})

// Emit toggle-research event to parent
const emit = defineEmits(['toggle-research'])

// Watch for research panel toggle
const handleToggleResearch = () => {
  toggleResearch()
  emit('toggle-research')
}
</script>

<style scoped>
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
<template>
  <div class="chat-footer">
    <!-- Input Area -->
    <MessageInput 
      :isLoading="isLoading"
      @send="handleSendMessage"
    />
    
    <!-- Control Buttons -->
    <ControlButtons 
      :isResearchActive="isResearchActive"
      @export="handleExport"
      @enforce="handleEnforce"
      @pretty="handlePretty"
      @markdown="handleMarkdown"
      @research="handleResearch"
    />
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';
import MessageInput from './MessageInput.vue';
import ControlButtons from './ControlButtons.vue';

/**
 * Footer component for chat interface containing input and control buttons
 * @component
 */

// Define props
const props = defineProps({
  /**
   * Whether the chat is currently loading/processing a message
   */
  isLoading: {
    type: Boolean,
    required: true,
    default: false
  },
  /**
   * Whether the research panel is currently active/visible
   */
  isResearchActive: {
    type: Boolean,
    required: true,
    default: false
  }
});

// Define emits
/**
 * Events emitted by the component
 */
const emit = defineEmits([
  /**
   * Emitted when a message is sent
   * @event send
   * @property {string} message - The message text
   */
  'send',
  
  /**
   * Emitted when the export button is clicked
   * @event export
   */
  'export',
  
  /**
   * Emitted when the enforce section headers button is clicked
   * @event enforce
   */
  'enforce',
  
  /**
   * Emitted when the pretty text button is clicked
   * @event pretty
   */
  'pretty',
  
  /**
   * Emitted when the markdown button is clicked
   * @event markdown
   */
  'markdown',
  
  /**
   * Emitted when the research panel toggle button is clicked
   * @event research
   */
  'research'
]);

/**
 * Handle send message event from MessageInput
 * @param {string} message - The message text
 */
const handleSendMessage = (message) => {
  emit('send', message);
};

/**
 * Handle export event from ControlButtons
 */
const handleExport = () => {
  emit('export');
};

/**
 * Handle enforce event from ControlButtons
 */
const handleEnforce = () => {
  emit('enforce');
};

/**
 * Handle pretty event from ControlButtons
 */
const handlePretty = () => {
  emit('pretty');
};

/**
 * Handle markdown event from ControlButtons
 */
const handleMarkdown = () => {
  emit('markdown');
};

/**
 * Handle research event from ControlButtons
 */
const handleResearch = () => {
  emit('research');
};
</script>

<style scoped>
.chat-footer {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}
</style> 
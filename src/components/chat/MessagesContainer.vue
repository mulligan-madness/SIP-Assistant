<template>
  <div class="messages-container" ref="containerRef">
    <MessageList 
      :messages="messages"
      @copy="handleCopy"
    />
    <ThinkingIndicator 
      :isLoading="isLoading"
      :thinkingTime="thinkingTime"
    />
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, onMounted, watch } from 'vue';
import MessageList from './MessageList.vue';
import ThinkingIndicator from './ThinkingIndicator.vue';

/**
 * Container component for messages and thinking indicator
 * @component
 */

// Define props
const props = defineProps({
  /**
   * Array of message objects to display
   */
  messages: {
    type: Array,
    required: true,
    default: () => []
  },
  /**
   * Whether the chat is currently loading/processing a message
   */
  isLoading: {
    type: Boolean,
    required: true,
    default: false
  },
  /**
   * The elapsed thinking time to display (format: "0:00")
   */
  thinkingTime: {
    type: String,
    required: true,
    default: '0:00',
    validator: function(value) {
      // Validate format (m:ss)
      return /^\d+:\d{2}$/.test(value);
    }
  }
});

// Define emits
/**
 * Events emitted by the component
 */
const emit = defineEmits([
  /**
   * Emitted when a message is copied
   * @event copy
   * @property {string} content - The content being copied
   */
  'copy'
]);

// Refs
const containerRef = ref(null);

/**
 * Handle copy event from MessageList component
 * @param {string} content - Content being copied
 */
const handleCopy = (content) => {
  emit('copy', content);
};

/**
 * Scroll to the bottom of the messages container
 */
const scrollToBottom = () => {
  if (containerRef.value) {
    containerRef.value.scrollTop = containerRef.value.scrollHeight;
  }
};

// Watch for changes to messages and scroll to bottom
watch(() => props.messages, () => {
  scrollToBottom();
}, { deep: true });

// Scroll to bottom on mount
onMounted(() => {
  scrollToBottom();
});

// Expose methods to parent component
defineExpose({
  scrollToBottom
});
</script>

<style scoped>
.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
  margin-bottom: 20px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  min-height: 0;
  /* Ensure proper space for numbered lists and bullet points */
  padding-left: 20px;
  padding-right: 20px;
}
</style> 
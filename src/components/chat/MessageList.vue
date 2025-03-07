<template>
  <div class="message-list">
    <Message
      v-for="(message, index) in messages"
      :key="index"
      :content="message.content"
      :type="message.type"
      @copy="handleCopy"
    />
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';
import Message from './Message.vue';

/**
 * MessageList component for displaying a list of messages
 * @component
 */

// Define props
const props = defineProps({
  /**
   * Array of message objects to display
   * Each message should have content and type properties
   */
  messages: {
    type: Array,
    required: true,
    default: () => [],
    validator: function(value) {
      return value.every(message => 
        typeof message === 'object' && 
        'content' in message && 
        'type' in message &&
        ['user', 'bot', 'system'].includes(message.type)
      );
    }
  }
});

// Define emits
/**
 * Emitted when a message is copied
 * @event copy
 * @property {string} content - The content being copied
 */
const emit = defineEmits(['copy']);

/**
 * Handle copy event from Message component
 * @param {string} content - Content being copied
 */
const handleCopy = (content) => {
  emit('copy', content);
};
</script>

<style scoped>
.message-list {
  /* The styles here will be inherited from the parent component */
  display: flex;
  flex-direction: column;
  width: 100%;
}
</style>

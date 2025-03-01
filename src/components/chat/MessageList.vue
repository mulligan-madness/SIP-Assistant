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

// Define props
const props = defineProps({
  messages: {
    type: Array,
    required: true,
    default: () => []
  }
});

// Define emits
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

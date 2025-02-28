<template>
  <div class="message-list">
    <div v-for="(message, index) in messages" 
         :key="index" 
         :class="['message', `message--${message.type}`]">
         <div class="message-content" v-html="message.type === 'bot' ? renderMarkdown(message.content) : message.content"></div>
         <button v-if="message.type === 'bot'" 
                 class="copy-button"
                 @click="copyToClipboard(message.content)"
                 title="Copy to clipboard">
           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
             <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
             <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
           </svg>
         </button>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';
import { marked } from 'marked';
import Prism from 'prismjs';

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
 * Renders markdown content to HTML
 * @param {string} content - Markdown content to render
 * @return {string} HTML content
 */
const renderMarkdown = (content) => {
  const rendered = marked(content, { breaks: true });
  setTimeout(() => {
    Prism.highlightAll();
  }, 0);
  return rendered;
};

/**
 * Copies message content to clipboard
 * @param {string} content - Content to copy
 */
const copyToClipboard = async (content) => {
  try {
    await navigator.clipboard.writeText(content);
    emit('copy', content);
    // Optional: Show a brief success message or visual feedback
  } catch (err) {
    console.error('Failed to copy text: ', err);
  }
};
</script>

<style scoped>
.message-list {
  /* The styles here will be inherited from the parent component */
}

.message {
  position: relative;
  max-width: 70%;
  margin: 10px 0;
  padding: 12px;
  border-radius: 8px;
  line-height: 1.4;
}

.message-content {
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.message--user {
  background: var(--primary-color);
  color: white;
  margin-left: auto;
  margin-right: 0;
}

.message--bot {
  background: var(--surface-color);
  color: var(--text-color);
  margin-right: auto;
  margin-left: 0;
}

.copy-button {
  position: absolute;
  top: 8px;
  right: 8px;
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 4px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s ease;
  color: var(--text-color);
}

.message:hover .copy-button {
  opacity: 1;
}

.copy-button:hover {
  background: var(--button-secondary-hover);
}

.copy-button svg {
  display: block;
}
</style>

<template>
  <div :class="['message', `message--${type}`]">
    <div :class="['message-content', {'markdown-content': type === 'bot'}]" v-html="renderedContent"></div>
    <button v-if="type === 'bot'" 
            class="copy-button"
            @click="copyToClipboard"
            title="Copy to clipboard">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
    </button>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, computed } from 'vue';
import { marked } from 'marked';
import Prism from 'prismjs';

// Define props
/**
 * Message component for displaying chat messages
 * @component
 */
const props = defineProps({
  /**
   * The content of the message
   */
  content: {
    type: String,
    required: true,
    validator: function(value) {
      return value.trim().length > 0;
    }
  },
  /**
   * The type of message (user or bot)
   */
  type: {
    type: String,
    required: true,
    validator: (value) => ['user', 'bot', 'system'].includes(value)
  }
});

// Define emits
/**
 * Emitted when the user copies the message content
 * @event copy
 * @property {string} content - The content being copied
 */
const emit = defineEmits(['copy']);

/**
 * Renders markdown content to HTML if it's a bot message
 */
const renderedContent = computed(() => {
  if (props.type !== 'bot') {
    return props.content;
  }
  
  // Handle null or undefined content
  if (props.content === null || props.content === undefined) {
    console.warn('Received null or undefined content in renderMarkdown');
    return '<p>No content available</p>';
  }
  
  // Ensure content is a string
  let contentStr = String(props.content);
  
  // Check if content might be JSON
  if (contentStr.trim().startsWith('{') && contentStr.trim().endsWith('}')) {
    try {
      const parsed = JSON.parse(contentStr);
      // If it's our API response format, extract just the message
      if (parsed && typeof parsed.message === 'string') {
        contentStr = parsed.message;
      }
    } catch (e) {
      // Not valid JSON, continue with original content
      console.log('Content looks like JSON but could not be parsed:', e);
    }
  }
  
  if (contentStr.trim() === '') {
    return '<p>Empty response</p>';
  }
  
  try {
    const rendered = marked(contentStr, { breaks: true });
    setTimeout(() => {
      Prism.highlightAll();
    }, 0);
    return rendered;
  } catch (error) {
    console.error('Error rendering markdown:', error);
    // Return the content as a string if rendering fails, wrapped in a paragraph
    return `<p>${contentStr}</p>`;
  }
});

/**
 * Copies message content to clipboard
 */
const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(props.content);
    emit('copy', props.content);
    // Optional: Show a brief success message or visual feedback
  } catch (err) {
    console.error('Failed to copy text: ', err);
  }
};
</script>

<style scoped>
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

/* Ensure lists have proper spacing from the container edges */
:deep(.markdown-content ul),
:deep(.markdown-content ol) {
  padding-left: 1.5em; 
  margin: 0.5em 0;
}

:deep(.markdown-content li) {
  margin: 0.25em 0;
}

/* Ensure nested lists are properly indented */
:deep(.markdown-content ul ul),
:deep(.markdown-content ol ol),
:deep(.markdown-content ul ol),
:deep(.markdown-content ol ul) {
  margin: 0.25em 0;
}

/* Ensure proper list markers */
:deep(.markdown-content ul > li) {
  list-style-type: disc;
}

:deep(.markdown-content ol > li) {
  list-style-type: decimal;
}

/* Ensure content like ordered lists with numbers has enough space */
:deep(.markdown-content ol) {
  padding-left: 2em;
}

.message--user {
  background: var(--primary-color);
  color: white;
  margin-left: auto;
  margin-right: 0;
}

.message--bot {
  background: var(--primary-dark);
  color: var(--text-color);
  margin-right: auto;
  margin-left: 0;
  border: 1px solid var(--border-color);
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
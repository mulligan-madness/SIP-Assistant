<template>
  <div class="document-card">
    <div class="document-card__header">
      <h3 class="document-card__title">{{ doc.metadata?.title || 'Untitled Document' }}</h3>
      <div class="document-card__meta">
        <span class="document-card__date">{{ formattedDate }}</span>
        <span class="document-card__score">Relevance: {{ Math.round(doc.score * 100) }}%</span>
      </div>
    </div>
    
    <div class="document-card__content" v-if="isExpanded">
      <div class="document-card__text" v-html="formattedText"></div>
      <div class="document-card__citation">
        <h4>Citation</h4>
        <p>{{ citation }}</p>
        <button 
          class="document-card__copy-button"
          @click="copyToClipboard(citation)"
          title="Copy citation to clipboard"
        >
          Copy
        </button>
      </div>
    </div>
    
    <div class="document-card__actions">
      <button 
        class="document-card__button"
        @click="toggleExpand"
        :title="isExpanded ? 'Hide document content' : 'Show full document content'"
      >
        {{ isExpanded ? 'Collapse' : 'View Content' }}
      </button>
      <button 
        class="document-card__button"
        @click="reference"
        title="Insert this document as a reference in your chat"
      >
        Reference
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

/**
 * Document card component for displaying search results
 * @component
 */
const props = defineProps({
  /**
   * The document to display
   */
  doc: {
    type: Object,
    required: true
  },
  /**
   * Whether the document is expanded
   */
  initialExpanded: {
    type: Boolean,
    default: false
  }
});

/**
 * Events emitted by the component
 */
const emit = defineEmits([
  /**
   * Emitted when the document is toggled (expanded/collapsed)
   * @event toggle
   * @property {boolean} expanded - Whether the document is expanded
   */
  'toggle',
  
  /**
   * Emitted when the document is referenced
   * @event reference
   * @property {Object} docInfo - Information about the referenced document
   * @property {string} docInfo.text - The document text
   * @property {string} docInfo.citation - The document citation
   */
  'reference'
]);

// Local state
const isExpanded = ref(props.initialExpanded);

// Computed properties
const formattedDate = computed(() => {
  if (!props.doc.metadata?.date) return 'Unknown date';
  
  try {
    const date = new Date(props.doc.metadata.date);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return props.doc.metadata.date;
  }
});

const formattedText = computed(() => {
  if (!props.doc.text) return '';
  
  try {
    const rawHtml = marked(props.doc.text);
    return DOMPurify.sanitize(rawHtml);
  } catch (error) {
    console.error('Error rendering markdown:', error);
    return DOMPurify.sanitize(String(props.doc.text));
  }
});

const citation = computed(() => {
  const title = props.doc.metadata?.title || 'Untitled Document';
  const date = formattedDate.value;
  const source = props.doc.metadata?.source || 'Unknown Source';
  
  return `${title} (${date}). ${source}.`;
});

// Methods
const toggleExpand = () => {
  isExpanded.value = !isExpanded.value;
  emit('toggle', isExpanded.value);
};

const reference = () => {
  emit('reference', {
    text: props.doc.text,
    citation: citation.value
  });
};

const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text)
    .then(() => {
      console.log('Copied to clipboard');
    })
    .catch(err => {
      console.error('Failed to copy:', err);
    });
};
</script>

<style scoped>
.document-card {
  background: var(--surface-color-secondary, #2c2c2e);
  border-radius: 6px;
  margin-bottom: 16px;
  overflow: hidden;
  border: 1px solid var(--border-color, #333);
}

.document-card__header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color, #333);
}

.document-card__title {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
}

.document-card__meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-secondary, #aaa);
}

.document-card__content {
  padding: 16px;
  border-bottom: 1px solid var(--border-color, #333);
}

.document-card__text {
  margin-bottom: 16px;
  line-height: 1.5;
}

/* Remove the duplicate hyperlink styling and use a class instead */
:deep(.document-card__text) {
  /* This will apply the markdown-content styling to the document text */
  composes: markdown-content from global;
}

.document-card__citation {
  background: var(--background-color, #121212);
  padding: 12px;
  border-radius: 4px;
  font-size: 13px;
}

.document-card__citation h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
}

.document-card__citation p {
  margin: 0 0 8px 0;
}

.document-card__copy-button {
  padding: 4px 8px;
  background: var(--button-secondary, #2c2c2e);
  border: 1px solid var(--border-color, #333);
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  color: var(--text-color, #e0e0e0);
}

.document-card__copy-button:hover {
  background: var(--button-secondary-hover, #3c3c3e);
}

.document-card__actions {
  display: flex;
  padding: 12px 16px;
  gap: 8px;
  justify-content: flex-end;
}

.document-card__button {
  padding: 6px 12px;
  background: var(--button-secondary, #2c2c2e);
  border: 1px solid var(--border-color, #333);
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  color: var(--text-color, #e0e0e0);
  transition: background-color 0.2s ease;
}

.document-card__button:hover {
  background: var(--button-secondary-hover, #3c3c3e);
}
</style> 
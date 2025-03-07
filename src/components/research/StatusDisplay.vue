<template>
  <div>
    <!-- Loading State -->
    <div v-if="isLoading" class="research-panel__loading">
      <div class="spinner"></div>
      <p>Searching for relevant documents...</p>
    </div>
    
    <!-- Empty State -->
    <div v-else-if="isEmpty" class="research-panel__placeholder">
      <p v-if="searchAttempted">No documents found. Try a different search query.</p>
      <p v-else>Enter a search query to find relevant governance documents.</p>
      <p v-if="!searchAttempted" class="research-panel__tip">
        <strong>Tip:</strong> Try searching for topics like "voting", "treasury", or "proposals"
      </p>
      <div v-else class="no-results">
        <p>No results found for "{{ searchQuery }}"</p>
        <p class="search-tip">Try using different keywords or more general terms. The search uses semantic matching with a threshold of {{ Math.round(searchThreshold * 100) }}% similarity.</p>
      </div>
    </div>
    
    <!-- Error State -->
    <div v-else-if="hasError" class="research-panel__error">
      <p>{{ errorMessage }}</p>
      <button @click="clearError" class="research-panel__error-button">Try Again</button>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

/**
 * Status display component for the research panel
 * @component
 */
const props = defineProps({
  /**
   * Whether a search is currently in progress
   */
  isLoading: {
    type: Boolean,
    required: true
  },
  /**
   * Whether the search results are empty
   */
  isEmpty: {
    type: Boolean,
    required: true
  },
  /**
   * Whether a search has been attempted
   */
  searchAttempted: {
    type: Boolean,
    required: true
  },
  /**
   * Whether there is an error
   */
  hasError: {
    type: Boolean,
    required: true
  },
  /**
   * The error message to display
   */
  errorMessage: {
    type: String,
    default: 'An error occurred while searching'
  },
  /**
   * The search query
   */
  searchQuery: {
    type: String,
    default: ''
  },
  /**
   * The search threshold
   */
  searchThreshold: {
    type: Number,
    default: 0.1
  }
});

/**
 * Events emitted by the component
 */
const emit = defineEmits([
  /**
   * Emitted when the error should be cleared
   * @event clear-error
   */
  'clear-error'
]);

/**
 * Emit the clear-error event
 */
const clearError = () => {
  emit('clear-error');
};
</script>

<style scoped>
.research-panel__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  gap: 16px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border-color, #333);
  border-top-color: var(--primary-color, #bb86fc);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.research-panel__placeholder, 
.research-panel__error {
  text-align: center;
  padding: 32px 16px;
  color: var(--text-secondary, #aaa);
}

.research-panel__error-button {
  margin-top: 16px;
  padding: 8px 16px;
  background: var(--button-primary, #7c5ddf);
  color: var(--button-text-primary, #ffffff);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.research-panel__error-button:hover {
  background: var(--button-primary-hover, #9579f0);
}

.research-panel__tip {
  font-size: 13px;
  color: var(--text-secondary, #aaa);
  margin-top: 12px;
}

.no-results {
  text-align: center;
  padding: 32px 16px;
  color: var(--text-secondary, #aaa);
}

/* Remove the duplicate hyperlink styling and use a class instead */
:deep(.no-results) {
  /* This will apply the markdown-content styling to the no results section */
  composes: markdown-content from global;
}

.search-tip {
  font-size: 13px;
  color: var(--text-secondary, #aaa);
  margin-top: 12px;
}
</style> 
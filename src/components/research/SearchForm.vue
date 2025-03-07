<template>
  <div class="research-panel__search">
    <input 
      type="text" 
      v-model="searchQuery" 
      placeholder="Search for relevant documents..." 
      class="research-panel__search-input"
      @keyup.enter="performSearch"
      title="Enter keywords to search for relevant governance documents"
    />
    <button 
      class="research-panel__search-button"
      @click="performSearch"
      :disabled="isSearching"
      title="Search for documents related to your query"
    >
      <span v-if="isSearching">Searching...</span>
      <span v-else>Search</span>
    </button>
    <button 
      v-if="showDebug"
      class="research-panel__debug-button"
      @click="debugVectorStore"
      title="Debug vector store"
    >
      Debug
    </button>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits } from 'vue';

/**
 * Search form component for the research panel
 * @component
 */
const props = defineProps({
  /**
   * Whether a search is currently in progress
   */
  isSearching: {
    type: Boolean,
    required: true
  },
  /**
   * Whether to show the debug button
   */
  showDebug: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits([
  /**
   * Emitted when a search is performed
   * @event search
   * @property {string} query - The search query
   */
  'search',
  
  /**
   * Emitted when the debug button is clicked
   * @event debug
   */
  'debug'
]);

// Local state
const searchQuery = ref('');

/**
 * Emit the search event with the current query
 */
const performSearch = () => {
  if (!searchQuery.value.trim()) return;
  emit('search', searchQuery.value.trim());
};

/**
 * Emit the debug event
 */
const debugVectorStore = () => {
  emit('debug');
};
</script>

<style scoped>
.research-panel__search {
  padding: 12px 16px;
  display: flex;
  gap: 8px;
  border-bottom: 1px solid var(--border-color, #333);
}

.research-panel__search-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--border-color, #333);
  border-radius: 4px;
  font-size: 14px;
  background: var(--input-background, #2c2c2e);
  color: var(--text-color, #e0e0e0);
}

.research-panel__search-input::placeholder {
  color: var(--text-secondary, #aaa);
}

.research-panel__search-button {
  padding: 8px 16px;
  background: var(--button-primary, #7c5ddf);
  color: var(--button-text-primary, #ffffff);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s ease;
}

.research-panel__search-button:hover:not(:disabled) {
  background: var(--button-primary-hover, #9579f0);
}

.research-panel__search-button:disabled {
  background: var(--button-disabled, #404040);
  color: var(--disabled-text, #666);
  cursor: not-allowed;
}

.research-panel__debug-button {
  padding: 8px 12px;
  background: var(--button-secondary, #2c2c2e);
  color: var(--text-color, #e0e0e0);
  border: 1px solid var(--border-color, #333);
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

.research-panel__debug-button:hover {
  background: var(--button-secondary-hover, #3c3c3e);
}
</style> 
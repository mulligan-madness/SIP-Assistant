<template>
  <div v-if="visible" class="research-panel">
    <!-- Panel Header -->
    <PanelHeader 
      title="Research Results" 
      @close-panel="$emit('toggle-panel')"
    />
    
    <!-- Search Form -->
    <SearchForm 
      :is-searching="isSearching"
      :show-debug="showDebug"
      @search="performSearch"
      @debug="debugVectorStore"
    />
    
    <div class="research-panel__content">
      <!-- First-use Help Message -->
      <HelpSection 
        v-if="!searchAttempted && !searchResults && showHelp"
        @dismiss="showHelp = false"
      />
      
      <!-- Status Display (Loading, Empty, Error) -->
      <StatusDisplay
        v-if="isSearching || !searchResults || searchResults.length === 0 || searchError"
        :is-loading="isSearching"
        :is-empty="!searchResults || searchResults.length === 0"
        :search-attempted="searchAttempted"
        :has-error="!!searchError"
        :error-message="searchError"
        :search-query="searchQuery"
        :search-threshold="searchThreshold"
        @clear-error="clearError"
      />
      
      <!-- Results -->
      <div v-else class="research-panel__results">
        <DocumentCard
          v-for="(doc, index) in searchResults"
          :key="index"
          :doc="doc"
          :initial-expanded="expandedDocuments[index]"
          @toggle="(expanded) => expandedDocuments[index] = expanded"
          @reference="referenceDocument"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import PanelHeader from './PanelHeader.vue';
import SearchForm from './SearchForm.vue';
import HelpSection from './HelpSection.vue';
import StatusDisplay from './StatusDisplay.vue';
import DocumentCard from './DocumentCard.vue';

/**
 * Research panel component for searching and displaying documents
 * @component
 */
const props = defineProps({
  /**
   * Whether the panel is visible
   */
  visible: {
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
   * Emitted when the panel should be toggled (shown/hidden)
   * @event toggle-panel
   */
  'toggle-panel',
  
  /**
   * Emitted when a document is referenced
   * @event reference-document
   * @property {Object} docInfo - Information about the referenced document
   * @property {string} docInfo.text - The document text
   * @property {string} docInfo.citation - The document citation
   */
  'reference-document'
]);

// Search state
const searchQuery = ref('');
const isSearching = ref(false);
const searchResults = ref(null);
const searchError = ref(null);
const searchAttempted = ref(false);
const expandedDocuments = reactive({});
const searchCache = reactive({});
const showHelp = ref(true);
const retryCount = ref(0);
const maxRetries = 3;
const searchThreshold = ref(0.1);
const showDebug = ref(process.env.NODE_ENV === 'development' || localStorage.getItem('enableDebug') === 'true');

// Check if this is the first time using the panel
onMounted(() => {
  const hasUsedResearch = localStorage.getItem('hasUsedResearch');
  if (hasUsedResearch) {
    showHelp.value = false;
  }
});

/**
 * Perform a search for documents
 * @param {string} query - The search query
 * @param {boolean} retry - Whether this is a retry attempt
 */
const performSearch = async (query, retry = false) => {
  if (!query) {
    searchError.value = 'Please enter a search query';
    return;
  }
  
  searchQuery.value = query;
  
  if (retry) {
    retryCount.value++;
    console.log(`[ResearchPanel] Retry attempt ${retryCount.value} of ${maxRetries}`);
  } else {
    retryCount.value = 0;
    console.log(`[ResearchPanel] Starting new search`);
  }
  
  if (retryCount.value > maxRetries) {
    searchError.value = 'Maximum retry attempts reached. Please try again later.';
    isSearching.value = false;
    console.log(`[ResearchPanel] Maximum retry attempts (${maxRetries}) reached`);
    return;
  }
  
  console.log(`[ResearchPanel] Search query: "${query}"`);
  
  // Check cache first
  if (searchCache[query] && !retry) {
    console.log('[ResearchPanel] Using cached results for:', query);
    searchResults.value = searchCache[query];
    searchAttempted.value = true;
    return;
  }
  
  try {
    console.log('[ResearchPanel] Setting search state...');
    isSearching.value = true;
    searchError.value = null;
    searchAttempted.value = true;
    
    console.log('[ResearchPanel] Sending API request to /api/vector/search...');
    const startTime = Date.now();
    
    // Use the simpler vector search endpoint
    const response = await fetch('/api/vector/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: query,
        limit: 5,
        threshold: searchThreshold.value
      }),
      // Add timeout to prevent hanging requests
      signal: AbortSignal.timeout(10000)
    }).catch(error => {
      console.error('[ResearchPanel] Fetch error:', error);
      if (error.name === 'AbortError') {
        throw new Error('Search request timed out. Please try again.');
      }
      throw error;
    });
    
    const duration = Date.now() - startTime;
    console.log(`[ResearchPanel] API response received in ${duration}ms, status: ${response.status}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[ResearchPanel] API error response:', errorData);
      
      // Handle rate limiting or server errors with exponential backoff
      if (response.status === 429 || response.status >= 500) {
        const retryDelay = Math.min(1000 * Math.pow(2, retryCount.value), 10000);
        console.log(`[ResearchPanel] Rate limited or server error. Retrying in ${retryDelay}ms...`);
        
        setTimeout(() => {
          performSearch(query, true);
        }, retryDelay);
        
        return;
      }
      
      throw new Error(errorData.message || `Failed to search documents (${response.status})`);
    }
    
    console.log('[ResearchPanel] Parsing JSON response...');
    const data = await response.json().catch(() => {
      console.error('[ResearchPanel] Failed to parse JSON response');
      throw new Error('Failed to parse search results');
    });
    
    console.log(`[ResearchPanel] Response data:`, data);
    
    if (!data.results) {
      console.error('[ResearchPanel] Invalid response format - missing results array');
      throw new Error('Invalid response format from server');
    }
    
    console.log(`[ResearchPanel] Search successful, found ${data.results.length} results`);
    searchResults.value = data.results;
    
    // Log the state after setting search results
    console.log(`[ResearchPanel] State after search: isSearching=${isSearching.value}, searchAttempted=${searchAttempted.value}, resultsLength=${searchResults.value ? searchResults.value.length : 0}`);
    
    // Cache the results
    if (data.results && data.results.length > 0) {
      searchCache[query] = data.results;
      console.log(`[ResearchPanel] Results cached for query: "${query}"`);
      
      // Limit cache size to prevent memory issues
      const cacheKeys = Object.keys(searchCache);
      if (cacheKeys.length > 10) {
        delete searchCache[cacheKeys[0]];
        console.log(`[ResearchPanel] Cache pruned, removed oldest entry`);
      }
    }
    
    // Reset expanded state for new results
    Object.keys(expandedDocuments).forEach(key => {
      delete expandedDocuments[key];
    });
    
    // Mark that the user has used research
    localStorage.setItem('hasUsedResearch', 'true');
    showHelp.value = false;
  } catch (error) {
    console.error('[ResearchPanel] Search error:', error);
    
    // If it's a network error, try to retry
    if (error.message.includes('network') || error.message.includes('timeout')) {
      const retryDelay = Math.min(1000 * Math.pow(2, retryCount.value), 10000);
      console.log(`[ResearchPanel] Network error. Retrying in ${retryDelay}ms...`);
      
      setTimeout(() => {
        performSearch(query, true);
      }, retryDelay);
      
      return;
    }
    
    searchError.value = error.message || 'An error occurred while searching';
    searchResults.value = null;
  } finally {
    // Always set isSearching to false when the search completes
    isSearching.value = false;
    console.log(`[ResearchPanel] Search completed, isSearching set to false`);
    console.log(`[ResearchPanel] Final state: isSearching=${isSearching.value}, searchAttempted=${searchAttempted.value}, resultsLength=${searchResults.value ? searchResults.value.length : 0}, hasError=${!!searchError.value}`);
  }
};

/**
 * Clear any search errors
 */
const clearError = () => {
  searchError.value = null;
  retryCount.value = 0;
};

/**
 * Reference a document in the chat
 * @param {Object} docInfo - The document information
 */
const referenceDocument = (docInfo) => {
  emit('reference-document', docInfo);
};

/**
 * Debug the vector store
 */
const debugVectorStore = async () => {
  try {
    console.log('[ResearchPanel] Fetching vector store debug info...');
    
    // Create a simple endpoint call to get vector store info
    const response = await fetch('/api/vector/debug', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error('[ResearchPanel] Failed to get debug info:', response.status);
      alert('Debug endpoint not available. Check console for more info.');
      return;
    }
    
    const data = await response.json();
    console.log('[ResearchPanel] Vector store debug info:', data);
    
    // Display basic info in an alert for now
    alert(`Vector Store Info:
- Total documents: ${data.totalDocuments || 'N/A'}
- Document types: ${data.documentTypes ? JSON.stringify(data.documentTypes) : 'N/A'}
- Sample document titles: ${data.sampleTitles ? data.sampleTitles.join(', ') : 'N/A'}`);
    
  } catch (error) {
    console.error('[ResearchPanel] Debug error:', error);
    alert('Error fetching debug info: ' + error.message);
  }
};
</script>

<style scoped>
.research-panel {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 450px;
  max-width: calc(100vw - 40px);
  max-height: calc(100vh - 40px);
  background: var(--surface-color, #1e1e1e);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 900;
  color: var(--text-color, #e0e0e0);
}

.research-panel__content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

@media (max-width: 768px) {
  .research-panel {
    top: 0;
    right: 0;
    width: 100%;
    max-width: 100%;
    height: 100%;
    max-height: 100%;
    border-radius: 0;
  }
}
</style>

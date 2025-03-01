<template>
  <div v-if="visible" class="research-panel">
    <div class="research-panel__header">
      <h2 class="research-panel__title">Research Results</h2>
      <button 
        class="research-panel__close-button"
        @click="$emit('toggle')"
        aria-label="Close Research Panel"
        title="Close panel"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
    
    <!-- Simple Search Form -->
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
    </div>
    
    <div class="research-panel__content">
      <!-- First-use Help Message -->
      <div v-if="!searchAttempted && !searchResults && showHelp" class="research-panel__help">
        <h3>How to Use Research</h3>
        <p>Search for governance-related topics to find relevant documents from the knowledge base.</p>
        <ul>
          <li><strong>Search:</strong> Enter keywords and press Enter or click Search</li>
          <li><strong>View Content:</strong> Click "View Content" to read the full document</li>
          <li><strong>Reference:</strong> Click "Reference" to insert a citation into your chat</li>
        </ul>
        <div class="research-panel__help-actions">
          <button @click="showHelp = false" class="research-panel__help-button">Got it!</button>
        </div>
      </div>
      
      <!-- Loading State -->
      <div v-else-if="isSearching" class="research-panel__loading">
        <div class="spinner"></div>
        <p>Searching for relevant documents...</p>
      </div>
      
      <!-- Empty State -->
      <div v-else-if="!searchResults || searchResults.length === 0" class="research-panel__placeholder">
        <p v-if="searchAttempted">No documents found. Try a different search query.</p>
        <p v-else>Enter a search query to find relevant governance documents.</p>
        <p v-if="!searchAttempted" class="research-panel__tip">
          <strong>Tip:</strong> Try searching for topics like "voting", "treasury", or "proposals"
        </p>
      </div>
      
      <!-- Error State -->
      <div v-else-if="searchError" class="research-panel__error">
        <p>{{ searchError }}</p>
        <button @click="clearError" class="research-panel__error-button">Try Again</button>
      </div>
      
      <!-- Results -->
      <div v-else class="research-panel__results">
        <div v-for="(doc, index) in searchResults" :key="index" class="document-card">
          <div class="document-card__header">
            <h3 class="document-card__title">{{ doc.metadata?.title || 'Untitled Document' }}</h3>
            <div class="document-card__meta">
              <span class="document-card__date">{{ formatDate(doc.metadata?.date) }}</span>
              <span class="document-card__score">Relevance: {{ Math.round(doc.score * 100) }}%</span>
            </div>
          </div>
          
          <div class="document-card__content" v-if="expandedDocuments[index]">
            <div class="document-card__text" v-html="formatMarkdown(doc.text)"></div>
            <div class="document-card__citation">
              <h4>Citation</h4>
              <p>{{ generateCitation(doc) }}</p>
              <button 
                class="document-card__copy-button"
                @click="copyToClipboard(generateCitation(doc))"
                title="Copy citation to clipboard"
              >
                Copy
              </button>
            </div>
          </div>
          
          <div class="document-card__actions">
            <button 
              class="document-card__button"
              @click="toggleDocument(index)"
              :title="expandedDocuments[index] ? 'Hide document content' : 'Show full document content'"
            >
              {{ expandedDocuments[index] ? 'Collapse' : 'View Content' }}
            </button>
            <button 
              class="document-card__button"
              @click="referenceDocument(doc)"
              title="Insert this document as a reference in your chat"
            >
              Reference
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, ref, reactive, onMounted } from 'vue';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

// Define props
const props = defineProps({
  visible: {
    type: Boolean,
    required: true,
    default: false
  }
});

// Define emits
const emit = defineEmits(['toggle', 'reference']);

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

// Check if this is the first time using the panel
onMounted(() => {
  const hasUsedResearch = localStorage.getItem('hasUsedResearch');
  if (hasUsedResearch) {
    showHelp.value = false;
  }
});

// Methods
const performSearch = async (retry = false) => {
  if (!searchQuery.value.trim()) {
    searchError.value = 'Please enter a search query';
    return;
  }
  
  if (retry) {
    retryCount.value++;
  } else {
    retryCount.value = 0;
  }
  
  if (retryCount.value > maxRetries) {
    searchError.value = 'Maximum retry attempts reached. Please try again later.';
    isSearching.value = false;
    return;
  }
  
  const query = searchQuery.value.trim();
  
  // Check cache first
  if (searchCache[query] && !retry) {
    console.log('Using cached results for:', query);
    searchResults.value = searchCache[query];
    searchAttempted.value = true;
    return;
  }
  
  try {
    isSearching.value = true;
    searchError.value = null;
    searchAttempted.value = true;
    
    // Use the simpler vector search endpoint
    const response = await fetch('/api/vector/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: query,
        limit: 5,
        threshold: 0.7
      }),
      // Add timeout to prevent hanging requests
      signal: AbortSignal.timeout(10000)
    }).catch(error => {
      if (error.name === 'AbortError') {
        throw new Error('Search request timed out. Please try again.');
      }
      throw error;
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Handle rate limiting or server errors with exponential backoff
      if (response.status === 429 || response.status >= 500) {
        const retryDelay = Math.min(1000 * Math.pow(2, retryCount.value), 10000);
        console.log(`Rate limited or server error. Retrying in ${retryDelay}ms...`);
        
        setTimeout(() => {
          performSearch(true);
        }, retryDelay);
        
        return;
      }
      
      throw new Error(errorData.message || `Failed to search documents (${response.status})`);
    }
    
    const data = await response.json().catch(() => {
      throw new Error('Failed to parse search results');
    });
    
    if (!data.results) {
      throw new Error('Invalid response format from server');
    }
    
    searchResults.value = data.results;
    
    // Cache the results
    if (data.results && data.results.length > 0) {
      searchCache[query] = data.results;
      
      // Limit cache size to prevent memory issues
      const cacheKeys = Object.keys(searchCache);
      if (cacheKeys.length > 10) {
        delete searchCache[cacheKeys[0]];
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
    console.error('Search error:', error);
    
    // If it's a network error, try to retry
    if (error.message.includes('network') || error.message.includes('timeout')) {
      const retryDelay = Math.min(1000 * Math.pow(2, retryCount.value), 10000);
      console.log(`Network error. Retrying in ${retryDelay}ms...`);
      
      setTimeout(() => {
        performSearch(true);
      }, retryDelay);
      
      return;
    }
    
    searchError.value = error.message || 'An error occurred while searching';
    searchResults.value = null;
  } finally {
    if (retryCount.value === 0 || retryCount.value > maxRetries) {
      isSearching.value = false;
    }
  }
};

const clearError = () => {
  searchError.value = null;
  retryCount.value = 0;
};

const toggleDocument = (index) => {
  expandedDocuments[index] = !expandedDocuments[index];
};

const referenceDocument = (doc) => {
  emit('reference', {
    text: doc.text,
    citation: generateCitation(doc)
  });
};

const formatDate = (dateString) => {
  if (!dateString) return 'No date';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  } catch (e) {
    return dateString;
  }
};

const generateCitation = (doc) => {
  const title = doc.metadata?.title || 'Untitled Document';
  const date = formatDate(doc.metadata?.date);
  const source = doc.metadata?.source || 'Unknown Source';
  
  return `${title} (${date}). ${source}.`;
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

const formatMarkdown = (text) => {
  if (!text) return '';
  
  try {
    const rawHtml = marked(text);
    return DOMPurify.sanitize(rawHtml);
  } catch (error) {
    console.error('Error rendering markdown:', error);
    return DOMPurify.sanitize(String(text));
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
  background: var(--surface-color, #ffffff);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 900;
  color: var(--text-color, #333333);
}

.research-panel__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color, #e0e0e0);
}

.research-panel__title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.research-panel__close-button {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: var(--text-secondary, #666666);
  border-radius: 4px;
}

.research-panel__close-button:hover {
  background: var(--hover-color, #f0f0f0);
}

.research-panel__search {
  padding: 12px 16px;
  display: flex;
  gap: 8px;
  border-bottom: 1px solid var(--border-color, #e0e0e0);
}

.research-panel__search-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--border-color, #e0e0e0);
  border-radius: 4px;
  font-size: 14px;
}

.research-panel__search-button {
  padding: 8px 16px;
  background: var(--primary-color, #4a6cf7);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.research-panel__search-button:disabled {
  background: var(--disabled-color, #cccccc);
  cursor: not-allowed;
}

.research-panel__content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

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
  border: 3px solid var(--border-color, #e0e0e0);
  border-top-color: var(--primary-color, #4a6cf7);
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
  color: var(--text-secondary, #666666);
}

.research-panel__error-button {
  margin-top: 16px;
  padding: 8px 16px;
  background: var(--primary-color, #4a6cf7);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.document-card {
  background: var(--card-bg, #f9f9f9);
  border-radius: 6px;
  margin-bottom: 16px;
  overflow: hidden;
  border: 1px solid var(--border-color, #e0e0e0);
}

.document-card__header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color, #e0e0e0);
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
  color: var(--text-secondary, #666666);
}

.document-card__content {
  padding: 16px;
  border-bottom: 1px solid var(--border-color, #e0e0e0);
}

.document-card__text {
  margin-bottom: 16px;
  line-height: 1.5;
}

.document-card__citation {
  background: var(--citation-bg, #f0f0f0);
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
  background: var(--secondary-color, #e0e0e0);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.document-card__actions {
  display: flex;
  padding: 12px 16px;
  gap: 8px;
  justify-content: flex-end;
}

.document-card__button {
  padding: 6px 12px;
  background: var(--button-bg, #f0f0f0);
  border: 1px solid var(--border-color, #e0e0e0);
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

.document-card__button:hover {
  background: var(--button-hover, #e0e0e0);
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

.research-panel__help {
  background: var(--help-bg, #f0f7ff);
  border-radius: 6px;
  padding: 16px;
  margin-bottom: 16px;
  border: 1px solid var(--help-border, #d0e3ff);
}

.research-panel__help h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: var(--help-title, #2c5282);
}

.research-panel__help p {
  margin: 0 0 12px 0;
  font-size: 14px;
  line-height: 1.5;
}

.research-panel__help ul {
  margin: 0 0 16px 0;
  padding-left: 20px;
}

.research-panel__help li {
  margin-bottom: 8px;
  font-size: 14px;
}

.research-panel__help-actions {
  display: flex;
  justify-content: flex-end;
}

.research-panel__help-button {
  padding: 6px 12px;
  background: var(--primary-color, #4a6cf7);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

.research-panel__tip {
  font-size: 13px;
  color: var(--text-secondary, #666666);
  margin-top: 12px;
}
</style>

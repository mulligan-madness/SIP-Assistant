<template>
  <div v-if="visible" class="research-panel">
    <div class="research-panel__header">
      <h2 class="research-panel__title">Research Results</h2>
      <button 
        class="research-panel__close-button"
        @click="$emit('toggle')"
        aria-label="Close Research Panel"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
    
    <!-- Search Form -->
    <div class="research-panel__search">
      <input 
        type="text" 
        v-model="searchQuery" 
        placeholder="Search for relevant documents..." 
        class="research-panel__search-input"
        @keyup.enter="performSearch"
      />
      <button 
        class="research-panel__search-button"
        @click="performSearch"
        :disabled="isSearching"
      >
        <span v-if="isSearching">Searching...</span>
        <span v-else>Search</span>
      </button>
    </div>
    
    <!-- Search Options -->
    <div class="research-panel__options">
      <div class="research-panel__option">
        <label for="limit">Results:</label>
        <select id="limit" v-model="searchOptions.limit" class="research-panel__select">
          <option value="3">3</option>
          <option value="5">5</option>
          <option value="10">10</option>
          <option value="15">15</option>
        </select>
      </div>
      <div class="research-panel__option">
        <label for="threshold">Threshold:</label>
        <select id="threshold" v-model="searchOptions.threshold" class="research-panel__select">
          <option value="0.5">0.5</option>
          <option value="0.7">0.7</option>
          <option value="0.8">0.8</option>
          <option value="0.9">0.9</option>
        </select>
      </div>
      <div class="research-panel__option research-panel__checkbox">
        <input type="checkbox" id="enhance" v-model="searchOptions.enhanceQuery">
        <label for="enhance">Enhance Query</label>
      </div>
      <div class="research-panel__option research-panel__checkbox">
        <input type="checkbox" id="summarize" v-model="searchOptions.summarize">
        <label for="summarize">Summarize</label>
      </div>
    </div>
    
    <div class="research-panel__content">
      <!-- Loading State -->
      <div v-if="isSearching" class="research-panel__loading">
        <div class="spinner"></div>
        <p>Searching for relevant documents...</p>
      </div>
      
      <!-- Empty State -->
      <div v-else-if="!searchResults && !researchData" class="research-panel__placeholder">
        <p>Enter a search query to find relevant governance documents.</p>
        <p>The system will use vector search to find the most semantically similar content.</p>
      </div>
      
      <!-- Error State -->
      <div v-else-if="searchError" class="research-panel__error">
        <p>{{ searchError }}</p>
        <button @click="clearError" class="research-panel__error-button">Try Again</button>
      </div>
      
      <!-- Results -->
      <div v-else class="research-panel__sections">
        <!-- Summary Section (if available) -->
        <div v-if="searchResults && searchResults.summary" class="research-section">
          <h3 class="research-section__title">Summary</h3>
          <div class="research-section__content">
            <div class="summary-card">
              <p class="summary-card__text" v-html="formatMarkdown(searchResults.summary)"></p>
            </div>
          </div>
        </div>
        
        <!-- Documents Section -->
        <div class="research-section">
          <h3 class="research-section__title">
            Relevant Documents
            <span v-if="searchResults && searchResults.results" class="research-section__count">
              ({{ searchResults.results.length }})
            </span>
          </h3>
          
          <div v-if="searchResults && searchResults.results && searchResults.results.length" class="research-section__content">
            <div v-for="(doc, index) in searchResults.results" :key="index" class="document-card">
              <div class="document-card__header">
                <h4 class="document-card__title">
                  {{ getDocumentTitle(doc) }}
                </h4>
                <span class="document-card__score">{{ (doc.score * 100).toFixed(1) }}% match</span>
              </div>
              
              <div class="document-card__meta">
                <span class="document-card__source">{{ getDocumentSource(doc) }}</span>
                <span class="document-card__date">{{ getDocumentDate(doc) }}</span>
              </div>
              
              <p class="document-card__excerpt">{{ doc.text }}</p>
              
              <div class="document-card__citation">
                <strong>Citation:</strong> {{ doc.citation || 'No citation available' }}
              </div>
              
              <div class="document-card__actions">
                <button 
                  class="document-card__button"
                  @click="copyToClipboard(doc.text)"
                >
                  Copy Text
                </button>
                <button 
                  class="document-card__button"
                  @click="copyToClipboard(doc.citation)"
                >
                  Copy Citation
                </button>
              </div>
            </div>
          </div>
          
          <div v-else-if="researchData && researchData.documents && researchData.documents.length" class="research-section__content">
            <!-- Fallback to original research data if available -->
            <div v-for="(doc, index) in researchData.documents" :key="index" class="document-card">
              <h4 class="document-card__title">{{ doc.title || `Document ${index + 1}` }}</h4>
              <div class="document-card__meta">
                <span class="document-card__source">{{ doc.source || 'Unknown source' }}</span>
                <span class="document-card__date">{{ doc.date || 'No date' }}</span>
              </div>
              <p class="document-card__excerpt">{{ doc.excerpt || 'No excerpt available' }}</p>
              <div class="document-card__actions">
                <button class="document-card__button">View Full</button>
                <button class="document-card__button">Cite</button>
              </div>
            </div>
          </div>
          
          <p v-else class="research-section__empty">No documents found. Try adjusting your search query or options.</p>
        </div>
        
        <!-- Themes Section -->
        <div class="research-section">
          <h3 class="research-section__title">Key Themes</h3>
          <div v-if="researchData.themes && researchData.themes.length" class="research-section__content">
            <div v-for="(theme, index) in researchData.themes" :key="index" class="theme-item">
              <h4 class="theme-item__title">{{ theme.title || `Theme ${index + 1}` }}</h4>
              <p class="theme-item__description">{{ theme.description || 'No description available' }}</p>
              <div class="theme-item__tags">
                <span v-for="(tag, tagIndex) in theme.tags || []" :key="tagIndex" class="theme-tag">
                  {{ tag }}
                </span>
              </div>
            </div>
          </div>
          <p v-else class="research-section__empty">No themes identified.</p>
        </div>
        
        <!-- Recommendations Section -->
        <div class="research-section">
          <h3 class="research-section__title">Recommendations</h3>
          <div v-if="researchData.recommendations && researchData.recommendations.length" class="research-section__content">
            <div v-for="(rec, index) in researchData.recommendations" :key="index" class="recommendation-item">
              <h4 class="recommendation-item__title">{{ rec.title || `Recommendation ${index + 1}` }}</h4>
              <p class="recommendation-item__description">{{ rec.description || 'No description available' }}</p>
              <div class="recommendation-item__priority" :class="`priority-${rec.priority || 'medium'}`">
                {{ rec.priority ? rec.priority.charAt(0).toUpperCase() + rec.priority.slice(1) : 'Medium' }} Priority
              </div>
            </div>
          </div>
          <p v-else class="research-section__empty">No recommendations available.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, ref, reactive } from 'vue';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

// Define props
const props = defineProps({
  visible: {
    type: Boolean,
    required: true,
    default: false
  },
  researchData: {
    type: Object,
    required: false,
    default: () => ({})
  }
});

// Define emits
defineEmits(['toggle']);

// Search state
const searchQuery = ref('');
const isSearching = ref(false);
const searchResults = ref(null);
const searchError = ref(null);
const searchOptions = reactive({
  limit: 5,
  threshold: 0.7,
  enhanceQuery: false,
  summarize: true
});

// Methods
const performSearch = async () => {
  if (!searchQuery.value.trim()) {
    searchError.value = 'Please enter a search query';
    return;
  }
  
  try {
    isSearching.value = true;
    searchError.value = null;
    
    // Determine which endpoint to use based on options
    const endpoint = searchOptions.enhanceQuery || searchOptions.summarize 
      ? '/api/agent/retrieve' 
      : '/api/vector/search';
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: searchQuery.value,
        limit: parseInt(searchOptions.limit),
        threshold: parseFloat(searchOptions.threshold),
        enhanceQuery: searchOptions.enhanceQuery,
        summarize: searchOptions.summarize
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Search failed');
    }
    
    const data = await response.json();
    searchResults.value = data;
  } catch (error) {
    console.error('Search error:', error);
    searchError.value = error.message || 'An error occurred during search';
  } finally {
    isSearching.value = false;
  }
};

const clearError = () => {
  searchError.value = null;
};

const getDocumentTitle = (doc) => {
  if (doc.metadata && doc.metadata.title) {
    return doc.metadata.title;
  }
  
  // Try to extract a title from the first line
  const firstLine = doc.text.split('\n')[0].trim();
  if (firstLine && firstLine.length < 100) {
    return firstLine;
  }
  
  return 'Untitled Document';
};

const getDocumentSource = (doc) => {
  if (doc.metadata && doc.metadata.source) {
    return doc.metadata.source;
  }
  return 'Unknown source';
};

const getDocumentDate = (doc) => {
  if (doc.metadata && doc.metadata.date) {
    return doc.metadata.date;
  }
  return 'No date';
};

const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text)
    .then(() => {
      // Could add a toast notification here
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
    return DOMPurify.sanitize(String(text)); // Return sanitized text if rendering fails
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
  background: var(--surface-color);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 900;
}

.research-panel__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid var(--border-color);
}

.research-panel__title {
  margin: 0;
  font-size: 1.2rem;
  color: var(--text-color);
}

.research-panel__close-button {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.research-panel__close-button:hover {
  background: var(--button-secondary-hover);
  color: var(--text-color);
}

.research-panel__search {
  display: flex;
  padding: 15px 20px;
  border-bottom: 1px solid var(--border-color);
  gap: 10px;
}

.research-panel__search-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 0.9rem;
  background: var(--input-background);
  color: var(--text-color);
}

.research-panel__search-button {
  padding: 8px 16px;
  background: var(--button-primary);
  color: var(--button-text-primary);
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.research-panel__search-button:hover:not(:disabled) {
  background: var(--button-primary-hover);
}

.research-panel__search-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.research-panel__options {
  display: flex;
  flex-wrap: wrap;
  padding: 10px 20px;
  border-bottom: 1px solid var(--border-color);
  gap: 15px;
  font-size: 0.85rem;
}

.research-panel__option {
  display: flex;
  align-items: center;
  gap: 5px;
}

.research-panel__select {
  padding: 4px 8px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--input-background);
  color: var(--text-color);
  font-size: 0.85rem;
}

.research-panel__checkbox {
  display: flex;
  align-items: center;
  gap: 5px;
}

.research-panel__content {
  padding: 0;
  overflow-y: auto;
  flex: 1;
}

.research-panel__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: var(--text-secondary);
}

.spinner {
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top: 3px solid var(--button-primary);
  width: 30px;
  height: 30px;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.research-panel__placeholder {
  color: var(--text-secondary);
  text-align: center;
  padding: 40px 20px;
}

.research-panel__error {
  color: var(--error-color);
  text-align: center;
  padding: 30px 20px;
}

.research-panel__error-button {
  margin-top: 15px;
  padding: 8px 16px;
  background: var(--button-secondary);
  color: var(--button-text-secondary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.research-panel__error-button:hover {
  background: var(--button-secondary-hover);
}

.research-panel__sections {
  display: flex;
  flex-direction: column;
}

.research-section {
  padding: 15px 20px;
  border-bottom: 1px solid var(--border-color);
}

.research-section:last-child {
  border-bottom: none;
}

.research-section__title {
  margin: 0 0 15px 0;
  font-size: 1rem;
  color: var(--text-color);
  display: flex;
  align-items: center;
}

.research-section__count {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-left: 8px;
}

.research-section__content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.research-section__empty {
  color: var(--text-secondary);
  font-style: italic;
  margin: 10px 0;
}

.summary-card {
  background: var(--surface-color-secondary);
  border-radius: 6px;
  padding: 15px;
  border: 1px solid var(--border-color);
}

.summary-card__text {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--text-color);
}

.document-card {
  background: var(--surface-color-secondary);
  border-radius: 6px;
  padding: 15px;
  border: 1px solid var(--border-color);
}

.document-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.document-card__title {
  margin: 0;
  font-size: 0.95rem;
  color: var(--text-color);
  flex: 1;
}

.document-card__score {
  font-size: 0.8rem;
  background: var(--accent-color-light);
  color: var(--accent-color);
  padding: 2px 6px;
  border-radius: 12px;
  font-weight: 500;
}

.document-card__meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-bottom: 10px;
}

.document-card__excerpt {
  font-size: 0.9rem;
  margin: 0 0 12px 0;
  color: var(--text-color);
  line-height: 1.4;
  max-height: 200px;
  overflow-y: auto;
}

.document-card__citation {
  font-size: 0.85rem;
  margin: 0 0 12px 0;
  color: var(--text-secondary);
  padding: 8px;
  background: var(--surface-color-tertiary);
  border-radius: 4px;
  border-left: 3px solid var(--accent-color);
}

.document-card__actions {
  display: flex;
  gap: 8px;
}

.document-card__button {
  padding: 6px 10px;
  font-size: 0.8rem;
  background: var(--button-secondary);
  color: var(--button-text-secondary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.document-card__button:hover {
  background: var(--button-primary);
  color: var(--button-text-primary);
}

.theme-item {
  background: var(--surface-color-secondary);
  border-radius: 6px;
  padding: 12px;
  border: 1px solid var(--border-color);
}

.theme-item__title {
  margin: 0 0 8px 0;
  font-size: 0.95rem;
  color: var(--text-color);
}

.theme-item__description {
  font-size: 0.9rem;
  margin: 0 0 10px 0;
  color: var(--text-color);
  line-height: 1.4;
}

.theme-item__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.theme-tag {
  padding: 2px 8px;
  background: var(--button-secondary);
  color: var(--button-text-secondary);
  border-radius: 12px;
  font-size: 0.75rem;
}

.recommendation-item {
  background: var(--surface-color-secondary);
  border-radius: 6px;
  padding: 12px;
  border: 1px solid var(--border-color);
}

.recommendation-item__title {
  margin: 0 0 8px 0;
  font-size: 0.95rem;
  color: var(--text-color);
}

.recommendation-item__description {
  font-size: 0.9rem;
  margin: 0 0 10px 0;
  color: var(--text-color);
  line-height: 1.4;
}

.recommendation-item__priority {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.priority-high {
  background: rgba(255, 107, 107, 0.2);
  color: #ff6b6b;
}

.priority-medium {
  background: rgba(255, 159, 67, 0.2);
  color: #ff9f43;
}

.priority-low {
  background: rgba(46, 213, 115, 0.2);
  color: #2ed573;
}
</style>

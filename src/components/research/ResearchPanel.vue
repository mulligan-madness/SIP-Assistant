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
    <div class="research-panel__content">
      <div v-if="!researchData || Object.keys(researchData).length === 0" class="research-panel__placeholder">
        <p>No research data available yet.</p>
        <p>Future versions will show relevant governance documents here.</p>
      </div>
      <div v-else class="research-panel__sections">
        <!-- Documents Section -->
        <div class="research-section">
          <h3 class="research-section__title">Relevant Documents</h3>
          <div v-if="researchData.documents && researchData.documents.length" class="research-section__content">
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
          <p v-else class="research-section__empty">No documents found.</p>
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
import { defineProps, defineEmits } from 'vue';

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
</script>

<style scoped>
.research-panel {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 400px;
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

.research-panel__content {
  padding: 0;
  overflow-y: auto;
  flex: 1;
}

.research-panel__placeholder {
  color: var(--text-secondary);
  text-align: center;
  padding: 40px 0;
}

.research-panel__sections {
  display: flex;
  flex-direction: column;
  gap: 20px;
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

/* Document Card Styles */
.document-card {
  background: var(--surface-color-secondary);
  border-radius: 6px;
  padding: 12px;
  border: 1px solid var(--border-color);
}

.document-card__title {
  margin: 0 0 8px 0;
  font-size: 0.95rem;
  color: var(--text-color);
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
}

.document-card__actions {
  display: flex;
  gap: 8px;
}

.document-card__button {
  padding: 4px 8px;
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

/* Theme Item Styles */
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

/* Recommendation Item Styles */
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

/* Responsive adjustments */
@media (min-width: 768px) {
  .research-panel {
    width: 450px;
  }
}
</style>

<template>
  <div class="research-panel__help">
    <h3>How to Use Research</h3>
    <p>Search for governance-related topics to find relevant documents from the knowledge base.</p>
    <ul>
      <li><strong>Search:</strong> Enter keywords and press Enter or click Search</li>
      <li><strong>View Content:</strong> Click "View Content" to read the full document</li>
      <li><strong>Reference:</strong> Click "Reference" to insert a citation into your chat</li>
    </ul>
    <div class="research-panel__help-actions">
      <button @click="dismiss" class="research-panel__help-button">Got it!</button>
    </div>
  </div>
</template>

<script setup>
import { defineEmits } from 'vue';

/**
 * Help section component for the research panel
 * @component
 */
const emit = defineEmits([
  /**
   * Emitted when the help section is dismissed
   * @event dismiss
   */
  'dismiss'
]);

/**
 * Emit the dismiss event
 */
const dismiss = () => {
  emit('dismiss');
};
</script>

<style scoped>
.research-panel__help {
  background: var(--surface-color-secondary, #2c2c2e);
  border-radius: 6px;
  padding: 16px;
  margin-bottom: 16px;
  border: 1px solid var(--border-color, #333);
}

/* Remove the duplicate hyperlink styling and use a class instead */
:deep(.research-panel__help) {
  /* This will apply the markdown-content styling to the help section */
  composes: markdown-content from global;
}

.research-panel__help h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: var(--primary-color, #bb86fc);
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
  background: var(--button-primary, #7c5ddf);
  color: var(--button-text-primary, #ffffff);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: background-color 0.2s ease;
}

.research-panel__help-button:hover {
  background: var(--button-primary-hover, #9579f0);
}
</style> 
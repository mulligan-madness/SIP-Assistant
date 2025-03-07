<template>
  <div class="research-panel__header">
    <h2 class="research-panel__title">{{ title }}</h2>
    <button 
      class="research-panel__close-button"
      @click="close"
      aria-label="Close Research Panel"
      title="Close panel"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

/**
 * Panel header component for the research panel
 * @component
 */
const props = defineProps({
  /**
   * The title of the panel
   */
  title: {
    type: String,
    default: 'Research Results'
  }
});

/**
 * Events emitted by the component
 */
const emit = defineEmits([
  /**
   * Emitted when the close button is clicked
   * @event close-panel
   */
  'close-panel'
]);

/**
 * Emit the close-panel event
 */
const close = () => {
  emit('close-panel');
};
</script>

<style scoped>
.research-panel__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color, #333);
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
  color: var(--text-secondary, #aaa);
  border-radius: 4px;
}

.research-panel__close-button:hover {
  background: var(--hover-color, #3c3c3e);
}
</style> 
<template>
  <div class="progress-display">
    <div class="progress-display__actions">
      <button 
        v-if="canCancel"
        class="progress-display__button progress-display__button--cancel"
        @click="$emit('cancel')"
        :disabled="isComplete"
      >
        Cancel
      </button>
      <button 
        v-if="isComplete"
        class="progress-display__button progress-display__button--close"
        @click="$emit('close')"
      >
        Close
      </button>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

/**
 * Progress display component for indexing operations
 * @component
 */
const props = defineProps({
  /**
   * Whether the indexing operation can be cancelled
   */
  canCancel: {
    type: Boolean,
    default: true
  },
  /**
   * Whether the indexing operation is complete
   */
  isComplete: {
    type: Boolean,
    default: false
  }
});

/**
 * Events emitted by the component
 */
const emit = defineEmits([
  /**
   * Emitted when the cancel button is clicked
   * @event cancel
   */
  'cancel',
  
  /**
   * Emitted when the close button is clicked
   * @event close
   */
  'close'
]);
</script>

<style scoped>
.progress-display {
  margin-top: 16px;
}

.progress-display__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.progress-display__button {
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.progress-display__button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.progress-display__button--cancel {
  background-color: var(--danger-color, #e74c3c);
  color: white;
  border: none;
}

.progress-display__button--cancel:hover:not(:disabled) {
  background-color: var(--danger-color-hover, #c0392b);
}

.progress-display__button--close {
  background-color: var(--accent-color, #3498db);
  color: white;
  border: none;
}

.progress-display__button--close:hover {
  background-color: var(--accent-color-hover, #2980b9);
}
</style> 
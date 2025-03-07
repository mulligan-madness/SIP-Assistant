<template>
  <div class="log-viewer">
    <div class="log-viewer__header">
      <h4>Process Logs</h4>
      <button 
        class="log-viewer__toggle" 
        @click="toggleLogs"
      >
        {{ showLogs ? 'Hide' : 'Show' }}
      </button>
    </div>
    <transition name="slide">
      <div class="log-viewer__content" v-if="showLogs">
        <div 
          v-for="(log, index) in logs" 
          :key="index" 
          class="log-viewer__log"
          :class="{ 'log-viewer__log--error': log.type === 'error' }"
        >
          <span class="log-viewer__log-time">{{ formatLogTime(log.timestamp) }}</span>
          <span class="log-viewer__log-message">{{ log.message }}</span>
        </div>
        <div v-if="logs.length === 0" class="log-viewer__log log-viewer__log--empty">
          No logs available yet
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits } from 'vue';

/**
 * Log viewer component for displaying process logs
 * @component
 */
const props = defineProps({
  /**
   * Array of log objects
   */
  logs: {
    type: Array,
    required: true,
    default: () => []
  },
  /**
   * Initial state of log visibility
   */
  initialShowLogs: {
    type: Boolean,
    default: true
  }
});

/**
 * Events emitted by the component
 */
const emit = defineEmits([
  /**
   * Emitted when logs are toggled (shown/hidden)
   * @event toggle-logs
   * @property {boolean} visible - Whether logs are visible
   */
  'toggle-logs'
]);

// Local state
const showLogs = ref(props.initialShowLogs);

/**
 * Toggle log visibility
 */
const toggleLogs = () => {
  showLogs.value = !showLogs.value;
  emit('toggle-logs', showLogs.value);
};

/**
 * Format log timestamp to readable time
 * @param {number} timestamp - The log timestamp
 * @returns {string} Formatted time string
 */
const formatLogTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString();
};
</script>

<style scoped>
.log-viewer {
  background-color: var(--surface-color-secondary);
  border-radius: 4px;
  overflow: hidden;
}

.log-viewer__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: var(--surface-color-tertiary);
}

.log-viewer__header h4 {
  margin: 0;
  font-size: 0.9rem;
  color: var(--text-color);
}

.log-viewer__toggle {
  background-color: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.log-viewer__toggle:hover {
  background-color: var(--surface-color);
  color: var(--text-color);
}

.log-viewer__content {
  max-height: 200px;
  overflow-y: auto;
  padding: 8px 12px;
}

.log-viewer__log {
  font-family: monospace;
  font-size: 0.8rem;
  padding: 4px 0;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.1);
}

.log-viewer__log:last-child {
  border-bottom: none;
}

.log-viewer__log--error {
  color: #ff5555;
}

.log-viewer__log--empty {
  color: var(--text-secondary);
  text-align: center;
  padding: 16px;
}

.log-viewer__log-time {
  color: var(--text-secondary);
  margin-right: 8px;
}

.slide-enter-active,
.slide-leave-active {
  transition: max-height 0.3s ease;
  max-height: 200px;
  overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
  max-height: 0;
}
</style> 
<template>
  <div class="status-bar">
    <div class="status-bar__header">
      <h3 class="status-bar__title">{{ title }}</h3>
      <div class="status-bar__timer">{{ formattedTime }}</div>
    </div>
    
    <div class="status-bar__progress">
      <div class="status-bar__progress-bar" :style="{ width: `${progressPercentage}%` }"></div>
    </div>
    
    <div class="status-bar__stats">
      <div class="status-bar__stat">
        <span class="status-bar__stat-label">Processed:</span>
        <span class="status-bar__stat-value">{{ processed }} / {{ total }}</span>
      </div>
      <div class="status-bar__stat">
        <span class="status-bar__stat-label">Status:</span>
        <span class="status-bar__stat-value">{{ status }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, defineProps, defineEmits } from 'vue';

/**
 * Status bar component for displaying indexing progress
 * @component
 */
const props = defineProps({
  /**
   * The title of the indexing operation
   */
  title: {
    type: String,
    required: true,
    validator: function(value) {
      return value.length > 0;
    }
  },
  /**
   * The number of items processed
   */
  processed: {
    type: Number,
    required: true,
    default: 0,
    validator: function(value) {
      return value >= 0;
    }
  },
  /**
   * The total number of items to process
   */
  total: {
    type: Number,
    required: true,
    default: 0,
    validator: function(value) {
      return value >= 0;
    }
  },
  /**
   * The current status message
   */
  status: {
    type: String,
    required: true,
    default: 'Initializing...'
  },
  /**
   * The formatted elapsed time (format: "0:00")
   */
  formattedTime: {
    type: String,
    required: true,
    default: '0:00',
    validator: function(value) {
      return /^\d+:\d{2}$/.test(value);
    }
  }
});

/**
 * Computed percentage of progress
 */
const progressPercentage = computed(() => {
  if (props.total === 0) return 0;
  return Math.min(100, Math.round((props.processed / props.total) * 100));
});
</script>

<style scoped>
.status-bar {
  margin-bottom: 16px;
}

.status-bar__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.status-bar__title {
  margin: 0;
  font-size: 1.2rem;
  color: var(--text-color);
}

.status-bar__timer {
  font-family: monospace;
  font-size: 1.1rem;
  padding: 4px 8px;
  background-color: var(--surface-color-secondary);
  border-radius: 4px;
  color: var(--accent-color);
}

.status-bar__progress {
  height: 8px;
  background-color: var(--surface-color-tertiary);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 12px;
}

.status-bar__progress-bar {
  height: 100%;
  background-color: var(--accent-color);
  transition: width 0.5s ease;
}

.status-bar__stats {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}

.status-bar__stat {
  display: flex;
  flex-direction: column;
}

.status-bar__stat-label {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.status-bar__stat-value {
  font-size: 1rem;
  color: var(--text-color);
}
</style> 
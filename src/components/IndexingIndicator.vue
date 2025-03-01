<template>
  <div class="indexing-indicator" v-if="visible">
    <div class="indexing-indicator__header">
      <h3 class="indexing-indicator__title">{{ title }}</h3>
      <div class="indexing-indicator__timer">{{ formattedTime }}</div>
    </div>
    
    <div class="indexing-indicator__progress">
      <div class="indexing-indicator__progress-bar" :style="{ width: `${progressPercentage}%` }"></div>
    </div>
    
    <div class="indexing-indicator__stats">
      <div class="indexing-indicator__stat">
        <span class="indexing-indicator__stat-label">Processed:</span>
        <span class="indexing-indicator__stat-value">{{ processed }} / {{ total }}</span>
      </div>
      <div class="indexing-indicator__stat">
        <span class="indexing-indicator__stat-label">Status:</span>
        <span class="indexing-indicator__stat-value">{{ status }}</span>
      </div>
    </div>
    
    <div class="indexing-indicator__logs">
      <div class="indexing-indicator__logs-header">
        <h4>Process Logs</h4>
        <button 
          class="indexing-indicator__logs-toggle" 
          @click="toggleLogs"
        >
          {{ showLogs ? 'Hide' : 'Show' }}
        </button>
      </div>
      <transition name="slide">
        <div class="indexing-indicator__logs-content" v-if="showLogs">
          <div 
            v-for="(log, index) in logs" 
            :key="index" 
            class="indexing-indicator__log"
            :class="{ 'indexing-indicator__log--error': log.type === 'error' }"
          >
            <span class="indexing-indicator__log-time">{{ formatLogTime(log.timestamp) }}</span>
            <span class="indexing-indicator__log-message">{{ log.message }}</span>
          </div>
          <div v-if="logs.length === 0" class="indexing-indicator__log indexing-indicator__log--empty">
            No logs available yet
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'

export default {
  name: 'IndexingIndicator',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: 'Indexing Forum Data'
    },
    initialStatus: {
      type: String,
      default: 'Initializing...'
    },
    total: {
      type: Number,
      default: 0
    }
  },
  setup(props, { emit }) {
    const processed = ref(0)
    const status = ref(props.initialStatus)
    const logs = ref([])
    const showLogs = ref(true)
    const startTime = ref(null)
    const elapsedTime = ref(0)
    const intervalId = ref(null)
    
    const progressPercentage = computed(() => {
      if (props.total === 0) return 0
      return Math.min(100, Math.round((processed.value / props.total) * 100))
    })
    
    const formattedTime = computed(() => {
      const seconds = Math.floor(elapsedTime.value / 1000)
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
    })
    
    const startTimer = () => {
      if (intervalId.value) return
      
      startTime.value = Date.now()
      intervalId.value = setInterval(() => {
        elapsedTime.value = Date.now() - startTime.value
      }, 1000)
    }
    
    const stopTimer = () => {
      if (intervalId.value) {
        clearInterval(intervalId.value)
        intervalId.value = null
      }
    }
    
    const resetTimer = () => {
      stopTimer()
      elapsedTime.value = 0
      startTime.value = null
    }
    
    const updateProgress = (newProcessed, newTotal, newStatus) => {
      processed.value = newProcessed
      if (newTotal && newTotal > 0) {
        emit('update:total', newTotal)
      }
      if (newStatus) {
        status.value = newStatus
      }
      
      // If we're done, stop the timer
      if (processed.value === props.total && props.total > 0) {
        stopTimer()
        status.value = 'Complete'
        emit('complete')
      }
    }
    
    const addLog = (message, type = 'info') => {
      logs.value.unshift({
        message,
        type,
        timestamp: Date.now()
      })
      
      // Keep logs limited to recent entries
      if (logs.value.length > 100) {
        logs.value = logs.value.slice(0, 100)
      }
    }
    
    const toggleLogs = () => {
      showLogs.value = !showLogs.value
    }
    
    const formatLogTime = (timestamp) => {
      const date = new Date(timestamp)
      return date.toLocaleTimeString()
    }
    
    // Clean up on unmount
    onUnmounted(() => {
      stopTimer()
    })
    
    // Watch for visibility changes
    onMounted(() => {
      if (props.visible) {
        // Start timer as soon as component is visible
        startTimer()
      }
    })
    
    return {
      processed,
      status,
      logs,
      progressPercentage,
      formattedTime,
      showLogs,
      updateProgress,
      addLog,
      toggleLogs,
      formatLogTime,
      resetTimer
    }
  }
}
</script>

<style scoped>
.indexing-indicator {
  background-color: var(--surface-color);
  border-radius: 8px;
  border: 1px solid var(--border-color);
  padding: 16px;
  margin-bottom: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.indexing-indicator__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.indexing-indicator__title {
  margin: 0;
  font-size: 1.2rem;
  color: var(--text-color);
}

.indexing-indicator__timer {
  font-family: monospace;
  font-size: 1.1rem;
  padding: 4px 8px;
  background-color: var(--surface-color-secondary);
  border-radius: 4px;
  color: var(--accent-color);
}

.indexing-indicator__progress {
  height: 8px;
  background-color: var(--surface-color-tertiary);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 12px;
}

.indexing-indicator__progress-bar {
  height: 100%;
  background-color: var(--accent-color);
  transition: width 0.5s ease;
}

.indexing-indicator__stats {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}

.indexing-indicator__stat {
  display: flex;
  flex-direction: column;
}

.indexing-indicator__stat-label {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.indexing-indicator__stat-value {
  font-size: 1rem;
  color: var(--text-color);
}

.indexing-indicator__logs {
  background-color: var(--surface-color-secondary);
  border-radius: 4px;
  overflow: hidden;
}

.indexing-indicator__logs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: var(--surface-color-tertiary);
}

.indexing-indicator__logs-header h4 {
  margin: 0;
  font-size: 0.9rem;
  color: var(--text-color);
}

.indexing-indicator__logs-toggle {
  background-color: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.indexing-indicator__logs-toggle:hover {
  background-color: var(--surface-color);
  color: var(--text-color);
}

.indexing-indicator__logs-content {
  max-height: 200px;
  overflow-y: auto;
  padding: 8px 12px;
}

.indexing-indicator__log {
  font-family: monospace;
  font-size: 0.8rem;
  padding: 4px 0;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.1);
}

.indexing-indicator__log:last-child {
  border-bottom: none;
}

.indexing-indicator__log--error {
  color: #ff5555;
}

.indexing-indicator__log--empty {
  color: var(--text-secondary);
  text-align: center;
  padding: 16px;
}

.indexing-indicator__log-time {
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
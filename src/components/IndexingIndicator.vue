<template>
  <div class="indexing-indicator" v-if="visible">
    <!-- Status Bar Component -->
    <StatusBar
      :title="title"
      :processed="processed"
      :total="total"
      :status="status"
      :formattedTime="formattedTime"
    />
    
    <!-- Log Viewer Component -->
    <LogViewer
      :logs="logs"
      :initialShowLogs="showLogs"
      @toggle-logs="showLogs = $event"
    />
    
    <!-- Progress Display Component -->
    <ProgressDisplay
      :canCancel="true"
      :isComplete="processed === total && total > 0"
      @cancel="$emit('cancel')"
      @close="$emit('close')"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import StatusBar from './indexing/StatusBar.vue'
import LogViewer from './indexing/LogViewer.vue'
import ProgressDisplay from './indexing/ProgressDisplay.vue'

/**
 * Component for displaying indexing progress and status
 * @component
 */
export default {
  name: 'IndexingIndicator',
  components: {
    StatusBar,
    LogViewer,
    ProgressDisplay
  },
  props: {
    /**
     * Whether the indicator is visible
     */
    visible: {
      type: Boolean,
      default: false,
      required: false
    },
    /**
     * The title of the indexing operation
     */
    title: {
      type: String,
      default: 'Indexing Forum Data',
      required: false,
      validator: function(value) {
        return value.length > 0;
      }
    },
    /**
     * The initial status message to display
     */
    initialStatus: {
      type: String,
      default: 'Initializing...',
      required: false
    },
    /**
     * The total number of items to process
     */
    total: {
      type: Number,
      default: 0,
      required: false,
      validator: function(value) {
        return value >= 0;
      }
    }
  },
  emits: ['update:total', 'complete', 'cancel', 'close'],
  setup(props, { emit }) {
    const processed = ref(0)
    const status = ref(props.initialStatus)
    const logs = ref([])
    const showLogs = ref(true)
    const startTime = ref(null)
    const elapsedTime = ref(0)
    const intervalId = ref(null)
    
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
      formattedTime,
      showLogs,
      updateProgress,
      addLog,
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
</style> 
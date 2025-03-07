<template>
  <div class="context-generator">
    <button 
      class="action-button"
      @click="regenerateContext" 
      :disabled="generating"
    >
      Regenerate Context
    </button>
    <div v-if="generating" class="generation-status">
      <div class="loading-spinner"></div>
      <div class="generation-info">
        <div class="generation-message">{{ contextPun }}</div>
        <div class="generation-timer">{{ formatTime(elapsedTime) }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';

/**
 * Component for managing context generation
 * @component
 */
export default {
  name: 'ContextGenerator',
  /**
   * Events emitted by the component
   */
  emits: [
    /**
     * Emitted when a status update occurs
     * @event status-update
     * @property {Object} status - The status object
     * @property {string} status.message - The status message
     * @property {string} status.type - The status type (info, success, error)
     */
    'status-update'
  ],
  setup(props, { emit }) {
    // State
    const generating = ref(false);
    const elapsedTime = ref(0);
    const contextPun = ref('');
    let timer = null;
    let punInterval = null;

    const contextPuns = [
      "I'm not just context switching, I'm context flipping!",
      "This context is taking so long, it must be text-ercising",
      "Getting in shape with some context-ual fitness",
      "Don't worry, I'm just having a context identity crisis",
      "This is quite the context-ual situation we're in",
      "I'm not stalling, I'm building context-ual suspense",
      "This is a pretty deep context we're getting into",
      "Making context great again, one token at a time",
      "Hold tight, we're in a context-sensitive area",
      "This context is like a good book - full of plot twists",
      "Context is loading... please enjoy these dad jokes",
      "Warning: Context overload imminent!",
      "Brewing up some fresh context for you",
      "Context.exe has encountered a pun exception",
      "Loading context... please don't feed the AI"
    ];

    // Methods
    const formatTime = (seconds) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    /**
     * Emit a status update
     * @param {string} message - The status message
     * @param {string} type - The status type (info, success, error)
     */
    const setStatus = (message, type = 'info') => {
      emit('status-update', { message, type });
    };

    const regenerateContext = async () => {
      generating.value = true;
      elapsedTime.value = 0;
      contextPun.value = contextPuns[0];
      let punIndex = 1;

      // Start timer
      timer = setInterval(() => {
        elapsedTime.value++;
      }, 1000);

      // Rotate puns every 5 seconds
      punInterval = setInterval(() => {
        contextPun.value = contextPuns[punIndex];
        punIndex = (punIndex + 1) % contextPuns.length;
      }, 5000);

      try {
        const response = await fetch('/api/generate-context', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
          throw new Error('Failed to regenerate context');
        }
        
        setStatus('Context regenerated successfully', 'success');
      } catch (error) {
        setStatus(error.message, 'error');
      } finally {
        cleanup();
        generating.value = false;
      }
    };

    const cleanup = () => {
      if (timer) clearInterval(timer);
      if (punInterval) clearInterval(punInterval);
    };

    return {
      generating,
      elapsedTime,
      contextPun,
      formatTime,
      regenerateContext,
      cleanup
    };
  }
};
</script>

<style scoped>
.generation-status {
  margin-top: 15px;
  padding: 15px;
  background: var(--surface-color);
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 15px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid var(--text-color);
  border-top: 3px solid var(--button-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.generation-info {
  flex: 1;
}

.generation-message {
  color: var(--text-color);
  font-size: 0.9rem;
  margin-bottom: 4px;
}

.generation-timer {
  color: var(--text-secondary);
  font-size: 0.8rem;
  font-family: monospace;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style> 
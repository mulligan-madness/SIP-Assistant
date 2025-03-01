<template>
  <div class="settings-section">
    <h3>Data Management</h3>
    <div class="button-group">
      <button 
        class="action-button"
        @click="scrapeForum" 
        :disabled="scraping || generatingContext"
      >
        Scrape Fresh Forum Data
      </button>
      <button 
        class="action-button"
        @click="regenerateContext" 
        :disabled="generatingContext || scraping"
      >
        Regenerate Context
      </button>
    </div>
    <div v-if="scraping" class="scraping-status">
      <div class="loading-spinner"></div>
      <div class="scraping-info">
        <div class="scraping-message">{{ scrapingMessage }}</div>
        <div class="scraping-timer">{{ formatTime(elapsedTime) }}</div>
      </div>
    </div>
    <div v-if="generatingContext" class="scraping-status">
      <div class="loading-spinner"></div>
      <div class="scraping-info">
        <div class="scraping-message">{{ contextPun }}</div>
        <div class="scraping-timer">{{ formatTime(contextTime) }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';

export default {
  name: 'DataManagementSettings',
  emits: ['status-update'],
  setup(props, { emit }) {
    // State
    const scraping = ref(false);
    const generatingContext = ref(false);
    const elapsedTime = ref(0);
    const contextTime = ref(0);
    const scrapingMessage = ref('');
    const contextPun = ref('');
    let timerInterval = null;
    let contextInterval = null;
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

    const updateScrapingMessage = (time) => {
      if (time <= 2) {
        scrapingMessage.value = 'Initializing scraper...';
      } else if (time <= 5) {
        scrapingMessage.value = 'Fetching SIP proposals...';
      } else if (time <= 8) {
        scrapingMessage.value = 'Processing forum content...';
      } else if (time <= 12) {
        scrapingMessage.value = 'Analyzing SIP data...';
      } else {
        scrapingMessage.value = 'Finalizing data collection...';
      }
    };

    const setStatus = (message, type = 'info') => {
      emit('status-update', { message, type });
    };

    const scrapeForum = async () => {
      scraping.value = true;
      elapsedTime.value = 0;
      scrapingMessage.value = 'Initializing scraper...';
      
      // Start timer
      timerInterval = setInterval(() => {
        elapsedTime.value++;
        updateScrapingMessage(elapsedTime.value);
      }, 1000);

      try {
        const response = await fetch('/api/load-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rescrape: true })
        });
        
        if (!response.ok) {
          throw new Error('Failed to scrape forum data');
        }
        
        const data = await response.json();
        setStatus(`Successfully scraped ${data.count} SIPs`, 'success');
      } catch (error) {
        setStatus(error.message, 'error');
      } finally {
        if (timerInterval) {
          clearInterval(timerInterval);
        }
        scraping.value = false;
      }
    };

    const regenerateContext = async () => {
      generatingContext.value = true;
      contextTime.value = 0;
      contextPun.value = contextPuns[0];
      let punIndex = 1;

      // Start timer
      contextInterval = setInterval(() => {
        contextTime.value++;
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
        if (contextInterval) clearInterval(contextInterval);
        if (punInterval) clearInterval(punInterval);
        generatingContext.value = false;
      }
    };

    const cleanup = () => {
      if (timerInterval) clearInterval(timerInterval);
      if (contextInterval) clearInterval(contextInterval);
      if (punInterval) clearInterval(punInterval);
    };

    return {
      scraping,
      generatingContext,
      elapsedTime,
      contextTime,
      scrapingMessage,
      contextPun,
      formatTime,
      scrapeForum,
      regenerateContext,
      cleanup
    };
  }
};
</script>

<style scoped>
.scraping-status {
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

.scraping-info {
  flex: 1;
}

.scraping-message {
  color: var(--text-color);
  font-size: 0.9rem;
  margin-bottom: 4px;
}

.scraping-timer {
  color: var(--text-secondary);
  font-size: 0.8rem;
  font-family: monospace;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>

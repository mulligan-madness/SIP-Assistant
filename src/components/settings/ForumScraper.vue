<template>
  <div class="forum-scraper">
    <button 
      class="action-button"
      @click="scrapeForum" 
      :disabled="scraping"
    >
      Scrape Fresh Forum Data
    </button>
    <div v-if="scraping" class="scraping-status">
      <div class="loading-spinner"></div>
      <div class="scraping-info">
        <div class="scraping-message">{{ scrapingMessage }}</div>
        <div class="scraping-timer">{{ formatTime(elapsedTime) }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';

/**
 * Component for scraping forum data
 * @component
 */
export default {
  name: 'ForumScraper',
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
    const scraping = ref(false);
    const elapsedTime = ref(0);
    const scrapingMessage = ref('');
    let timer = null;

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

    /**
     * Emit a status update
     * @param {string} message - The status message
     * @param {string} type - The status type (info, success, error)
     */
    const setStatus = (message, type = 'info') => {
      emit('status-update', { message, type });
    };

    const scrapeForum = async () => {
      scraping.value = true;
      elapsedTime.value = 0;
      scrapingMessage.value = 'Initializing scraper...';
      
      // Start timer
      timer = setInterval(() => {
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
        cleanup();
        scraping.value = false;
      }
    };

    const cleanup = () => {
      if (timer) clearInterval(timer);
    };

    return {
      scraping,
      elapsedTime,
      scrapingMessage,
      formatTime,
      scrapeForum,
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
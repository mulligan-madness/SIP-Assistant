<template>
  <div v-if="show" class="settings-modal" @click.self="closeModal">
    <div class="settings-modal__content">
      <h2 class="settings-modal__title">Settings</h2>
      
      <div class="settings-section">
        <h3>LLM Provider</h3>
        <div class="button-group">
          <button 
            class="action-button"
            @click="changeLLM('1')" 
            :disabled="changingProvider"
          >
            Local (LMStudio - phi-4)
          </button>
          <button 
            class="action-button"
            @click="changeLLM('2')" 
            :disabled="changingProvider"
          >
            OpenAI (o1-mini)
          </button>
          <button 
            class="action-button"
            @click="changeLLM('3')" 
            :disabled="changingProvider"
          >
            Anthropic (claude-3-opus-latest)
          </button>
        </div>
      </div>

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

      <div class="settings-section">
        <h3>System</h3>
        <div class="button-group">
          <button 
            class="action-button"
            @click="restartServer" 
            :disabled="serverRestarting"
          >
            Restart Server
          </button>
          <button 
            class="action-button"
            @click="reloadPage"
          >
            Reload Page
          </button>
        </div>
      </div>

      <Transition name="fade">
        <div 
          v-if="status" 
          :class="[
            'settings-modal__status',
            `settings-modal__status--${status.type}`
          ]"
        >
          {{ status.message }}
        </div>
      </Transition>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'

export default {
  name: 'SettingsModal',
  props: {
    show: {
      type: Boolean,
      required: true
    }
  },
  emits: ['close'],
  setup(props, { emit }) {
    const isDevelopment = computed(() => process.env.NODE_ENV === 'development')

    // State
    const status = ref(null)
    const currentProvider = ref(null)
    const changingProvider = ref(false)
    const serverRestarting = ref(false)
    const scraping = ref(false)
    const generatingContext = ref(false)
    const elapsedTime = ref(0)
    const contextTime = ref(0)
    const scrapingMessage = ref('')
    const contextPun = ref('')
    let timerInterval = null
    let contextInterval = null
    let punInterval = null

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
    ]

    // Methods
    const closeModal = () => {
      if (timerInterval) clearInterval(timerInterval)
      if (contextInterval) clearInterval(contextInterval)
      if (punInterval) clearInterval(punInterval)
      emit('close')
    }

    const formatTime = (seconds) => {
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const updateScrapingMessage = (time) => {
      if (time <= 2) {
        scrapingMessage.value = 'Initializing scraper...'
      } else if (time <= 5) {
        scrapingMessage.value = 'Fetching SIP proposals...'
      } else if (time <= 8) {
        scrapingMessage.value = 'Processing forum content...'
      } else if (time <= 12) {
        scrapingMessage.value = 'Analyzing SIP data...'
      } else {
        scrapingMessage.value = 'Finalizing data collection...'
      }
    }

    const setStatus = (message, type = 'info') => {
      status.value = { message, type }
      setTimeout(() => {
        status.value = null
      }, 3000)
    }

    const changeLLM = async (provider) => {
      changingProvider.value = true
      try {
        const response = await fetch('/api/init-llm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider })
        })
        
        if (!response.ok) {
          throw new Error('Failed to change LLM provider')
        }
        
        currentProvider.value = provider
        setStatus('LLM provider changed successfully', 'success')
      } catch (error) {
        setStatus(error.message, 'error')
      } finally {
        changingProvider.value = false
      }
    }

    const scrapeForum = async () => {
      scraping.value = true
      elapsedTime.value = 0
      scrapingMessage.value = 'Initializing scraper...'
      
      // Start timer
      timerInterval = setInterval(() => {
        elapsedTime.value++
        updateScrapingMessage(elapsedTime.value)
      }, 1000)

      try {
        const response = await fetch('/api/load-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rescrape: true })
        })
        
        if (!response.ok) {
          throw new Error('Failed to scrape forum data')
        }
        
        const data = await response.json()
        setStatus(`Successfully scraped ${data.count} SIPs`, 'success')
      } catch (error) {
        setStatus(error.message, 'error')
      } finally {
        if (timerInterval) {
          clearInterval(timerInterval)
        }
        scraping.value = false
      }
    }

    const restartServer = async () => {
      serverRestarting.value = true
      try {
        await fetch('/api/restart', { method: 'POST' })
        setStatus('Server restarting...', 'info')
        setTimeout(() => {
          window.location.reload()
        }, 5000)
      } catch (error) {
        setStatus(error.message, 'error')
        serverRestarting.value = false
      }
    }

    const reloadPage = () => {
      window.location.reload()
    }

    const regenerateContext = async () => {
      generatingContext.value = true
      contextTime.value = 0
      contextPun.value = contextPuns[0]
      let punIndex = 1

      // Start timer
      contextInterval = setInterval(() => {
        contextTime.value++
      }, 1000)

      // Rotate puns every 5 seconds
      punInterval = setInterval(() => {
        contextPun.value = contextPuns[punIndex]
        punIndex = (punIndex + 1) % contextPuns.length
      }, 5000)

      try {
        const response = await fetch('/api/generate-context', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
        
        if (!response.ok) {
          throw new Error('Failed to regenerate context')
        }
        
        setStatus('Context regenerated successfully', 'success')
      } catch (error) {
        setStatus(error.message, 'error')
      } finally {
        if (contextInterval) clearInterval(contextInterval)
        if (punInterval) clearInterval(punInterval)
        generatingContext.value = false
      }
    }

    return {
      status,
      currentProvider,
      changingProvider,
      serverRestarting,
      scraping,
      generatingContext,
      scrapingMessage,
      contextPun,
      elapsedTime,
      contextTime,
      closeModal,
      changeLLM,
      scrapeForum,
      regenerateContext,
      restartServer,
      reloadPage,
      formatTime
    }
  }
}
</script>

<style scoped>
.settings-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.settings-modal__content {
  background: white;
  border-radius: 12px;
  padding: 30px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.settings-modal__title {
  font-size: 1.8rem;
  color: #333;
  margin: 0 0 20px 0;
}

.settings-section {
  margin-bottom: 30px;
}

.settings-section h3 {
  font-size: 1.2rem;
  color: #333;
  margin: 0 0 15px 0;
}

.button-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.action-button {
  flex: 1;
  min-width: 150px;
  height: 44px;
  background: #1976d2;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;
}

.action-button:hover:not(:disabled) {
  background: #1565c0;
  transform: none;
}

.action-button:disabled {
  background: #e0e0e0;
  color: #9e9e9e;
  cursor: not-allowed;
}

.settings-modal__status {
  margin-top: 20px;
  padding: 10px;
  border-radius: 6px;
  text-align: center;
}

.settings-modal__status--success {
  background: #e8f5e9;
  color: #2e7d32;
}

.settings-modal__status--error {
  background: #ffebee;
  color: #c62828;
}

.settings-modal__status--info {
  background: #e3f2fd;
  color: #1565c0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 600px) {
  .settings-modal__content {
    padding: 20px;
  }

  .button-group {
    flex-direction: column;
  }

  .action-button {
    width: 100%;
  }
}

.scraping-status {
  margin-top: 15px;
  padding: 15px;
  background: #f5f5f5;
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
  border: 3px solid #e0e0e0;
  border-top: 3px solid #1976d2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.scraping-info {
  flex: 1;
}

.scraping-message {
  color: #333;
  font-size: 0.9rem;
  margin-bottom: 4px;
}

.scraping-timer {
  color: #666;
  font-size: 0.8rem;
  font-family: monospace;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Add global override for chat settings button to remove rotation on hover */
:deep(.chat__settings-button:hover),
:deep(.chat__settings-icon:hover) {
  transform: none !important;
}
</style> 
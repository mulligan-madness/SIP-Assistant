<template>
  <div class="app">
    <div v-if="!isFullyInitialized" class="init-container">
      <h2>SIP Assistant Initialization</h2>
      
      <div class="init-step">
        <h3>1. LLM Provider Selection</h3>
        <div v-if="!status.llmInitialized">
          <button @click="initLLM('1')" :disabled="initializingLLM">Local (LMStudio - phi-4)</button>
          <button @click="initLLM('2')" :disabled="initializingLLM">OpenAI (o1-mini)</button>
          <button @click="initLLM('3')" :disabled="initializingLLM">Anthropic (claude-3-opus-latest)</button>
          <div v-if="initializingLLM" class="loading">Initializing LLM...</div>
        </div>
        <div v-else class="completed">✓ LLM Provider Initialized</div>
      </div>

      <div class="init-step">
        <h3>2. Forum Data</h3>
        <div v-if="!status.dataLoaded">
          <div class="button-group">
            <button 
              @click="loadData(false)" 
              :disabled="loadingData"
              class="action-button"
            >
              Use Existing Data
            </button>
            <button 
              @click="loadData(true)" 
              :disabled="loadingData"
              class="action-button"
            >
              Scrape Fresh Data
            </button>
          </div>
          <div v-if="loadingData" class="loading">
            Loading forum data... {{ elapsedTime }}s
            <br>
            {{ loadingMessage }}
          </div>
        </div>
        <div v-else class="completed">
          <span class="completed-icon">✓</span>
          <span class="completed-text">Forum Data Loaded</span>
          <div class="completed-details">{{ dataStats }}</div>
        </div>
      </div>

      <div class="init-step">
        <h3>3. Context Generation</h3>
        <div v-if="!status.contextCompressed">
          <button @click="loadExistingContext()" :disabled="loadingContext">Use Existing Context</button>
          <button @click="generateContext()" :disabled="!status.dataLoaded || loadingContext">
            Generate New Context
          </button>
          <div v-if="loadingContext" class="loading">Loading context...</div>
          <div v-if="error" class="error">{{ error }}</div>
        </div>
        <div v-else class="completed">✓ Context Generated</div>
      </div>
    </div>

    <ChatInterface v-else />
  </div>
</template>

<script>
import ChatInterface from './components/ChatInterface.vue'
import axios from 'axios'

export default {
  name: 'App',
  components: {
    ChatInterface
  },
  data() {
    return {
      status: {
        llmInitialized: false,
        dataLoaded: false,
        contextCompressed: false,
        existingContextAvailable: false
      },
      initializingLLM: false,
      loadingData: false,
      loadingContext: false,
      error: null,
      elapsedTime: 0,
      timerInterval: null,
      isRescraping: false,
      loadingMessage: '',
      dataStats: ''
    }
  },
  computed: {
    isFullyInitialized() {
      return this.status.llmInitialized && 
             this.status.dataLoaded && 
             this.status.contextCompressed
    }
  },
  methods: {
    async checkStatus() {
      try {
        const response = await axios.get('/api/status')
        this.status = response.data
      } catch (error) {
        console.error('Failed to check status:', error)
      }
    },
    async initLLM(provider) {
      this.initializingLLM = true
      try {
        await axios.post('/api/init-llm', { provider })
        await this.checkStatus()
      } catch (error) {
        console.error('Failed to initialize LLM:', error)
        this.error = error.response?.data?.userMessage || error.message
      } finally {
        this.initializingLLM = false
      }
    },
    async loadData(rescrape) {
      console.log('loadData called with rescrape:', rescrape)
      this.loadingData = true
      console.log('loadingData set to:', this.loadingData)
      this.isRescraping = rescrape
      this.elapsedTime = 0
      this.error = null
      this.loadingMessage = rescrape ? 'Connecting to forum...' : 'Loading existing data...'
      console.log('Initial loading message:', this.loadingMessage)
      
      // Start timer
      if (this.timerInterval) {
        clearInterval(this.timerInterval)
      }
      
      this.timerInterval = setInterval(() => {
        this.elapsedTime++
        console.log('Timer tick, elapsed time:', this.elapsedTime)
        // Update loading message based on elapsed time for scraping
        if (rescrape) {
          if (this.elapsedTime > 2 && this.elapsedTime <= 5) {
            this.loadingMessage = 'Fetching SIP proposals...'
            console.log('Updated loading message:', this.loadingMessage)
          } else if (this.elapsedTime > 5 && this.elapsedTime <= 8) {
            this.loadingMessage = 'Processing forum content...'
            console.log('Updated loading message:', this.loadingMessage)
          } else if (this.elapsedTime > 8) {
            this.loadingMessage = 'Analyzing SIP data...'
            console.log('Updated loading message:', this.loadingMessage)
          }
        }
      }, 1000)

      try {
        console.log('Making API request...')
        const response = await axios.post('/api/load-data', { rescrape })
        console.log('API response received:', response.data)
        this.dataStats = `${response.data.count} SIP proposals loaded`
        await this.checkStatus()
      } catch (error) {
        console.error('Failed to load data:', error)
        this.error = error.response?.data?.userMessage || error.message
        this.loadingMessage = 'Error loading data'
      } finally {
        console.log('Request completed, cleaning up...')
        if (this.timerInterval) {
          clearInterval(this.timerInterval)
        }
        this.loadingData = false
        console.log('loadingData set to:', this.loadingData)
      }
    },
    async loadExistingContext() {
      this.loadingContext = true
      this.error = null
      try {
        await axios.post('/api/load-context')
        await this.checkStatus()
      } catch (error) {
        console.error('Failed to load existing context:', error)
        this.error = error.response?.data?.userMessage || error.message
      } finally {
        this.loadingContext = false
      }
    },
    async generateContext() {
      this.loadingContext = true
      try {
        await axios.post('/api/generate-context')
        await this.checkStatus()
      } catch (error) {
        console.error('Failed to generate context:', error)
        this.error = error.response?.data?.userMessage || error.message
      } finally {
        this.loadingContext = false
      }
    }
  },
  async created() {
    await this.checkStatus()
  },
  beforeDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval)
    }
  }
}
</script>

<style>
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: #f5f5f5;
}

.app {
  min-height: 100vh;
  padding: 20px;
  box-sizing: border-box;
}

.init-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.init-step {
  margin-bottom: 24px;
  padding: 16px;
  border: 1px solid #eee;
  border-radius: 4px;
}

.init-step h3 {
  margin-top: 0;
  color: #333;
}

.button-group {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

button {
  margin-right: 0;
  margin-bottom: 0;
  padding: 10px 20px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 180px;
}

button:hover:not(:disabled) {
  background: #0056b3;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.btn-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-icon {
  font-size: 1.1em;
}

.loading-btn {
  position: relative;
  overflow: hidden;
}

.loading-btn::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 200%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255,255,255,0.2),
    transparent
  );
  animation: loading-btn 1.5s infinite;
}

@keyframes loading-btn {
  0% { left: -100%; }
  100% { left: 100%; }
}

.loading-container {
  margin-top: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.loading-bar {
  height: 6px;
  background: #e9ecef;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 12px;
}

.loading-progress {
  height: 100%;
  background: #007bff;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.loading-status {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #495057;
  font-size: 0.95em;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid rgba(0, 123, 255, 0.1);
  border-top-color: #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-details {
  margin-top: 8px;
  color: #6c757d;
  font-size: 0.9em;
}

.completed {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.completed-icon {
  font-size: 1.2em;
  color: #28a745;
}

.completed-text {
  color: #28a745;
  font-weight: 600;
}

.completed-details {
  color: #6c757d;
  font-size: 0.9em;
}

.error {
  color: #dc3545;
  margin-top: 8px;
  padding: 8px;
  background: #f8d7da;
  border-radius: 4px;
}

.loading-state {
  margin-top: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 16px;
  background: rgba(0, 123, 255, 0.05);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.05);
}

.loading-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.loading-timer {
  font-family: monospace;
  font-size: 1.2em;
  font-weight: 500;
  color: #007bff;
}

.loading-message {
  color: #666;
  font-size: 0.9em;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.action-button {
  background: #007bff;
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1em;
  font-weight: 500;
  transition: all 0.2s ease;
  min-width: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-button:hover:not(:disabled) {
  background: #0056b3;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.action-button:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.loading {
  margin-top: 16px;
  color: #007bff;
  font-weight: 500;
  text-align: center;
}
</style> 
<template>
  <div class="app">
    <div v-if="!isFullyInitialized" class="init-container">
      <h2 class="init-title">SIP Assistant Initialization</h2>
      
      <div class="init-step">
        <h3 class="init-step__title">1. LLM Provider Selection</h3>
        <div v-if="!status.llmInitialized" class="init-step__content">
          <div class="button-group">
            <button 
              class="action-button"
              @click="initLLM('1')" 
              :disabled="initializingLLM"
            >
              Local (LMStudio - phi-4)
            </button>
            <button 
              class="action-button"
              @click="initLLM('2')" 
              :disabled="initializingLLM"
            >
              OpenAI (o1-mini)
            </button>
            <button 
              class="action-button"
              @click="initLLM('3')" 
              :disabled="initializingLLM"
            >
              Anthropic (claude-3-opus-latest)
            </button>
          </div>
          <div v-if="initializingLLM" class="loading">Initializing LLM...</div>
        </div>
        <div v-else class="completed">✓ LLM Provider Initialized</div>
      </div>

      <div class="init-step">
        <h3 class="init-step__title">2. Forum Data</h3>
        <div v-if="!status.dataLoaded" class="init-step__content">
          <div class="button-group">
            <button 
              class="action-button"
              @click="loadData(false)" 
              :disabled="loadingData"
            >
              Use Existing Data
            </button>
            <button 
              class="action-button"
              @click="loadData(true)" 
              :disabled="loadingData"
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
        <h3 class="init-step__title">3. Context Generation</h3>
        <div v-if="!status.contextCompressed" class="init-step__content">
          <div class="button-group">
            <button 
              class="action-button"
              @click="loadExistingContext()" 
              :disabled="contextLoading || !status.existingContextAvailable"
            >
              Use Existing Context
            </button>
            <button 
              class="action-button"
              @click="generateNewContext()" 
              :disabled="contextLoading || !status.dataLoaded"
            >
              Generate New Context
            </button>
          </div>
          <div v-if="contextLoading" class="loading">
            {{ contextLoadingMessage }}
          </div>
        </div>
        <div v-else class="completed">✓ Context Generated</div>
      </div>
    </div>

    <ChatInterface v-else />
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import axios from 'axios'
import ChatInterface from './components/ChatInterface.vue'

export default {
  name: 'App',
  components: {
    ChatInterface
  },
  setup() {
    const status = ref({
      llmInitialized: false,
      dataLoaded: false,
      contextCompressed: false,
      existingContextAvailable: false
    })
    
    const initializingLLM = ref(false)
    const loadingData = ref(false)
    const contextLoading = ref(false)
    const elapsedTime = ref(0)
    const loadingMessage = ref('')
    const contextLoadingMessage = ref('')
    const dataStats = ref('')
    let timerInterval = null

    const isFullyInitialized = computed(() => 
      status.value.llmInitialized && 
      status.value.dataLoaded && 
      status.value.contextCompressed
    )

    const checkStatus = async () => {
      try {
        const response = await axios.get('/api/status')
        status.value = response.data
      } catch (error) {
        console.error('Failed to check status:', error)
      }
    }

    const initLLM = async (provider) => {
      initializingLLM.value = true
      try {
        await axios.post('/api/init-llm', { provider })
        await checkStatus()
      } catch (error) {
        console.error('Failed to initialize LLM:', error)
      } finally {
        initializingLLM.value = false
      }
    }

    const loadData = async (rescrape) => {
      loadingData.value = true
      elapsedTime.value = 0
      loadingMessage.value = rescrape ? 'Starting forum scrape...' : 'Loading existing data...'
      
      if (timerInterval) {
        clearInterval(timerInterval)
      }
      
      timerInterval = setInterval(() => {
        elapsedTime.value++
        if (rescrape) {
          if (elapsedTime.value > 2 && elapsedTime.value <= 5) {
            loadingMessage.value = 'Fetching SIP proposals...'
          } else if (elapsedTime.value > 5 && elapsedTime.value <= 8) {
            loadingMessage.value = 'Processing forum content...'
          } else if (elapsedTime.value > 8) {
            loadingMessage.value = 'Analyzing SIP data...'
          }
        }
      }, 1000)

      try {
        const response = await axios.post('/api/load-data', { rescrape })
        dataStats.value = `${response.data.count} SIP proposals loaded`
        await checkStatus()
      } catch (error) {
        console.error('Failed to load data:', error)
        loadingMessage.value = 'Error loading data'
      } finally {
        if (timerInterval) {
          clearInterval(timerInterval)
        }
        loadingData.value = false
      }
    }

    const loadExistingContext = async () => {
      contextLoading.value = true
      contextLoadingMessage.value = 'Loading existing context...'
      try {
        await axios.post('/api/load-context')
        await checkStatus()
      } catch (error) {
        console.error('Failed to load context:', error)
        contextLoadingMessage.value = 'Error loading context'
      } finally {
        contextLoading.value = false
      }
    }

    const generateNewContext = async () => {
      contextLoading.value = true
      contextLoadingMessage.value = 'Generating new context...'
      try {
        await axios.post('/api/generate-context')
        await checkStatus()
      } catch (error) {
        console.error('Failed to generate context:', error)
        contextLoadingMessage.value = 'Error generating context'
      } finally {
        contextLoading.value = false
      }
    }

    // Check initial status
    checkStatus()

    return {
      status,
      isFullyInitialized,
      initializingLLM,
      loadingData,
      contextLoading,
      elapsedTime,
      loadingMessage,
      contextLoadingMessage,
      dataStats,
      initLLM,
      loadData,
      loadExistingContext,
      generateNewContext
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
  max-width: 800px;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.init-title {
  font-size: 2rem;
  color: #333;
  margin: 0 0 30px 0;
  text-align: center;
}

.init-step {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.init-step__title {
  font-size: 1.4rem;
  color: #333;
  margin: 0 0 20px 0;
}

.init-step__content {
  margin-top: 15px;
}

.button-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 15px;
}

.action-button {
  flex: 1;
  min-width: 200px;
  height: 44px;
  background: #1976d2;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(25, 118, 210, 0.2);
}

.action-button:hover:not(:disabled) {
  background: #1565c0;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(21, 101, 192, 0.3);
}

.action-button:disabled {
  background: #e0e0e0;
  color: #9e9e9e;
  cursor: not-allowed;
  box-shadow: none;
}

.loading {
  margin-top: 10px;
  color: #666;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.completed {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #2e7d32;
  font-weight: 500;
}

.completed-icon {
  font-size: 1.2rem;
}

.completed-text {
  font-size: 1rem;
}

.completed-details {
  margin-top: 5px;
  font-size: 0.9rem;
  color: #666;
  font-weight: normal;
}

@media (max-width: 600px) {
  .init-container {
    padding: 20px;
  }

  .button-group {
    flex-direction: column;
  }

  .action-button {
    width: 100%;
  }
}
</style> 
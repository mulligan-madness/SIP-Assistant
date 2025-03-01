<template>
  <div class="app">
    <div v-if="loading" class="loading-container">
      <h2>Loading SIP Assistant...</h2>
      <div class="loading-message">{{ loadingMessage }}</div>
    </div>
    <ChatInterface v-else />
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import ChatInterface from './components/ChatInterface.vue'

export default {
  name: 'App',
  components: {
    ChatInterface
  },
  setup() {
    const loading = ref(true)
    const loadingMessage = ref('Initializing...')

    const initializeApp = async () => {
      try {
        // Initialize with OpenAI by default
        await axios.post('/api/init-llm', { provider: '1' })
        
        // Check if we need to load data and context
        const { data: status } = await axios.get('/api/status')
        
        if (!status.dataLoaded) {
          loadingMessage.value = 'Loading forum data...'
          await axios.post('/api/load-data', { rescrape: false })
        }
        
        if (!status.contextCompressed) {
          loadingMessage.value = 'Loading context data...'
          await axios.post('/api/load-context')
        }
        
        loading.value = false
      } catch (error) {
        console.error('Initialization error:', error)
        loadingMessage.value = 'Error during initialization. Please refresh the page.'
      }
    }

    onMounted(() => {
      initializeApp()
    })

    return {
      loading,
      loadingMessage
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
  background: var(--background-color);
}

.app {
  min-height: 100vh;
  padding: 20px;
  box-sizing: border-box;
}

.loading-container {
  max-width: 800px;
  margin: 0 auto;
  background: #1e1e1e;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.loading-message {
  margin-top: 15px;
  color: var(--text-color);
}
</style> 
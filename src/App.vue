<template>
  <div class="app">
    <div v-if="loading" class="loading-container">
      <h2>Loading SIP Assistant...</h2>
      <div class="loading-message">{{ loadingMessage }}</div>
      <IndexingIndicator 
        v-if="indexingActive"
        :visible="indexingActive"
        :title="indexingTitle"
        :initialStatus="indexingStatus"
        :total="totalDocuments"
        ref="indexingIndicator"
      />
    </div>
    <div v-else class="app-container">
      <ChatInterface @toggle-research="toggleResearchPanel" />
      <ResearchPanel 
        :visible="showResearchPanel" 
        @toggle="toggleResearchPanel"
      />
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import ChatInterface from './components/ChatInterface.vue'
import ResearchPanel from './components/research/ResearchPanel.vue'
import IndexingIndicator from './components/IndexingIndicator.vue'

export default {
  name: 'App',
  components: {
    ChatInterface,
    ResearchPanel,
    IndexingIndicator
  },
  setup() {
    const loading = ref(true)
    const loadingMessage = ref('Initializing...')
    const showResearchPanel = ref(false)
    const indexingActive = ref(false)
    const indexingTitle = ref('Initializing Vector Store')
    const indexingStatus = ref('Preparing...')
    const totalDocuments = ref(0)
    const processedDocuments = ref(0)
    const indexingIndicator = ref(null)
    const indexingLogs = ref([])
    
    const toggleResearchPanel = () => {
      showResearchPanel.value = !showResearchPanel.value
    }

    // Utility to add a log both to the console and to our visual logs
    const logIndexingOperation = (message, type = 'info') => {
      console.log(`[Indexing] ${message}`)
      
      if (indexingIndicator.value) {
        indexingIndicator.value.addLog(message, type)
      }
      
      // Store logs in case the indicator component isn't mounted yet
      indexingLogs.value.push({
        message,
        type,
        timestamp: Date.now()
      })
    }
    
    // Function to set the total documents and update the indicator
    const setTotalDocuments = (total) => {
      totalDocuments.value = total
      logIndexingOperation(`Found ${total} documents to process`)
    }
    
    // Function to update progress and status
    const updateIndexingProgress = (processed, status) => {
      processedDocuments.value = processed
      
      if (status) {
        indexingStatus.value = status
      }
      
      if (indexingIndicator.value) {
        indexingIndicator.value.updateProgress(processed, totalDocuments.value, status)
      }
    }
    
    // Setup event source for server-sent events if we're indexing
    const setupIndexingEvents = () => {
      // Initialize SSE for indexing progress updates
      const eventSource = new EventSource('/api/vector/index-progress')
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          if (data.type === 'init') {
            setTotalDocuments(data.total)
            indexingTitle.value = 'Indexing Forum Data'
          } else if (data.type === 'progress') {
            updateIndexingProgress(data.processed, data.status)
            if (data.log) {
              logIndexingOperation(data.log, data.logType || 'info')
            }
          } else if (data.type === 'complete') {
            updateIndexingProgress(data.total, 'Complete')
            logIndexingOperation('Indexing completed successfully', 'info')
            setTimeout(() => {
              eventSource.close()
            }, 1000)
          } else if (data.type === 'error') {
            logIndexingOperation(data.message, 'error')
          }
        } catch (error) {
          console.error('Error processing SSE event:', error)
        }
      }
      
      eventSource.onerror = (error) => {
        console.error('SSE Error:', error)
        logIndexingOperation('Error connecting to indexing progress stream', 'error')
        eventSource.close()
      }
      
      return eventSource
    }

    const initializeApp = async () => {
      let eventSource = null
      
      try {
        // Initialize with OpenAI by default
        await axios.post('/api/init-llm', { provider: '1' })
        
        // Check if we need to load data and context
        const { data: status } = await axios.get('/api/status')
        
        let dataLoadSuccess = true;
        if (!status.dataLoaded) {
          loadingMessage.value = 'Loading forum data...'
          try {
            await axios.post('/api/load-data', { rescrape: false })
          } catch (dataError) {
            console.error('Error loading forum data, trying rescrape:', dataError)
            loadingMessage.value = 'Scraping forum data...'
            try {
              const { data: rescrapeResult } = await axios.post('/api/load-data', { rescrape: true })
              
              // Check if reindexing was automatically performed
              if (rescrapeResult.reindexed) {
                console.log('Forum data rescraped and vector store automatically reindexed')
                loadingMessage.value = 'Forum data rescraped and vector store reindexed'
                
                // If we have indexing stats, log them
                if (rescrapeResult.indexStats) {
                  console.log(`Reindexing stats: ${rescrapeResult.indexStats.indexed} indexed, ${rescrapeResult.indexStats.skipped} skipped`)
                }
                
                // No need to set needsVectorReindex flag since it was already handled
                status.needsVectorReindex = false
              } else if (rescrapeResult.needsVectorReindex) {
                // Reindexing was not performed or failed
                console.log('Forum data rescraped successfully, vector reindexing will be triggered')
                status.needsVectorReindex = true
              }
            } catch (rescrapeError) {
              console.error('Error rescraping forum data:', rescrapeError)
              dataLoadSuccess = false
            }
          }
        }
        
        if (!status.contextCompressed) {
          loadingMessage.value = 'Loading context data...'
          try {
            await axios.post('/api/load-context')
          } catch (contextError) {
            console.error('Error loading context data:', contextError)
            // Continue despite the error
          }
        }
        
        // Initialize vector store with forum data if needed
        if (dataLoadSuccess) {
          loadingMessage.value = 'Checking vector search status...'
          let vectorInitialized = false;
          
          try {
            // Check if vector store is already initialized using the status endpoint
            const { data: vectorStatus } = await axios.get('/api/vector/status')
            
            // Check if we need to reindex due to a recent forum rescrape
            // Note: If automatic reindexing was performed during the forum scrape,
            // the needsVectorReindex flag should already be cleared
            const needsReindexing = status.needsVectorReindex || vectorStatus.needsIndexing
            
            if (vectorStatus.initialized && vectorStatus.vectorCount > 0 && !needsReindexing) {
              // Vector store is already initialized and has data
              console.log('Vector store is already initialized with data')
              vectorInitialized = true
            } else if (needsReindexing) {
              // Vector store needs indexing or reindexing
              const action = status.needsVectorReindex ? 'reindexing' : 'indexing'
              console.log(`Vector store needs ${action}, attempting to index forum data...`)
              
              // Show indexing indicator
              indexingActive.value = true
              indexingTitle.value = status.needsVectorReindex ? 
                'Reindexing Forum Data After Scrape' : 
                'Preparing to Index Forum Data'
              logIndexingOperation(`Starting forum data ${action} process`)
              
              // Fetch total documents first
              const { data: forumData } = await axios.post('/api/load-data', { rescrape: false })
              if (forumData.count) {
                setTotalDocuments(forumData.count)
              }
              
              // Set up SSE for real-time updates
              eventSource = setupIndexingEvents()
              
              // Start the indexing process
              const indexResult = await axios.post('/api/vector/index-forum-data')
              
              logIndexingOperation('Indexing completed: ' + indexResult.data.message)
              vectorInitialized = true
            } else {
              // Vector service is initialized but empty
              console.log('Vector service is initialized but empty')
              vectorInitialized = true
            }
          } catch (statusError) {
            console.error('Error checking vector store status:', statusError)
            console.log('Falling back to manual vector initialization...')
            
            try {
              // Show indexing indicator
              indexingActive.value = true
              indexingTitle.value = status.needsVectorReindex ? 
                'Reindexing Forum Data After Scrape' : 
                'Preparing to Index Forum Data'
              const action = status.needsVectorReindex ? 'reindexing' : 'indexing'
              logIndexingOperation(`Starting forum data ${action} process`)
              
              // Set up SSE for real-time updates
              eventSource = setupIndexingEvents()
              
              await axios.post('/api/vector/index-forum-data')
              console.log(`Successfully ${action} forum data`)
              vectorInitialized = true
            } catch (indexError) {
              console.error('Error indexing forum data:', indexError)
              logIndexingOperation(`Error ${status.needsVectorReindex ? 'reindexing' : 'indexing'} forum data: ${indexError.message}`, 'error')
              console.log('Continuing without forum data indexing')
            }
          }
          
          if (!vectorInitialized) {
            console.warn('Vector store initialization failed, but application will continue')
          }
        }
        
        // Add a small delay to see the completion if indexing
        if (indexingActive.value) {
          setTimeout(() => {
            loading.value = false
            if (eventSource) {
              eventSource.close()
            }
          }, 2000)
        } else {
          loading.value = false
        }
      } catch (error) {
        console.error('Initialization error:', error)
        loadingMessage.value = 'Error during initialization. App will load with limited functionality.'
        
        // Allow the app to load even if there are initialization errors
        setTimeout(() => {
          loading.value = false
          if (eventSource) {
            eventSource.close()
          }
        }, 3000)
      }
    }

    onMounted(() => {
      initializeApp()
    })

    return {
      loading,
      loadingMessage,
      showResearchPanel,
      toggleResearchPanel,
      indexingActive,
      indexingTitle,
      indexingStatus,
      totalDocuments,
      indexingIndicator
    }
  }
}
</script>

<style>
:root {
  --background-color: #121212;
  --surface-color: #1e1e1e;
  --surface-color-secondary: #252525;
  --surface-color-tertiary: #2a2a2a;
  --text-color: #e0e0e0;
  --text-secondary: #a0a0a0;
  --border-color: #333333;
  --accent-color: #0078d4;
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --error-color: #ef4444;
  --shadow-color: rgba(0, 0, 0, 0.5);
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  background-color: var(--background-color);
  color: var(--text-color);
  line-height: 1.6;
}

.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.app-container {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  padding: 20px;
}

.loading-container h2 {
  margin-bottom: 16px;
  font-size: 24px;
}

.loading-message {
  font-size: 16px;
  color: var(--text-secondary);
  margin-bottom: 24px;
}
</style> 
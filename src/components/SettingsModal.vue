<template>
  <div v-if="show" class="settings-modal" @click="closeModal">
    <div class="settings-modal__content" @click.stop>
      <div class="settings-modal__header">
        <h2 class="settings-modal__title">Settings</h2>
        <button 
          class="settings-modal__close-button" 
          @click="closeModal"
          aria-label="Close settings"
        >
          &times;
        </button>
      </div>
      
      <div class="settings-modal__body">
        <section class="settings-modal__section">
          <h3 class="settings-modal__section-title">LLM Provider</h3>
          <div class="settings-modal__button-group">
            <button 
              class="settings-modal__button"
              :class="{ 'settings-modal__button--active': currentProvider === '1' }"
              @click="changeLLM('1')" 
              :disabled="changingProvider"
            >
              Local (LMStudio)
            </button>
            <button 
              class="settings-modal__button"
              :class="{ 'settings-modal__button--active': currentProvider === '2' }"
              @click="changeLLM('2')" 
              :disabled="changingProvider"
            >
              OpenAI
            </button>
            <button 
              class="settings-modal__button"
              :class="{ 'settings-modal__button--active': currentProvider === '3' }"
              @click="changeLLM('3')" 
              :disabled="changingProvider"
            >
              Anthropic
            </button>
          </div>
        </section>

        <section class="settings-modal__section">
          <h3 class="settings-modal__section-title">Data Management</h3>
          <div class="settings-modal__button-group">
            <button 
              class="settings-modal__button"
              @click="loadData(false)" 
              :disabled="dataLoading"
            >
              Use Existing Data
            </button>
            <button 
              class="settings-modal__button"
              @click="loadData(true)" 
              :disabled="dataLoading"
            >
              Scrape Fresh Data
            </button>
          </div>
        </section>

        <section class="settings-modal__section">
          <h3 class="settings-modal__section-title">Context Management</h3>
          <div class="settings-modal__button-group">
            <button 
              class="settings-modal__button"
              @click="loadExistingContext()" 
              :disabled="contextLoading"
            >
              Use Existing Context
            </button>
            <button 
              class="settings-modal__button"
              @click="generateNewContext()" 
              :disabled="contextLoading"
            >
              Generate New Context
            </button>
          </div>
        </section>

        <section class="settings-modal__section">
          <h3 class="settings-modal__section-title">Server Control</h3>
          <div class="settings-modal__button-group">
            <button 
              class="settings-modal__button settings-modal__button--warning"
              @click="restartServer()" 
              :disabled="serverRestarting"
            >
              Restart Server
            </button>
            <button 
              class="settings-modal__button"
              @click="reloadPage()"
            >
              Reload Page
            </button>
          </div>
        </section>
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

    if (isDevelopment.value) {
      console.log('SettingsModal setup starting')
    }

    // State
    const status = ref(null)
    const currentProvider = ref(null)
    const changingProvider = ref(false)
    const dataLoading = ref(false)
    const contextLoading = ref(false)
    const serverRestarting = ref(false)

    // Methods
    const closeModal = () => {
      if (isDevelopment.value) {
        console.log('SettingsModal closing')
      }
      emit('close')
    }

    const setStatus = (message, type = 'info') => {
      status.value = { message, type }
      setTimeout(() => {
        status.value = null
      }, 3000)
    }

    const changeLLM = async (provider) => {
      if (isDevelopment.value) {
        console.log('Changing LLM provider to:', provider)
      }
      
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

    const loadData = async (rescrape) => {
      if (isDevelopment.value) {
        console.log('Loading data, rescrape:', rescrape)
      }
      
      dataLoading.value = true
      try {
        const response = await fetch('/api/load-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rescrape })
        })
        
        if (!response.ok) {
          throw new Error('Failed to load data')
        }
        
        setStatus(rescrape ? 'Fresh data scraped successfully' : 'Existing data loaded successfully', 'success')
      } catch (error) {
        setStatus(error.message, 'error')
      } finally {
        dataLoading.value = false
      }
    }

    const loadExistingContext = async () => {
      if (isDevelopment.value) {
        console.log('Loading existing context')
      }
      
      contextLoading.value = true
      try {
        const response = await fetch('/api/load-context', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
        
        if (!response.ok) {
          throw new Error('Failed to load existing context')
        }
        
        setStatus('Existing context loaded successfully', 'success')
      } catch (error) {
        setStatus(error.message, 'error')
      } finally {
        contextLoading.value = false
      }
    }

    const generateNewContext = async () => {
      if (isDevelopment.value) {
        console.log('Generating new context')
      }
      
      contextLoading.value = true
      try {
        const response = await fetch('/api/generate-context', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
        
        if (!response.ok) {
          throw new Error('Failed to generate new context')
        }
        
        setStatus('New context generated successfully', 'success')
      } catch (error) {
        setStatus(error.message, 'error')
      } finally {
        contextLoading.value = false
      }
    }

    const restartServer = async () => {
      if (isDevelopment.value) {
        console.log('Restarting server')
      }
      
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
      if (isDevelopment.value) {
        console.log('Reloading page')
      }
      window.location.reload()
    }

    return {
      status,
      currentProvider,
      changingProvider,
      dataLoading,
      contextLoading,
      serverRestarting,
      closeModal,
      changeLLM,
      loadData,
      loadExistingContext,
      generateNewContext,
      restartServer,
      reloadPage
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
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.settings-modal__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.settings-modal__title {
  margin: 0;
  font-size: 1.5rem;
  color: var(--text-color);
}

.settings-modal__close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  color: #666;
  transition: color 0.2s ease;
}

.settings-modal__close-button:hover {
  color: var(--text-color);
}

.settings-modal__body {
  padding: 1rem;
}

.settings-modal__section {
  margin-bottom: 1.5rem;
}

.settings-modal__section:last-child {
  margin-bottom: 0;
}

.settings-modal__section-title {
  margin: 0 0 1rem 0;
  color: var(--text-color);
  font-size: 1.1rem;
}

.settings-modal__button-group {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.settings-modal__button {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: #f8f9fa;
  color: var(--text-color);
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  flex: 1;
  min-width: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.settings-modal__button:hover:not(:disabled) {
  background: #f0f0f0;
  border-color: var(--primary-color);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.settings-modal__button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.settings-modal__button--active {
  background: var(--primary-color);
  border-color: var(--primary-color);
  color: white;
  box-shadow: 0 2px 4px rgba(25, 118, 210, 0.2);
}

.settings-modal__button--active:hover:not(:disabled) {
  background: var(--primary-dark);
}

.settings-modal__button--warning {
  background: #fff5f5;
  border-color: #f44336;
  color: #f44336;
}

.settings-modal__button--warning:hover:not(:disabled) {
  background: #f44336;
  color: white;
  border-color: #d32f2f;
}

.settings-modal__status {
  padding: 1rem;
  margin: 1rem;
  border-radius: 4px;
  text-align: center;
  transition: opacity 0.3s ease;
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

/* Animations */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Responsive design */
@media (min-width: 768px) {
  .settings-modal__button-group {
    flex-wrap: nowrap;
  }
  
  .settings-modal__button {
    min-width: unset;
  }
}
</style> 
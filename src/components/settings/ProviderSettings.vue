<template>
  <div class="settings-section">
    <h3>LLM Provider</h3>
    <div class="button-group">
      <button 
        class="action-button"
        @click="changeLLM('1')" 
        :disabled="changingProvider"
        :class="{ 'active': currentProvider === '1' }"
      >
        OpenAI (o1-mini)
      </button>
      <button 
        class="action-button"
        @click="changeLLM('2')" 
        :disabled="changingProvider"
        :class="{ 'active': currentProvider === '2' }"
      >
        Anthropic (claude-3-opus-latest)
      </button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';

/**
 * Component for managing LLM provider settings
 * @component
 */
export default {
  name: 'ProviderSettings',
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
    const changingProvider = ref(false);
    const currentProvider = ref(null);

    /**
     * Emit a status update
     * @param {string} message - The status message
     * @param {string} type - The status type (info, success, error)
     */
    const setStatus = (message, type = 'info') => {
      emit('status-update', { message, type });
    };

    /**
     * Change the LLM provider
     * @param {string} provider - The provider ID
     */
    const changeLLM = async (provider) => {
      changingProvider.value = true;
      try {
        setStatus('Changing LLM provider...', 'info');
        
        const response = await fetch('/api/init-llm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider })
        });
        
        if (!response.ok) {
          throw new Error('Failed to change LLM provider');
        }
        
        const data = await response.json();
        
        if (data.success) {
          currentProvider.value = provider;
          setStatus('LLM provider changed successfully', 'success');
        } else {
          throw new Error(data.error || 'Unknown error occurred');
        }
      } catch (error) {
        console.error('Error changing LLM provider:', error);
        setStatus(`Error: ${error.message}`, 'error');
      } finally {
        changingProvider.value = false;
      }
    };

    // Check which provider is currently active on mount
    onMounted(async () => {
      try {
        const response = await fetch('/api/status');
        if (response.ok) {
          const data = await response.json();
          // Set initial provider based on what's running
          if (data.llmInitialized) {
            // Default to OpenAI if we can't determine
            currentProvider.value = '1';
          }
        }
      } catch (error) {
        console.error('Error checking provider status:', error);
      }
    });

    return {
      changingProvider,
      currentProvider,
      changeLLM
    };
  }
};
</script>

<style scoped>
/* Active class moved to global CSS */
</style>

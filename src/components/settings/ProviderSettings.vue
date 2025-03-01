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

export default {
  name: 'ProviderSettings',
  emits: ['status-update'],
  setup(props, { emit }) {
    const changingProvider = ref(false);
    const currentProvider = ref(null);

    const setStatus = (message, type = 'info') => {
      emit('status-update', { message, type });
    };

    const changeLLM = async (provider) => {
      changingProvider.value = true;
      try {
        const response = await fetch('/api/init-llm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider })
        });
        
        if (!response.ok) {
          throw new Error('Failed to change LLM provider');
        }
        
        currentProvider.value = provider;
        setStatus('LLM provider changed successfully', 'success');
      } catch (error) {
        setStatus(error.message, 'error');
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

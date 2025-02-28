<template>
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
</template>

<script>
import { ref } from 'vue';

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

    return {
      changingProvider,
      currentProvider,
      changeLLM
    };
  }
};
</script>

<style scoped>
/* The styles will be inherited from the parent SettingsModal component */
</style>

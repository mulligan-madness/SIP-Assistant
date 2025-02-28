<template>
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
</template>

<script>
import { ref } from 'vue';

export default {
  name: 'SystemSettings',
  emits: ['status-update'],
  setup(props, { emit }) {
    const serverRestarting = ref(false);

    const setStatus = (message, type = 'info') => {
      emit('status-update', { message, type });
    };

    const restartServer = async () => {
      serverRestarting.value = true;
      try {
        await fetch('/api/restart', { method: 'POST' });
        setStatus('Server restarting...', 'info');
        setTimeout(() => {
          window.location.reload();
        }, 5000);
      } catch (error) {
        setStatus(error.message, 'error');
        serverRestarting.value = false;
      }
    };

    const reloadPage = () => {
      window.location.reload();
    };

    return {
      serverRestarting,
      restartServer,
      reloadPage
    };
  }
};
</script>

<style scoped>
/* The styles will be inherited from the parent SettingsModal component */
</style>

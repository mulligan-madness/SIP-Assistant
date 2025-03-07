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

/**
 * Component for system-level settings and actions
 * @component
 */
export default {
  name: 'SystemSettings',
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
    const serverRestarting = ref(false);

    /**
     * Emit a status update
     * @param {string} message - The status message
     * @param {string} type - The status type (info, success, error)
     */
    const setStatus = (message, type = 'info') => {
      emit('status-update', { message, type });
    };

    /**
     * Restart the server
     */
    const restartServer = async () => {
      serverRestarting.value = true;
      try {
        await fetch('/api/restart', { method: 'POST' });
        setStatus('Server restarting...', 'info');
        setTimeout(() => {
          window.location.reload();
        }, 5000);
      } catch (error) {
        setStatus(`Error: ${error.message}`, 'error');
        serverRestarting.value = false;
      }
    };

    /**
     * Reload the current page
     */
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
/* Styles moved to global CSS */
</style>

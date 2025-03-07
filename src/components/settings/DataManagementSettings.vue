<template>
  <div class="settings-section">
    <h3>Data Management</h3>
    <div class="data-management-container">
      <ForumScraper 
        ref="forumScraper"
        @status-update="handleStatusUpdate" 
      />
      
      <ContextGenerator 
        ref="contextGenerator"
        @status-update="handleStatusUpdate" 
      />
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import ForumScraper from './ForumScraper.vue';
import ContextGenerator from './ContextGenerator.vue';

/**
 * Component for data management settings
 * @component
 */
export default {
  name: 'DataManagementSettings',
  components: {
    ForumScraper,
    ContextGenerator
  },
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
    const forumScraper = ref(null);
    const contextGenerator = ref(null);

    /**
     * Handle status updates from child components
     * @param {Object} status - The status object
     */
    const handleStatusUpdate = (status) => {
      emit('status-update', status);
    };

    /**
     * Clean up any timers when component is unmounted
     */
    const cleanup = () => {
      if (forumScraper.value) {
        forumScraper.value.cleanup();
      }
      if (contextGenerator.value) {
        contextGenerator.value.cleanup();
      }
    };

    return {
      forumScraper,
      contextGenerator,
      handleStatusUpdate,
      cleanup
    };
  }
};
</script>

<style scoped>
.data-management-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

@media (max-width: 600px) {
  .data-management-container {
    gap: 15px;
  }
}
</style>

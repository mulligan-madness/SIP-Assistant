<template>
  <div v-if="show" class="settings-modal" @click.self="closeModal">
    <div class="settings-modal__content">
      <h2 class="settings-modal__title">Settings</h2>
      
      <ProviderSettings @status-update="handleStatusUpdate" />
      
      <DataManagementSettings 
        ref="dataManagementSettings"
        @status-update="handleStatusUpdate" 
      />
      
      <SystemSettings @status-update="handleStatusUpdate" />

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
import { ref, onUnmounted } from 'vue';
import ProviderSettings from './settings/ProviderSettings.vue';
import DataManagementSettings from './settings/DataManagementSettings.vue';
import SystemSettings from './settings/SystemSettings.vue';

export default {
  name: 'SettingsModal',
  components: {
    ProviderSettings,
    DataManagementSettings,
    SystemSettings
  },
  props: {
    show: {
      type: Boolean,
      required: true
    }
  },
  emits: ['close'],
  setup(props, { emit }) {
    const status = ref(null);
    const dataManagementSettings = ref(null);

    const closeModal = () => {
      if (dataManagementSettings.value) {
        dataManagementSettings.value.cleanup();
      }
      emit('close');
    };

    const handleStatusUpdate = (statusData) => {
      status.value = statusData;
      setTimeout(() => {
        status.value = null;
      }, 3000);
    };

    onUnmounted(() => {
      if (dataManagementSettings.value) {
        dataManagementSettings.value.cleanup();
      }
    });

    return {
      status,
      dataManagementSettings,
      closeModal,
      handleStatusUpdate
    };
  }
};
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
  background: var(--surface-color);
  border-radius: 12px;
  padding: 30px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.settings-modal__title {
  font-size: 1.8rem;
  color: var(--text-color);
  margin: 0 0 20px 0;
}

.settings-section {
  margin-bottom: 30px;
}

.settings-section h3 {
  font-size: 1.2rem;
  color: var(--text-color);
  margin: 0 0 15px 0;
}

/* Button styles moved to global CSS */

.settings-modal__status {
  margin-top: 20px;
  padding: 10px;
  border-radius: 6px;
  text-align: center;
}

.settings-modal__status--success {
  background: var(--surface-color-secondary);
  color: var(--button-primary);
}

.settings-modal__status--error {
  background: var(--surface-color-secondary);
  color: #ff6b6b;
}

.settings-modal__status--info {
  background: var(--surface-color-secondary);
  color: var(--button-primary);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 600px) {
  .settings-modal__content {
    padding: 20px;
  }

  .button-group {
    flex-direction: column;
  }

  .action-button {
    width: 100%;
  }
}

/* Add global override for chat settings button to remove rotation on hover */
:deep(.chat__settings-button:hover),
:deep(.chat__settings-icon:hover) {
  transform: none !important;
}
</style> 
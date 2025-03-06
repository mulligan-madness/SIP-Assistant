<template>
  <div class="header">
    <h1 class="title">SIP Chat Assistant</h1>
    <div class="controls">
      <button 
        class="mode-toggle"
        @click="$emit('toggle-mode')"
        :class="{ 'active': isInterviewMode }"
        aria-label="Toggle Interview Mode"
      >
        <svg class="mode-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          <circle cx="12" cy="10" r="2"></circle>
          <path d="M8 14h8"></path>
        </svg>
        <span class="mode-label">{{ isInterviewMode ? 'Interview Mode' : 'Chat Mode' }}</span>
      </button>
      <button 
        class="settings-button"
        @click="$emit('toggle-settings')"
        aria-label="Settings"
      >
        <svg class="settings-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
        <span v-if="isDevelopment" class="debug-label">
          Settings ({{ showSettings ? 'Open' : 'Closed' }})
        </span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, computed } from 'vue';

// Define props
const props = defineProps({
  showSettings: {
    type: Boolean,
    required: true,
    default: false
  },
  isInterviewMode: {
    type: Boolean,
    required: false,
    default: false
  }
});

// Define emits
defineEmits(['toggle-settings', 'toggle-mode']);

// Computed
const isDevelopment = computed(() => process.env.NODE_ENV === 'development');
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 0 10px;
  position: relative;
}

.controls {
  display: flex;
  gap: 8px;
  align-items: center;
}

.title {
  margin: 0;
  font-size: 1.8rem;
  color: var(--text-color);
}

.settings-button {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 8px;
  background: var(--button-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  z-index: 100;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px var(--button-shadow);
}

.settings-button:hover {
  transform: rotate(30deg);
  background: var(--button-secondary-hover);
  box-shadow: 0 2px 4px var(--button-shadow);
}

.settings-icon {
  width: 24px;
  height: 24px;
  color: var(--text-color);
}

.mode-toggle {
  display: flex;
  align-items: center;
  padding: 6px 10px;
  background: var(--button-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px var(--button-shadow);
  color: var(--text-color);
}

.mode-toggle:hover {
  background: var(--button-secondary-hover);
  box-shadow: 0 2px 4px var(--button-shadow);
}

.mode-toggle.active {
  background: var(--button-primary);
  color: var(--button-text-primary);
}

.mode-icon {
  margin-right: 6px;
}

.mode-label {
  font-size: 14px;
  font-weight: 500;
}

.debug-label {
  position: absolute;
  top: -20px;
  right: 0;
  background: yellow;
  color: red;
  font-size: 12px;
  padding: 2px 4px;
  border-radius: 4px;
  font-weight: bold;
}

@media (max-width: 600px) {
  .mode-label {
    display: none;
  }
  
  .mode-toggle {
    padding: 6px;
  }
  
  .mode-icon {
    margin-right: 0;
  }
}
</style>

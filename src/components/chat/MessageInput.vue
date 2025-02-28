<template>
  <div class="input-area">
    <textarea 
      v-model="inputMessage"
      class="input"
      placeholder="Ask about SuperRare Improvement Proposals..."
      @keydown.enter.prevent="handleEnter"
      ref="inputField"
      rows="1"
    ></textarea>
    <button 
      class="send-button"
      @click="sendMessage" 
      :disabled="isLoading || !inputMessage.trim()"
    >
      Send
    </button>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, onMounted } from 'vue';

// Define props
const props = defineProps({
  isLoading: {
    type: Boolean,
    required: true,
    default: false
  }
});

// Define emits
const emit = defineEmits(['send']);

// Local state
const inputMessage = ref('');
const inputField = ref(null);

// Functions
const sendMessage = () => {
  if (!inputMessage.value.trim() || props.isLoading) return;
  
  const message = inputMessage.value.trim();
  emit('send', message);
  inputMessage.value = ''; // Clear input after sending
};

const handleEnter = (e) => {
  if (e.shiftKey) return; // Allow shift+enter for new lines
  e.preventDefault(); // Prevent default enter behavior
  sendMessage();
};

// Lifecycle
onMounted(() => {
  if (inputField.value) {
    inputField.value.focus();
  }
});
</script>

<style scoped>
.input-area {
  display: flex;
  gap: 10px;
  width: 100%;
  align-items: flex-start;
}

.input {
  flex: 1;
  padding: 10px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 16px;
  font-family: inherit;
  resize: none;
  min-height: 40px;
  max-height: 200px;
  overflow-y: auto;
  line-height: 1.4;
  margin: 0;
  background: #2c2c2e;
  color: var(--text-color);
}

.send-button {
  height: 44px;
  min-width: 100px;
  background: var(--button-primary);
  color: var(--button-text-primary);
  border: none;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px var(--button-shadow);
}

.send-button:hover:not(:disabled) {
  background: var(--button-primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 3px 6px var(--button-shadow);
}

.send-button:disabled {
  background: var(--button-disabled);
  color: var(--button-text-secondary);
  box-shadow: none;
  cursor: not-allowed;
}
</style>

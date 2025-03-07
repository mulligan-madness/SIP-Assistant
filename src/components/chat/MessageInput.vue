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
      class="action-button"
      @click="sendMessage" 
      :disabled="isLoading || !inputMessage.trim()"
    >
      Send
    </button>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, onMounted } from 'vue';

/**
 * Component for inputting and sending chat messages
 * @component
 */

// Define props
const props = defineProps({
  /**
   * Whether the chat is currently loading/processing a message
   */
  isLoading: {
    type: Boolean,
    required: true,
    default: false
  }
});

// Define emits
/**
 * Emitted when a message is sent
 * @event send
 * @property {string} message - The message text being sent
 */
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

/* Send button styles */
.action-button {
  height: 44px;
  padding: 0 16px;
  white-space: nowrap;
  flex: 0 0 auto;
}
</style>

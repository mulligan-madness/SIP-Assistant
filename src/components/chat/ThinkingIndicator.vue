<template>
  <div v-if="isLoading" class="thinking">
    <span>Thinking</span>
    <div class="thinking-dots">
      <span></span>
      <span></span>
      <span></span>
    </div>
    <span class="thinking-timer">{{ thinkingTime }}</span>
  </div>
</template>

<script setup>
import { defineProps } from 'vue';

// Define props
const props = defineProps({
  isLoading: {
    type: Boolean,
    required: true,
    default: false
  },
  thinkingTime: {
    type: String,
    required: true,
    default: '0:00'
  }
});
</script>

<style scoped>
.thinking {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 10px 0;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  color: var(--text-secondary);
}

.thinking-dots {
  display: flex;
  gap: 4px;
  align-items: center;
}

.thinking-dots span {
  width: 8px;
  height: 8px;
  background-color: var(--text-secondary);
  border-radius: 50%;
  display: inline-block;
  animation: pulse 1.5s infinite ease-in-out;
}

.thinking-dots span:nth-child(2) {
  animation-delay: 0.3s;
}

.thinking-dots span:nth-child(3) {
  animation-delay: 0.6s;
}

.thinking-timer {
  font-family: monospace;
  margin-left: 4px;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.2);
    opacity: 1;
  }
}
</style>

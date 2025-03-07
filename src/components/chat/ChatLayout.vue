<template>
  <div class="chat-layout">
    <slot name="header"></slot>
    <slot name="content"></slot>
    <slot name="footer"></slot>
    <slot name="panels"></slot>
    <slot name="modals"></slot>
  </div>
</template>

<script setup>
/**
 * Layout component for the chat interface
 * @component
 * 
 * This component provides a consistent layout structure for the chat interface
 * with named slots for different sections:
 * - header: For the chat header
 * - content: For the main chat content (messages)
 * - footer: For the chat footer (input and controls)
 * - panels: For additional panels like research
 * - modals: For modals like settings
 */
</script>

<style scoped>
.chat-layout {
  max-width: 800px;
  margin: 0 auto;
  background: var(--surface-color);
  border-radius: 8px;
  box-shadow: 0 2px 4px var(--shadow-color);
  padding: 20px;
  height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}
</style> 
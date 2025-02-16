import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'url'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.{js,vue}'],
      exclude: ['src/main.js', '**/node_modules/**']
    },
    setupFiles: ['./tests/unit/setup.js'],
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
}) 
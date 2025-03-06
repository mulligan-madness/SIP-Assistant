import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: [
      'tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],
    setupFiles: ['./tests/unit/setup.js'],
    alias: {
      '@': resolve(__dirname, './src'),
      'src': resolve(__dirname, './src'),
      'tests': resolve(__dirname, './tests'),
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      'src': resolve(__dirname, './src'),
      'tests': resolve(__dirname, './tests'),
    },
  },
  coverage: {
    provider: 'v8',
    reporter: ['text', 'lcov'],
    include: ['src/**/*.{js,vue}'],
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
}) 
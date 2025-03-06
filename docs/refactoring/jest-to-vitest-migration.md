# Migration from Jest to Vitest

This document outlines the migration process from Jest to Vitest for the SIP Assistant project.

## Why Vitest?

Vitest offers several advantages over Jest:

1. **Speed**: Vitest is significantly faster than Jest, especially for large test suites
2. **Vite Integration**: Seamless integration with our Vite-based build system
3. **ESM Support**: Better support for ES modules
4. **Vue Compatibility**: Excellent compatibility with Vue 3
5. **API Compatibility**: Vitest has a Jest-compatible API, making migration easier

## Migration Steps

The following steps were taken to migrate from Jest to Vitest:

1. **Install Vitest**: Added Vitest and related packages
   ```bash
   npm install -D vitest @vitest/coverage-v8
   ```

2. **Update Configuration**: Created a `vitest.config.js` file with appropriate settings
   ```javascript
   import { defineConfig } from 'vitest/config';
   import vue from '@vitejs/plugin-vue';
   import { fileURLToPath } from 'url';
   import { dirname, resolve } from 'path';

   const __dirname = dirname(fileURLToPath(import.meta.url));

   export default defineConfig({
     plugins: [vue()],
     test: {
       globals: true,
       environment: 'jsdom',
       include: [
         'tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
       ],
     },
     resolve: {
       alias: {
         '@': resolve(__dirname, './src'),
       },
     },
     coverage: {
       provider: 'v8',
       reporter: ['text', 'lcov'],
       include: ['src/**/*.{js,vue}'],
       exclude: ['**/node_modules/**', '**/dist/**'],
     },
   });
   ```

3. **Update Package Scripts**: Modified test scripts in `package.json`
   ```json
   "scripts": {
     "test": "vitest",
     "test:watch": "vitest --watch",
     "test:coverage": "vitest run --coverage",
     "test:ci": "vitest run --ci --coverage --maxWorkers=2",
     "test:ui": "vitest --ui"
   }
   ```

4. **Update Test Files**: Replaced Jest-specific APIs with Vitest equivalents
   - Changed `jest.fn()` to `vi.fn()`
   - Changed `jest.mock()` to `vi.mock()`
   - Changed `jest.spyOn()` to `vi.spyOn()`
   - Changed timer functions like `jest.useFakeTimers()` to `vi.useFakeTimers()`

5. **Update Documentation**: Updated testing documentation to reference Vitest instead of Jest

6. **Remove Jest Dependencies**: Removed Jest-related packages from `package.json`
   ```bash
   npm uninstall jest jest-environment-jsdom @vue/vue3-jest babel-jest
   ```

7. **Consolidate Test Directories**: Moved all tests to a unified `tests` directory structure

## API Differences

While Vitest aims to be compatible with Jest, there are some differences to be aware of:

1. **Imports**: Vitest requires explicit imports for mocking utilities
   ```javascript
   import { vi } from 'vitest';
   ```

2. **Module Mocking**: Vitest handles ES modules differently
   ```javascript
   // Jest
   jest.mock('../services/api');
   const api = require('../services/api');
   
   // Vitest
   import { vi } from 'vitest';
   import * as api from '../services/api';
   vi.mock('../services/api');
   ```

3. **Configuration**: Vitest uses a different configuration format

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Migrating from Jest](https://vitest.dev/guide/migration.html) 
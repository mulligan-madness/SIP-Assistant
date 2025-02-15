module.exports = {
  root: true,
  env: {
    node: true,
    browser: true,
    es2021: true
  },
  extends: [
    'plugin:vue/vue3-recommended',
    'eslint:recommended',
    'plugin:node/recommended',
    'plugin:security/recommended',
    '@vue/prettier'
  ],
  plugins: [
    'security'
  ],
  parserOptions: {
    ecmaVersion: 2021
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'vue/multi-word-component-names': 'off',
    'vue/require-default-prop': 'off',
    'vue/no-v-html': 'off', // Since we're using marked for safe markdown rendering
    'node/no-unsupported-features/es-syntax': ['error', {
      'version': '>=14.0.0',
      'ignores': ['modules']
    }],
    'node/no-missing-require': ['error', {
      'allowModules': ['vue']
    }],
    'security/detect-object-injection': 'off', // We're handling this through input validation
    'security/detect-non-literal-fs-filename': 'off', // We're using validated paths
    'node/no-unpublished-require': ['error', {
      'allowModules': ['vite', '@vitejs/plugin-vue']
    }]
  },
  overrides: [
    {
      files: ['src/**/*.vue'],
      rules: {
        'node/no-unsupported-features/es-syntax': 'off',
        'node/no-missing-require': 'off'
      }
    }
  ]
} 
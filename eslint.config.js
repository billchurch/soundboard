import js from '@eslint/js';
import functionalPlugin from 'eslint-plugin-functional';

export default [
  js.configs.recommended,
  {
    files: ['**/*.js'],
    ignores: ['public/sounds/**'],
    languageOptions: {
      sourceType: 'module',
      globals: {
        document: 'readonly',
        window: 'readonly',
        console: 'readonly',
        process: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        performance: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        globalThis: 'readonly',
      },
    },
    plugins: {
      functional: functionalPlugin,
    },
    rules: {
      'prefer-const': 'error',
      'no-var': 'error',
      'functional/immutable-data': 'off',
      'functional/no-class': 'off',
      'functional/no-conditional-statements': 'off',
      'functional/no-loop-statements': 'off',
      'functional/no-let': 'warn',
      'functional/prefer-tacit': 'off',
      'no-implicit-globals': 'error',
      'no-console': 'off',
    },
  },
];

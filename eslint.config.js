import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

/**
 * Pragmatic lint setup for the R3XON codebase.
 * Focused on real error detection (hooks misuse, undefined vars, dead code)
 * without drowning a 12k-line legacy codebase in style noise.
 */
export default tseslint.config(
  {
    ignores: [
      'dist/**', 'node_modules/**', 'coverage/**', 'screenshots/**',
      'test-results/**', 'playwright-report/**', 'e2e/**', 'scripts/**',
      '*.config.js', '*.config.ts',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}', 'server.ts'],
    plugins: { 'react-hooks': reactHooks },
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // React hooks correctness — catches the nastiest runtime bugs
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'off',

      // Noise control for a legacy codebase
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      'no-empty': ['warn', { allowEmptyCatch: true }],
      'no-useless-catch': 'warn',
      'prefer-const': 'warn',
    },
  },
);

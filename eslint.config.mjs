import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'node_modules/**',
      '.cache/**',
      'artifacts/**',
      'test-results/**',
      'playwright-report/**',
      'coverage/**',
      'dist/**',
      'out/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
);

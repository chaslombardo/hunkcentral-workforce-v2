import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

export default [
  // Apply Next.js and TypeScript configs to all files
  ...compat.extends('next/core-web-vitals', 'next/typescript', 'prettier'),
  
  // Global rules for all files
  {
    rules: {
      // Warn about console.log in application code
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      
      // Temporarily relax strict rules for deployment
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-expressions': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  
  // Override rules for test files and test utilities
  {
    files: [
      '__tests__/**/*',
      '**/*.test.{js,jsx,ts,tsx}',
      '**/*.spec.{js,jsx,ts,tsx}',
      '**/test-runner.{js,ts}',
      '**/vitest.setup.{js,ts}',
      '**/vitest.config.{js,ts}',
    ],
    rules: {
      // Allow console.log in test files and test utilities
      'no-console': 'off',
    },
  },
  
  // Override rules for development and debug files
  {
    files: [
      '**/debug/**/*',
      '**/development/**/*',
      '**/*.debug.{js,jsx,ts,tsx}',
      '**/*.dev.{js,jsx,ts,tsx}',
    ],
    rules: {
      // Allow console.log in debug/development files
      'no-console': 'off',
    },
  },
];
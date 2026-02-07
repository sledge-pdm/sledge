import tsParser from '@typescript-eslint/parser';

const restrictedImports = {
  paths: [
    {
      name: '@tauri-apps/api',
      message: 'Use ~/utils/platform instead of direct Tauri imports.',
    },
    { name: 'fs', message: 'Avoid Node builtins in src; use ~/utils/platform or web APIs.' },
    { name: 'path', message: 'Avoid Node builtins in src; use ~/utils/platform or web APIs.' },
    { name: 'os', message: 'Avoid Node builtins in src; use ~/utils/platform or web APIs.' },
    { name: 'crypto', message: 'Avoid Node builtins in src; use Web Crypto APIs.' },
    { name: 'stream', message: 'Avoid Node builtins in src.' },
    { name: 'child_process', message: 'Avoid Node builtins in src.' },
    { name: 'worker_threads', message: 'Avoid Node builtins in src.' },
  ],
  patterns: [
    {
      group: ['@tauri-apps/*'],
      message: 'Use ~/utils/platform instead of direct Tauri imports.',
    },
    {
      group: ['node:*'],
      message: 'Avoid Node builtins in src; use ~/utils/platform or web APIs.',
    },
  ],
};

export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'wasm/pkg/**', 'src-tauri/**'],
  },
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
  },
  {
    files: ['src/**/*.{ts,tsx,js,jsx}'],
    rules: {
      'no-restricted-imports': ['error', restrictedImports],
    },
  },
  {
    files: ['src/utils/platform/**'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
  {
    files: ['src/utils/UpdateUtils.ts'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
];

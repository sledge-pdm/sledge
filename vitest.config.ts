import dotenv from 'dotenv';
import path from 'path';
import topLevelAwait from 'vite-plugin-top-level-await';
import wasmPlugin from 'vite-plugin-wasm';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [wasmPlugin(), topLevelAwait()],
  test: {
    environment: 'node',
    globals: true,
    env: dotenv.config({ path: path.resolve(__dirname, '.env.vitest') }).parsed,
    setupFiles: [path.resolve(__dirname, 'vitest.setup.ts')],
    // app-level integration tests + feature-local unit tests
    include: [
      'apps/sledge/test/**/*.test.ts',
      'apps/sledge/test/**/*.test.tsx',
      'apps/sledge/src/features/**/__tests__/**/*.test.ts',
      'apps/sledge/src/features/**/__tests__/**/*.test.tsx',
      // unit test variant naming
      'apps/sledge/src/features/**/__tests__/**/*.unit.test.ts',
      'apps/sledge/src/features/**/__tests__/**/*.unit.test.tsx',
    ],
    exclude: ['**/dist/**', '**/node_modules/**', '**/target/**'],
    coverage: {
      reporter: ['text', 'html'],
    },
  },
  resolve: {
    alias: {
      '~': path.resolve(__dirname, 'apps/sledge/src'),
      '@sledge/core': path.resolve(__dirname, 'packages/core'),
      '@sledge/theme': path.resolve(__dirname, 'packages/theme'),
      '@sledge/ui': path.resolve(__dirname, 'packages/ui'),
      '@sledge/wasm': path.resolve(__dirname, 'packages/wasm/pkg/sledge_wasm.js'),
    },
  },
});

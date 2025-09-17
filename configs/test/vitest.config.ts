import dotenv from 'dotenv';
import path from 'path';
import topLevelAwait from 'vite-plugin-top-level-await';
import wasmPlugin from 'vite-plugin-wasm';
import { defineConfig } from 'vitest/config';

// rootDir はリポジトリルートへの絶対パス
const rootDir = path.resolve(__dirname, '../..');

export default defineConfig({
  plugins: [wasmPlugin(), topLevelAwait()],
  test: {
    environment: 'node',
    globals: true,
    env: dotenv.config({ path: path.resolve(__dirname, '.env.vitest') }).parsed,
    setupFiles: [path.resolve(__dirname, 'vitest.setup.ts')],
    include: [
      'apps/sledge/test/**/*.test.ts',
      'apps/sledge/test/**/*.test.tsx',
      'apps/sledge/src/features/**/__tests__/**/*.test.ts',
      'apps/sledge/src/features/**/__tests__/**/*.test.tsx',
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
      '~': path.resolve(rootDir, 'apps/sledge/src'),
      '@sledge/core': path.resolve(rootDir, 'packages/core'),
      '@sledge/theme': path.resolve(rootDir, 'packages/theme'),
      '@sledge/ui': path.resolve(rootDir, 'packages/ui'),
      '@sledge/wasm': path.resolve(rootDir, 'packages/wasm/pkg/sledge_wasm.js'),
    },
  },
});

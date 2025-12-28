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
    include: ['test/**/*.test.ts', 'test/**/*.test.tsx'],
    exclude: ['**/dist/**', '**/node_modules/**', '**/target/**'],
    server: {
      deps: {
        // Ensure Vite transforms the wasm-using anvil package instead of Node trying to load .wasm directly.
        inline: ['@sledge/anvil', /@sledge-pdm\/anvil/],
      },
    },
  },
  optimizeDeps: {
    exclude: ['@sledge/core', '@sledge/theme', '@sledge/ui'],
  },
  resolve: {
    alias: {
      '~': path.resolve(__dirname, 'src'),
      '@assets': path.resolve(__dirname, 'assets'),
      '@sledge/wasm': path.resolve(__dirname, 'wasm/pkg/sledge_wasm.js'),
      '@tauri-apps/plugin-fs': path.resolve(__dirname, 'test/mocks/tauri-plugin-fs.ts'),
      '@tauri-apps/api/core': path.resolve(__dirname, 'test/mocks/tauri-api-core.ts'),
    },
  },
});

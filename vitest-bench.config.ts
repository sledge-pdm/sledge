import { playwright } from '@vitest/browser-playwright';
import dotenv from 'dotenv';
import path from 'path';
import topLevelAwait from 'vite-plugin-top-level-await';
import wasmPlugin from 'vite-plugin-wasm';
import solidPlugin from 'vite-plugin-solid';
import { defineConfig } from 'vitest/config';

const projectRoot = path.resolve(__dirname);

export default defineConfig({
  plugins: [wasmPlugin(), solidPlugin() , topLevelAwait()],
  resolve: {
    alias: {
      '~': path.resolve(projectRoot, 'src'),
      '@assets': path.resolve(projectRoot, 'public/assets'),
      '@sledge/wasm': path.resolve(projectRoot, 'wasm/pkg/sledge_wasm.js'),
    },
  },
  test: {
    environment: 'node',
    globals: true,
    env: dotenv.config({ path: path.resolve(__dirname, './test/.env.vitest') }).parsed,
    setupFiles: [path.resolve(__dirname, './test/vitest-e2e.setup.ts')],
    exclude: ['**/dist/**', '**/node_modules/**', '**/target/**'],
    benchmark: {
      include: ['test/**/*.bench.(js|ts)'],
      outputJson: './test/bench/result.json',
    },
    browser: {
      provider: playwright(),
      enabled: true,
      headless: true,
      instances: [{ browser: 'chromium' }],
      screenshotFailures: false,
    },
  },
});

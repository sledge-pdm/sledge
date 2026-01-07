import { playwright } from '@vitest/browser-playwright';
import dotenv from 'dotenv';
import path from 'path';
import topLevelAwait from 'vite-plugin-top-level-await';
import wasmPlugin from 'vite-plugin-wasm';
import { defineConfig } from 'vitest/config';

const sharedConfig = {
  plugins: [wasmPlugin(), topLevelAwait()],
  resolve: {
    alias: {
      '~': path.resolve(__dirname, 'src'),
      '@assets': path.resolve(__dirname, 'public/assets'),
      '@sledge/wasm': path.resolve(__dirname, 'wasm/pkg/sledge_wasm.js'),
    },
  },
};

export default defineConfig({
  test: {
    projects: [
      {
        ...sharedConfig,
        test: {
          name: 'unit',
          environment: 'node',
          globals: true,
          env: dotenv.config({ path: path.resolve(__dirname, '.env.vitest') }).parsed,
          setupFiles: [path.resolve(__dirname, 'vitest-unit.setup.ts')],
          include: ['test/unit/**/*.test.ts', 'test/unit/**/*.test.tsx', 'test/**/*.unit.test.tsx'],
          exclude: ['**/dist/**', '**/node_modules/**', '**/target/**'],
        },
      },
      {
        ...sharedConfig,
        test: {
          name: 'e2e',
          environment: 'node',
          globals: true,
          env: dotenv.config({ path: path.resolve(__dirname, '.env.vitest') }).parsed,
          setupFiles: [path.resolve(__dirname, 'vitest-e2e.setup.ts')],
          include: ['test/e2e/**/*.test.ts', 'test/e2e/**/*.test.tsx', 'test/**/*.browser.test.tsx'],
          exclude: ['**/dist/**', '**/node_modules/**', '**/target/**'],
          browser: {
            provider: playwright(),
            enabled: true,
            headless: true,
            instances: [{ browser: 'chromium' }],
            screenshotFailures: false,
          },
        },
      },
    ],
  },
});

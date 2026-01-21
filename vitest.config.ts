import { playwright } from '@vitest/browser-playwright';
import dotenv from 'dotenv';
import path from 'path';
import topLevelAwait from 'vite-plugin-top-level-await';
import wasmPlugin from 'vite-plugin-wasm';
import { defineConfig } from 'vitest/config';

const projectRoot = path.resolve(__dirname);

const sharedConf = {
  plugins: [wasmPlugin(), topLevelAwait()],
  resolve: {
    alias: {
      '~': path.resolve(projectRoot, 'src'),
      '@assets': path.resolve(projectRoot, 'public/assets'),
      '@sledge/wasm': path.resolve(projectRoot, 'wasm/pkg/sledge_wasm.js'),
    },
  },
};

export default defineConfig({
  test: {
    benchmark: {
      include: ['test/**/*.bench.(js|ts)'],
    },
    projects: [
      {
        ...sharedConf,
        test: {
          name: 'unit',
          environment: 'node',
          globals: true,
          env: dotenv.config({ path: path.resolve(__dirname, './test/.env.vitest') }).parsed,
          setupFiles: [path.resolve(__dirname, './test/vitest-unit.setup.ts')],
          include: ['test/unit/**/*.test.ts', 'test/unit/**/*.test.tsx', 'test/**/*.unit.test.tsx'],
          exclude: ['**/dist/**', '**/node_modules/**', '**/target/**', 'test/e2e/**'],
        },
      },
      {
        ...sharedConf,
        test: {
          name: 'e2e',
          environment: 'node',
          globals: true,
          env: dotenv.config({ path: path.resolve(__dirname, './test/.env.vitest') }).parsed,
          setupFiles: [path.resolve(__dirname, './test/vitest-e2e.setup.ts')],
          include: ['test/e2e/**/*.test.ts', 'test/e2e/**/*.test.tsx', 'test/**/*.browser.test.tsx'],
          exclude: ['**/dist/**', '**/node_modules/**', '**/target/**', 'test/unit/**'],
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

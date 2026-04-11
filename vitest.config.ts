import { playwright } from '@vitest/browser-playwright';
import dotenv from 'dotenv';
import path from 'path';
import solidPlugin from 'vite-plugin-solid';
import wasmPlugin from 'vite-plugin-wasm';
import { defineConfig } from 'vitest/config';

const projectRoot = path.resolve(__dirname);
const sharedAliases = {
  '~': path.resolve(projectRoot, 'src'),
  '@assets': path.resolve(projectRoot, 'public/assets'),
};
const testEnv = dotenv.config({ path: path.resolve(__dirname, './test/.env.vitest') }).parsed;

export default defineConfig({
  plugins: [wasmPlugin(), solidPlugin()],
  resolve: {
    alias: {
      ...sharedAliases,
      '@sledge/wasm': path.resolve(projectRoot, 'wasm/pkg/sledge_wasm.js'),
    },
  },
  optimizeDeps: {
    include: [
      'solid-js',
      'solid-js/store',
      'mitt',
      'uuid',
      '@acab/ecsstatic',
      '@sledge-pdm/frasco',
      '@solid-primitives/raf',
      '@solid-primitives/scheduled',
    ],
  },
  test: {
    benchmark: {
      include: ['test/**/*.bench.(js|ts)'],
    },
    environment: 'node',
    setupFiles: [path.resolve(__dirname, './test/vitest.jest-dom.setup.ts')],
    projects: [
      {
        extends: true,
        resolve: {
          alias: {
            ...sharedAliases,
            '@sledge/wasm': path.resolve(projectRoot, 'src/utils/wasm_js/index.ts'),
          },
        },
        test: {
          name: 'unit',
          environment: 'node',
          globals: true,
          env: testEnv,
          setupFiles: [path.resolve(__dirname, './test/vitest-unit.setup.ts')],
          include: ['test/unit/**/*.test.ts', 'test/unit/**/*.test.tsx', 'test/**/*.unit.test.tsx'],
          exclude: ['**/dist/**', '**/node_modules/**', '**/target/**', 'test/e2e/**'],
        },
      },
      {
        extends: true,
        test: {
          name: 'e2e',
          environment: 'node',
          globals: true,
          env: testEnv,
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

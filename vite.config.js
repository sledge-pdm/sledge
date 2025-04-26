import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import path from 'path';
import { defineConfig } from 'vite';
import checker from 'vite-plugin-checker';
import solidPlugin from 'vite-plugin-solid';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    vanillaExtractPlugin({ devStyleRuntime: 'vanilla-extract' }),
    solidPlugin(),
    tsconfigPaths(),
    checker({
      eslint: { lintCommand: 'eslint "./src/**/*.{ts,tsx}"' },
      typescript: true, // 型チェックも要れば
      terminal: false,
      overlay: false,
    }),
  ],
  build: {
    target: 'esnext',
    outDir: 'dist',
  },
  server: {
    host: true,
    port: 5173,
  },
  alias: {
    '~': path.resolve(__dirname, 'src'),
  },
});

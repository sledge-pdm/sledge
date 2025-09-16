import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import path from 'path';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import solidPlugin from 'vite-plugin-solid';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    vanillaExtractPlugin(),
    solidPlugin(),
    tsconfigPaths(),
    nodePolyfills({ include: ['process'], globals: { global: true, process: true } }),
  ],
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
  },
  publicDir: '../../assets',
  resolve: {
    alias: {
      '@sledge/core': path.join(__dirname, '../../packages/core'),
      '@sledge/theme': path.join(__dirname, '../../packages/theme'),
      '@sledge/ui': path.join(__dirname, '../../packages/ui'),
    },
  },
});

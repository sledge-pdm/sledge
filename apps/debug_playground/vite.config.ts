/// <reference types="vitest" />
/// <reference types="vite/client" />

import path from 'path';
import devtools from 'solid-devtools/vite';
import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import topLevelAwait from 'vite-plugin-top-level-await';
import wasmPlugin from 'vite-plugin-wasm';

export default defineConfig({
  plugins: [devtools(), solidPlugin(), topLevelAwait(), wasmPlugin()],
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
  },
  publicDir: '../../assets',
  resolve: {
    conditions: ['development', 'browser'],
    alias: {
      '~': path.join(__dirname, 'src'),
      '@sledge/core': path.join(__dirname, '../../packages/core'),
      '@sledge/theme': path.join(__dirname, '../../packages/theme'),
      '@sledge/ui': path.join(__dirname, '../../packages/ui'),
      '@sledge/anvil': path.join(__dirname, '../../packages/anvil'),
      '@sledge/wasm': path.join(__dirname, '../../packages/wasm/pkg/sledge_wasm.js'),
      '@assets': path.join(__dirname, '../../assets'),
    },
  },
});

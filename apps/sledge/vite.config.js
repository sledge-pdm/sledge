import { ecsstatic } from '@acab/ecsstatic/vite';
import path from 'path';
import { defineConfig } from 'vite';
import glsl from 'vite-plugin-glsl';
import solidPlugin from 'vite-plugin-solid';
import topLevelAwait from 'vite-plugin-top-level-await';
import wasmPlugin from 'vite-plugin-wasm';

const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
  plugins: [wasmPlugin(), ecsstatic(), solidPlugin(), glsl(), topLevelAwait()],
  build: {
    outDir: 'dist',
    // Tauri uses Chromium on Windows and WebKit on macOS and Linux
    target: process.env.TAURI_ENV_PLATFORM == 'windows' ? 'chrome105' : 'safari13',
    // don't minify for debug builds
    minify: !process.env.TAURI_ENV_DEBUG ? 'esbuild' : false,
    // produce sourcemaps for debug builds
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
  },
  clearScreen: false,
  server: {
    // make sure this port matches the devUrl port in tauri.conf.json file
    port: 5173,
    // Tauri expects a fixed port, fail if that port is not available
    strictPort: true,
    // if the host Tauri is expecting is set, use it
    host: host || false,
    hmr: host
      ? {
          protocol: 'ws',
          host,
          port: 1421,
        }
      : undefined,

    watch: {
      ignored: ['**/src-tauri/**', '**/.vite-inspect/**'],
    },
  },
  publicDir: '../../assets',
  resolve: {
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

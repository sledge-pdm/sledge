import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import path from 'path';
import { defineConfig } from 'vite';
import glsl from 'vite-plugin-glsl';
import solidPlugin from 'vite-plugin-solid';
import topLevelAwait from "vite-plugin-top-level-await";
import wasmPlugin from 'vite-plugin-wasm';
import tsconfigPaths from 'vite-tsconfig-paths';

const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
  plugins: [wasmPlugin(), vanillaExtractPlugin({ devStyleRuntime: 'vanilla-extract' }), solidPlugin(), tsconfigPaths(), glsl(), topLevelAwait()],
  build: {
    // target: 'esnext',
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
      // tell vite to ignore watching `src-tauri`
      ignored: ['**/src-tauri/**'],
    },
  },
  alias: {
    '~': path.resolve(__dirname, 'src'),
  },
  worker: {
    // Not needed with vite-plugin-top-level-await >= 1.3.0
    format: 'es',
    plugins: [
      wasm(),
      topLevelAwait()
    ]
  },
  resolve: {
    alias: {
      '@sledge/wasm': path.resolve(__dirname, '../../packages/wasm/pkg/sledge_wasm'),
    },
  },
});

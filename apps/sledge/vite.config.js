import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import path from 'path';
import { defineConfig } from 'vite';
import glsl from 'vite-plugin-glsl';
import solidPlugin from 'vite-plugin-solid';
import topLevelAwait from 'vite-plugin-top-level-await';
import wasmPlugin from 'vite-plugin-wasm';

const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
  plugins: [
    wasmPlugin(),
    vanillaExtractPlugin({
      devStyleRuntime: 'vanilla-extract',
    }),
    solidPlugin(),
    glsl(),
    topLevelAwait(),
  ],
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
  worker: {
    // Not needed with vite-plugin-top-level-await >= 1.3.0
    format: 'es',
    plugins: () => [wasmPlugin(), topLevelAwait()],
  },
  optimizeDeps: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    include: [
      // Tauri APIs - 個別にpre-bundlingして高速化
      '@tauri-apps/api/app',
      '@tauri-apps/api/core',
      '@tauri-apps/api/event',
      '@tauri-apps/api/path',
      // '@tauri-apps/api/fs',
      // '@tauri-apps/api/dialog',
      // Tauri プラグイン
      '@tauri-apps/plugin-os',
      // 外部ライブラリ
      'mitt',
      'uuid',
      'interactjs',
      'msgpackr',
      // SolidJS関連（よく使用されるもの）
      '@solid-primitives/map',
      '@solid-primitives/mouse',
      '@solid-primitives/timer',
    ],
    exclude: [
      '@solid-primitives/raf',
      // WASMモジュールはpre-bundlingから除外
      '@sledge/wasm',
      // VanillaExtractのランタイムをpre-bundlingから除外（処理速度向上）
      '@vanilla-extract/css',
      '@vanilla-extract/dynamic',
    ],
  },
  publicDir: '../../assets',
  resolve: {
    alias: {
      '~': path.join(__dirname, 'src'),
      '@sledge/core': path.join(__dirname, '../../packages/core'),
      '@sledge/theme': path.join(__dirname, '../../packages/theme'),
      '@sledge/ui': path.join(__dirname, '../../packages/ui'),
      '@sledge/wasm': path.join(__dirname, '../../packages/wasm/pkg/sledge_wasm.js'),
    },
  },
});

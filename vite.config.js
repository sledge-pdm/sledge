import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';
import glsl from 'vite-plugin-glsl';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';

export default defineConfig({
  plugins: [vanillaExtractPlugin({ devStyleRuntime: 'vanilla-extract' }), solidPlugin(), tsconfigPaths(), glsl()],
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

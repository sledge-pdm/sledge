import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [vanillaExtractPlugin(), solidPlugin(), tsconfigPaths()],
  server: {
    host: '192.168.5.3',
    port: 3000,
  },
  build: {
    target: 'esnext',
  },
});

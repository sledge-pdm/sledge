import { defineConfig } from 'vite'
import solidPlugin from 'vite-plugin-solid'
import tsconfigPaths from 'vite-tsconfig-paths'
import path from 'path'

export default defineConfig({
  plugins: [solidPlugin(), tsconfigPaths()],
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
})

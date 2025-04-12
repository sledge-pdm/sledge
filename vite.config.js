import { defineConfig } from 'vite'
import solidPlugin from 'vite-plugin-solid'
import tsconfigPaths from 'vite-tsconfig-paths'
import UnoCSS from 'unocss/vite'
import path from 'path'

export default defineConfig({
  plugins: [solidPlugin(), tsconfigPaths(), UnoCSS()],
  build: {
    target: 'esnext',
    outDir: 'dist',
  },
  server: {
    host: true,
    port: 5173,
  },
  alias: {
    // alias a path to a fs directory
    // the key must start and end with a slash
    '/@components/': path.join(__dirname, 'src/components'),
  },
})

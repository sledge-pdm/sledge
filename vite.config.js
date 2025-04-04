import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import tsconfigPaths from "vite-tsconfig-paths"; // ← これ！

export default defineConfig({
  plugins: [solidPlugin(), tsconfigPaths()],
  build: {
    target: "esnext",
    outDir: "dist",
  },
  server: {
    port: 5173,
  },
});

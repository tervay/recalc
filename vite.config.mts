import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import svgrPlugin from "vite-plugin-svgr";
import topLevelAwait from "vite-plugin-top-level-await";
import viteTsconfigPaths from "vite-tsconfig-paths";
import wasm from "vite-plugin-wasm";

export default defineConfig({
  server: {
    port: 3000,
  },
  preview: {
    port: 3000,
  },
  plugins: [
    wasm(),
    react(),
    viteTsconfigPaths(),
    svgrPlugin(),
    topLevelAwait({
      // The export name of top-level await promise for each chunk module
      promiseExportName: "__tla",
      // The function to generate import names of top-level await promise in each chunk module
      promiseImportName: (i) => `__tla_${i}`,
    }),
  ],
  worker: {
    plugins: () => [react(), viteTsconfigPaths(), svgrPlugin()],
  },
  resolve: {
    alias: {},
  },
  optimizeDeps: {
    esbuildOptions: {
      // Node.js global to browser globalThis
      define: {},
      plugins: [],
    },
  },
  build: {
    outDir: "build/",
    rollupOptions: {
      plugins: [],
    },
    commonjsOptions: {
      strictRequires: true,
    },
  },
});

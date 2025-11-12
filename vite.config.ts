import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { comlink } from 'vite-plugin-comlink';
import topLevelAwait from 'vite-plugin-top-level-await';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
    comlink(),
    topLevelAwait(),
  ],
  worker: {
    plugins: () => [comlink(), topLevelAwait()],
  },
  resolve: {
    alias: {
      '~': path.resolve(__dirname, 'app'),
    },
  },
  optimizeDeps: {
    // Force optimization to use pre-optimized dependencies
    force: false,
  },
  test: {
    exclude: ['playwright-tests/**', 'node_modules/**'],
  },
});

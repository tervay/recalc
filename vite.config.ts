import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { comlink } from 'vite-plugin-comlink';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths(), comlink()],
  worker: {
    plugins: () => [comlink()],
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

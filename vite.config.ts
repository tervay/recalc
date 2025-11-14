import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import Icons from 'unplugin-icons/vite';
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
    Icons({
      compiler: 'jsx',
      jsx: 'react',
    }),
  ],
  build: {
    minify: 'esbuild',
    cssMinify: true,
  },
  worker: {
    plugins: () => [comlink(), topLevelAwait()],
    format: 'es',
  },
  resolve: {
    alias: {
      '~': path.resolve(__dirname, 'app'),
    },
  },
  test: {
    exclude: ['playwright-tests/**', 'node_modules/**'],
  },
});

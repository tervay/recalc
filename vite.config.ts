import path from 'path';

import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import Icons from 'unplugin-icons/vite';
import { comlink } from 'vite-plugin-comlink';
import topLevelAwait from 'vite-plugin-top-level-await';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    tailwindcss(),
    reactRouter(),
    comlink(),
    topLevelAwait(),
    Icons({
      compiler: 'jsx',
      jsx: 'react',
    }),
  ],
  worker: {
    plugins: () => [comlink(), topLevelAwait()],
    format: 'es',
  },
  resolve: {
    alias: {
      '~': path.resolve(__dirname, 'app'),
    },
    tsconfigPaths: true,
  },
  test: {
    exclude: ['playwright-tests/**', 'node_modules/**'],
  },
});

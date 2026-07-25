import path from 'path';

import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import Icons from 'unplugin-icons/vite';
import { comlink } from 'vite-plugin-comlink';
import Sitemap from 'vite-plugin-sitemap';
import { defineConfig } from 'vitest/config';

// The sitemap plugin auto-discovers every prerendered route by globbing the
// built HTML in `build/client`, so we only need to exclude non-public pages
// that still emit HTML. `/dev/error` isn't prerendered, so it never appears;
// `/__spa-fallback` is React Router's client fallback shell, not a real page.
const EXCLUDED_ROUTES = ['/__spa-fallback', '/dev/error'];

export default defineConfig({
  plugins: [
    tailwindcss(),
    reactRouter(),
    comlink(),
    Icons({
      compiler: 'jsx',
      jsx: 'react',
    }),
    Sitemap({
      hostname: 'https://reca.lc',
      exclude: EXCLUDED_ROUTES,
      generateRobotsTxt: true,
      robots: [
        {
          userAgent: '*',
          allow: '/',
        },
      ],
      outDir: 'build/client',
    }),
  ],
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        // Emscripten-generated wpilibc_wasm.js and workerpool's browser dist
        // both contain Node.js-specific requires guarded by runtime env checks.
        // They're never reached in browser; the warnings are harmless.
        if (
          warning.message.includes(
            'has been externalized for browser compatibility',
          )
        )
          return;
        // Consequence of the above: rolldown can't move __vite-browser-external
        // into a separate chunk when it's also statically imported by workerpool.
        if (warning.code === 'INEFFECTIVE_DYNAMIC_IMPORT') return;
        warn(warning);
      },
    },
  },
  worker: {
    plugins: () => [comlink()],
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
    snapshotFormat: {
      maxOutputLength: Infinity,
    },
    unstubGlobals: true,
  },
  server: {
    watch: {
      ignored: ['playwright-tests/**'],
    },
  },
});

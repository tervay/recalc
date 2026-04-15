import fs from 'node:fs';
import path from 'path';

import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import Icons from 'unplugin-icons/vite';
import { comlink } from 'vite-plugin-comlink';
import Sitemap from 'vite-plugin-sitemap';
import { defineConfig } from 'vitest/config';

function routesFromConfig(): string[] {
  const src = fs.readFileSync(
    path.resolve(__dirname, 'app/routes.ts'),
    'utf-8',
  );
  const paths: string[] = [];
  for (const match of src.matchAll(/^\s*route\(\s*['"]([^'"]+)['"]/gm)) {
    paths.push(`/${match[1]}`);
  }
  return paths;
}

const routes = routesFromConfig();

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
      hostname: 'https://beta.reca.lc',
      dynamicRoutes: routes,
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
  },
  server: {
    watch: {
      ignored: ['playwright-tests/**'],
    },
  },
});

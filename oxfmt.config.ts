import { defineConfig } from 'oxfmt';

export default defineConfig({
  semi: true,
  singleQuote: true,
  trailingComma: 'all',
  tabWidth: 2,
  printWidth: 80,
  sortPackageJson: true,
  sortTailwindcss: {
    stylesheet: './app/app.css',
    functions: ['clsx', 'cn', 'cva'],
  },
  sortImports: {},
  ignorePatterns: [
    '.cache/',
    '.DS_Store',
    '.react-router/',
    '.vercel/',
    'build/',
    'node_modules/',
    'playwright-report/',
    'playwright-tests/**/*.yaml',
    'pnpm-lock.yaml',
    'test-results/',
  ],
});

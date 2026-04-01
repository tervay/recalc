import { defineConfig } from 'oxlint';

export default defineConfig({
  plugins: [
    'eslint',
    'import',
    'jsdoc',
    'jsx-a11y',
    'node',
    'oxc',
    'promise',
    'react-perf',
    'react',
    'typescript',
    'unicorn',
    'vitest',
  ],
  ignorePatterns: [
    '.react-router/',
    '**/.cache/',
    '**/.DS_Store',
    '**/.vercel/',
    '**/.vscode/',
    '**/*.d.ts',
    '**/playwright-report/',
    '**/test-results/',
    'app/components/ui/**',
    'app/lib/generated/**',
    'build/',
    'eslint.config.mjs',
    'node_modules/',
    'pnpm-lock.yaml',
    'wpilib/allwpilib/',
  ],
  rules: {
    // Vite query suffixes (e.g. ?worker&url) confuse this rule into false positives
    'import/default': 'off',
    'no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      },
    ],
  },
  overrides: [
    {
      files: ['**/*.{ts,tsx}'],
      env: {
        browser: true,
        worker: true,
      },
      rules: {
        'no-throw-literal': 'off',
        '@typescript-eslint/only-throw-error': [
          'error',
          { allow: ['Response'] },
        ],
        'react/no-unknown-property': [
          'error',
          { ignore: ['vaul-drawer-wrapper'] },
        ],
      },
    },
    {
      files: ['server.js', 'entry.server.tsx'],
      env: {
        node: true,
      },
    },
    {
      files: ['**/*.{ts,tsx,js}'],
      jsPlugins: ['eslint-plugin-no-relative-import-paths'],
      rules: {
        'no-relative-import-paths/no-relative-import-paths': 'error',
      },
    },
    {
      files: ['**/*.{ts,tsx}'],
      jsPlugins: ['eslint-plugin-zod'],
      rules: {
        'zod/array-style': 'error',
        'zod/no-any-schema': 'error',
        'zod/no-empty-custom-schema': 'error',
        'zod/no-number-schema-with-int': 'error',
        'zod/no-optional-and-default-together': 'error',
        'zod/no-throw-in-refine': 'error',
        'zod/prefer-enum-over-literal-union': 'error',
        'zod/prefer-meta': 'error',
        'zod/prefer-meta-last': 'error',
        'zod/prefer-namespace-import': 'error',
        'zod/require-brand-type-parameter': 'error',
        'zod/require-error-message': 'error',
        'zod/require-schema-suffix': 'error',
      },
    },
  ],
  options: {
    typeAware: true,
  },
});

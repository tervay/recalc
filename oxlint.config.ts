import { defineConfig } from 'oxlint';

export default defineConfig({
  jsPlugins: ['oxlint-tailwindcss'],
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

        // Type-aware rules — correctness
        '@typescript-eslint/no-unnecessary-type-parameters': 'error',
        '@typescript-eslint/consistent-return': 'error',
        '@typescript-eslint/strict-void-return': 'error',

        // Type-aware rules — modernization
        '@typescript-eslint/prefer-optional-chain': 'warn',
        '@typescript-eslint/prefer-nullish-coalescing': 'warn',
        '@typescript-eslint/prefer-readonly': 'warn',
        '@typescript-eslint/dot-notation': 'warn',
        '@typescript-eslint/consistent-type-exports': 'warn',
        '@typescript-eslint/no-unnecessary-qualifier': 'warn',
        '@typescript-eslint/no-unnecessary-type-conversion': 'warn',
        '@typescript-eslint/prefer-find': 'warn',
        '@typescript-eslint/prefer-regexp-exec': 'warn',
        '@typescript-eslint/prefer-string-starts-ends-with': 'warn',
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
        'zod/consistent-import': 'error',
        'zod/consistent-schema-var-name': 'error',
        'zod/require-brand-type-parameter': 'error',
        'zod/require-error-message': 'error',
      },
    },
    {
      files: ['**/*.{ts,tsx}'],
      jsPlugins: ['oxlint-tailwindcss'],
      rules: {
        // Correctness — catch real bugs
        'tailwindcss/no-conflicting-classes': 'error',
        'tailwindcss/no-deprecated-classes': 'error',
        'tailwindcss/no-duplicate-classes': 'warn',
        'tailwindcss/no-unknown-classes': 'error',

        // Modernization — keep classes in current canonical form
        'tailwindcss/enforce-canonical': 'warn',
        'tailwindcss/no-unnecessary-arbitrary-value': 'warn',

        // Style and consistency
        'tailwindcss/enforce-sort-order': 'warn',
        'tailwindcss/consistent-variant-order': 'warn',
        'tailwindcss/enforce-consistent-important-position': 'warn',
        'tailwindcss/no-unnecessary-whitespace': 'warn',
      },
    },
  ],
  settings: {
    tailwindcss: {
      entryPoint: 'app/app.css',
    },
  },
  options: {
    typeAware: true,
  },
});

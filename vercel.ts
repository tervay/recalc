import { routes, type VercelConfig } from '@vercel/config/v1';

export const config: VercelConfig = {
  framework: 'react-router',
  outputDirectory: 'build/client',
  installCommand: 'pnpm install',
  rewrites: [routes.rewrite('/(.*)', '/index.html')],
  headers: [
    routes.cacheControl('/assets/(.*)', {
      public: true,
      maxAge: '1 year',
      immutable: true,
    }),
    routes.header('/(.*)', [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      {
        key: 'Content-Security-Policy',
        value:
          "frame-ancestors 'self' https://*.onshape.com moz-extension: chrome-extension:",
      },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    ]),
  ],
};

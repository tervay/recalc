import { matchers, routes, type VercelConfig } from '@vercel/config/v1';

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
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    ]),
    routes.header('/(.*)', [{ key: 'X-Robots-Tag', value: 'noindex' }], {
      has: [matchers.host('reca.lc')],
    }),
  ],
};

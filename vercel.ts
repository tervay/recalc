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
    // Transitional: this deployment will eventually become the production
    // reca.lc site, but currently also serves beta.reca.lc. Keep the beta
    // host out of search results so it never competes with the canonical
    // reca.lc URLs in app/lib/seo.ts. Safe to delete once beta.reca.lc is
    // retired at cutover.
    routes.header('/(.*)', [{ key: 'X-Robots-Tag', value: 'noindex' }], {
      has: [matchers.host('beta.reca.lc')],
    }),
  ],
};

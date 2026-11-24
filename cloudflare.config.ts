import { defineConfig } from 'cf/config';

export default defineConfig({
  accountId: '457faf2157908d04b73df7cb5800ff03',
  worker: {
    name: 'recalc',
    compatibilityDate: '2026-11-23',
    assets: {
      htmlHandling: 'drop-trailing-slash',
      notFoundHandling: 'single-page-application',
    },
    domains: ['reca.lc', 'www.reca.lc'],
  },
});

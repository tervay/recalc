import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

function parseHeaders(source: string): Map<string, Map<string, string>> {
  const rules = new Map<string, Map<string, string>>();
  let current = new Map<string, string>();
  for (const line of source.split('\n')) {
    if (line.trim() === '' || line.trim().startsWith('#')) continue;
    if (/^\s/.test(line)) {
      const separator = line.indexOf(':');
      current.set(
        line.slice(0, separator).trim().toLowerCase(),
        line.slice(separator + 1).trim(),
      );
    } else {
      current = new Map();
      rules.set(line.trim(), current);
    }
  }
  return rules;
}

const rules = parseHeaders(
  readFileSync(join(process.cwd(), 'public', '_headers'), 'utf8'),
);

describe('public/_headers', () => {
  it('allows Onshape and browser extensions to frame every page', () => {
    expect(rules.get('/*')?.get('content-security-policy')).toBe(
      "frame-ancestors 'self' https://*.onshape.com moz-extension: chrome-extension:",
    );
  });

  it('disables MIME sniffing on every page', () => {
    expect(rules.get('/*')?.get('x-content-type-options')).toBe('nosniff');
  });

  it('limits the referrer on cross-origin requests from every page', () => {
    expect(rules.get('/*')?.get('referrer-policy')).toBe(
      'strict-origin-when-cross-origin',
    );
  });

  it('caches hashed build assets immutably for a year', () => {
    expect(rules.get('/assets/*')?.get('cache-control')).toBe(
      'public, max-age=31536000, immutable',
    );
  });
});

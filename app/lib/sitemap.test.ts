import { describe, expect, it } from 'vitest';

import { routePaths, sitemapXml } from '~/lib/sitemap';

describe('routePaths', () => {
  it('maps the root index.html to the root path', () => {
    expect(routePaths(['index.html'])).toEqual(['/']);
  });

  it('maps a nested index.html to its directory path', () => {
    expect(routePaths(['flywheel/index.html'])).toEqual(['/flywheel']);
  });

  it('maps a deeply nested index.html to its full directory path', () => {
    expect(routePaths(['a/b/index.html'])).toEqual(['/a/b']);
  });

  it('accepts Windows path separators', () => {
    expect(routePaths(['a\\b\\index.html'])).toEqual(['/a/b']);
  });

  it('ignores HTML files that are not index.html', () => {
    expect(routePaths(['__spa-fallback.html'])).toEqual([]);
  });

  it('ignores files whose name merely ends with index.html', () => {
    expect(routePaths(['notindex.html'])).toEqual([]);
  });

  it('ignores non-HTML build assets', () => {
    expect(routePaths(['assets/root-abc.js', 'robots.txt'])).toEqual([]);
  });

  it('sorts paths so the sitemap is deterministic', () => {
    expect(
      routePaths(['motors/index.html', 'index.html', 'arm/index.html']),
    ).toEqual(['/', '/arm', '/motors']);
  });
});

describe('sitemapXml', () => {
  it('renders each URL as a loc entry in order', () => {
    expect(sitemapXml(['https://reca.lc', 'https://reca.lc/flywheel'])).toBe(
      [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        '  <url><loc>https://reca.lc</loc></url>',
        '  <url><loc>https://reca.lc/flywheel</loc></url>',
        '</urlset>',
        '',
      ].join('\n'),
    );
  });

  it('escapes XML special characters in URLs', () => {
    expect(sitemapXml(['https://reca.lc/?a=1&b=2'])).toContain(
      '<loc>https://reca.lc/?a=1&amp;b=2</loc>',
    );
  });

  it('renders an empty urlset when there are no URLs', () => {
    expect(sitemapXml([])).toBe(
      [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        '</urlset>',
        '',
      ].join('\n'),
    );
  });
});

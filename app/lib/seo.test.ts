import { describe, expect, it } from 'vitest';

import { BASE_URL, OG_IMAGE, buildMeta, pageUrl } from '~/lib/seo';

describe('pageUrl', () => {
  it('resolves the root path to the bare base URL with no trailing slash', () => {
    expect(pageUrl('/')).toBe(BASE_URL);
  });

  it('resolves a leading-slash path to an absolute URL', () => {
    expect(pageUrl('/flywheel')).toBe(`${BASE_URL}/flywheel`);
  });

  it('normalizes a path missing its leading slash', () => {
    expect(pageUrl('flywheel')).toBe(`${BASE_URL}/flywheel`);
  });

  it('preserves multi-segment paths', () => {
    expect(pageUrl('/dev/error')).toBe(`${BASE_URL}/dev/error`);
  });
});

describe('buildMeta', () => {
  const opts = {
    path: '/belts',
    title: 'FRC & FTC Belt Calculator | ReCalc',
    description: 'Calculate belt drives.',
  };

  it('includes the title tag', () => {
    const meta = buildMeta(opts);
    expect(meta).toContainEqual({ title: opts.title });
  });

  it('includes the meta description tag', () => {
    const meta = buildMeta(opts);
    expect(meta).toContainEqual({
      name: 'description',
      content: opts.description,
    });
  });

  it('includes a canonical link tag pointing at the absolute page URL', () => {
    const meta = buildMeta(opts);
    expect(meta).toContainEqual({
      tagName: 'link',
      rel: 'canonical',
      href: `${BASE_URL}/belts`,
    });
  });

  it('includes Open Graph tags with the absolute URL and shared image', () => {
    const meta = buildMeta(opts);
    expect(meta).toContainEqual({ property: 'og:title', content: opts.title });
    expect(meta).toContainEqual({
      property: 'og:description',
      content: opts.description,
    });
    expect(meta).toContainEqual({
      property: 'og:url',
      content: `${BASE_URL}/belts`,
    });
    expect(meta).toContainEqual({ property: 'og:type', content: 'website' });
    expect(meta).toContainEqual({
      property: 'og:site_name',
      content: 'ReCalc',
    });
    expect(meta).toContainEqual({ property: 'og:image', content: OG_IMAGE });
  });

  it('defaults og:type to "website" when not specified', () => {
    const meta = buildMeta(opts);
    expect(meta).toContainEqual({ property: 'og:type', content: 'website' });
  });

  it('honors an explicit ogType override', () => {
    const meta = buildMeta({ ...opts, ogType: 'article' });
    expect(meta).toContainEqual({ property: 'og:type', content: 'article' });
  });

  it('includes Twitter card tags mirroring the title, description, and image', () => {
    const meta = buildMeta(opts);
    expect(meta).toContainEqual({
      name: 'twitter:card',
      content: 'summary_large_image',
    });
    expect(meta).toContainEqual({
      name: 'twitter:title',
      content: opts.title,
    });
    expect(meta).toContainEqual({
      name: 'twitter:description',
      content: opts.description,
    });
    expect(meta).toContainEqual({
      name: 'twitter:image',
      content: OG_IMAGE,
    });
  });

  it('resolves canonical/og/twitter URLs for the root path without a trailing slash', () => {
    const meta = buildMeta({ ...opts, path: '/' });
    expect(meta).toContainEqual({
      tagName: 'link',
      rel: 'canonical',
      href: BASE_URL,
    });
    expect(meta).toContainEqual({ property: 'og:url', content: BASE_URL });
  });
});

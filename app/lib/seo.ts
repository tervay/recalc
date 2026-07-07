import type { MetaDescriptor } from 'react-router';

/**
 * Central SEO configuration. This is the single source of truth for the
 * production origin and the shared meta-tag builder — every route's meta()
 * should go through buildMeta() rather than hand-rolling title/description/
 * canonical/OG/Twitter tags.
 */
export const BASE_URL = 'https://beta.reca.lc';
export const SITE_NAME = 'ReCalc';
export const OG_IMAGE = `${BASE_URL}/og-image.png`;

/** Resolves a route path (e.g. "/flywheel") to an absolute production URL. */
export function pageUrl(path: string): string {
  if (path === '/') return BASE_URL;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_URL}${normalized}`;
}

interface BuildMetaOpts {
  /** Route path, e.g. "/flywheel". Used for canonical + og:url. */
  path: string;
  /** Browser tab title. Should be keyword-rich with a brand suffix. */
  title: string;
  description: string;
  ogType?: 'website' | 'article';
}

/**
 * Builds the standard set of meta tags for a route: title, description,
 * canonical link, Open Graph, and Twitter card. Callers append any
 * page-specific `script:ld+json` entries after spreading this.
 */
export function buildMeta({
  path,
  title,
  description,
  ogType = 'website',
}: BuildMetaOpts): MetaDescriptor[] {
  const url = pageUrl(path);

  return [
    { title },
    { name: 'description', content: description },
    { tagName: 'link', rel: 'canonical', href: url },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:url', content: url },
    { property: 'og:type', content: ogType },
    { property: 'og:site_name', content: SITE_NAME },
    { property: 'og:image', content: OG_IMAGE },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: OG_IMAGE },
  ];
}

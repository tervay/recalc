const BASE_URL = 'https://beta.reca.lc';
const SITE_NAME = 'ReCalc';
const SITE_DESCRIPTION =
  'A collaboration-focused mechanical design calculator for FIRST Robotics Competition teams.';
const WEBSITE_ID = `${BASE_URL}/#website`;
const LANG = 'en-US';

export function buildWebSite() {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: BASE_URL,
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    inLanguage: LANG,
  };
}

interface WebPageOpts {
  url: string;
  name: string;
  description: string;
  breadcrumbLabel?: string;
  type?: 'WebPage' | 'AboutPage';
}

export function buildWebPage({
  url,
  name,
  description,
  breadcrumbLabel,
  type = 'WebPage',
}: WebPageOpts) {
  const base: Record<string, unknown> = {
    '@type': type,
    '@id': `${url}/#webpage`,
    url,
    name,
    description,
    inLanguage: LANG,
    isPartOf: { '@id': WEBSITE_ID },
  };

  if (breadcrumbLabel !== undefined) {
    base['breadcrumb'] = {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
        { '@type': 'ListItem', position: 2, name: breadcrumbLabel, item: url },
      ],
    };
  }

  return base;
}

interface CalculatorAppOpts {
  url: string;
  name: string;
  description: string;
}

export function buildCalculatorApp({
  url,
  name,
  description,
}: CalculatorAppOpts) {
  return {
    '@type': 'SoftwareApplication',
    '@id': `${url}/#app`,
    url,
    name,
    description,
    applicationCategory: 'UtilityApplication',
    operatingSystem: 'Web',
    isPartOf: { '@id': WEBSITE_ID },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };
}

export function buildJsonLd(...nodes: Record<string, unknown>[]) {
  return {
    '@context': 'https://schema.org',
    '@graph': nodes,
  };
}

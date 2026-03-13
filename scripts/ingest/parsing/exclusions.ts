import type { VendorName } from 'scripts/ingest/vendors';

import type { ShopifyProduct } from '~/lib/types/shopify';

export const EXCLUSION_KEYWORDS = [
  'swerve',
  'gearbox',
  'polybelt',
  'gearmotor',
  'kit',
  'tensioner',
  'clamping',
  'toughbox',
  'grinder',
  'pulley block',
  'bevel',
  'double,',
  'robits',
  'mk3',
  'mk4',
  'mk5',
  'miter',
  'timing belt tread',
  'nitrile track',
  'track drive',
  'round groove',
  'crowned roller',
  'flat belt',
  'open ended',
  'steamworks',
  'spacer',
  'servo spline',
  ' worm ',
  '0.6 module',
  '0.5 in. key bore',
  'sport gear',
  'pulley plate',
  'pulley bearing',
  'spool pulley',
  'picobox',
  'nub bore',
  'gears graphic',
  'pulley stock',
  'neverest',
  'gear stock',
  'dog pattern',
  'samurai',
  'ninja star',
  'ships from sydney',
  'base pulley',
  'for dart',
  'pulley extension',
];

export function shouldSkipProduct(
  product: ShopifyProduct,
  vendor: VendorName,
): boolean {
  const title = product.title.toLowerCase();

  if (EXCLUSION_KEYWORDS.some((exclusion) => title.includes(exclusion))) {
    return true;
  }

  // WCP-specific: skip products that don't start with "wcp-"
  if (vendor === 'WCP' && !title.startsWith('wcp-')) {
    return true;
  }

  return false;
}

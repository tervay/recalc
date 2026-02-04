import { urlForHandle } from 'scripts/downloadProducts/download';
import type { VendorCache, VendorName } from 'scripts/downloadProducts/types';

import type { ShopifyProduct } from '~/lib/types/shopify';

/**
 * Ignorelist for specific products that are known to be unparseable.
 * Each entry is a tuple of [productId, variantId].
 */
export const UNPARSEABLE_IGNORELIST: Record<
  VendorName,
  Array<[string, string]>
> = {
  WCP: [],
  Thrifty: [],
  AndyMark: [
    ['8263438729388', '44495365636268'],
    ['8263478608044', '44495536292012'],
    ['8263479885996', '44495544778924'],
    ['8262927810732', '44493482623148'],
  ],
  REV: [],
  VBeltGuys: [],
  LastAnvil: [],
  SDS: [
    ['3955802964086', '29503182995574'],
    ['1685628551286', '15245515948150'],
  ],
  Swyft: [],
};

/**
 * Exclusion keywords for products that should not be parsed
 */
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

/**
 * Check if a product/variant combination is in the unparseable ignorelist
 */
export function isInIgnorelist(
  vendor: VendorName,
  productId: number,
  variantId: number,
): boolean {
  const ignorelist = UNPARSEABLE_IGNORELIST[vendor];
  if (!ignorelist || ignorelist.length === 0) return false;

  const productIdStr = String(productId);
  const variantIdStr = String(variantId);

  return ignorelist.some(
    ([pid, vid]) => pid === productIdStr && vid === variantIdStr,
  );
}

/**
 * Check if a product should be skipped during parsing
 */
export function shouldSkipProduct(
  product: ShopifyProduct,
  vendor: VendorName,
): boolean {
  const title = product.title.toLowerCase();

  // Check exclusion keywords
  if (EXCLUSION_KEYWORDS.some((exclusion) => title.includes(exclusion))) {
    return true;
  }

  // WCP-specific: skip products that don't start with "wcp-"
  if (vendor === 'WCP' && !title.startsWith('wcp-')) {
    return true;
  }

  return false;
}

/**
 * Check if a product title contains relevant keywords (belt, pulley, sprocket, gear)
 * and does not contain exclusion keywords
 */
function isRelevantProduct(
  product: ShopifyProduct,
  vendor: VendorName,
): boolean {
  const title = product.title.toLowerCase();

  // Check if should be skipped
  if (shouldSkipProduct(product, vendor)) {
    return false;
  }

  // Include products containing relevant keywords
  const keywords = ['belt', 'pulley', 'sprocket', 'gear'];
  return keywords.some((keyword) => title.includes(keyword));
}

/**
 * Alert user about unparsed products that might be relevant
 */
export function alertUnparsedProducts(
  vendorProducts: Map<VendorName, ShopifyProduct[]>,
  allCaches: Map<string, VendorCache>,
): void {
  const unparsedRelevantProducts: Map<VendorName, ShopifyProduct[]> = new Map();

  // Check each vendor's products
  for (const [vendor, products] of vendorProducts.entries()) {
    // Skip vendors with no products (REV, VBeltGuys)
    if (products.length === 0) continue;

    // Collect all parsed product IDs for this vendor
    const parsedProductIds = new Set<number>();
    for (const [cacheKey, cache] of allCaches.entries()) {
      // Only look at caches for this vendor
      if (cacheKey.startsWith(`${vendor}_`)) {
        for (const entry of Object.values(cache)) {
          parsedProductIds.add(entry.productId);
        }
      }
    }

    // Find unparsed products that might be relevant
    const unparsed: ShopifyProduct[] = [];
    for (const product of products) {
      if (
        !parsedProductIds.has(product.id) &&
        isRelevantProduct(product, vendor)
      ) {
        // Check if all variants are in the ignorelist
        const allVariantsIgnored = product.variants.every((variant) =>
          isInIgnorelist(vendor, product.id, variant.id),
        );

        // Only include if not all variants are ignored
        if (!allVariantsIgnored) {
          unparsed.push(product);
        }
      }
    }

    if (unparsed.length > 0) {
      unparsedRelevantProducts.set(vendor, unparsed);
    }
  }

  // Display results
  let totalUnparsed = 0;
  for (const products of unparsedRelevantProducts.values()) {
    totalUnparsed += products.length;
  }

  if (totalUnparsed === 0) {
    console.log('\nNo unparsed relevant products detected.');
    return;
  }

  console.log('\n========================================');
  console.log('UNPARSED RELEVANT PRODUCTS DETECTED');
  console.log('(Products containing: belt, pulley, sprocket, or gear)');
  console.log('========================================\n');

  for (const [vendor, products] of unparsedRelevantProducts.entries()) {
    console.log(`${vendor}:`);
    console.log(
      `  (${products.length} unparsed product${products.length > 1 ? 's' : ''})`,
    );

    for (const product of products) {
      console.log(`  - ${product.title}`);

      // Show productId_variantId for single-variant products for easy copy-paste to ignorelist
      if (product.variants.length === 1) {
        console.log(`    Product ID: ${product.id}_${product.variants[0].id}`);
      } else {
        console.log(`    Product ID: ${product.id}`);
      }

      console.log(`    URL: ${urlForHandle(product.handle, vendor)}`);
      console.log(`    Variants: ${product.variants.length}`);
      console.log('');
    }

    console.log('');
  }

  console.log('========================================');
  console.log(
    `Total: ${totalUnparsed} unparsed product${totalUnparsed > 1 ? 's' : ''}`,
  );
  console.log('========================================\n');
}

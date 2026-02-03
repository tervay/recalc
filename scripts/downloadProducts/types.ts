import type { JSONBelt } from '~/lib/types/belts';
import type { JSONGear } from '~/lib/types/gears';
import type { JSONPlanetaryInstance } from '~/lib/types/planetary';
import type { JSONPulley } from '~/lib/types/pulleys';
import type { ShopifyProduct } from '~/lib/types/shopify';
import type { JSONSprocket } from '~/lib/types/sprockets';

/**
 * Represents a single cached entry for a product variant
 */
export interface CacheEntry {
  productId: number;
  variantId: number;
  rawProduct: ShopifyProduct;
  parsedData:
    | JSONPulley
    | JSONBelt
    | JSONSprocket
    | JSONGear
    | JSONPlanetaryInstance;
  firstSeen: string;
  lastSeen: string;
}

/**
 * Vendor cache is a map of cache entries keyed by "{productId}_{variantId}"
 */
export type VendorCache = Record<string, CacheEntry>;

/**
 * Product types that can be cached
 */
export type ProductType =
  | 'pulleys'
  | 'belts'
  | 'sprockets'
  | 'gears'
  | 'planetaries';

/**
 * Vendor names
 */
export type VendorName =
  | 'WCP'
  | 'Swyft'
  | 'Thrifty'
  | 'VBeltGuys'
  | 'AndyMark'
  | 'LastAnvil'
  | 'SDS'
  | 'REV';

/**
 * Cache metadata for tracking
 */
export interface CacheMetadata {
  vendor: VendorName;
  productType: ProductType;
  lastUpdated: string;
  entryCount: number;
}

/**
 * Generate cache key from product and variant IDs
 */
export function getCacheKey(productId: number, variantId: number): string {
  return `${productId}_${variantId}`;
}

/**
 * Parse cache key back to IDs
 */
export function parseCacheKey(key: string): {
  productId: number;
  variantId: number;
} {
  const [productId, variantId] = key.split('_').map(Number);
  return { productId, variantId };
}

/**
 * Remove unnecessary fields from ShopifyProduct for cache storage
 */
export function cleanProductForCache(product: ShopifyProduct): ShopifyProduct {
  const {
    body_html: _body,
    published_at: _pub,
    created_at: _created,
    updated_at: _updated,
    ...cleanProduct
  } = product;

  return {
    ...cleanProduct,
    variants: product.variants.map((v) => {
      const {
        requires_shipping: _reqShip,
        taxable: _tax,
        featured_image: _img,
        compare_at_price: _comp,
        created_at: _vCreated,
        updated_at: _vUpdated,
        ...cleanVariant
      } = v;
      return cleanVariant;
    }),
  } as ShopifyProduct;
}

/**
 * Create a minimal synthetic ShopifyProduct for hardcoded products
 */
export function createSyntheticProduct(
  id: number,
  title: string,
  vendor: string,
  productType: string,
  sku: string | null,
): ShopifyProduct {
  return {
    id,
    title,
    handle: `synthetic-${id}`,
    vendor,
    product_type: productType,
    tags: [],
    variants: [
      {
        id,
        title: sku ?? '',
        option1: sku ?? '',
        option2: null,
        option3: null,
        sku,
        available: true,
        price: '0',
        grams: 0,
        position: 1,
        product_id: id,
      },
    ],
    images: [],
    options: [],
  } as unknown as ShopifyProduct;
}

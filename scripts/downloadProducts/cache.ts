import { mkdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { format } from 'prettier';
import type {
  CacheEntry,
  ProductType,
  VendorCache,
  VendorName,
} from 'scripts/downloadProducts/types';
import { getCacheKey } from 'scripts/downloadProducts/types';

/**
 * Load cache from disk for a specific vendor and product type
 */
export async function loadCache(
  vendor: VendorName,
  productType: ProductType,
): Promise<VendorCache | null> {
  const cacheFile = join(
    process.cwd(),
    'vendors',
    `${vendor}_${productType}_cache.json`,
  );

  try {
    const content = await readFile(cacheFile, 'utf-8');
    return JSON.parse(content) as VendorCache;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

/**
 * Save cache to disk for a specific vendor and product type
 */
export async function saveCache(
  vendor: VendorName,
  productType: ProductType,
  cache: VendorCache,
): Promise<void> {
  const vendorDir = join(process.cwd(), 'vendors');
  await mkdir(vendorDir, { recursive: true });

  const cacheFile = join(vendorDir, `${vendor}_${productType}_cache.json`);

  const jsonString = JSON.stringify(cache, null, 2);
  const formatted = await format(jsonString, {
    filepath: cacheFile,
  });

  await writeFile(cacheFile, formatted);
}

/**
 * Compare and merge old cache with new entries
 * Returns merged cache and list of newly detected products
 */
export function compareAndMerge(
  oldCache: VendorCache | null,
  newEntries: CacheEntry[],
): { merged: VendorCache; newProducts: CacheEntry[] } {
  const merged: VendorCache = oldCache ? { ...oldCache } : {};
  const newProducts: CacheEntry[] = [];
  const now = new Date().toISOString();

  for (const entry of newEntries) {
    const key = getCacheKey(entry.productId, entry.variantId);

    if (merged[key]) {
      // Existing entry - update lastSeen timestamp
      merged[key] = {
        ...entry,
        firstSeen: merged[key].firstSeen, // Preserve original firstSeen
        lastSeen: now,
      };
    } else {
      // New entry - this is a new product
      merged[key] = {
        ...entry,
        firstSeen: now,
        lastSeen: now,
      };
      newProducts.push(merged[key]);
    }
  }

  return { merged, newProducts };
}

/**
 * Detect new products by comparing merged cache with old cache
 */
export function detectNewProducts(
  merged: VendorCache,
  oldCache: VendorCache | null,
): CacheEntry[] {
  if (!oldCache) {
    return Object.values(merged);
  }

  const newProducts: CacheEntry[] = [];

  for (const [key, entry] of Object.entries(merged)) {
    if (!oldCache[key]) {
      newProducts.push(entry);
    }
  }

  return newProducts;
}

/**
 * Get all cache keys for a vendor across all product types
 */
export function getCacheKeys(_vendor: VendorName): ProductType[] {
  const allProductTypes: ProductType[] = [
    'pulleys',
    'belts',
    'sprockets',
    'gears',
    'planetaries',
  ];

  return allProductTypes;
}

/**
 * Load all caches for a vendor
 */
export async function loadAllCachesForVendor(
  vendor: VendorName,
): Promise<Map<ProductType, VendorCache>> {
  const caches = new Map<ProductType, VendorCache>();
  const productTypes = getCacheKeys(vendor);

  await Promise.all(
    productTypes.map(async (productType) => {
      const cache = await loadCache(vendor, productType);
      if (cache) {
        caches.set(productType, cache);
      }
    }),
  );

  return caches;
}

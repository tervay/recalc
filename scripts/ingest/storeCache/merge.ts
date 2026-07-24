import type { StoreCacheEntry } from 'scripts/ingest/storeCache/types';
import type { VendorName } from 'scripts/ingest/vendors';

import type { ShopifyProduct } from '~/lib/types/shopify';

export function mergeStoreCacheEntries(
  existing: StoreCacheEntry[],
  products: ShopifyProduct[],
  vendor: VendorName,
): { merged: StoreCacheEntry[]; newEntries: StoreCacheEntry[] } {
  const existingByKey = new Map<string, StoreCacheEntry>();
  for (const entry of existing) {
    const key = `${entry.product.id}_${entry.variant.id}`;
    existingByKey.set(key, entry);
  }

  const merged: StoreCacheEntry[] = [];
  const newEntries: StoreCacheEntry[] = [];
  const now = new Date().toISOString();

  for (const product of products) {
    for (const variant of product.variants) {
      const key = `${product.id}_${variant.id}`;
      const existing = existingByKey.get(key);

      const entry: StoreCacheEntry = {
        vendor,
        product: {
          title: product.title,
          id: product.id,
          handle: product.handle,
        },
        variant: {
          id: variant.id,
          title: variant.title,
          sku: variant.sku ?? null,
          options: [
            variant.option1 ?? null,
            variant.option2 ?? null,
            variant.option3 ?? null,
          ],
        },
        firstSeen: existing ? existing.firstSeen : now,
      };

      merged.push(entry);
      if (!existing) {
        newEntries.push(entry);
      }
    }
  }

  return { merged, newEntries };
}

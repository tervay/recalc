import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

import type { StoreCacheEntry } from 'scripts/ingest/storeCache/types';
import type { VendorName } from 'scripts/ingest/vendors';
import { SHOPIFY_CONFIGS } from 'scripts/ingest/vendors';
import * as YAML from 'yaml';

// Reconstruct each entry with a canonical key order so that the YAML output
// is byte-for-byte identical regardless of the order the Shopify API returned
// products or of how the entry was originally deserialized.
function canonicalize(entry: StoreCacheEntry): StoreCacheEntry {
  return {
    vendor: entry.vendor,
    product: {
      handle: entry.product.handle,
      id: entry.product.id,
      title: entry.product.title,
    },
    variant: {
      id: entry.variant.id,
      options: entry.variant.options,
      sku: entry.variant.sku,
      title: entry.variant.title,
    },
    firstSeen: entry.firstSeen,
  };
}

export async function writeStoreCache(
  vendor: VendorName,
  entries: StoreCacheEntry[],
): Promise<void> {
  const sorted = [...entries]
    .sort((a, b) => {
      if (a.product.id !== b.product.id) return a.product.id - b.product.id;
      return a.variant.id - b.variant.id;
    })
    .map(canonicalize);

  const doc = new YAML.Document(sorted);
  const seq = doc.contents as YAML.YAMLSeq;
  const config = SHOPIFY_CONFIGS[vendor];

  if (config) {
    for (let i = 0; i < sorted.length; i++) {
      const entry = sorted[i];
      const item = seq.items[i];
      if (!YAML.isMap(item)) continue;

      const url = `${config.rootDomain}/products/${entry.product.handle}?variant=${entry.variant.id}`;

      for (const pair of item.items) {
        if (
          YAML.isScalar(pair.key) &&
          (pair.key as YAML.Scalar).value === 'product'
        ) {
          (pair.key as YAML.Scalar).commentBefore = ` ${url}`;
          break;
        }
      }
    }
  }

  const vendorDir = join(process.cwd(), 'vendors');
  await mkdir(vendorDir, { recursive: true });

  const filePath = join(vendorDir, `${vendor}.yaml`);
  await writeFile(filePath, doc.toString(), 'utf-8');
}

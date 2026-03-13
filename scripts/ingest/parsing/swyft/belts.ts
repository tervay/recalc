import { urlForHandle } from 'scripts/ingest/vendors';

import type { JSONBelt } from '~/lib/types/belts';
import type { ShopifyProduct } from '~/lib/types/shopify';

export function parseSwyftBelts(products: ShopifyProduct[]): JSONBelt[] {
  const belts: JSONBelt[] = [];

  for (const product of products) {
    if (product.title.includes('Timing Belt')) {
      const width = product.title.includes('9mm Width') ? 9 : 15;

      for (const variant of product.variants) {
        const teeth = Number(variant.title.split(' ')[0]);
        if (!isNaN(teeth) && teeth > 0) {
          belts.push({
            teeth,
            width,
            profile: 'HTD',
            pitch: 5,
            sku: variant.sku,
            url: urlForHandle(product.handle, 'Swyft'),
            vendor: 'Swyft',
          });
        }
      }
    }
  }

  return belts;
}

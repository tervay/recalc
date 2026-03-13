import { urlForHandle } from 'scripts/ingest/vendors';

import type { JSONBelt } from '~/lib/types/belts';
import type { ShopifyProduct } from '~/lib/types/shopify';

export function parseThriftyBelts(products: ShopifyProduct[]): JSONBelt[] {
  const belts: JSONBelt[] = [];

  for (const product of products) {
    if (product.title.includes('HTD Timing Belts')) {
      const widthMatch = product.title.match(/(\d+)mm Wide/);
      const width = widthMatch ? parseInt(widthMatch[1]) : null;

      if (width === null) continue;

      for (const variant of product.variants) {
        const toothMatch = variant.title.match(/^(\d+) Tooth/);
        const teeth = toothMatch ? parseInt(toothMatch[1]) : null;

        if (teeth === null) continue;

        belts.push({
          teeth,
          width,
          profile: 'HTD',
          pitch: 5,
          sku: variant.sku,
          url: urlForHandle(product.handle, 'Thrifty'),
          vendor: 'Thrifty',
        });
      }
    }
  }

  return belts;
}

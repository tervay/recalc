import { urlForHandle } from 'scripts/ingest/vendors';

import type { JSONBelt } from '~/lib/types/belts';
import type { ShopifyProduct } from '~/lib/types/shopify';

export function parseLastAnvilBelts(products: ShopifyProduct[]): JSONBelt[] {
  const belts: JSONBelt[] = [];

  for (const product of products) {
    if (!product.title.includes('Timing Belt')) continue;

    const widthMatch = product.title.match(/\((\d+)mm\)/);
    const width = widthMatch ? parseInt(widthMatch[1]) : null;

    if (width === null) continue;

    for (const variant of product.variants) {
      const toothMatch = variant.title.match(/(\d+)T/);
      const toothCount = toothMatch ? parseInt(toothMatch[1]) : null;

      if (toothCount === null) continue;

      belts.push({
        teeth: toothCount,
        width,
        profile: 'HTD',
        pitch: 5,
        sku: `LA-${variant.sku}`,
        url: urlForHandle(product.handle, 'LastAnvil'),
        vendor: 'LastAnvil',
      });
    }
  }

  return belts;
}

import { urlForHandle } from 'scripts/ingest/vendors';

import type { JSONPulley } from '~/lib/types/pulleys';
import type { ShopifyProduct } from '~/lib/types/shopify';

export function parseLastAnvilPulleys(
  products: ShopifyProduct[],
): JSONPulley[] {
  const pulleys: JSONPulley[] = [];

  for (const product of products) {
    if (!product.title.includes('Pulley')) continue;

    for (const variant of product.variants) {
      const toothMatch = variant.title.match(/(\d+)T\b/i);
      const toothCount = toothMatch ? Number(toothMatch[1]) : null;

      if (toothCount === null) continue;

      pulleys.push({
        teeth: toothCount,
        width: 9,
        profile: 'HTD',
        pitch: 5,
        sku: `LA-${variant.sku}`,
        url: urlForHandle(product.handle, 'LastAnvil'),
        bore: '1/2" Hex',
        vendor: 'LastAnvil',
      });
    }
  }

  return pulleys;
}

import { urlForHandle } from 'scripts/ingest/vendors';

import type { JSONBelt } from '~/lib/types/belts';
import { zJSONBeltSchema } from '~/lib/types/belts';
import type { ShopifyProduct } from '~/lib/types/shopify';

const SDS_BELT_TITLE_REGEX = /Belt,\s*Timing,\s*HTD\s+(\d+)-5M-(\d+)/i;

export function parseSDSBelts(products: ShopifyProduct[]): JSONBelt[] {
  const belts: JSONBelt[] = [];

  for (const product of products) {
    if (!product.title.includes('Belt') || !product.title.includes('Timing'))
      continue;

    const match = product.title.match(SDS_BELT_TITLE_REGEX);
    if (!match) continue;

    const lengthMm = parseInt(match[1], 10);
    const widthMm = parseInt(match[2], 10);
    const teeth = lengthMm / 5;
    if (!Number.isInteger(teeth) || teeth < 1) continue;

    const variant = product.variants[0];
    if (!variant) continue;

    try {
      const parsedData = zJSONBeltSchema.parse({
        teeth,
        width: widthMm,
        profile: 'HTD',
        pitch: 5,
        sku: variant.sku,
        url: urlForHandle(product.handle, 'SDS'),
        vendor: 'SDS',
      });
      belts.push(parsedData);
    } catch (error) {
      console.error(`Error parsing SDS belt: ${product.title}`, error);
    }
  }

  return belts;
}

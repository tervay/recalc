import { urlForHandle } from 'scripts/ingest/vendors';

import type { JSONBelt } from '~/lib/types/belts';
import { zJSONBeltSchema } from '~/lib/types/belts';
import type { ShopifyProduct } from '~/lib/types/shopify';

const PRODUCT_RE = /(?<profile>HTD|GT2)\s+(?<pitch>\d+)mm Pitch Timing Belts/;
const VARIANT_RE = /^(?<teeth>\d+) Tooth \/ (?<width>\d+)mm Width$/;

export function parseSwyftBelts(products: ShopifyProduct[]): JSONBelt[] {
  const belts: JSONBelt[] = [];

  for (const product of products) {
    const productMatch = PRODUCT_RE.exec(product.title);
    if (!productMatch?.groups) continue;
    const { profile, pitch } = productMatch.groups;

    for (const variant of product.variants) {
      const variantMatch = VARIANT_RE.exec(variant.title);
      if (!variantMatch?.groups) continue;
      const { teeth, width } = variantMatch.groups;

      try {
        belts.push(
          zJSONBeltSchema.parse({
            teeth: Number(teeth),
            width: Number(width),
            profile,
            pitch: Number(pitch),
            sku: variant.sku,
            url: urlForHandle(product.handle, 'Swyft'),
            vendor: 'Swyft',
          }),
        );
      } catch (error) {
        console.error(`Error parsing Swyft belt: ${product.title}`, error);
      }
    }
  }

  return belts;
}

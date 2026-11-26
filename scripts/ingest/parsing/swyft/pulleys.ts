import { urlForHandle } from 'scripts/ingest/vendors';

import type { JSONPulley } from '~/lib/types/pulleys';
import { zJSONPulleySchema } from '~/lib/types/pulleys';
import type { ShopifyProduct } from '~/lib/types/shopify';

const PRODUCT_RE = /^SWYFT (?<profile>HTD) (?<pitch>\d+)mm Pulleys$/;
const VARIANT_RE = /^(?<teeth>\d+) Tooth$/;
const MAX_BELT_WIDTH_MM = 9;

export function parseSwyftPulleys(products: ShopifyProduct[]): JSONPulley[] {
  const pulleys: JSONPulley[] = [];

  for (const product of products) {
    const productMatch = PRODUCT_RE.exec(product.title);
    if (!productMatch?.groups) continue;
    const { profile, pitch } = productMatch.groups;

    for (const variant of product.variants) {
      const variantMatch = VARIANT_RE.exec(variant.title);
      if (!variantMatch?.groups) continue;

      try {
        pulleys.push(
          zJSONPulleySchema.parse({
            teeth: Number(variantMatch.groups.teeth),
            width: MAX_BELT_WIDTH_MM,
            profile,
            pitch: Number(pitch),
            sku: variant.sku,
            variantId: variant.id,
            url: urlForHandle(product.handle, 'Swyft', variant.id),
            bore: '1/2" Hex',
            vendor: 'Swyft',
          }),
        );
      } catch (error) {
        console.error(`Error parsing Swyft pulley: ${variant.title}`, error);
      }
    }
  }

  return pulleys;
}

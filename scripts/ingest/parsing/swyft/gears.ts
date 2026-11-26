import { urlForHandle } from 'scripts/ingest/vendors';

import type { Bore } from '~/lib/types/common';
import type { JSONGear } from '~/lib/types/gears';
import { zJSONGearSchema } from '~/lib/types/gears';
import type { ShopifyProduct } from '~/lib/types/shopify';

const PRODUCT_RE = /^SWYFT Gears (?<dp>\d+)DP$/;
const VARIANT_RE =
  /^(?<teeth>\d+) Tooth (?<bore>15T SplineXS|1\/2" Hex) (?:Pinion|Wide|Hub)$/;

const swyftBoreToJsonBore: Record<string, Bore> = {
  '15T SplineXS': 'SplineXS',
  '1/2" Hex': '1/2" Hex',
};

export function parseSwyftGears(products: ShopifyProduct[]): JSONGear[] {
  const gears: JSONGear[] = [];

  for (const product of products) {
    const productMatch = PRODUCT_RE.exec(product.title);
    if (!productMatch?.groups) continue;
    const { dp } = productMatch.groups;

    for (const variant of product.variants) {
      const variantMatch = VARIANT_RE.exec(variant.title);
      if (!variantMatch?.groups) continue;
      const { teeth, bore } = variantMatch.groups;

      try {
        gears.push(
          zJSONGearSchema.parse({
            teeth: Number(teeth),
            dp: Number(dp),
            bore: swyftBoreToJsonBore[bore],
            url: urlForHandle(product.handle, 'Swyft', variant.id),
            sku: variant.sku,
            variantId: variant.id,
            vendor: 'Swyft',
          }),
        );
      } catch (error) {
        console.error(`Error parsing Swyft gear: ${variant.title}`, error);
      }
    }
  }

  return gears;
}

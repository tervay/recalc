import {
  DP_RE,
  normalizeBore,
  normalizeRevUrl,
  TEETH_RE,
} from 'scripts/ingest/parsing/rev/families';

import type { JSONGear } from '~/lib/types/gears';
import { zJSONGearSchema } from '~/lib/types/gears';
import type { ShopifyProduct } from '~/lib/types/shopify';

// Listing pages that carry at least one spur gear / pinion gear in our
// schema (teeth + dp + bore, all stated in the name). Some of these pages
// also list non-gear parts (pulleys, sprockets) or gears with an unsupported
// bore (15T Spline) - those are filtered out below by the required regex
// captures, not by this url list.
const GEAR_FAMILY_URLS = new Set(
  [
    'https://www.revrobotics.com/20DP-Gears-0.5-Hex',
    'https://www.revrobotics.com/20DP-Gears-Maxspline',
    'https://www.revrobotics.com/neo-pinions',
    'https://www.revrobotics.com/550-motor-pinions',
  ].map(normalizeRevUrl),
);

export function parseREVGears(products: ShopifyProduct[]): JSONGear[] {
  const gears: JSONGear[] = [];

  for (const product of products) {
    if (!GEAR_FAMILY_URLS.has(normalizeRevUrl(product.handle))) continue;

    const teethMatch = product.title.match(TEETH_RE);
    const dpMatch = product.title.match(DP_RE);
    const bore = normalizeBore(product.title);
    if (!teethMatch || !dpMatch || !bore) continue;

    try {
      gears.push(
        zJSONGearSchema.parse({
          teeth: parseInt(teethMatch[1], 10),
          dp: parseInt(dpMatch[1], 10),
          bore,
          url: product.handle,
          sku: product.variants[0]?.sku ?? null,
          vendor: 'REV',
        }),
      );
    } catch (error) {
      console.error(`Error parsing REV gear: ${product.title}`, error);
    }
  }

  return gears;
}

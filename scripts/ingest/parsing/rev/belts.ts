import {
  normalizeRevUrl,
  PROFILE_PITCH_MM,
  TEETH_RE,
} from 'scripts/ingest/parsing/rev/families';

import type { JSONBelt } from '~/lib/types/belts';
import { zJSONBeltSchema } from '~/lib/types/belts';
import type { ShopifyProduct } from '~/lib/types/shopify';

// Only REV's RT25 belt line is in scope. GT2 3mm belts exist in the feed
// too, but their names carry no width ("55 Tooth GT2 3mm Pitch Belt") and
// width is a required JSONBelt field - rather than guess at it, that family
// is intentionally left out so those entries are simply skipped.
const RT25_BELT_URL = normalizeRevUrl(
  'https://www.revrobotics.com/RT25-Belts-1/2in-Width',
);

// The whole RT25-Belts-1/2in-Width family shares one fixed width/pitch,
// stated in the family name itself - not fabricated per entry.
const RT25_WIDTH_MM = 12.7; // 0.5in
const RT25_PITCH_MM = PROFILE_PITCH_MM.RT25;

export function parseREVBelts(products: ShopifyProduct[]): JSONBelt[] {
  const belts: JSONBelt[] = [];

  for (const product of products) {
    if (normalizeRevUrl(product.handle) !== RT25_BELT_URL) continue;

    const teethMatch = product.title.match(TEETH_RE);
    if (!teethMatch) continue;

    try {
      belts.push(
        zJSONBeltSchema.parse({
          teeth: parseInt(teethMatch[1], 10),
          width: RT25_WIDTH_MM,
          profile: 'RT25',
          pitch: RT25_PITCH_MM,
          sku: product.variants[0]?.sku ?? null,
          url: product.handle,
          vendor: 'REV',
        }),
      );
    } catch (error) {
      console.error(`Error parsing REV belt: ${product.title}`, error);
    }
  }

  return belts;
}

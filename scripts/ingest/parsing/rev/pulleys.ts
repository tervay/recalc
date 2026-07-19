import {
  inToMm,
  normalizeBore,
  normalizeRevUrl,
  parseInchesToken,
  PROFILE_PITCH_MM,
  TEETH_RE,
  WIDTH_IN_RE,
} from 'scripts/ingest/parsing/rev/families';

import type { JSONPulley } from '~/lib/types/pulleys';
import { zJSONPulleySchema } from '~/lib/types/pulleys';
import type { ShopifyProduct } from '~/lib/types/shopify';

const PULLEY_FAMILY_URLS = new Set(
  [
    'https://www.revrobotics.com/RT25-Pulleys',
    'https://www.revrobotics.com/550-motor-pinions',
    'https://www.revrobotics.com/neo-pinions',
  ].map(normalizeRevUrl),
);

// "RT25 Plastic Pulley Kit" listings never print a width because every kit
// in that line ships for the 0.5in RT25 belt family. The 550/NEO pinion GT2
// pulleys likewise omit width because each SKU is a single fixed-size hub.
// These are physical constants of specific, named parts - not guesses -
// recorded once here rather than left un-parseable.
const RT25_PLASTIC_KIT_WIDTH_MM = inToMm(0.5);
const FIXED_WIDTH_MM_BY_SKU: Record<string, number> = {
  'REV-21-1908': 16, // GT2 3mm 550 Motor Pinion Pulley
  'REV-21-1909': inToMm(1), // GT2 3mm NEO Pinion Pulley
};

export function parseREVPulleys(products: ShopifyProduct[]): JSONPulley[] {
  const pulleys: JSONPulley[] = [];

  for (const product of products) {
    if (!PULLEY_FAMILY_URLS.has(normalizeRevUrl(product.handle))) continue;

    const profileMatch = product.title.match(/\b(RT25|GT2)\b/i);
    if (!profileMatch) continue;
    const profile = profileMatch[1].toUpperCase();

    const teethMatch = product.title.match(TEETH_RE);
    if (!teethMatch) continue;

    const bore = normalizeBore(product.title);
    if (!bore) continue;

    const sku = product.variants[0]?.sku ?? null;

    const widthMatch = product.title.match(WIDTH_IN_RE);
    let width: number | undefined;
    if (widthMatch) {
      width = inToMm(parseInchesToken(widthMatch[1]));
    } else if (sku && FIXED_WIDTH_MM_BY_SKU[sku] !== undefined) {
      width = FIXED_WIDTH_MM_BY_SKU[sku];
    } else if (profile === 'RT25' && bore === 'MAXSpline') {
      width = RT25_PLASTIC_KIT_WIDTH_MM;
    }
    if (width === undefined) continue;

    try {
      pulleys.push(
        zJSONPulleySchema.parse({
          teeth: parseInt(teethMatch[1], 10),
          width,
          profile,
          pitch: PROFILE_PITCH_MM[profile],
          sku,
          url: product.handle,
          bore,
          vendor: 'REV',
        }),
      );
    } catch (error) {
      console.error(`Error parsing REV pulley: ${product.title}`, error);
    }
  }

  return pulleys;
}

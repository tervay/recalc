import {
  normalizeBore,
  normalizeRevUrl,
  TEETH_RE,
} from 'scripts/ingest/parsing/rev/families';

import type { ShopifyProduct } from '~/lib/types/shopify';
import type { ChainType, JSONSprocket } from '~/lib/types/sprockets';
import { zJSONSprocketSchema } from '~/lib/types/sprockets';

const SPROCKET_FAMILY_URLS = new Set(
  [
    'https://www.revrobotics.com/ION-25-Sprockets',
    'https://www.revrobotics.com/ION-35-Sprockets',
    'https://www.revrobotics.com/neo-pinions',
  ].map(normalizeRevUrl),
);

const CHAIN_TYPE_RE = /#(25|35)\b/;

// "Billet Sprocket" SKUs never print a bore in the product name - that line
// ships in MAXSpline bore only. Every Hub/Plate variant states its bore
// explicitly and is parsed from the name as normal via normalizeBore.
const BILLET_SPROCKET_DEFAULT_BORE = 'MAXSpline';
const BILLET_SPROCKET_RE = /billet sprocket/i;

// REV-21-3495's upstream name drops the "T" tooth-count suffix ("... - 12
// (REV-21-3495))" instead of "... - 12T ..."), so TEETH_RE can't match it.
// Confirmed against the live shop listing: it's a 12-tooth sprocket. This is
// a known typo in one specific, still-active SKU - not a general fallback
// for un-suffixed numbers, which would risk misreading other malformed rows.
const TEETH_OVERRIDE_BY_SKU: Record<string, number> = {
  'REV-21-3495': 12,
};

export function parseREVSprockets(products: ShopifyProduct[]): JSONSprocket[] {
  const sprockets: JSONSprocket[] = [];

  for (const product of products) {
    if (!SPROCKET_FAMILY_URLS.has(normalizeRevUrl(product.handle))) continue;

    const chainMatch = product.title.match(CHAIN_TYPE_RE);
    if (!chainMatch) continue;
    const chainType = `#${chainMatch[1]}` as ChainType;

    const sku = product.variants[0]?.sku ?? null;
    const teethMatch = product.title.match(TEETH_RE);
    let teeth: number | undefined;
    if (teethMatch) {
      teeth = parseInt(teethMatch[1], 10);
    } else if (sku && TEETH_OVERRIDE_BY_SKU[sku] !== undefined) {
      teeth = TEETH_OVERRIDE_BY_SKU[sku];
    }
    if (teeth === undefined) continue;

    const bore =
      normalizeBore(product.title) ??
      (BILLET_SPROCKET_RE.test(product.title)
        ? BILLET_SPROCKET_DEFAULT_BORE
        : null);
    if (!bore) continue;

    try {
      sprockets.push(
        zJSONSprocketSchema.parse({
          teeth,
          bore,
          chainType,
          url: product.handle,
          sku,
          vendor: 'REV',
        }),
      );
    } catch (error) {
      console.error(`Error parsing REV sprocket: ${product.title}`, error);
    }
  }

  return sprockets;
}

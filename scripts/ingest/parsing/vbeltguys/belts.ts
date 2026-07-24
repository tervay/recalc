import { urlForHandle } from 'scripts/ingest/vendors';

import type { JSONBelt } from '~/lib/types/belts';
import type { ShopifyProduct } from '~/lib/types/shopify';

// e.g. "120-3m-09-synchronous-timing-belt" -> length 120, pitch 3, width 09.
const HANDLE_RE = /^(\d+)-(\d+)m-(\d+)-synchronous-timing-belt$/;

export function parseVBeltGuysBelts(products: ShopifyProduct[]): JSONBelt[] {
  const belts: JSONBelt[] = [];

  for (const product of products) {
    const match = HANDLE_RE.exec(product.handle);
    if (!match) continue;

    const length = parseInt(match[1], 10);
    const pitch = parseInt(match[2], 10);
    const width = parseInt(match[3], 10);

    // Guard against divide-by-zero and non-integer tooth counts.
    if (pitch === 0 || length % pitch !== 0) continue;

    const teeth = length / pitch;
    const profile = pitch === 3 ? 'GT2' : 'HTD';

    belts.push({
      teeth,
      width,
      profile,
      pitch,
      sku: `${match[1]}-${match[2]}m-${match[3]}`,
      url: urlForHandle(product.handle, 'VBeltGuys'),
      vendor: 'VBeltGuys',
    });
  }

  return belts;
}

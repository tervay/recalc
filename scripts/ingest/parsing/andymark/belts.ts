import { shouldSkipProduct } from 'scripts/ingest/parsing/exclusions';
import { urlForHandle } from 'scripts/ingest/vendors';
import * as z from 'zod';

import type { JSONBelt } from '~/lib/types/belts';
import type { ShopifyProduct } from '~/lib/types/shopify';

const zAndyMarkBeltSchema = z.object({
  teeth: z.number(),
  width: z.number().min(1),
  profile: z.string(),
  pitch: z.number().min(1),
  sku: z.string().nullable(),
  url: z.string().url(),
});

function andyMarkBeltToJsonBelt(
  belt: z.infer<typeof zAndyMarkBeltSchema>,
): JSONBelt {
  return { ...belt, vendor: 'AndyMark' };
}

export function parseAndyMarkBelts(products: ShopifyProduct[]): JSONBelt[] {
  const belts: JSONBelt[] = [];

  for (const product of products) {
    if (shouldSkipProduct(product, 'AndyMark')) continue;

    if (product.handle.includes('collections/')) continue;

    const widthMatch =
      /(\d+)\s*mm\s+Wide\s+5\s*mm\s+Pitch\s+HTD\s+Timing\s+Belts/i.exec(
        product.title,
      );
    if (!widthMatch) continue;

    const width = parseInt(widthMatch[1]);

    for (const variant of product.variants) {
      const toothMatch = /(?:Tooth Count=|^|\/\s*)(\d+)/.exec(variant.title);
      if (!toothMatch) continue;

      const teeth = parseInt(toothMatch[1]);
      const skuPrefix = width === 9 ? 'AM-5209' : 'AM-5215';
      const sku = variant.sku ?? `${skuPrefix}_${teeth}T`;

      try {
        const andyMarkBelt = zAndyMarkBeltSchema.parse({
          teeth,
          width,
          profile: 'HTD',
          pitch: 5,
          sku,
          url: urlForHandle(product.handle, 'AndyMark'),
        });
        belts.push(andyMarkBeltToJsonBelt(andyMarkBelt));
      } catch (error) {
        console.error(
          `Error parsing AndyMark belt: ${product.title} - ${variant.title}`,
          error,
        );
      }
    }
  }

  return belts;
}

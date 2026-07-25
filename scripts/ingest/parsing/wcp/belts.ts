import { urlForHandle } from 'scripts/ingest/vendors';
import * as z from 'zod';

import type { JSONBelt } from '~/lib/types/belts';
import { zJSONBeltSchema } from '~/lib/types/belts';
import type { ShopifyProduct } from '~/lib/types/shopify';

const zWCPBeltSchema = zJSONBeltSchema;
type WCPBelt = z.infer<typeof zWCPBeltSchema>;

function wcpBeltToJsonBelt(belt: WCPBelt): JSONBelt {
  return { ...belt, vendor: 'WCP' };
}

export function parseWCPBelts(products: ShopifyProduct[]): JSONBelt[] {
  const regex =
    /(?<teeth>\d+)t\s*x\s*(?<width>\d+)mm.*\((?<profile>HTD|GT2)\s*(?<pitch>\d+)mm\)/;
  const belts: JSONBelt[] = [];

  for (const product of products) {
    if (product.title.includes('Timing Belt')) {
      const match = regex.exec(product.title);
      if (match?.groups) {
        const { teeth, width, profile, pitch } = match.groups;
        try {
          const wcpBelt = zWCPBeltSchema.parse({
            teeth: parseInt(teeth),
            width: parseInt(width),
            profile,
            pitch: parseInt(pitch),
            url: urlForHandle(product.handle, 'WCP'),
            sku: product.variants[0].sku,
            vendor: 'WCP',
          });
          belts.push(wcpBeltToJsonBelt(wcpBelt));
        } catch (error) {
          console.error(`Error parsing WCP belt: ${product.title}`, error);
        }
      }
    }
  }

  return belts;
}

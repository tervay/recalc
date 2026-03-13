import { urlForHandle } from 'scripts/ingest/vendors';
import * as z from 'zod';

import type { Bore } from '~/lib/types/common';
import type { ShopifyProduct } from '~/lib/types/shopify';
import type { JSONSprocket } from '~/lib/types/sprockets';
import { zChainTypeSchema } from '~/lib/types/sprockets';

const zWCPSprocketBoreSchema = z.enum([
  '1/2" Hex Bore',
  'SplineXL Bore',
  '8mm Key Bore',
  '1/2" Rounded Hex Bore',
  '8mm SplineXS Bore',
  'Falcon Bore',
  '1/2" ID',
  '3/8" Hex Bore',
]);
type WCPSprocketBore = z.infer<typeof zWCPSprocketBoreSchema>;

const zWCPSprocketSchema = z.object({
  teeth: z.number(),
  bore: zWCPSprocketBoreSchema,
  chainType: zChainTypeSchema,
  url: z.string().url(),
  sku: z.string().nullable(),
});
type WCPSprocket = z.infer<typeof zWCPSprocketSchema>;

const wcpBoreToJsonBore: Record<WCPSprocketBore, Bore> = {
  '1/2" Hex Bore': '1/2" Hex',
  'SplineXL Bore': 'SplineXL',
  '8mm Key Bore': '8mm',
  '1/2" Rounded Hex Bore': '1/2" Hex',
  '8mm SplineXS Bore': 'SplineXS',
  'Falcon Bore': 'Falcon',
  '1/2" ID': '1/2" Hex',
  '3/8" Hex Bore': '3/8" Hex',
};

function wcpSprocketToJsonSprocket(sprocket: WCPSprocket): JSONSprocket {
  return {
    ...sprocket,
    bore: wcpBoreToJsonBore[sprocket.bore],
    vendor: 'WCP',
  };
}

export function parseWCPSprockets(products: ShopifyProduct[]): JSONSprocket[] {
  const sprockets: JSONSprocket[] = [];
  const regex = /(?<tooth>\d+)t.*?\((?<chain>#\d+)[^)]+,\s*(?<bore>[^)]+)\)/;

  for (const product of products) {
    if (product.title.includes('Sprocket')) {
      const match = product.title.match(regex);
      if (match?.groups) {
        const { tooth, chain, bore } = match.groups;

        try {
          const wcpSprocket = zWCPSprocketSchema.parse({
            teeth: parseInt(tooth),
            chainType: chain,
            bore,
            url: urlForHandle(product.handle, 'WCP'),
            sku: product.variants[0].sku,
          });
          sprockets.push(wcpSprocketToJsonSprocket(wcpSprocket));
        } catch (error) {
          console.error(`Error parsing WCP sprocket: ${product.title}`, error);
        }
      }
    }
  }

  return sprockets;
}

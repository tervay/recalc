import { urlForHandle } from 'scripts/ingest/vendors';
import * as z from 'zod';

import type { Bore } from '~/lib/types/common';
import type { JSONPulley } from '~/lib/types/pulleys';
import type { ShopifyProduct } from '~/lib/types/shopify';

const zWCPPulleyBoreSchema = z.enum([
  '1/2" Hex',
  '8mm',
  '8mm Key',
  '8mm SplineXS',
  'Falcon',
  'RS775',
  'RS550',
] as const);
type WCPPulleyBore = z.infer<typeof zWCPPulleyBoreSchema>;

const zWCPPulleySchema = z.object({
  teeth: z.number(),
  width: z.number().min(1),
  profile: z.string(),
  pitch: z.number().min(1),
  sku: z.string().nullable(),
  url: z.string().url(),
  bore: zWCPPulleyBoreSchema,
});
type WCPPulley = z.infer<typeof zWCPPulleySchema>;

const wcpBoreToJsonBore: Record<WCPPulleyBore, Bore> = {
  '8mm': '8mm',
  '1/2" Hex': '1/2" Hex',
  '8mm Key': '8mm',
  '8mm SplineXS': 'SplineXS',
  Falcon: 'Falcon',
  RS775: 'RS775',
  RS550: 'RS550',
};

function wcpPulleyToJsonPulley(pulley: WCPPulley): JSONPulley {
  return {
    ...pulley,
    bore: wcpBoreToJsonBore[pulley.bore],
    vendor: 'WCP',
  };
}

export function parseWCPPulleys(products: ShopifyProduct[]): JSONPulley[] {
  const regex =
    /(?<teeth>\d+)t\s*x\s*(?<width>\d+)mm\s*Wide\s*(?<flangeType>.*)\s*(?<profile>GT2|HTD)\s*(?<pitch>\d+)mm(?:.*,\s*(?<bore>.*?) Bore\))?/;
  const pulleys: JSONPulley[] = [];

  for (const product of products) {
    if (product.title.includes('Pulley')) {
      const match = regex.exec(product.title);
      if (match?.groups) {
        const { teeth, width, profile, pitch, bore } = match.groups;
        if (bore === undefined) {
          continue;
        }

        try {
          const wcpPulley = zWCPPulleySchema.parse({
            teeth: parseInt(teeth),
            width: parseInt(width),
            profile,
            pitch: parseInt(pitch),
            bore,
            url: urlForHandle(product.handle, 'WCP'),
            sku: product.variants[0].sku,
          });
          pulleys.push(wcpPulleyToJsonPulley(wcpPulley));
        } catch (error) {
          console.error(`Error parsing WCP pulley: ${product.title}`, error);
        }
      }
    }
  }

  return pulleys;
}

import { urlForHandle } from 'scripts/ingest/vendors';
import * as z from 'zod';

import type { Bore } from '~/lib/types/common';
import type { JSONGear } from '~/lib/types/gears';
import type { ShopifyProduct } from '~/lib/types/shopify';

const zWCPGearBoreSchema = z.enum([
  'BAG Bore',
  'Falcon Bore',
  '1/2" Hex Bore',
  '3/8" Hex Bore',
  'Rounded Hex Bearing',
  '1/4" Round',
  'SplineXL Bore',
  '8mm SplineXS Bore',
  '8mm Key Bore',
  'RS550/775 Bore',
  '1/2" Rounded Hex Bore',
  'RS775 Bore',
  '8mm Round Bore',
  'Pinion Only',
] as const);
type WCPGearBore = z.infer<typeof zWCPGearBoreSchema>;

const zWCPGearSchema = z.object({
  teeth: z.number().min(1),
  dp: z.number().min(1),
  bore: zWCPGearBoreSchema,
  url: z.string().url(),
  sku: z.string().nullable(),
});

const wcpBoreToJsonBore: Record<WCPGearBore, Bore> = {
  '1/2" Hex Bore': '1/2" Hex',
  'Falcon Bore': 'Falcon',
  'BAG Bore': 'BAG',
  'Rounded Hex Bearing': '1.125" Round',
  '3/8" Hex Bore': '3/8" Hex',
  '1/4" Round': '1/4" Round',
  'SplineXL Bore': 'SplineXL',
  '8mm SplineXS Bore': 'SplineXS',
  '8mm Key Bore': '8mm',
  'RS550/775 Bore': 'RS550',
  '1/2" Rounded Hex Bore': '1/2" Hex',
  'RS775 Bore': 'RS775',
  '8mm Round Bore': '8mm',
  'Pinion Only': '8mm',
};

function wcpGearToJsonGear(gear: z.infer<typeof zWCPGearSchema>): JSONGear {
  return { ...gear, bore: wcpBoreToJsonBore[gear.bore], vendor: 'WCP' };
}

export function parseWCPGears(products: ShopifyProduct[]): JSONGear[] {
  const gears: JSONGear[] = [];
  const regex =
    /(?<toothCount>\d+)t.*?\(\s*(?<dp>\d+)\s*DP(?:,\s*[^,]+)?,\s*(?<bore>[^)]+)\)/;

  for (const product of products) {
    if (product.title.includes('Gear')) {
      const match = regex.exec(product.title);
      if (match?.groups) {
        const { toothCount, dp, bore } = match.groups;
        try {
          const wcpGear = zWCPGearSchema.parse({
            teeth: parseInt(toothCount),
            dp: parseInt(dp),
            bore,
            url: urlForHandle(product.handle, 'WCP'),
            sku: product.variants[0].sku,
          });
          gears.push(wcpGearToJsonGear(wcpGear));
        } catch (error) {
          console.error(`Error parsing WCP gear: ${product.title}`, error);
        }
      }
    }
  }

  return gears;
}

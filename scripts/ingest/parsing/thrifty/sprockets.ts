import { urlForHandle } from 'scripts/ingest/vendors';
import * as z from 'zod';

import type { Bore } from '~/lib/types/common';
import type { ShopifyProduct } from '~/lib/types/shopify';
import type { ChainType, JSONSprocket } from '~/lib/types/sprockets';
import { zChainTypeSchema } from '~/lib/types/sprockets';

const zThriftySprocketBoreSchema = z.enum([
  '3/8" Hex Bore',
  '1/2" Hex Bore',
  '8mm Keyed Bore',
]);
type ThriftySprocketBore = z.infer<typeof zThriftySprocketBoreSchema>;

const zThriftySprocketSchema = z.object({
  teeth: z.number(),
  bore: zThriftySprocketBoreSchema,
  chainType: zChainTypeSchema,
  sku: z.string(),
  url: z.string().url(),
});

const thriftyBoreToJsonBore: Record<ThriftySprocketBore, Bore> = {
  '3/8" Hex Bore': '3/8" Hex',
  '1/2" Hex Bore': '1/2" Hex',
  '8mm Keyed Bore': '8mm',
};

function thriftySprocketToJsonSprocket(
  sprocket: z.infer<typeof zThriftySprocketSchema>,
): JSONSprocket {
  return {
    ...sprocket,
    bore: thriftyBoreToJsonBore[sprocket.bore],
    vendor: 'Thrifty',
  };
}

export function parseThriftySprockets(
  products: ShopifyProduct[],
): JSONSprocket[] {
  const sprockets: JSONSprocket[] = [];

  for (const product of products) {
    for (const variant of product.variants) {
      if (
        product.title === '#35 Chain Billet Sprockets' ||
        product.title === '#35 Flat Plate Sprockets'
      ) {
        sprockets.push({
          teeth: parseInt(variant.title.split(' ')[0]),
          bore: '1.125" Round',
          chainType: '#35',
          sku: variant.sku,
          url: urlForHandle(product.handle, 'Thrifty'),
          vendor: 'Thrifty',
        });
      } else if (
        product.title === '#25 Chain Billet Sprockets' ||
        product.title === '#25 Flat Plate Sprockets'
      ) {
        sprockets.push({
          teeth: parseInt(variant.title.split(' ')[0]),
          bore: '1.125" Round',
          chainType: '#25',
          sku: variant.sku,
          url: urlForHandle(product.handle, 'Thrifty'),
          vendor: 'Thrifty',
        });
      } else if (
        product.title === 'QTY 2 - Half Inch Hex 22 Tooth #25 Sprocket'
      ) {
        sprockets.push({
          teeth: 22,
          bore: '1/2" Hex',
          chainType: '#25',
          sku: variant.sku,
          url: urlForHandle(product.handle, 'Thrifty'),
          vendor: 'Thrifty',
        });
      } else {
        const regex =
          /(?<chainType>#\d+).*?(?<toothCount>\d+)\s+Tooth\s+(?<boreType>.+? Bore)/;
        if (variant.title.includes('Sprocket')) {
          for (const variantInner of product.variants) {
            const match = regex.exec(
              `${product.title} // ${variantInner.title}`,
            );
            if (match?.groups) {
              const { chainType, toothCount, boreType } = match.groups;
              try {
                const thriftySprocket = zThriftySprocketSchema.parse({
                  chainType: chainType as ChainType,
                  teeth: Number(toothCount),
                  bore: boreType as ThriftySprocketBore,
                  sku: variantInner.sku,
                  url: urlForHandle(product.handle, 'Thrifty'),
                });
                sprockets.push(thriftySprocketToJsonSprocket(thriftySprocket));
              } catch (error) {
                console.error(
                  `Error parsing Thrifty sprocket: ${product.title} // ${variantInner.title}`,
                  error,
                );
              }
            }
          }
        }
      }
    }
  }

  return sprockets;
}

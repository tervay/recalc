import { urlForHandle } from 'scripts/ingest/vendors';
import * as z from 'zod';

import type { Bore } from '~/lib/types/common';
import type { JSONPulley } from '~/lib/types/pulleys';
import type { ShopifyProduct } from '~/lib/types/shopify';

const zThriftyPulleyBoreSchema = z.enum([
  'Kraken Spline',
  'Falcon',
  '8mm Keyed',
  'Bearing / Hub',
  '1/2" Hex',
] as const);
type ThriftyPulleyBore = z.infer<typeof zThriftyPulleyBoreSchema>;

const zThriftyPulleySchema = z.object({
  teeth: z.number(),
  profile: z.enum(['HTD']),
  bore: zThriftyPulleyBoreSchema,
  sku: z.string(),
  url: z.string().url(),
});

const thriftyBoreToJsonBore: Record<ThriftyPulleyBore, Bore> = {
  'Kraken Spline': 'SplineXS',
  Falcon: 'Falcon',
  '8mm Keyed': '8mm',
  'Bearing / Hub': '1.125" Round',
  '1/2" Hex': '1/2" Hex',
};

function thriftyPulleyToJsonPulley(
  pulley: z.infer<typeof zThriftyPulleySchema>,
): JSONPulley {
  return {
    ...pulley,
    bore: thriftyBoreToJsonBore[pulley.bore],
    vendor: 'Thrifty',
    width: 18.5,
    pitch: 5,
  };
}

export function parseThriftyPulleys(products: ShopifyProduct[]): JSONPulley[] {
  const pulleys: JSONPulley[] = [];

  for (const product of products) {
    if (product.title.includes('Pulley')) {
      if (
        product.title === 'Kraken Spline Bore Aluminum HTD Pulleys' ||
        product.title === '1/2" Hex Bore Aluminum HTD Pulleys'
      ) {
        const defaultBore =
          product.title === 'Kraken Spline Bore Aluminum HTD Pulleys'
            ? 'Kraken Spline'
            : '1/2" Hex';

        const variantRegex =
          /(?<width>[\d.]+)mm Wide (?<tooth>\d+) Tooth(?:\s+(?<bore>[^(]+?))?(?:\s*\(.*?\))?$/i;

        for (const variant of product.variants) {
          const match = variantRegex.exec(variant.title);
          if (match?.groups) {
            const { tooth, bore } = match.groups;
            let mappedBore = bore ? bore.trim() : defaultBore;

            if (mappedBore === 'Spline XS' || mappedBore === 'SplineXS') {
              mappedBore = 'Kraken Spline';
            }

            try {
              const thriftyPulley = zThriftyPulleySchema.parse({
                teeth: parseInt(tooth),
                profile: 'HTD',
                bore: mappedBore,
                sku: variant.sku,
                url: urlForHandle(product.handle, 'Thrifty'),
              });
              pulleys.push(thriftyPulleyToJsonPulley(thriftyPulley));
            } catch (error) {
              console.error(
                `Error parsing Thrifty pulley variant: ${product.title} - ${variant.title}`,
                error,
              );
            }
          }
        }
      } else if (product.title.endsWith('Pulley')) {
        const regex =
          /QTY \d+ - (?<tooth>\d+) Tooth (?<profile>\w+) (?<bore>[\w\s]+) Motor Output Pulley/i;

        const match = regex.exec(product.title);
        if (match?.groups) {
          const { tooth, profile, bore } = match.groups;
          try {
            const thriftyPulley = zThriftyPulleySchema.parse({
              teeth: parseInt(tooth),
              profile,
              bore,
              sku: product.variants[0].sku,
              url: urlForHandle(product.handle, 'Thrifty'),
            });
            pulleys.push(thriftyPulleyToJsonPulley(thriftyPulley));
          } catch (error) {
            console.error(
              `Error parsing Thrifty pulley: ${product.title}`,
              error,
            );
          }
        }
      } else {
        const regex =
          /QTY \d+ - (?<tooth>\d+) Tooth (?<profile>\w+) Pulley(?: - (?<bore1>.+?)| (?<bore2>.+?)) Bore/i;

        const match = regex.exec(product.title);
        if (match?.groups) {
          const { tooth, profile, bore1, bore2 } = match.groups;
          const bore = bore1 ?? bore2;
          try {
            const thriftyPulley = zThriftyPulleySchema.parse({
              teeth: parseInt(tooth),
              profile,
              bore,
              sku: product.variants[0].sku,
              url: urlForHandle(product.handle, 'Thrifty'),
            });
            pulleys.push(thriftyPulleyToJsonPulley(thriftyPulley));
          } catch (error) {
            console.error(
              `Error parsing Thrifty pulley: ${product.title}`,
              error,
            );
          }
        }
      }
    }
  }

  return pulleys;
}

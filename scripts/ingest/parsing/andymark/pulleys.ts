import { urlForHandle } from 'scripts/ingest/vendors';
import * as z from 'zod';

import { zBoreSchema } from '~/lib/types/common';
import type { JSONPulley } from '~/lib/types/pulleys';
import type { ShopifyProduct } from '~/lib/types/shopify';

const zAndyMarkPulleySchema = z.object({
  teeth: z.number(),
  width: z.number().min(1),
  profile: z.string(),
  pitch: z.number().min(1),
  sku: z.string().nullable(),
  url: z.string().url(),
  bore: zBoreSchema,
});

function andyMarkPulleyToJsonPulley(
  pulley: z.infer<typeof zAndyMarkPulleySchema>,
): JSONPulley {
  return {
    teeth: pulley.teeth,
    width: pulley.width,
    profile: pulley.profile,
    pitch: pulley.pitch,
    sku: pulley.sku,
    url: pulley.url,
    bore: pulley.bore,
    vendor: 'AndyMark',
  };
}

function normalizeAndyMarkPulleyBore(
  boreText: string,
): '8mm' | '1/2" Hex' | '3/8" Hex' | '1.125" Round' | null {
  const lower = boreText.trim().toLowerCase();

  if (/8\s*mm/.test(lower)) return '8mm';
  if (/0\.5|1\/2|half/.test(lower) && /hex/.test(lower)) return '1/2" Hex';
  if (/0\.375|3\/8/.test(lower) && /hex/.test(lower)) return '3/8" Hex';
  if (/1\.125/.test(lower) && /round/.test(lower)) return '1.125" Round';
  if (/bearing/.test(lower)) return '1.125" Round';

  return null;
}

export function parseAndyMarkPulleys(products: ShopifyProduct[]): JSONPulley[] {
  const pulleys: JSONPulley[] = [];

  for (const product of products) {
    if (!product.title.includes('Pulley') && !product.title.includes('pulley'))
      continue;

    if (product.handle.includes('collections/')) continue;

    const toothMatch = /(\d+)\s*T(?:ooth)?/i.exec(product.title);
    if (!toothMatch) continue;
    const teeth = parseInt(toothMatch[1]);

    const fullMatch = /(\d+)\s*mm.*?(\d+)\s*mm/i.exec(product.title);
    let width: number;
    let pitch: number;

    if (fullMatch) {
      const val1 = parseInt(fullMatch[1]);
      const val2 = parseInt(fullMatch[2]);
      width = Math.max(val1, val2);
      pitch = Math.min(val1, val2);
    } else {
      width = 9;
      pitch = 5;
    }

    const boreMatch =
      /(\d+\.?\d*\s*(?:in\.|mm))\s*(?:Hex|Round)|(?:with|bore)\s+(\d+\s*mm)|bearing\s+bore/i.exec(
        product.title,
      );

    if (product.variants.length > 1) {
      for (const variant of product.variants) {
        if (
          variant.title.toLowerCase().includes('extension') ||
          variant.title.toLowerCase().includes('nub')
        )
          continue;

        const variantBoreMatch =
          /Bore\s*=\s*([^-]+)|(\d+\.?\d*\s*(?:in\.|mm)\s*(?:Hex|Round))/i.exec(
            variant.title,
          );
        let bore: '8mm' | '1/2" Hex' | '3/8" Hex' | '1.125" Round' | null =
          null;

        if (variantBoreMatch) {
          const boreText =
            variantBoreMatch[1] ?? variantBoreMatch[2] ?? variantBoreMatch[0];
          bore = normalizeAndyMarkPulleyBore(boreText);
        } else if (boreMatch) {
          bore = normalizeAndyMarkPulleyBore(boreMatch[0]);
        }

        if (!bore) continue;

        const sku = variant.sku ?? `AM-${teeth}T`;

        try {
          const andyMarkPulley = zAndyMarkPulleySchema.parse({
            teeth,
            width,
            profile: 'HTD',
            pitch,
            sku,
            url: urlForHandle(product.handle, 'AndyMark'),
            bore,
          });
          pulleys.push(andyMarkPulleyToJsonPulley(andyMarkPulley));
        } catch (error) {
          console.error(
            `Error parsing AndyMark pulley: ${product.title} - ${variant.title}`,
            error,
          );
        }
      }
    } else {
      const bore = boreMatch ? normalizeAndyMarkPulleyBore(boreMatch[0]) : null;
      if (!bore) continue;

      const variant = product.variants[0];
      const sku = variant.sku ?? `AM-${teeth}T`;

      try {
        const andyMarkPulley = zAndyMarkPulleySchema.parse({
          teeth,
          width,
          profile: 'HTD',
          pitch,
          sku,
          url: urlForHandle(product.handle, 'AndyMark'),
          bore,
        });
        pulleys.push(andyMarkPulleyToJsonPulley(andyMarkPulley));
      } catch (error) {
        console.error(`Error parsing AndyMark pulley: ${product.title}`, error);
      }
    }
  }

  return pulleys;
}

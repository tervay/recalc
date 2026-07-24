import { urlForHandle } from 'scripts/ingest/vendors';

import type { Bore } from '~/lib/types/common';
import type { JSONGear } from '~/lib/types/gears';
import { zJSONGearSchema } from '~/lib/types/gears';
import type { ShopifyProduct } from '~/lib/types/shopify';

function normalizeAndyMarkBore(boreText: string): Bore | null {
  const lower = boreText.trim().toLowerCase();

  if (/0\.375|3\/8|3-8/.test(lower) && /hex/.test(lower)) return '3/8" Hex';
  if (/0\.5|1\/2|half/.test(lower) && /hex/.test(lower)) return '1/2" Hex';

  if (/0\.250|1\/4|quarter/.test(lower) && /round/.test(lower))
    return '1/4" Round';
  if (/0\.375|3\/8/.test(lower) && /round/.test(lower)) return '1/4" Round';
  if (/0\.5|1\/2/.test(lower) && /round/.test(lower)) return '1/4" Round';
  if (/1\.125/.test(lower) && /round/.test(lower)) return '1.125" Round';

  if (/8\s*mm/.test(lower)) return '8mm';

  return null;
}

export function parseAndyMarkGears(products: ShopifyProduct[]): JSONGear[] {
  const gears: JSONGear[] = [];

  for (const product of products) {
    if (!product.title.includes('Gear') && !product.title.includes('gear'))
      continue;

    if (product.handle.includes('collections/')) continue;

    const singleGearMatch = /(\d+)\s+Tooth\s+(\d+)\s+DP\s+(.*?)\s+Bore/i.exec(
      product.title,
    );
    if (singleGearMatch && product.variants.length === 1) {
      const teeth = parseInt(singleGearMatch[1]);
      const dp = parseInt(singleGearMatch[2]);
      const boreText = singleGearMatch[3];
      const bore = normalizeAndyMarkBore(boreText);

      if (bore === null) continue;

      const variant = product.variants[0];
      const sku = variant.sku ?? `AM-${teeth}T-${dp}DP`;

      try {
        const parsedData = zJSONGearSchema.parse({
          teeth,
          dp,
          bore,
          url: urlForHandle(product.handle, 'AndyMark'),
          sku,
          vendor: 'AndyMark',
        });
        gears.push(parsedData);
      } catch (error) {
        console.error(`Error parsing AndyMark gear: ${product.title}`, error);
      }
      continue;
    }

    const dpMatch = /(\d+)\s+DP\s+(?:Pinion\s+)?Gears/i.exec(product.title);
    if (!dpMatch) continue;

    const dp = parseInt(dpMatch[1]);

    const productBoreMatch = /Bore:\s*([^-\n]+)/i.exec(product.title);
    let defaultBore: Bore | null = null;
    if (productBoreMatch) {
      defaultBore = normalizeAndyMarkBore(productBoreMatch[1]);
    }

    const isPinion = /pinion/i.test(product.title);
    if (isPinion && !defaultBore) {
      defaultBore = '3/8" Hex';
    }

    for (const variant of product.variants) {
      let teeth: number | null = null;
      let bore: Bore | null = defaultBore;

      const optionMatch = /^(.+?)\s+\/\s+(\d+)/.exec(variant.title);
      if (optionMatch) {
        bore = normalizeAndyMarkBore(optionMatch[1]);
        teeth = parseInt(optionMatch[2]);
      } else {
        const variantToothMatch = /(?:Tooth Count:\s*|^)(\d+)/i.exec(
          variant.title,
        );
        if (variantToothMatch) {
          teeth = parseInt(variantToothMatch[1]);
        }

        if (!bore) {
          const variantBoreMatch =
            /(?:Bore:\s*|)([0-9./]+\s*(?:in\.|mm)\s*(?:Hex|Round|hex|round))/i.exec(
              variant.title,
            );
          if (variantBoreMatch) {
            bore = normalizeAndyMarkBore(variantBoreMatch[1]);
          }
        }
      }

      if (teeth === null || bore === null) continue;

      const sku = variant.sku ?? `AM-${teeth}T-${dp}DP`;

      try {
        const parsedData = zJSONGearSchema.parse({
          teeth,
          dp,
          bore,
          url: urlForHandle(product.handle, 'AndyMark'),
          sku,
          vendor: 'AndyMark',
        });
        gears.push(parsedData);
      } catch (error) {
        console.error(
          `Error parsing AndyMark gear: ${product.title} - ${variant.title}`,
          error,
        );
      }
    }
  }

  return gears;
}

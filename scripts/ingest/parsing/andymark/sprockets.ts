import { urlForHandle } from 'scripts/ingest/vendors';

import type { ShopifyProduct } from '~/lib/types/shopify';
import type { ChainType, JSONSprocket } from '~/lib/types/sprockets';

function normalizeAndyMarkSprocketBore(
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

export function parseAndyMarkSprockets(
  products: ShopifyProduct[],
): JSONSprocket[] {
  const sprockets: JSONSprocket[] = [];

  for (const product of products) {
    if (
      !product.title.includes('Sprocket') &&
      !product.title.includes('sprocket')
    )
      continue;

    if (product.handle.includes('collections/')) continue;

    const seriesAndToothMatch =
      /(#?\d+)\s+Series\s+(\d+)\s+Tooth|((\d+)\s+Tooth.*?(#?\d+)\s+Series)/i.exec(
        product.title,
      );

    if (seriesAndToothMatch && product.variants.length === 1) {
      let teeth: number;
      let chainNum: string;

      if (seriesAndToothMatch[1] && seriesAndToothMatch[2]) {
        chainNum = seriesAndToothMatch[1].replace('#', '');
        teeth = parseInt(seriesAndToothMatch[2]);
      } else if (seriesAndToothMatch[4] && seriesAndToothMatch[5]) {
        teeth = parseInt(seriesAndToothMatch[4]);
        chainNum = seriesAndToothMatch[5].replace('#', '');
      } else {
        continue;
      }

      const chainType: ChainType = `#${chainNum}` as ChainType;

      const boreMatch = /(\d+\.?\d*\s*(?:in\.|mm))\s+(?:Hex|Round|Bore)/i.exec(
        product.title,
      );
      let bore = boreMatch ? normalizeAndyMarkSprocketBore(boreMatch[0]) : null;

      if (
        !bore &&
        product.title.toLowerCase().includes('round') &&
        !/\d+\.?\d*\s*(?:in\.|mm)\s+round/i.exec(product.title)
      ) {
        bore = '1.125" Round';
      }

      if (
        !bore &&
        product.title.toLowerCase().includes('aluminum') &&
        !product.title.toLowerCase().includes('hex')
      ) {
        bore = '1.125" Round';
      }

      if (!bore) continue;

      const variant = product.variants[0];
      const sku = variant.sku ?? `AM-${teeth}T-${chainType}`;

      sprockets.push({
        teeth,
        bore,
        chainType,
        url: urlForHandle(product.handle, 'AndyMark'),
        sku,
        vendor: 'AndyMark',
      });
      continue;
    }

    const seriesMatch = /(#?\d+)\s+Series/i.exec(product.title);
    if (!seriesMatch) continue;

    const chainNum = seriesMatch[1].replace('#', '');
    const chainType: ChainType = `#${chainNum}` as ChainType;

    const isBearingBore = /bearing.*bore|plate.*sprocket/i.test(product.title);
    const isSymmetricalHub = /symmetrical.*hub/i.test(product.title);
    const defaultBore = isBearingBore
      ? '1.125" Round'
      : isSymmetricalHub
        ? '1/2" Hex'
        : null;

    for (const variant of product.variants) {
      let teeth: number | null = null;
      let bore: '8mm' | '1/2" Hex' | '3/8" Hex' | '1.125" Round' | null =
        defaultBore;

      const variantToothMatch =
        /(?:Tooth Count:\s*|)(\d+)\s+Tooth/i.exec(variant.title) ??
        /^(\d+)/.exec(variant.title);
      if (variantToothMatch) {
        teeth = parseInt(variantToothMatch[1]);
      }

      if (!bore) {
        const variantBoreMatch =
          /([0-9./]+\s*(?:in\.|mm)\s*(?:Hex|Round|hex|round))/i.exec(
            variant.title,
          ) ?? /(8\s*mm)/i.exec(variant.title);
        if (variantBoreMatch) {
          bore = normalizeAndyMarkSprocketBore(variantBoreMatch[1]);
        }
      }

      if (teeth === null || bore === null) continue;

      const sku = variant.sku ?? `AM-${teeth}T-${chainType}`;

      sprockets.push({
        teeth,
        bore,
        chainType,
        url: urlForHandle(product.handle, 'AndyMark'),
        sku,
        vendor: 'AndyMark',
      });
    }
  }

  return sprockets;
}

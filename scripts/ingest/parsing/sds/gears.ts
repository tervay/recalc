import { urlForHandle } from 'scripts/ingest/vendors';

import type { Bore } from '~/lib/types/common';
import type { JSONGear } from '~/lib/types/gears';
import { zJSONGearSchema } from '~/lib/types/gears';
import type { ShopifyProduct } from '~/lib/types/shopify';

const SDS_GEAR_TITLE_REGEX = /Gear,\s*(\d+)DP,\s*(\d+)T\s*,?\s*(.+)/i;
const SDS_GEAR_HANDLE_REGEX = /^(\d+)t-(\d+)dp-(.*?)-?gear$/i;

function normalizeSDSBore(boreText: string): Bore | null {
  const lower = boreText.trim().toLowerCase();
  if (/falcon/.test(lower)) return 'Falcon';
  if (/8\s*mm|8mm/.test(lower)) return '8mm';
  if (/3\/8|3-8.*hex/.test(lower)) return '3/8" Hex';
  return null;
}

function sdsBoreToSkuSuffix(bore: Bore): string {
  if (bore === '3/8" Hex') return '38HEX';
  if (bore === '8mm') return '8MM';
  if (bore === 'Falcon') return 'FALCON';
  return bore.toUpperCase().replace(/\s+/g, '');
}

export function parseSDSGears(products: ShopifyProduct[]): JSONGear[] {
  const gears: JSONGear[] = [];

  for (const product of products) {
    if (!product.title.includes('Gear')) continue;

    let teeth: number;
    let dp: number;
    let bore: Bore | null = null;

    const titleMatch = SDS_GEAR_TITLE_REGEX.exec(product.title);
    if (titleMatch) {
      dp = parseInt(titleMatch[1], 10);
      teeth = parseInt(titleMatch[2], 10);
      bore = normalizeSDSBore(titleMatch[3]);
    } else {
      const handleMatch = SDS_GEAR_HANDLE_REGEX.exec(product.handle);
      if (!handleMatch) continue;
      teeth = parseInt(handleMatch[1], 10);
      dp = parseInt(handleMatch[2], 10);
      const handleBorePart = handleMatch[3].toLowerCase();
      if (/falcon/.test(handleBorePart)) bore = 'Falcon';
      else if (/8mm/.test(handleBorePart)) bore = '8mm';
      else if (/3-8-hex/.test(handleBorePart)) bore = '3/8" Hex';
      else if (handleBorePart === '' || handleBorePart === 'gear')
        bore = '3/8" Hex';
      else continue;
    }

    if (bore === null) continue;

    const url = urlForHandle(product.handle, 'SDS');
    const variant = product.variants[0];
    if (!variant) continue;
    const skuSuffix = sdsBoreToSkuSuffix(bore);
    const sku = variant.sku ?? `SDS-${teeth}T-${dp}DP-${skuSuffix}`;

    try {
      const parsedData = zJSONGearSchema.parse({
        teeth,
        dp,
        bore,
        url,
        sku,
        vendor: 'SDS',
      });
      gears.push(parsedData);
    } catch (error) {
      console.error(`Error parsing SDS gear: ${product.title}`, error);
    }
  }

  return gears;
}

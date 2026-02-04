import { urlForHandle } from 'scripts/downloadProducts/download';
import type { CacheEntry, VendorName } from 'scripts/downloadProducts/types';
import {
  cleanProductForCache,
  createSyntheticProduct,
} from 'scripts/downloadProducts/types';

import type { Bore } from '~/lib/types/common';
import type { JSONGear } from '~/lib/types/gears';
import {
  wcpGearToJsonGear,
  zJSONGearSchema,
  zWCPGearSchema,
} from '~/lib/types/gears';
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

export function parseWCPGears(products: ShopifyProduct[]): CacheEntry[] {
  const gears: CacheEntry[] = [];
  const regex =
    /(?<toothCount>\d+)t.*?\(\s*(?<dp>\d+)\s*DP(?:,\s*[^,]+)?,\s*(?<bore>[^)]+)\)/;
  const now = new Date().toISOString();

  for (const product of products) {
    if (product.title.includes('Gear')) {
      const match = product.title.match(regex);
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
          const parsedData = wcpGearToJsonGear(wcpGear);

          gears.push({
            productId: product.id,
            variantId: product.variants[0].id,
            rawProduct: cleanProductForCache(product),
            parsedData,
            firstSeen: now,
            lastSeen: now,
          });
        } catch (error) {
          console.error(`Error parsing WCP gear: ${product.title}`, error);
        }
      }
    }
  }

  return gears;
}

export function parseREVGears(): CacheEntry[] {
  const gears: CacheEntry[] = [];
  const now = new Date().toISOString();

  // 20DP MAXSpline gears
  for (const [index, toothCount] of [
    32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60, 62, 64, 66, 68,
  ].entries()) {
    const parsedData: JSONGear = {
      teeth: toothCount,
      dp: 20,
      bore: 'MAXSpline',
      url: 'https://www.revrobotics.com/20DP-Gears-Maxspline/',
      sku: `REV-21-${3010 + index}`,
      vendor: 'REV',
    };

    const syntheticId = -7000 - gears.length;

    gears.push({
      productId: syntheticId,
      variantId: syntheticId,
      rawProduct: createSyntheticProduct(
        syntheticId,
        `${toothCount}T 20DP MAXSpline REV Gear`,
        'REV',
        'Gear',
        parsedData.sku,
      ),
      parsedData,
      firstSeen: now,
      lastSeen: now,
    });
  }

  // Additional 20DP MAXSpline gears
  for (const [toothCount, sku] of [
    [72, 'REV-21-3030'],
    [80, 'REV-21-3034'],
  ] as const) {
    const parsedData: JSONGear = {
      teeth: toothCount,
      dp: 20,
      bore: 'MAXSpline',
      url: 'https://www.revrobotics.com/20DP-Gears-Maxspline/',
      sku,
      vendor: 'REV',
    };

    const syntheticId = -7000 - gears.length;

    gears.push({
      productId: syntheticId,
      variantId: syntheticId,
      rawProduct: createSyntheticProduct(
        syntheticId,
        `${toothCount}T 20DP MAXSpline REV Gear`,
        'REV',
        'Gear',
        parsedData.sku,
      ),
      parsedData,
      firstSeen: now,
      lastSeen: now,
    });
  }

  // 20DP 1/2" Hex gears
  for (const [index, toothCount] of [
    18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54,
    56, 58, 60, 62, 64, 66, 68,
  ].entries()) {
    const parsedData: JSONGear = {
      teeth: toothCount,
      dp: 20,
      bore: '1/2" Hex',
      url: 'https://www.revrobotics.com/20DP-Gears-0.5-Hex/',
      sku: `REV-21-${1920 + index}`,
      vendor: 'REV',
    };

    const syntheticId = -7000 - gears.length;

    gears.push({
      productId: syntheticId,
      variantId: syntheticId,
      rawProduct: createSyntheticProduct(
        syntheticId,
        `${toothCount}T 20DP 1/2" Hex REV Gear`,
        'REV',
        'Gear',
        parsedData.sku,
      ),
      parsedData,
      firstSeen: now,
      lastSeen: now,
    });
  }

  // Additional 20DP 1/2" Hex gears
  for (const [toothCount, sku] of [
    [16, 'REV-21-2196'],
    [72, 'REV-21-1947'],
    [80, 'REV-21-1951'],
  ] as const) {
    const parsedData: JSONGear = {
      teeth: toothCount,
      dp: 20,
      bore: '1/2" Hex',
      url: 'https://www.revrobotics.com/20DP-Gears-0.5-Hex/',
      sku,
      vendor: 'REV',
    };

    const syntheticId = -7000 - gears.length;

    gears.push({
      productId: syntheticId,
      variantId: syntheticId,
      rawProduct: createSyntheticProduct(
        syntheticId,
        `${toothCount}T 20DP 1/2" Hex REV Gear`,
        'REV',
        'Gear',
        parsedData.sku,
      ),
      parsedData,
      firstSeen: now,
      lastSeen: now,
    });
  }

  // 20DP 8mm bore gears (NEO pinions)
  for (const [index, toothCount] of [10, 11, 12, 13, 14].entries()) {
    const parsedData: JSONGear = {
      teeth: toothCount,
      dp: 20,
      bore: '8mm',
      url: 'https://www.revrobotics.com/neo-pinions/',
      sku: `REV-21-${1998 + index}`,
      vendor: 'REV',
    };

    const syntheticId = -7000 - gears.length;

    gears.push({
      productId: syntheticId,
      variantId: syntheticId,
      rawProduct: createSyntheticProduct(
        syntheticId,
        `${toothCount}T 20DP 8mm REV NEO Pinion`,
        'REV',
        'Gear',
        parsedData.sku,
      ),
      parsedData,
      firstSeen: now,
      lastSeen: now,
    });
  }

  // 32DP RS550 pinion
  const rs550Gear: JSONGear = {
    teeth: 12,
    dp: 32,
    bore: 'RS550',
    url: 'https://www.revrobotics.com/550-motor-pinions/',
    sku: 'REV-41-1660-PK2',
    vendor: 'REV',
  };

  const syntheticId = -7000 - gears.length;

  gears.push({
    productId: syntheticId,
    variantId: syntheticId,
    rawProduct: createSyntheticProduct(
      syntheticId,
      '12T 32DP RS550 REV Pinion',
      'REV',
      'Gear',
      rs550Gear.sku,
    ),
    parsedData: rs550Gear,
    firstSeen: now,
    lastSeen: now,
  });

  return gears;
}

export function parseSDSGears(products: ShopifyProduct[]): CacheEntry[] {
  const cacheEntries: CacheEntry[] = [];
  const now = new Date().toISOString();

  for (const product of products) {
    if (!product.title.includes('Gear')) continue;

    let teeth: number;
    let dp: number;
    let bore: Bore | null = null;

    const titleMatch = product.title.match(SDS_GEAR_TITLE_REGEX);
    if (titleMatch) {
      dp = parseInt(titleMatch[1], 10);
      teeth = parseInt(titleMatch[2], 10);
      bore = normalizeSDSBore(titleMatch[3]);
    } else {
      const handleMatch = product.handle.match(SDS_GEAR_HANDLE_REGEX);
      if (!handleMatch) continue;
      teeth = parseInt(handleMatch[1], 10);
      dp = parseInt(handleMatch[2], 10);
      const handleBorePart = (handleMatch[3] ?? '').toLowerCase();
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

      cacheEntries.push({
        productId: product.id,
        variantId: variant.id,
        rawProduct: cleanProductForCache(product),
        parsedData,
        firstSeen: now,
        lastSeen: now,
      });
    } catch (error) {
      console.error(`Error parsing SDS gear: ${product.title}`, error);
    }
  }

  return cacheEntries;
}

export function parseVendorGears(
  vendor: VendorName,
  products: ShopifyProduct[],
): CacheEntry[] {
  switch (vendor) {
    case 'WCP':
      return parseWCPGears(products);
    case 'REV':
      return parseREVGears();
    case 'SDS':
      return parseSDSGears(products);
    default:
      return [];
  }
}

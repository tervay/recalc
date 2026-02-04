import { urlForHandle } from 'scripts/downloadProducts/download';
import type { CacheEntry, VendorName } from 'scripts/downloadProducts/types';
import {
  cleanProductForCache,
  createSyntheticProduct,
} from 'scripts/downloadProducts/types';

import type { JSONGear } from '~/lib/types/gears';
import { wcpGearToJsonGear, zWCPGearSchema } from '~/lib/types/gears';
import type { ShopifyProduct } from '~/lib/types/shopify';

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

export function parseSDSGears(): CacheEntry[] {
  const gears: JSONGear[] = [
    {
      teeth: 16,
      dp: 20,
      bore: '3/8" Hex',
      url: 'https://www.swervedrivespecialties.com/collections/20dp-3-8-hex-gears/products/16t-20dp-3-8-hex-gear',
      sku: 'SDS-16T-20DP-38HEX',
      vendor: 'SDS',
    },
    {
      teeth: 17,
      dp: 20,
      bore: '3/8" Hex',
      url: 'https://www.swervedrivespecialties.com/collections/20dp-3-8-hex-gears/products/17t-20dp-3-8-hex-gear',
      sku: 'SDS-17T-20DP-38HEX',
      vendor: 'SDS',
    },
    {
      teeth: 19,
      dp: 20,
      bore: '3/8" Hex',
      url: 'https://www.swervedrivespecialties.com/collections/20dp-3-8-hex-gears/products/19t-20dp-3-8-hex-gear',
      sku: 'SDS-19T-20DP-38HEX',
      vendor: 'SDS',
    },
    {
      teeth: 50,
      dp: 20,
      bore: '3/8" Hex',
      url: 'https://www.swervedrivespecialties.com/collections/20dp-3-8-hex-gears/products/gear-20dp-50t-3-8-hex-bore',
      sku: 'SDS-50T-20DP-38HEX',
      vendor: 'SDS',
    },
    {
      teeth: 32,
      dp: 32,
      bore: '3/8" Hex',
      url: 'https://www.swervedrivespecialties.com/collections/32dp-3-8-hex-gears/products/32t-32dp-gear',
      sku: 'SDS-32T-32DP-38HEX',
      vendor: 'SDS',
    },
    {
      teeth: 14,
      dp: 20,
      bore: '8mm',
      url: 'https://www.swervedrivespecialties.com/collections/motor-pinions-8mm-bore/products/gear-20dp-14t-8mm-bore',
      sku: 'SDS-14T-20DP-8MM',
      vendor: 'SDS',
    },
    {
      teeth: 16,
      dp: 20,
      bore: '8mm',
      url: 'https://www.swervedrivespecialties.com/collections/motor-pinions-8mm-bore/products/gear-20dp-16t-8mm-bore',
      sku: 'SDS-16T-20DP-8MM',
      vendor: 'SDS',
    },
    {
      teeth: 15,
      dp: 32,
      bore: '8mm',
      url: 'https://www.swervedrivespecialties.com/collections/motor-pinions-8mm-bore/products/gear-32dp-15t-8mm-bore',
      sku: 'SDS-15T-32DP-8MM',
      vendor: 'SDS',
    },
  ];

  const cacheEntries: CacheEntry[] = [];
  const now = new Date().toISOString();

  for (const parsedData of gears) {
    const syntheticId = -8000 - cacheEntries.length;

    cacheEntries.push({
      productId: syntheticId,
      variantId: syntheticId,
      rawProduct: createSyntheticProduct(
        syntheticId,
        `${parsedData.teeth}T ${parsedData.dp}DP ${parsedData.bore} SDS Gear`,
        'SDS',
        'Gear',
        parsedData.sku,
      ),
      parsedData,
      firstSeen: now,
      lastSeen: now,
    });
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
      return parseSDSGears();
    default:
      return [];
  }
}

import { isInIgnorelist } from 'scripts/downloadProducts/alert';
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
      });
    } catch (error) {
      console.error(`Error parsing SDS gear: ${product.title}`, error);
    }
  }

  return cacheEntries;
}

function normalizeAndyMarkBore(boreText: string): Bore | null {
  const lower = boreText.trim().toLowerCase();

  // Hex bores
  if (/0\.375|3\/8|3-8/.test(lower) && /hex/.test(lower)) return '3/8" Hex';
  if (/0\.5|1\/2|half/.test(lower) && /hex/.test(lower)) return '1/2" Hex';

  // Round bores
  if (/0\.250|1\/4|quarter/.test(lower) && /round/.test(lower))
    return '1/4" Round';
  if (/0\.375|3\/8/.test(lower) && /round/.test(lower)) return '1/4" Round';
  if (/0\.5|1\/2/.test(lower) && /round/.test(lower)) return '1/4" Round';
  if (/1\.125/.test(lower) && /round/.test(lower)) return '1.125" Round';

  // 8mm
  if (/8\s*mm/.test(lower)) return '8mm';

  return null;
}

export function parseAndyMarkGears(products: ShopifyProduct[]): CacheEntry[] {
  const gears: CacheEntry[] = [];
  const now = new Date().toISOString();

  for (const product of products) {
    if (!product.title.includes('Gear') && !product.title.includes('gear'))
      continue;

    // Skip collection URLs to avoid duplicates
    if (product.handle?.includes('collections/')) continue;

    // Pattern 1: Single-variant gears with format "XX Tooth YY DP ... Bore Steel Gear"
    const singleGearMatch = product.title.match(
      /(\d+)\s+Tooth\s+(\d+)\s+DP\s+(.*?)\s+Bore/i,
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

        gears.push({
          productId: product.id,
          variantId: variant.id,
          rawProduct: cleanProductForCache(product),
          parsedData,
          firstSeen: now,
        });
      } catch (error) {
        console.error(`Error parsing AndyMark gear: ${product.title}`, error);
      }
      continue;
    }

    // Pattern 2: Multi-variant gears with format "Standard XX DP Gears" or "XX DP Pinion Gears"
    const dpMatch = product.title.match(/(\d+)\s+DP\s+(?:Pinion\s+)?Gears/i);
    if (!dpMatch) continue;

    const dp = parseInt(dpMatch[1]);

    // Check if bore is specified in product title
    const productBoreMatch = product.title.match(/Bore:\s*([^-\n]+)/i);
    let defaultBore: Bore | null = null;
    if (productBoreMatch) {
      defaultBore = normalizeAndyMarkBore(productBoreMatch[1]);
    }

    // Check if this is a pinion gear (typically 3/8" Hex bore)
    const isPinion = /pinion/i.test(product.title);
    if (isPinion && !defaultBore) {
      defaultBore = '3/8" Hex';
    }

    // Parse each variant
    for (const variant of product.variants) {
      // Skip variants in ignorelist
      if (isInIgnorelist('AndyMark', product.id, variant.id)) continue;

      // Variant title patterns:
      // "20 Tooth 0.375 in. Hex Bore"
      // "Tooth Count: 20, Bore: 0.375 in. Hex"
      // "1/2 in Hex / 18 / No / Steel" (option-based format)
      // "20"
      let teeth: number | null = null;
      let bore: Bore | null = defaultBore;

      // Check if variant uses option-based format (separated by " / " with spaces)
      const optionMatch = variant.title.match(/^(.+?)\s+\/\s+(\d+)/);
      if (optionMatch) {
        // Format: "bore / teeth / ..."
        bore = normalizeAndyMarkBore(optionMatch[1]);
        teeth = parseInt(optionMatch[2]);
      } else {
        // Standard format
        const variantToothMatch = variant.title.match(
          /(?:Tooth Count:\s*|^)(\d+)/i,
        );
        if (variantToothMatch) {
          teeth = parseInt(variantToothMatch[1]);
        }

        // Try to extract bore from variant title if not set
        if (!bore) {
          const variantBoreMatch = variant.title.match(
            /(?:Bore:\s*|)([0-9.\/]+\s*(?:in\.|mm)\s*(?:Hex|Round|hex|round))/i,
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

        gears.push({
          productId: product.id,
          variantId: variant.id,
          rawProduct: cleanProductForCache(product),
          parsedData,
          firstSeen: now,
        });
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
    case 'AndyMark':
      return parseAndyMarkGears(products);
    default:
      return [];
  }
}

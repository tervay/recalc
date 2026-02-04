import { shouldSkipProduct } from 'scripts/downloadProducts/alert';
import { urlForHandle } from 'scripts/downloadProducts/download';
import type { CacheEntry, VendorName } from 'scripts/downloadProducts/types';
import {
  cleanProductForCache,
  createSyntheticProduct,
} from 'scripts/downloadProducts/types';

import Measurement from '~/lib/models/Measurement';
import type { JSONBelt } from '~/lib/types/belts';
import {
  andyMarkBeltToJsonBelt,
  wcpBeltToJsonBelt,
  zAndyMarkBeltSchema,
  zJSONBeltSchema,
  zWCPBeltSchema,
} from '~/lib/types/belts';
import type { ShopifyProduct } from '~/lib/types/shopify';

const SDS_BELT_TITLE_REGEX = /Belt,\s*Timing,\s*HTD\s+(\d+)-5M-(\d+)/i;

export function parseWCPBelts(products: ShopifyProduct[]): CacheEntry[] {
  const regex =
    /(?<teeth>\d+)t\s*x\s*(?<width>\d+)mm.*\((?<profile>HTD|GT2)\s*(?<pitch>\d+)mm\)/;
  const belts: CacheEntry[] = [];
  const now = new Date().toISOString();

  for (const product of products) {
    if (product.title.includes('Timing Belt')) {
      const match = product.title.match(regex);
      if (match?.groups) {
        const { teeth, width, profile, pitch } = match.groups;
        try {
          const wcpBelt = zWCPBeltSchema.parse({
            teeth: parseInt(teeth),
            width: parseInt(width),
            profile,
            pitch: parseInt(pitch),
            url: urlForHandle(product.handle, 'WCP'),
            sku: product.variants[0].sku,
            vendor: 'WCP',
          });
          const parsedData = wcpBeltToJsonBelt(wcpBelt);

          belts.push({
            productId: product.id,
            variantId: product.variants[0].id,
            rawProduct: cleanProductForCache(product),
            parsedData,
            firstSeen: now,
          });
        } catch (error) {
          console.error(`Error parsing WCP belt: ${product.title}`, error);
        }
      }
    }
  }

  return belts;
}

export function parseSwyftBelts(products: ShopifyProduct[]): CacheEntry[] {
  const belts: CacheEntry[] = [];
  const now = new Date().toISOString();

  for (const product of products) {
    if (product.title.includes('Timing Belt')) {
      const width = product.title.includes('9mm Width') ? 9 : 15;

      for (const variant of product.variants) {
        const teeth = Number(variant.title.split(' ')[0]);
        if (!isNaN(teeth) && teeth > 0) {
          const parsedData: JSONBelt = {
            teeth,
            width,
            profile: 'HTD',
            pitch: 5,
            sku: variant.sku,
            url: urlForHandle(product.handle, 'Swyft'),
            vendor: 'Swyft',
          };

          belts.push({
            productId: product.id,
            variantId: variant.id,
            rawProduct: cleanProductForCache(product),
            parsedData,
            firstSeen: now,
          });
        }
      }
    }
  }

  return belts;
}

export function parseThriftyBelts(products: ShopifyProduct[]): CacheEntry[] {
  const belts: CacheEntry[] = [];
  const now = new Date().toISOString();

  for (const product of products) {
    if (product.title.includes('HTD Timing Belts')) {
      // Extract width from product title
      const widthMatch = product.title.match(/(\d+)mm Wide/);
      const width = widthMatch ? parseInt(widthMatch[1]) : null;

      if (width === null) continue;

      // Variant title pattern: "100 Tooth - 500-D5M-15" or "35 Tooth - 175-5M-09"
      for (const variant of product.variants) {
        const toothMatch = variant.title.match(/^(\d+) Tooth/);
        const teeth = toothMatch ? parseInt(toothMatch[1]) : null;

        if (teeth === null) continue;

        const parsedData: JSONBelt = {
          teeth,
          width,
          profile: 'HTD',
          pitch: 5,
          sku: variant.sku,
          url: urlForHandle(product.handle, 'Thrifty'),
          vendor: 'Thrifty',
        };

        belts.push({
          productId: product.id,
          variantId: variant.id,
          rawProduct: cleanProductForCache(product),
          parsedData,
          firstSeen: now,
        });
      }
    }
  }

  return belts;
}

export function parseVBeltGuysBelts(): CacheEntry[] {
  // VBeltGuys requires fetching to check availability
  // This is a special case that needs to be handled differently
  // For now, we'll return empty and handle this separately in the main script
  // as it requires network calls per potential belt
  return [];
}

export function parseREVBelts(): CacheEntry[] {
  const toothCounts: number[] = [
    32, 36, 40, 48, 56, 64, 72, 80, 88, 96, 104, 112, 120, 128, 136, 144, 152,
    160, 168, 176, 184, 192, 200, 208, 216,
  ];

  const belts: CacheEntry[] = [];
  const now = new Date().toISOString();

  for (const toothCount of toothCounts) {
    const parsedData: JSONBelt = {
      teeth: toothCount,
      width: new Measurement(0.5, 'in').to('mm').scalar,
      profile: 'RT25',
      pitch: new Measurement(0.25, 'in').to('mm').scalar,
      sku: `REV-21-${toothCount + 4000}`,
      url: 'https://www.revrobotics.com/RT25-Belts-1/2in-Width',
      vendor: 'REV',
    };

    const syntheticId = -3000 - belts.length;

    belts.push({
      productId: syntheticId,
      variantId: syntheticId,
      rawProduct: createSyntheticProduct(
        syntheticId,
        `${toothCount}T REV RT25 Belt`,
        'REV',
        'Belt',
        parsedData.sku,
      ),
      parsedData,
      firstSeen: now,
    });
  }

  return belts;
}

export function parseAndyMarkBelts(products: ShopifyProduct[]): CacheEntry[] {
  const belts: CacheEntry[] = [];
  const now = new Date().toISOString();

  for (const product of products) {
    // Skip products that should not be parsed
    if (shouldSkipProduct(product, 'AndyMark')) continue;

    // Skip collection URLs to avoid duplicates
    if (product.handle?.includes('collections/')) continue;

    // Match products like "15 mm Wide 5 mm Pitch HTD Timing Belts" or "9 mm Wide 5 mm Pitch HTD Timing Belts"
    const widthMatch = product.title.match(
      /(\d+)\s*mm\s+Wide\s+5\s*mm\s+Pitch\s+HTD\s+Timing\s+Belts/i,
    );
    if (!widthMatch) continue;

    const width = parseInt(widthMatch[1]);

    // Parse each variant to extract tooth count
    for (const variant of product.variants) {
      // Variant title patterns:
      // "30 Tooth - 150-5M-09"
      // "Tooth Count=30, Brand=AndyMark"
      // "AndyMark / 30"
      const toothMatch = variant.title.match(/(?:Tooth Count=|^|\/\s*)(\d+)/);
      if (!toothMatch) continue;

      const teeth = parseInt(toothMatch[1]);

      // Generate SKU in format AM-5209_{teeth}T or AM-5215_{teeth}T
      const skuPrefix = width === 9 ? 'AM-5209' : 'AM-5215';
      const sku = variant.sku ?? `${skuPrefix}_${teeth}T`;

      try {
        const andyMarkBelt = zAndyMarkBeltSchema.parse({
          teeth,
          width,
          profile: 'HTD',
          pitch: 5,
          sku,
          url: urlForHandle(product.handle, 'AndyMark'),
        });
        const parsedData = andyMarkBeltToJsonBelt(andyMarkBelt);

        belts.push({
          productId: product.id,
          variantId: variant.id,
          rawProduct: cleanProductForCache(product),
          parsedData,
          firstSeen: now,
        });
      } catch (error) {
        console.error(
          `Error parsing AndyMark belt: ${product.title} - ${variant.title}`,
          error,
        );
      }
    }
  }

  return belts;
}

export function parseLastAnvilBelts(products: ShopifyProduct[]): CacheEntry[] {
  const belts: CacheEntry[] = [];
  const now = new Date().toISOString();

  for (const product of products) {
    if (!product.title.includes('Timing Belt')) continue;

    const widthMatch = product.title.match(/\((\d+)mm\)/);
    const width = widthMatch ? parseInt(widthMatch[1]) : null;

    if (width === null) continue;

    for (const variant of product.variants) {
      const toothMatch = variant.title.match(/(\d+)T/);
      const toothCount = toothMatch ? parseInt(toothMatch[1]) : null;

      if (toothCount === null) continue;

      const parsedData: JSONBelt = {
        teeth: toothCount,
        width,
        profile: 'HTD',
        pitch: 5,
        sku: `LA-${variant.sku}`,
        url: urlForHandle(product.handle, 'LastAnvil'),
        vendor: 'LastAnvil',
      };

      belts.push({
        productId: product.id,
        variantId: variant.id,
        rawProduct: cleanProductForCache(product),
        parsedData,
        firstSeen: now,
      });
    }
  }

  return belts;
}

export function parseSDSBelts(products: ShopifyProduct[]): CacheEntry[] {
  const belts: CacheEntry[] = [];
  const now = new Date().toISOString();

  for (const product of products) {
    if (!product.title.includes('Belt') || !product.title.includes('Timing'))
      continue;

    const match = product.title.match(SDS_BELT_TITLE_REGEX);
    if (!match) continue;

    const lengthMm = parseInt(match[1], 10);
    const widthMm = parseInt(match[2], 10);
    const teeth = lengthMm / 5;
    if (!Number.isInteger(teeth) || teeth < 1) continue;

    const variant = product.variants[0];
    if (!variant) continue;

    try {
      const parsedData = zJSONBeltSchema.parse({
        teeth,
        width: widthMm,
        profile: 'HTD',
        pitch: 5,
        sku: variant.sku,
        url: urlForHandle(product.handle, 'SDS'),
        vendor: 'SDS',
      });

      belts.push({
        productId: product.id,
        variantId: variant.id,
        rawProduct: cleanProductForCache(product),
        parsedData,
        firstSeen: now,
      });
    } catch (error) {
      console.error(`Error parsing SDS belt: ${product.title}`, error);
    }
  }

  return belts;
}

export function parseVendorBelts(
  vendor: VendorName,
  products: ShopifyProduct[],
): CacheEntry[] {
  switch (vendor) {
    case 'WCP':
      return parseWCPBelts(products);
    case 'Thrifty':
      return parseThriftyBelts(products);
    case 'Swyft':
      return parseSwyftBelts(products);
    case 'VBeltGuys':
      return parseVBeltGuysBelts();
    case 'REV':
      return parseREVBelts();
    case 'AndyMark':
      return parseAndyMarkBelts(products);
    case 'LastAnvil':
      return parseLastAnvilBelts(products);
    case 'SDS':
      return parseSDSBelts(products);
    default:
      return [];
  }
}

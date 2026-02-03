import { urlForHandle } from 'scripts/downloadProducts/download';
import type { CacheEntry, VendorName } from 'scripts/downloadProducts/types';
import {
  cleanProductForCache,
  createSyntheticProduct,
} from 'scripts/downloadProducts/types';

import type { AndyMarkPulley, JSONPulley } from '~/lib/types/pulleys';
import {
  andyMarkPulleyToJsonPulley,
  revPulleyToJsonPulley,
  thriftyPulleyToJsonPulley,
  wcpPulleyToJsonPulley,
  zAndyMarkPulleySchema,
  zREVPulleySchema,
  zThriftyPulleySchema,
  zWCPPulleySchema,
} from '~/lib/types/pulleys';
import type { ShopifyProduct } from '~/lib/types/shopify';

export function parseWCPPulleys(products: ShopifyProduct[]): CacheEntry[] {
  const regex =
    /(?<teeth>\d+)t\s*x\s*(?<width>\d+)mm\s*Wide\s*(?<flangeType>.*)\s*(?<profile>GT2|HTD)\s*(?<pitch>\d+)mm(?:.*,\s*(?<bore>.*?) Bore\))?/;
  const pulleys: CacheEntry[] = [];
  const now = new Date().toISOString();

  for (const product of products) {
    if (product.title.includes('Pulley')) {
      const match = product.title.match(regex);
      if (match?.groups) {
        const { teeth, width, profile, pitch, bore } = match.groups;
        if (bore === undefined) {
          continue;
        }

        try {
          const wcpPulley = zWCPPulleySchema.parse({
            teeth: parseInt(teeth),
            width: parseInt(width),
            profile,
            pitch: parseInt(pitch),
            bore,
            url: urlForHandle(product.handle, 'WCP'),
            sku: product.variants[0].sku,
          });
          const parsedData = wcpPulleyToJsonPulley(wcpPulley);

          pulleys.push({
            productId: product.id,
            variantId: product.variants[0].id,
            rawProduct: cleanProductForCache(product),
            parsedData,
            firstSeen: now,
            lastSeen: now,
          });
        } catch (error) {
          console.error(`Error parsing WCP pulley: ${product.title}`, error);
        }
      }
    }
  }

  return pulleys;
}

export function parseThriftyPulleys(products: ShopifyProduct[]): CacheEntry[] {
  const pulleys: CacheEntry[] = [];
  const now = new Date().toISOString();

  for (const product of products) {
    if (product.title.includes('Pulley')) {
      if (product.title.endsWith('Pulley')) {
        const regex =
          /QTY \d+ - (?<tooth>\d+) Tooth (?<profile>\w+) (?<bore>[\w\s]+) Motor Output Pulley/i;

        const match = product.title.match(regex);
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
            const parsedData = thriftyPulleyToJsonPulley(thriftyPulley);

            pulleys.push({
              productId: product.id,
              variantId: product.variants[0].id,
              rawProduct: cleanProductForCache(product),
              parsedData,
              firstSeen: now,
              lastSeen: now,
            });
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

        const match = product.title.match(regex);
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
            const parsedData = thriftyPulleyToJsonPulley(thriftyPulley);

            pulleys.push({
              productId: product.id,
              variantId: product.variants[0].id,
              rawProduct: cleanProductForCache(product),
              parsedData,
              firstSeen: now,
              lastSeen: now,
            });
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

export function parseREVPulleys(): CacheEntry[] {
  const data: {
    teeth: number;
    bore: '8mm' | '1/2" Hex' | 'MAXSpline';
    width: number;
    sku: string;
  }[] = [
    {
      teeth: 12,
      bore: '8mm',
      width: 0.5,
      sku: 'REV-21-2200',
    },
    {
      teeth: 16,
      bore: '1/2" Hex',
      width: 0.5,
      sku: 'REV-21-2205',
    },
    {
      teeth: 16,
      bore: '1/2" Hex',
      width: 1,
      sku: 'REV-21-2206',
    },
    {
      teeth: 24,
      bore: 'MAXSpline',
      width: 0.5,
      sku: 'REV-21-2224',
    },
    {
      teeth: 32,
      bore: 'MAXSpline',
      width: 0.5,
      sku: 'REV-21-2236',
    },
    {
      teeth: 40,
      bore: 'MAXSpline',
      width: 0.5,
      sku: 'REV-21-2248',
    },
    {
      teeth: 48,
      bore: 'MAXSpline',
      width: 0.5,
      sku: 'REV-21-2260',
    },
    {
      teeth: 56,
      bore: 'MAXSpline',
      width: 0.5,
      sku: 'REV-21-2272',
    },
    {
      teeth: 64,
      bore: 'MAXSpline',
      width: 0.5,
      sku: 'REV-21-2284',
    },
  ];

  const pulleys: CacheEntry[] = [];
  const now = new Date().toISOString();

  for (const item of data) {
    const revPulley = zREVPulleySchema.parse({
      teeth: item.teeth,
      width: item.width,
      bore: item.bore,
      sku: item.sku,
      url: 'https://www.revrobotics.com/RT25-Pulleys/',
    });
    const parsedData = revPulleyToJsonPulley(revPulley);

    // Create synthetic IDs for REV products (negative to avoid conflicts)
    const syntheticId = -1000 - pulleys.length;

    pulleys.push({
      productId: syntheticId,
      variantId: syntheticId,
      rawProduct: createSyntheticProduct(
        syntheticId,
        `${item.teeth}T ${item.bore} REV Pulley`,
        'REV',
        'Pulley',
        item.sku,
      ),
      parsedData,
      firstSeen: now,
      lastSeen: now,
    });
  }

  // Add GT2 pulleys
  const gt2Pulleys: JSONPulley[] = [
    {
      teeth: 16,
      width: 25.4,
      profile: 'GT2',
      pitch: 3,
      sku: 'REV-21-1909',
      url: 'https://www.revrobotics.com/neo-pinions/',
      bore: '8mm',
      vendor: 'REV',
    },
    {
      teeth: 12,
      width: 16,
      profile: 'GT2',
      pitch: 3,
      sku: 'REV-21-1908',
      url: 'https://www.revrobotics.com/550-motor-pinions/',
      bore: 'RS550',
      vendor: 'REV',
    },
  ];

  for (const pulley of gt2Pulleys) {
    const syntheticId = -1000 - pulleys.length;
    pulleys.push({
      productId: syntheticId,
      variantId: syntheticId,
      rawProduct: createSyntheticProduct(
        syntheticId,
        `${pulley.teeth}T ${pulley.bore} REV GT2 Pulley`,
        'REV',
        'Pulley',
        pulley.sku,
      ),
      parsedData: pulley,
      firstSeen: now,
      lastSeen: now,
    });
  }

  return pulleys;
}

export function parseAndyMarkPulleys(): CacheEntry[] {
  const data: AndyMarkPulley[] = [
    {
      teeth: 24,
      width: 9,
      profile: 'HTD',
      pitch: 5,
      sku: 'AM-3402',
      url: 'https://andymark.com/collections/pulleys/products/24t-plastic-htd-pulleys',
      bore: '3/8" Hex',
    },
    {
      teeth: 24,
      width: 9,
      profile: 'HTD',
      pitch: 5,
      sku: 'AM-3403',
      url: 'https://andymark.com/collections/pulleys/products/24t-plastic-htd-pulleys',
      bore: '1/2" Hex',
    },
    {
      teeth: 42,
      width: 15,
      profile: 'HTD',
      pitch: 5,
      sku: 'AM-2234a',
      url: 'https://andymark.com/collections/pulleys/products/42-tooth-5-mm-htd-15-mm-wide-bearing-bore-plastic-pulley',
      bore: '1.125" Round',
    },
    {
      teeth: 24,
      width: 18,
      profile: 'HTD',
      pitch: 5,
      sku: 'AM-2234b',
      url: 'https://andymark.com/collections/pulleys/products/24-tooth-0-5-in-hex-bore-5-mm-htd-18-mm-wide-aluminum-pulley',
      bore: '1/2" Hex',
    },
    {
      teeth: 24,
      width: 9,
      profile: 'HTD',
      pitch: 5,
      sku: 'AM-4625',
      url: 'https://andymark.com/collections/pulleys/products/24-tooth-0-5-in-hex-bore-5-mm-htd-9-mm-wide-aluminum-pulley',
      bore: '1/2" Hex',
    },
    {
      teeth: 14,
      width: 9,
      profile: 'HTD',
      pitch: 5,
      sku: 'AM-4960',
      url: 'https://andymark.com/collections/pulleys/products/14-tooth-0-375-in-hex-bore-htd-pulley',
      bore: '3/8" Hex',
    },
  ];

  const pulleys: CacheEntry[] = [];
  const now = new Date().toISOString();

  for (const item of data) {
    const andyMarkPulley = zAndyMarkPulleySchema.parse(item);
    const parsedData = andyMarkPulleyToJsonPulley(andyMarkPulley);

    const syntheticId = -2000 - pulleys.length;

    pulleys.push({
      productId: syntheticId,
      variantId: syntheticId,
      rawProduct: createSyntheticProduct(
        syntheticId,
        `${item.teeth}T ${item.bore} AndyMark Pulley`,
        'AndyMark',
        'Pulley',
        item.sku,
      ),
      parsedData,
      firstSeen: now,
      lastSeen: now,
    });
  }

  return pulleys;
}

export function parseLastAnvilPulleys(
  products: ShopifyProduct[],
): CacheEntry[] {
  const pulleys: CacheEntry[] = [];
  const now = new Date().toISOString();

  for (const product of products) {
    if (!product.title.includes('Pulley')) continue;

    for (const variant of product.variants) {
      const toothMatch = variant.title.match(/(\d+)T\b/i);
      const toothCount = toothMatch ? Number(toothMatch[1]) : null;

      if (toothCount === null) continue;

      const parsedData: JSONPulley = {
        teeth: toothCount,
        width: 9,
        profile: 'HTD',
        pitch: 5,
        sku: `LA-${variant.sku}`,
        url: urlForHandle(product.handle, 'LastAnvil'),
        bore: '1/2" Hex',
        vendor: 'LastAnvil',
      };

      pulleys.push({
        productId: product.id,
        variantId: variant.id,
        rawProduct: cleanProductForCache(product),
        parsedData,
        firstSeen: now,
        lastSeen: now,
      });
    }
  }

  return pulleys;
}

export function parseVendorPulleys(
  vendor: VendorName,
  products: ShopifyProduct[],
): CacheEntry[] {
  switch (vendor) {
    case 'WCP':
      return parseWCPPulleys(products);
    case 'Thrifty':
      return parseThriftyPulleys(products);
    case 'REV':
      return parseREVPulleys();
    case 'AndyMark':
      return parseAndyMarkPulleys();
    case 'LastAnvil':
      return parseLastAnvilPulleys(products);
    default:
      return [];
  }
}

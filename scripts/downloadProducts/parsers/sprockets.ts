import { urlForHandle } from 'scripts/downloadProducts/download';
import type { CacheEntry, VendorName } from 'scripts/downloadProducts/types';
import {
  cleanProductForCache,
  createSyntheticProduct,
} from 'scripts/downloadProducts/types';

import type { ShopifyProduct } from '~/lib/types/shopify';
import type {
  ChainType,
  JSONSprocket,
  ThriftySprocketBore,
} from '~/lib/types/sprockets';
import {
  thriftySprocketToJsonSprocket,
  wcpSprocketToJsonSprocket,
  zThriftySprocketSchema,
  zWCPSprocketSchema,
} from '~/lib/types/sprockets';

export function parseWCPSprockets(products: ShopifyProduct[]): CacheEntry[] {
  const sprockets: CacheEntry[] = [];
  const regex = /(?<tooth>\d+)t.*?\((?<chain>#\d+)[^)]+,\s*(?<bore>[^)]+)\)/;
  const now = new Date().toISOString();

  for (const product of products) {
    if (product.title.includes('Sprocket')) {
      const match = product.title.match(regex);
      if (match?.groups) {
        const { tooth, chain, bore } = match.groups;

        try {
          const wcpSprocket = zWCPSprocketSchema.parse({
            teeth: parseInt(tooth),
            chainType: chain,
            bore,
            url: urlForHandle(product.handle, 'WCP'),
            sku: product.variants[0].sku,
          });
          const parsedData = wcpSprocketToJsonSprocket(wcpSprocket);

          sprockets.push({
            productId: product.id,
            variantId: product.variants[0].id,
            rawProduct: cleanProductForCache(product),
            parsedData,
            firstSeen: now,
          });
        } catch (error) {
          console.error(`Error parsing WCP sprocket: ${product.title}`, error);
        }
      }
    }
  }

  return sprockets;
}

export function parseThriftySprockets(
  products: ShopifyProduct[],
): CacheEntry[] {
  const sprockets: CacheEntry[] = [];
  const now = new Date().toISOString();

  for (const product of products) {
    for (const variant of product.variants) {
      if (
        product.title === '#35 Chain Billet Sprockets' ||
        product.title === '#35 Flat Plate Sprockets'
      ) {
        const parsedData: JSONSprocket = {
          teeth: parseInt(variant.title.split(' ')[0]),
          bore: '1.125" Round',
          chainType: '#35',
          sku: variant.sku,
          url: urlForHandle(product.handle, 'Thrifty'),
          vendor: 'Thrifty',
        };

        sprockets.push({
          productId: product.id,
          variantId: variant.id,
          rawProduct: cleanProductForCache(product),
          parsedData,
          firstSeen: now,
        });
      } else if (
        product.title === '#25 Chain Billet Sprockets' ||
        product.title === '#25 Flat Plate Sprockets'
      ) {
        const parsedData: JSONSprocket = {
          teeth: parseInt(variant.title.split(' ')[0]),
          bore: '1.125" Round',
          chainType: '#25',
          sku: variant.sku,
          url: urlForHandle(product.handle, 'Thrifty'),
          vendor: 'Thrifty',
        };

        sprockets.push({
          productId: product.id,
          variantId: variant.id,
          rawProduct: cleanProductForCache(product),
          parsedData,
          firstSeen: now,
        });
      } else if (
        product.title === 'QTY 2 - Half Inch Hex 22 Tooth #25 Sprocket'
      ) {
        // Special case for this product
        const parsedData: JSONSprocket = {
          teeth: 22,
          bore: '1/2" Hex',
          chainType: '#25',
          sku: variant.sku,
          url: urlForHandle(product.handle, 'Thrifty'),
          vendor: 'Thrifty',
        };

        sprockets.push({
          productId: product.id,
          variantId: variant.id,
          rawProduct: cleanProductForCache(product),
          parsedData,
          firstSeen: now,
        });
      } else {
        const regex =
          /(?<chainType>#\d+).*?(?<toothCount>\d+)\s+Tooth\s+(?<boreType>.+? Bore)/;
        if (variant.title.includes('Sprocket')) {
          for (const variantInner of product.variants) {
            const match = `${product.title} // ${variantInner.title}`.match(
              regex,
            );
            if (match?.groups) {
              const { chainType, toothCount, boreType } = match.groups;
              try {
                const thriftySprocket = zThriftySprocketSchema.parse({
                  chainType: chainType as ChainType,
                  teeth: Number(toothCount),
                  bore: boreType as ThriftySprocketBore,
                  sku: variantInner.sku,
                  url: urlForHandle(product.handle, 'Thrifty'),
                });
                const parsedData =
                  thriftySprocketToJsonSprocket(thriftySprocket);

                sprockets.push({
                  productId: product.id,
                  variantId: variantInner.id,
                  rawProduct: product,
                  parsedData,
                  firstSeen: now,
                });
              } catch (error) {
                console.error(
                  `Error parsing Thrifty sprocket: ${product.title} // ${variantInner.title}`,
                  error,
                );
              }
            }
          }
        }
      }
    }
  }

  return sprockets;
}

export function parseREVSprockets(): CacheEntry[] {
  const sprockets: CacheEntry[] = [];
  const now = new Date().toISOString();

  // ION 35 Sprockets with 1/2" Hex bore
  for (const [index, toothCount] of [9, 10, 11, 12, 16, 18, 20, 24].entries()) {
    const parsedData: JSONSprocket = {
      teeth: toothCount,
      bore: '1/2" Hex',
      chainType: '#35',
      sku: `REV-21-${3706 + index}`,
      url: 'https://www.revrobotics.com/ION-35-Sprockets/',
      vendor: 'REV',
    };

    const syntheticId = -5000 - sprockets.length;

    sprockets.push({
      productId: syntheticId,
      variantId: syntheticId,
      rawProduct: createSyntheticProduct(
        syntheticId,
        `${toothCount}T 1/2" Hex REV ION 35 Sprocket`,
        'REV',
        'Sprocket',
        parsedData.sku,
      ),
      parsedData,
      firstSeen: now,
    });
  }

  // ION 35 Sprockets with MAXSpline bore
  for (const [index, toothCount] of [
    16, 18, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 68, 72, 76, 80,
  ].entries()) {
    const parsedData: JSONSprocket = {
      teeth: toothCount,
      bore: 'MAXSpline',
      chainType: '#35',
      sku: `REV-21-${3718 + index}`,
      url: 'https://www.revrobotics.com/ION-35-Sprockets/',
      vendor: 'REV',
    };

    const syntheticId = -5000 - sprockets.length;

    sprockets.push({
      productId: syntheticId,
      variantId: syntheticId,
      rawProduct: createSyntheticProduct(
        syntheticId,
        `${toothCount}T MAXSpline REV ION 35 Sprocket`,
        'REV',
        'Sprocket',
        parsedData.sku,
      ),
      parsedData,
      firstSeen: now,
    });
  }

  // ION 25 Sprockets
  const ion25Sprockets: Pick<JSONSprocket, 'teeth' | 'bore' | 'sku'>[] = [
    { teeth: 12, bore: '1/2" Hex', sku: 'REV-21-2014' },
    { teeth: 16, bore: '1/2" Hex', sku: 'REV-21-2012' },
    { teeth: 16, bore: '1/2" Hex', sku: 'REV-21-2016' },
    { teeth: 24, bore: '1/2" Hex', sku: 'REV-21-2017' },
    { teeth: 32, bore: '1/2" Hex', sku: 'REV-21-2018' },
    { teeth: 24, bore: 'MAXSpline', sku: 'REV-21-2015' },
    { teeth: 32, bore: 'MAXSpline', sku: 'REV-21-2019' },
    { teeth: 48, bore: 'MAXSpline', sku: 'REV-21-1964' },
    { teeth: 64, bore: 'MAXSpline', sku: 'REV-21-1972' },
    { teeth: 40, bore: 'MAXSpline', sku: 'REV-21-3370' },
    { teeth: 48, bore: 'MAXSpline', sku: 'REV-21-3374' },
    { teeth: 56, bore: 'MAXSpline', sku: 'REV-21-3378' },
    { teeth: 64, bore: 'MAXSpline', sku: 'REV-21-3382' },
    { teeth: 72, bore: 'MAXSpline', sku: 'REV-21-3386' },
  ];

  for (const sprocket of ion25Sprockets) {
    const parsedData: JSONSprocket = {
      ...sprocket,
      chainType: '#25',
      url: 'https://www.revrobotics.com/ION-25-Sprockets/',
      vendor: 'REV',
    };

    const syntheticId = -5000 - sprockets.length;

    sprockets.push({
      productId: syntheticId,
      variantId: syntheticId,
      rawProduct: createSyntheticProduct(
        syntheticId,
        `${sprocket.teeth}T ${sprocket.bore} REV ION 25 Sprocket`,
        'REV',
        'Sprocket',
        parsedData.sku,
      ),
      parsedData,
      firstSeen: now,
    });
  }

  // NEO pinion sprockets
  const neoPinions: Pick<JSONSprocket, 'teeth' | 'bore' | 'sku'>[] = [
    { teeth: 10, bore: '8mm', sku: 'REV-21-2020' },
    { teeth: 12, bore: '8mm', sku: 'REV-21-3495' },
  ];

  for (const sprocket of neoPinions) {
    const parsedData: JSONSprocket = {
      ...sprocket,
      chainType: '#25',
      url: 'https://www.revrobotics.com/neo-pinions/',
      vendor: 'REV',
    };

    const syntheticId = -5000 - sprockets.length;

    sprockets.push({
      productId: syntheticId,
      variantId: syntheticId,
      rawProduct: createSyntheticProduct(
        syntheticId,
        `${sprocket.teeth}T ${sprocket.bore} REV NEO Pinion`,
        'REV',
        'Sprocket',
        parsedData.sku,
      ),
      parsedData,
      firstSeen: now,
    });
  }

  return sprockets;
}

export function parseLastAnvilSprockets(): CacheEntry[] {
  const sprockets: CacheEntry[] = [];
  const now = new Date().toISOString();

  const productId = 7640313233614;
  const variantId = 43296203997390;
  const parsedData: JSONSprocket = {
    teeth: 12,
    bore: '1/4" Round',
    chainType: '#25',
    url: urlForHandle('idler-sprocket', 'LastAnvil'),
    sku: '250153',
    vendor: 'LastAnvil',
  };
  const rawProduct = createSyntheticProduct(
    productId,
    '12T 1/4" Round LastAnvil #25 Sprocket',
    'LastAnvil',
    'Sprocket',
    '250153',
  );
  rawProduct.variants[0].id = variantId;
  rawProduct.variants[0].product_id = productId;

  sprockets.push({
    productId,
    variantId,
    rawProduct,
    parsedData,
    firstSeen: now,
  });

  return sprockets;
}

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
): CacheEntry[] {
  const sprockets: CacheEntry[] = [];
  const now = new Date().toISOString();

  for (const product of products) {
    if (
      !product.title.includes('Sprocket') &&
      !product.title.includes('sprocket')
    )
      continue;

    // Skip collection URLs to avoid duplicates
    if (product.handle?.includes('collections/')) continue;

    // Pattern 1: Single-variant sprockets with series and tooth in title
    // Format: "XX Series YY Tooth ... Sprocket" or "YY Tooth XX Series ... Sprocket"
    const seriesAndToothMatch = product.title.match(
      /(#?\d+)\s+Series\s+(\d+)\s+Tooth|((\d+)\s+Tooth.*?(#?\d+)\s+Series)/i,
    );

    if (seriesAndToothMatch && product.variants.length === 1) {
      let teeth: number;
      let chainNum: string;

      if (seriesAndToothMatch[1] && seriesAndToothMatch[2]) {
        // Format: "XX Series YY Tooth"
        chainNum = seriesAndToothMatch[1].replace('#', '');
        teeth = parseInt(seriesAndToothMatch[2]);
      } else if (seriesAndToothMatch[4] && seriesAndToothMatch[5]) {
        // Format: "YY Tooth XX Series"
        teeth = parseInt(seriesAndToothMatch[4]);
        chainNum = seriesAndToothMatch[5].replace('#', '');
      } else {
        continue;
      }

      const chainType: ChainType = `#${chainNum}` as ChainType;

      // Extract bore from title - patterns: "8 mm Bore", "0.5 in. Hex", etc.
      const boreMatch = product.title.match(
        /(\d+\.?\d*\s*(?:in\.|mm))\s+(?:Hex|Round|Bore)/i,
      );
      let bore = boreMatch ? normalizeAndyMarkSprocketBore(boreMatch[0]) : null;

      // If no bore in title and title contains "Round" (without specific measurement), it's 1.125" Round bearing bore
      if (
        !bore &&
        product.title.toLowerCase().includes('round') &&
        !product.title.match(/\d+\.?\d*\s*(?:in\.|mm)\s+round/i)
      ) {
        bore = '1.125" Round';
      }

      // If no bore but it's an aluminum sprocket without explicit bore info, it's likely 1.125" Round
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

      try {
        const parsedData: JSONSprocket = {
          teeth,
          bore,
          chainType,
          url: urlForHandle(product.handle, 'AndyMark'),
          sku,
          vendor: 'AndyMark',
        };

        sprockets.push({
          productId: product.id,
          variantId: variant.id,
          rawProduct: cleanProductForCache(product),
          parsedData,
          firstSeen: now,
        });
      } catch (error) {
        console.error(
          `Error parsing AndyMark sprocket: ${product.title}`,
          error,
        );
      }
      continue;
    }

    // Pattern 2: Multi-variant sprockets with format "XX Series ... Sprockets"
    const seriesMatch = product.title.match(/(#?\d+)\s+Series/i);
    if (!seriesMatch) continue;

    const chainNum = seriesMatch[1].replace('#', '');
    const chainType: ChainType = `#${chainNum}` as ChainType;

    // Determine if this is a bearing bore / plate sprocket
    const isBearingBore = /bearing.*bore|plate.*sprocket/i.test(product.title);
    // Symmetrical Hub Sprockets have 1/2" Hex bore by default
    const isSymmetricalHub = /symmetrical.*hub/i.test(product.title);
    const defaultBore = isBearingBore
      ? '1.125" Round'
      : isSymmetricalHub
        ? '1/2" Hex'
        : null;

    // Parse each variant
    for (const variant of product.variants) {
      // Variant title patterns:
      // "22 Tooth - 3/8 in. Hex"
      // "Tooth Count: 22, Bore: 0.375 in. Hex"
      let teeth: number | null = null;
      let bore: '8mm' | '1/2" Hex' | '3/8" Hex' | '1.125" Round' | null =
        defaultBore;

      const variantToothMatch =
        variant.title.match(/(?:Tooth Count:\s*|)(\d+)\s+Tooth/i) ||
        variant.title.match(/^(\d+)/);
      if (variantToothMatch) {
        teeth = parseInt(variantToothMatch[1]);
      }

      // Try to extract bore from variant title if not set
      if (!bore) {
        const variantBoreMatch =
          variant.title.match(
            /([0-9./]+\s*(?:in\.|mm)\s*(?:Hex|Round|hex|round))/i,
          ) || variant.title.match(/(8\s*mm)/i);
        if (variantBoreMatch) {
          bore = normalizeAndyMarkSprocketBore(variantBoreMatch[1]);
        }
      }

      if (teeth === null || bore === null) continue;

      const sku = variant.sku ?? `AM-${teeth}T-${chainType}`;

      try {
        const parsedData: JSONSprocket = {
          teeth,
          bore,
          chainType,
          url: urlForHandle(product.handle, 'AndyMark'),
          sku,
          vendor: 'AndyMark',
        };

        sprockets.push({
          productId: product.id,
          variantId: variant.id,
          rawProduct: cleanProductForCache(product),
          parsedData,
          firstSeen: now,
        });
      } catch (error) {
        console.error(
          `Error parsing AndyMark sprocket: ${product.title} - ${variant.title}`,
          error,
        );
      }
    }
  }

  return sprockets;
}

export function parseVendorSprockets(
  vendor: VendorName,
  products: ShopifyProduct[],
): CacheEntry[] {
  switch (vendor) {
    case 'WCP':
      return parseWCPSprockets(products);
    case 'Thrifty':
      return parseThriftySprockets(products);
    case 'REV':
      return parseREVSprockets();
    case 'AndyMark':
      return parseAndyMarkSprockets(products);
    case 'LastAnvil':
      return parseLastAnvilSprockets();
    default:
      return [];
  }
}

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
            lastSeen: now,
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
          lastSeen: now,
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
          lastSeen: now,
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
                  lastSeen: now,
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
      lastSeen: now,
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
      lastSeen: now,
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
      lastSeen: now,
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
      lastSeen: now,
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
    lastSeen: now,
  });

  return sprockets;
}

export function parseAndyMarkSprockets(): CacheEntry[] {
  const sprockets: CacheEntry[] = [];
  const now = new Date().toISOString();

  const staticSprockets: JSONSprocket[] = [
    {
      teeth: 10,
      bore: '8mm',
      chainType: '#25',
      url: 'https://andymark.com/collections/sprockets/products/25-series-symmetrical-hub-sprockets',
      sku: 'AM-4772',
      vendor: 'AndyMark',
    },
    {
      teeth: 17,
      bore: '1/2" Hex',
      chainType: '#25',
      url: 'https://andymark.com/collections/sprockets/products/25-series-17-tooth-0-5-in-hex-sprocket',
      sku: 'AM-3999',
      vendor: 'AndyMark',
    },
    {
      teeth: 12,
      bore: '8mm',
      chainType: '#35',
      url: 'https://andymark.com/collections/sprockets/products/35-series-12-tooth-0-5-in-key-bore-steel-sprocket',
      sku: 'AM-0019',
      vendor: 'AndyMark',
    },
  ];

  for (const parsedData of staticSprockets) {
    const syntheticId = -6000 - sprockets.length;

    sprockets.push({
      productId: syntheticId,
      variantId: syntheticId,
      rawProduct: createSyntheticProduct(
        syntheticId,
        `${parsedData.teeth}T ${parsedData.bore} AndyMark ${parsedData.chainType} Sprocket`,
        'AndyMark',
        'Sprocket',
        parsedData.sku,
      ),
      parsedData,
      firstSeen: now,
      lastSeen: now,
    });
  }

  // #25 Symmetrical Hub Sprockets
  for (const [index, toothCount] of [14, 18, 22, 26].entries()) {
    for (const bore of ['1/2" Hex', '3/8" Hex'] as const) {
      const parsedData: JSONSprocket = {
        teeth: toothCount,
        bore,
        chainType: '#25',
        url: 'https://andymark.com/collections/sprockets/products/25-series-symmetrical-hub-sprockets',
        sku:
          bore === '1/2" Hex'
            ? `AM-${4773 + index * 2}`
            : `AM-${4774 + index * 2}`,
        vendor: 'AndyMark',
      };

      const syntheticId = -6000 - sprockets.length;

      sprockets.push({
        productId: syntheticId,
        variantId: syntheticId,
        rawProduct: createSyntheticProduct(
          syntheticId,
          `${toothCount}T ${bore} AndyMark #25 Sprocket`,
          'AndyMark',
          'Sprocket',
          parsedData.sku,
        ),
        parsedData,
        firstSeen: now,
        lastSeen: now,
      });
    }
  }

  // #35 Symmetrical Hub Sprockets
  for (const [index, toothCount] of [14, 14, 18].entries()) {
    const parsedData: JSONSprocket = {
      teeth: toothCount,
      bore: '1/2" Hex',
      chainType: '#35',
      url: 'https://andymark.com/collections/sprockets/products/35-series-symmetrical-hub-sprockets',
      sku: `AM-${4789 + index}`,
      vendor: 'AndyMark',
    };

    const syntheticId = -6000 - sprockets.length;

    sprockets.push({
      productId: syntheticId,
      variantId: syntheticId,
      rawProduct: createSyntheticProduct(
        syntheticId,
        `${toothCount}T 1/2" Hex AndyMark #35 Sprocket`,
        'AndyMark',
        'Sprocket',
        parsedData.sku,
      ),
      parsedData,
      firstSeen: now,
      lastSeen: now,
    });
  }

  // #25 Bearing Bore Plate Sprockets
  for (const [index, toothCount] of [
    32, 38, 44, 50, 56, 62, 68, 74,
  ].entries()) {
    const parsedData: JSONSprocket = {
      teeth: toothCount,
      bore: '1.125" Round',
      chainType: '#25',
      url: 'https://andymark.com/collections/sprockets/products/25-series-bearing-bore-plate-sprockets',
      sku: `AM-${4781 + index}`,
      vendor: 'AndyMark',
    };

    const syntheticId = -6000 - sprockets.length;

    sprockets.push({
      productId: syntheticId,
      variantId: syntheticId,
      rawProduct: createSyntheticProduct(
        syntheticId,
        `${toothCount}T Bearing Bore AndyMark #25 Plate Sprocket`,
        'AndyMark',
        'Sprocket',
        parsedData.sku,
      ),
      parsedData,
      firstSeen: now,
      lastSeen: now,
    });
  }

  // #35 Bearing Bore Plate Sprockets
  for (const [index, toothCount] of [
    22, 28, 34, 40, 46, 52, 58, 64,
  ].entries()) {
    const parsedData: JSONSprocket = {
      teeth: toothCount,
      bore: '1.125" Round',
      chainType: '#35',
      url: 'https://andymark.com/collections/sprockets/products/35-series-bearing-bore-plate-sprockets',
      sku: `AM-${4792 + index}`,
      vendor: 'AndyMark',
    };

    const syntheticId = -6000 - sprockets.length;

    sprockets.push({
      productId: syntheticId,
      variantId: syntheticId,
      rawProduct: createSyntheticProduct(
        syntheticId,
        `${toothCount}T Bearing Bore AndyMark #35 Plate Sprocket`,
        'AndyMark',
        'Sprocket',
        parsedData.sku,
      ),
      parsedData,
      firstSeen: now,
      lastSeen: now,
    });
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
      return parseAndyMarkSprockets();
    case 'LastAnvil':
      return parseLastAnvilSprockets();
    default:
      return [];
  }
}

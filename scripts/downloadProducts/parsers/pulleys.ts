import { urlForHandle } from 'scripts/downloadProducts/download';
import type { CacheEntry, VendorName } from 'scripts/downloadProducts/types';
import {
  cleanProductForCache,
  createSyntheticProduct,
} from 'scripts/downloadProducts/types';

import type { JSONPulley } from '~/lib/types/pulleys';
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
      // Handle new variant-based pulley products (Kraken Spline, 1/2" Hex)
      if (
        product.title === 'Kraken Spline Bore Aluminum HTD Pulleys' ||
        product.title === '1/2" Hex Bore Aluminum HTD Pulleys'
      ) {
        // Determine default bore from product title
        const defaultBore =
          product.title === 'Kraken Spline Bore Aluminum HTD Pulleys'
            ? 'Kraken Spline'
            : '1/2" Hex';

        // Pattern: "18.5mm Wide 15 Tooth 1/2" Hex" or "18.5mm Wide 11 Tooth SplineXS"
        // May also have suffixes like "(Lightened)" or no bore type at all
        const variantRegex =
          /(?<width>[\d.]+)mm Wide (?<tooth>\d+) Tooth(?:\s+(?<bore>[^(]+?))?(?:\s*\(.*?\))?$/i;

        for (const variant of product.variants) {
          const match = variant.title.match(variantRegex);
          if (match?.groups) {
            const { tooth, bore } = match.groups;
            // Use bore from variant if present, otherwise use default from product title
            let mappedBore = bore ? bore.trim() : defaultBore;

            // Map bore types to schema values
            if (mappedBore === 'Spline XS' || mappedBore === 'SplineXS') {
              mappedBore = 'Kraken Spline';
            }

            try {
              const thriftyPulley = zThriftyPulleySchema.parse({
                teeth: parseInt(tooth),
                profile: 'HTD',
                bore: mappedBore,
                sku: variant.sku,
                url: urlForHandle(product.handle, 'Thrifty'),
              });
              const parsedData = thriftyPulleyToJsonPulley(thriftyPulley);

              pulleys.push({
                productId: product.id,
                variantId: variant.id,
                rawProduct: cleanProductForCache(product),
                parsedData,
                firstSeen: now,
              });
            } catch (error) {
              console.error(
                `Error parsing Thrifty pulley variant: ${product.title} - ${variant.title}`,
                error,
              );
            }
          }
        }
      } else if (product.title.endsWith('Pulley')) {
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
    });
  }

  return pulleys;
}

function normalizeAndyMarkPulleyBore(
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

export function parseAndyMarkPulleys(products: ShopifyProduct[]): CacheEntry[] {
  const pulleys: CacheEntry[] = [];
  const now = new Date().toISOString();

  for (const product of products) {
    if (!product.title.includes('Pulley') && !product.title.includes('pulley'))
      continue;

    // Skip collection URLs to avoid duplicates
    if (product.handle?.includes('collections/')) continue;

    // Extract tooth count from title
    const toothMatch = product.title.match(/(\d+)\s*T(?:ooth)?/i);
    if (!toothMatch) continue;
    const teeth = parseInt(toothMatch[1]);

    // Try to extract width and pitch from title
    // Pattern 1: "XX Tooth YY mm ... ZZ mm ... HTD" (explicit width and pitch)
    const fullMatch = product.title.match(/(\d+)\s*mm.*?(\d+)\s*mm/i);
    let width: number;
    let pitch: number;

    if (fullMatch) {
      const val1 = parseInt(fullMatch[1]);
      const val2 = parseInt(fullMatch[2]);
      width = Math.max(val1, val2);
      pitch = Math.min(val1, val2);
    } else {
      // Default values for HTD pulleys (common for AndyMark)
      width = 9; // Most common width
      pitch = 5; // HTD pitch
    }

    // Extract bore from title
    const boreMatch = product.title.match(
      /(\d+\.?\d*\s*(?:in\.|mm))\s*(?:Hex|Round)|(?:with|bore)\s+(\d+\s*mm)|bearing\s+bore/i,
    );

    // For multi-variant products, parse each variant
    if (product.variants.length > 1) {
      for (const variant of product.variants) {
        // Skip variants with "Universal Pulley Extension" or "Nub Bore"
        if (
          variant.title.toLowerCase().includes('extension') ||
          variant.title.toLowerCase().includes('nub')
        )
          continue;

        // Variant might specify bore: "Bore=0.375 in. Hex" or "0.375 in. Hex"
        const variantBoreMatch = variant.title.match(
          /Bore\s*=\s*([^-]+)|(\d+\.?\d*\s*(?:in\.|mm)\s*(?:Hex|Round))/i,
        );
        let bore: '8mm' | '1/2" Hex' | '3/8" Hex' | '1.125" Round' | null =
          null;

        if (variantBoreMatch) {
          const boreText =
            variantBoreMatch[1] ?? variantBoreMatch[2] ?? variantBoreMatch[0];
          bore = normalizeAndyMarkPulleyBore(boreText);
        } else if (boreMatch) {
          bore = normalizeAndyMarkPulleyBore(boreMatch[0]);
        }

        if (!bore) continue;

        const sku = variant.sku ?? `AM-${teeth}T`;

        try {
          const andyMarkPulley = zAndyMarkPulleySchema.parse({
            teeth,
            width,
            profile: 'HTD',
            pitch,
            sku,
            url: urlForHandle(product.handle, 'AndyMark'),
            bore,
          });
          const parsedData = andyMarkPulleyToJsonPulley(andyMarkPulley);

          pulleys.push({
            productId: product.id,
            variantId: variant.id,
            rawProduct: cleanProductForCache(product),
            parsedData,
            firstSeen: now,
          });
        } catch (error) {
          console.error(
            `Error parsing AndyMark pulley: ${product.title} - ${variant.title}`,
            error,
          );
        }
      }
    } else {
      // Single variant
      const bore = boreMatch ? normalizeAndyMarkPulleyBore(boreMatch[0]) : null;
      if (!bore) continue;

      const variant = product.variants[0];
      const sku = variant.sku ?? `AM-${teeth}T`;

      try {
        const andyMarkPulley = zAndyMarkPulleySchema.parse({
          teeth,
          width,
          profile: 'HTD',
          pitch,
          sku,
          url: urlForHandle(product.handle, 'AndyMark'),
          bore,
        });
        const parsedData = andyMarkPulleyToJsonPulley(andyMarkPulley);

        pulleys.push({
          productId: product.id,
          variantId: variant.id,
          rawProduct: cleanProductForCache(product),
          parsedData,
          firstSeen: now,
        });
      } catch (error) {
        console.error(`Error parsing AndyMark pulley: ${product.title}`, error);
      }
    }
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
      return parseAndyMarkPulleys(products);
    case 'LastAnvil':
      return parseLastAnvilPulleys(products);
    default:
      return [];
  }
}

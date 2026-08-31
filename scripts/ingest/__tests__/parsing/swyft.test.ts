import { parseSwyftBelts } from 'scripts/ingest/parsing/swyft/belts';
import { describe, expect, it } from 'vitest';

import type { ShopifyProduct, ShopifyVariant } from '~/lib/types/shopify';

function makeVariant(
  overrides: Partial<ShopifyVariant> & { id: number; product_id: number },
): ShopifyVariant {
  return {
    title: 'Default Title',
    option1: null,
    option2: null,
    option3: null,
    sku: null,
    available: true,
    price: '10.00',
    grams: 0,
    position: 1,
    ...overrides,
  } as ShopifyVariant;
}

function makeProduct(
  overrides: Partial<ShopifyProduct> & { id: number },
): ShopifyProduct {
  return {
    title: 'Test Product',
    handle: 'test-product',
    vendor: 'Swyft',
    product_type: '',
    tags: [],
    images: [],
    options: [],
    variants: [],
    ...overrides,
  } as unknown as ShopifyProduct;
}

describe('parseSwyftBelts', () => {
  it('parses an HTD belt variant', () => {
    const product = makeProduct({
      id: 1,
      title: 'HTD 5mm Pitch Timing Belts',
      handle: 'htd-timing-belts',
      variants: [
        makeVariant({
          id: 10,
          product_id: 1,
          title: '40 Tooth / 15mm Width',
          sku: 'HTD-40T-15MM',
        }),
      ],
    });

    const result = parseSwyftBelts([product]);
    expect(result).toEqual([
      {
        teeth: 40,
        width: 15,
        profile: 'HTD',
        pitch: 5,
        sku: 'HTD-40T-15MM',
        url: 'https://shop.swyftrobotics.com/products/htd-timing-belts',
        vendor: 'Swyft',
      },
    ]);
  });

  it('parses a GT2 belt variant with 5mm width', () => {
    const product = makeProduct({
      id: 2,
      title: 'GT2 2mm Pitch Timing Belts',
      handle: 'gt2-timing-belts',
      variants: [
        makeVariant({
          id: 20,
          product_id: 2,
          title: '40 Tooth / 5mm Width',
          sku: 'GT2-40T-5MM',
        }),
      ],
    });

    const [belt] = parseSwyftBelts([product]);
    expect(belt.teeth).toBe(40);
    expect(belt.width).toBe(5);
    expect(belt.profile).toBe('GT2');
    expect(belt.pitch).toBe(2);
    expect(belt.sku).toBe('GT2-40T-5MM');
  });

  it('parses a GT2 belt variant with 10mm width', () => {
    const product = makeProduct({
      id: 3,
      title: 'GT2 2mm Pitch Timing Belts',
      handle: 'gt2-timing-belts',
      variants: [
        makeVariant({
          id: 30,
          product_id: 3,
          title: '40 Tooth / 10mm Width',
          sku: '2GT-80-10',
        }),
      ],
    });

    const [belt] = parseSwyftBelts([product]);
    expect(belt.width).toBe(10);
    expect(belt.pitch).toBe(2);
    expect(belt.profile).toBe('GT2');
  });

  it('skips non-belt products', () => {
    const product = makeProduct({
      id: 4,
      title: 'FTC Spike Motor Kit',
      handle: 'ftc-spike-motor-kit',
      variants: [makeVariant({ id: 40, product_id: 4, title: 'Default' })],
    });

    expect(parseSwyftBelts([product])).toHaveLength(0);
  });

  it('skips variants whose title does not match the teeth/width pattern', () => {
    const product = makeProduct({
      id: 5,
      title: 'GT2 2mm Pitch Timing Belts',
      handle: 'gt2-timing-belts',
      variants: [
        makeVariant({ id: 50, product_id: 5, title: 'Default Title' }),
      ],
    });

    expect(parseSwyftBelts([product])).toHaveLength(0);
  });
});

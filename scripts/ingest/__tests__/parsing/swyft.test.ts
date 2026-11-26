import { parseSwyftBelts } from 'scripts/ingest/parsing/swyft/belts';
import { parseSwyftGears } from 'scripts/ingest/parsing/swyft/gears';
import { parseSwyftPulleys } from 'scripts/ingest/parsing/swyft/pulleys';
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
        variantId: 10,
        url: 'https://shop.swyftrobotics.com/products/htd-timing-belts?variant=10',
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

function gearProduct(...variantTitles: string[]): ShopifyProduct {
  return makeProduct({
    id: 6,
    title: 'SWYFT Gears 20DP',
    handle: 'swyft-gears-20dp',
    variants: variantTitles.map((title, i) =>
      makeVariant({ id: 60 + i, product_id: 6, title, sku: `SKU-${i}` }),
    ),
  });
}

describe('parseSwyftGears', () => {
  it('parses a 15T SplineXS pinion', () => {
    expect(
      parseSwyftGears([gearProduct('8 Tooth 15T SplineXS Pinion')]),
    ).toEqual([
      {
        teeth: 8,
        dp: 20,
        bore: 'SplineXS',
        url: 'https://shop.swyftrobotics.com/products/swyft-gears-20dp?variant=60',
        sku: 'SKU-0',
        variantId: 60,
        vendor: 'Swyft',
      },
    ]);
  });

  it('parses a 1/2" Hex wide gear', () => {
    const [gear] = parseSwyftGears([gearProduct('14 Tooth 1/2" Hex Wide')]);
    expect(gear).toMatchObject({ teeth: 14, dp: 20, bore: '1/2" Hex' });
  });

  it('parses a 1/2" Hex hub gear', () => {
    const [gear] = parseSwyftGears([gearProduct('24 Tooth 1/2" Hex Hub')]);
    expect(gear).toMatchObject({ teeth: 24, dp: 20, bore: '1/2" Hex' });
  });

  it('skips 7mm Hex pinions', () => {
    expect(parseSwyftGears([gearProduct('8 Tooth 7mm Hex Pinion')])).toEqual(
      [],
    );
  });

  it('skips slice gears without a shaft bore', () => {
    expect(parseSwyftGears([gearProduct('26 Tooth Slice')])).toEqual([]);
  });

  it('skips non-gear products', () => {
    const product = makeProduct({
      id: 7,
      title: 'Axle Adapters',
      variants: [
        makeVariant({ id: 70, product_id: 7, title: '8 Tooth 1/2" Hex Hub' }),
      ],
    });
    expect(parseSwyftGears([product])).toEqual([]);
  });
});

function pulleyProduct(...variantTitles: string[]): ShopifyProduct {
  return makeProduct({
    id: 8,
    title: 'SWYFT HTD 5mm Pulleys',
    handle: 'htd-5mm-pulleys',
    variants: variantTitles.map((title, i) =>
      makeVariant({ id: 80 + i, product_id: 8, title, sku: `SKU-${i}` }),
    ),
  });
}

describe('parseSwyftPulleys', () => {
  it('parses an HTD 5mm pulley variant', () => {
    expect(parseSwyftPulleys([pulleyProduct('14 Tooth')])).toEqual([
      {
        teeth: 14,
        width: 9,
        profile: 'HTD',
        pitch: 5,
        sku: 'SKU-0',
        variantId: 80,
        url: 'https://shop.swyftrobotics.com/products/htd-5mm-pulleys?variant=80',
        bore: '1/2" Hex',
        vendor: 'Swyft',
      },
    ]);
  });

  it('parses every tooth count variant', () => {
    const teeth = parseSwyftPulleys([
      pulleyProduct('14 Tooth', '16 Tooth', '36 Tooth'),
    ]).map((p) => p.teeth);
    expect(teeth).toEqual([14, 16, 36]);
  });

  it('skips the pulley bundle', () => {
    expect(parseSwyftPulleys([pulleyProduct('6PCS Pulley Bundle')])).toEqual(
      [],
    );
  });

  it('skips non-pulley products', () => {
    const product = makeProduct({
      id: 9,
      title: 'HTD 5mm Pitch Timing Belts',
      variants: [makeVariant({ id: 90, product_id: 9, title: '14 Tooth' })],
    });
    expect(parseSwyftPulleys([product])).toEqual([]);
  });
});

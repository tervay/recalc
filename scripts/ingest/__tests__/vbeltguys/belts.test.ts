import { parseVBeltGuysBelts } from 'scripts/ingest/parsing/vbeltguys/belts';
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

function makeProduct(handle: string, id = 1): ShopifyProduct {
  return {
    title: handle,
    handle,
    vendor: 'VBeltGuys',
    product_type: '',
    tags: [],
    images: [],
    options: [],
    variants: [makeVariant({ id: id * 10, product_id: id })],
  } as unknown as ShopifyProduct;
}

describe('parseVBeltGuysBelts', () => {
  it('maps a 3mm GT2 belt handle to the exact JSONBelt', () => {
    const result = parseVBeltGuysBelts([
      makeProduct('120-3m-09-synchronous-timing-belt'),
    ]);
    expect(result).toEqual([
      {
        teeth: 40,
        width: 9,
        profile: 'GT2',
        pitch: 3,
        sku: '120-3m-09',
        url: 'https://www.vbeltguys.com/products/120-3m-09-synchronous-timing-belt',
        vendor: 'VBeltGuys',
      },
    ]);
  });

  it('maps a 5mm belt to the HTD profile', () => {
    const [belt] = parseVBeltGuysBelts([
      makeProduct('125-5m-15-synchronous-timing-belt'),
    ]);
    expect(belt.profile).toBe('HTD');
    expect(belt.pitch).toBe(5);
    expect(belt.teeth).toBe(25);
    expect(belt.width).toBe(15);
    expect(belt.sku).toBe('125-5m-15');
  });

  it('skips handles that do not match the belt pattern', () => {
    expect(
      parseVBeltGuysBelts([
        makeProduct('some-random-pulley'),
        makeProduct('120-3m-09-synchronous-timing-belt'),
      ]),
    ).toHaveLength(1);
  });

  it('skips handles whose length is not an integer multiple of the pitch', () => {
    // 121 / 3 is not an integer -> not a real tooth count
    expect(
      parseVBeltGuysBelts([makeProduct('121-3m-09-synchronous-timing-belt')]),
    ).toHaveLength(0);
  });
});

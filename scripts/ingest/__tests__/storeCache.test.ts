import { mkdir, readFile, rm } from 'fs/promises';
import { join } from 'path';

import { mergeStoreCacheEntries } from 'scripts/ingest/storeCache/merge';
import { readStoreCache } from 'scripts/ingest/storeCache/read';
import type { StoreCacheEntry } from 'scripts/ingest/storeCache/types';
import { writeStoreCache } from 'scripts/ingest/storeCache/write';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

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
    vendor: 'WCP',
    product_type: '',
    tags: [],
    images: [],
    options: [],
    variants: [
      makeVariant({ id: overrides.id * 10, product_id: overrides.id }),
    ],
    ...overrides,
  } as unknown as ShopifyProduct;
}

describe('mergeStoreCacheEntries', () => {
  it('should create new entries from products', () => {
    const products = [makeProduct({ id: 1 })];
    const { merged, newEntries } = mergeStoreCacheEntries([], products, 'WCP');
    expect(merged).toHaveLength(1);
    expect(newEntries).toHaveLength(1);
    expect(merged[0].product.id).toBe(1);
    expect(merged[0].vendor).toBe('WCP');
  });

  it('should preserve firstSeen for existing entries', () => {
    const firstSeen = '2024-01-01T00:00:00.000Z';
    const existing: StoreCacheEntry[] = [
      {
        vendor: 'WCP',
        product: { title: 'Old', id: 1, handle: 'test-product' },
        variant: { id: 10, title: 'Default Title', sku: null, options: [] },
        firstSeen,
      },
    ];

    const products = [makeProduct({ id: 1 })];
    const { merged, newEntries } = mergeStoreCacheEntries(
      existing,
      products,
      'WCP',
    );

    expect(merged).toHaveLength(1);
    expect(newEntries).toHaveLength(0);
    expect(merged[0].firstSeen).toBe(firstSeen);
  });

  it('should detect new entries not in existing cache', () => {
    const existing: StoreCacheEntry[] = [
      {
        vendor: 'WCP',
        product: { title: 'Old', id: 1, handle: 'old-product' },
        variant: { id: 10, title: 'Default Title', sku: null, options: [] },
        firstSeen: '2024-01-01T00:00:00.000Z',
      },
    ];

    const products = [
      makeProduct({ id: 1 }),
      makeProduct({ id: 2, handle: 'new-product' }),
    ];
    const { merged, newEntries } = mergeStoreCacheEntries(
      existing,
      products,
      'WCP',
    );

    expect(merged).toHaveLength(2);
    expect(newEntries).toHaveLength(1);
    expect(newEntries[0].product.id).toBe(2);
  });

  it('should extract variant options correctly', () => {
    const product = makeProduct({ id: 1 });
    product.variants[0].option1 = 'Red';
    product.variants[0].option2 = 'Large';
    product.variants[0].option3 = null;

    const { merged } = mergeStoreCacheEntries([], [product], 'WCP');
    expect(merged[0].variant.options).toEqual(['Red', 'Large', null]);
  });

  it('should handle multi-variant products', () => {
    const product = makeProduct({ id: 1 });
    product.variants = [
      makeVariant({ id: 10, product_id: 1, option1: 'Red' }),
      makeVariant({ id: 11, product_id: 1, option1: 'Blue' }),
    ];

    const { merged } = mergeStoreCacheEntries([], [product], 'WCP');
    expect(merged).toHaveLength(2);
    expect(merged[0].variant.id).toBe(10);
    expect(merged[1].variant.id).toBe(11);
  });
});

// Use a vendor name that can never exist as a real cache file
const TEST_VENDOR = '__TEST__' as import('scripts/ingest/vendors').VendorName;

describe('writeStoreCache / readStoreCache', () => {
  const testVendorsDir = join(process.cwd(), 'vendors');

  beforeEach(async () => {
    await mkdir(testVendorsDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await rm(join(testVendorsDir, `${TEST_VENDOR}.yaml`));
    } catch {
      // file may not exist
    }
  });

  it('should write and read YAML roundtrip', async () => {
    const entries: StoreCacheEntry[] = [
      {
        vendor: TEST_VENDOR,
        product: { title: 'Product A', id: 100, handle: 'product-a' },
        variant: { id: 1000, title: 'Default', sku: 'SKU-A', options: [] },
        firstSeen: '2024-01-01T00:00:00.000Z',
      },
      {
        vendor: TEST_VENDOR,
        product: { title: 'Product B', id: 200, handle: 'product-b' },
        variant: { id: 2000, title: 'Default', sku: 'SKU-B', options: [] },
        firstSeen: '2024-01-02T00:00:00.000Z',
      },
    ];

    await writeStoreCache(TEST_VENDOR, entries);
    const read = await readStoreCache(TEST_VENDOR);

    expect(read).toHaveLength(2);
    expect(read[0].product.id).toBe(100);
    expect(read[1].product.id).toBe(200);
  });

  it('should sort entries by product.id then variant.id', async () => {
    const entries: StoreCacheEntry[] = [
      {
        vendor: TEST_VENDOR,
        product: { title: 'B', id: 200, handle: 'b' },
        variant: { id: 2000, title: 'Default', sku: null, options: [] },
        firstSeen: '2024-01-01T00:00:00.000Z',
      },
      {
        vendor: TEST_VENDOR,
        product: { title: 'A', id: 100, handle: 'a' },
        variant: { id: 1001, title: 'Var 2', sku: null, options: [] },
        firstSeen: '2024-01-01T00:00:00.000Z',
      },
      {
        vendor: TEST_VENDOR,
        product: { title: 'A', id: 100, handle: 'a' },
        variant: { id: 1000, title: 'Var 1', sku: null, options: [] },
        firstSeen: '2024-01-01T00:00:00.000Z',
      },
    ];

    await writeStoreCache(TEST_VENDOR, entries);
    const content = await readFile(
      join(testVendorsDir, `${TEST_VENDOR}.yaml`),
      'utf-8',
    );
    const { parse } = await import('yaml');
    const [first, second, third] = parse(content) as StoreCacheEntry[];

    expect(first.product.id).toBe(100);
    expect(first.variant.id).toBe(1000);
    expect(second.product.id).toBe(100);
    expect(second.variant.id).toBe(1001);
    expect(third.product.id).toBe(200);
  });
});

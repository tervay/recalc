import { compareAndMerge } from 'scripts/downloadProducts/cache';
import type { CacheEntry, VendorCache } from 'scripts/downloadProducts/types';
import { getCacheKey, parseCacheKey } from 'scripts/downloadProducts/types';
import { describe, expect, it } from 'vitest';

describe('Cache Management', () => {
  describe('getCacheKey', () => {
    it('should generate cache key from product and variant IDs', () => {
      expect(getCacheKey(12345, 67890)).toBe('12345_67890');
      expect(getCacheKey(1, 1)).toBe('1_1');
      expect(getCacheKey(999999, 888888)).toBe('999999_888888');
    });
  });

  describe('parseCacheKey', () => {
    it('should parse cache key back to IDs', () => {
      expect(parseCacheKey('12345_67890')).toEqual({
        productId: 12345,
        variantId: 67890,
      });
      expect(parseCacheKey('1_1')).toEqual({ productId: 1, variantId: 1 });
    });
  });

  describe('compareAndMerge', () => {
    const createMockEntry = (
      productId: number,
      variantId: number,
      sku: string,
    ): CacheEntry => ({
      productId,
      variantId,
      rawProduct: {
        id: productId,
        title: `Test Product ${productId}`,
        handle: 'test-product',
        body_html: '',
        published_at: '',
        created_at: '',
        updated_at: '',
        vendor: 'TestVendor',
        product_type: 'Test',
        tags: [],
        variants: [
          {
            id: variantId,
            title: 'Test Variant',
            option1: 'Test',
            option2: null,
            option3: null,
            sku,
            requires_shipping: true,
            taxable: false,
            featured_image: null,
            available: true,
            price: '0',
            grams: 0,
            compare_at_price: null,
            position: 1,
            product_id: productId,
            created_at: '',
            updated_at: '',
          },
        ],
        images: [],
        options: [],
      },
      parsedData: {
        teeth: 24,
        width: 15,
        profile: 'HTD',
        pitch: 5,
        sku,
        url: 'https://example.com',
        bore: '1/2" Hex',
        vendor: 'TestVendor',
      },
      firstSeen: '2024-01-01T00:00:00.000Z',
      lastSeen: '2024-01-01T00:00:00.000Z',
    });

    it('should create new cache when oldCache is null', () => {
      const newEntries = [
        createMockEntry(1, 1, 'SKU-001'),
        createMockEntry(2, 2, 'SKU-002'),
      ];

      const { merged, newProducts } = compareAndMerge(null, newEntries);

      expect(Object.keys(merged).length).toBe(2);
      expect(newProducts.length).toBe(2);
      expect(merged['1_1']).toBeDefined();
      expect(merged['2_2']).toBeDefined();
    });

    it('should detect new products when comparing with old cache', () => {
      const oldCache: VendorCache = {
        '1_1': createMockEntry(1, 1, 'SKU-001'),
      };

      const newEntries = [
        createMockEntry(1, 1, 'SKU-001'), // Existing
        createMockEntry(2, 2, 'SKU-002'), // New
        createMockEntry(3, 3, 'SKU-003'), // New
      ];

      const { merged, newProducts } = compareAndMerge(oldCache, newEntries);

      expect(Object.keys(merged).length).toBe(3);
      expect(newProducts.length).toBe(2);
      expect(newProducts.some((p) => p.productId === 2)).toBe(true);
      expect(newProducts.some((p) => p.productId === 3)).toBe(true);
    });

    it('should preserve firstSeen for existing entries', () => {
      const originalFirstSeen = '2023-01-01T00:00:00.000Z';
      const oldCache: VendorCache = {
        '1_1': {
          ...createMockEntry(1, 1, 'SKU-001'),
          firstSeen: originalFirstSeen,
          lastSeen: '2023-06-01T00:00:00.000Z',
        },
      };

      const newEntries = [createMockEntry(1, 1, 'SKU-001')];

      const { merged } = compareAndMerge(oldCache, newEntries);

      expect(merged['1_1'].firstSeen).toBe(originalFirstSeen);
    });

    it('should update lastSeen for existing entries', () => {
      const oldLastSeen = '2023-01-01T00:00:00.000Z';
      const oldCache: VendorCache = {
        '1_1': {
          ...createMockEntry(1, 1, 'SKU-001'),
          lastSeen: oldLastSeen,
        },
      };

      const newEntries = [createMockEntry(1, 1, 'SKU-001')];

      const { merged } = compareAndMerge(oldCache, newEntries);

      // lastSeen should be updated to current time (not the old value)
      expect(merged['1_1'].lastSeen).not.toBe(oldLastSeen);
    });

    it('should handle empty new entries', () => {
      const oldCache: VendorCache = {
        '1_1': createMockEntry(1, 1, 'SKU-001'),
      };

      const { merged, newProducts } = compareAndMerge(oldCache, []);

      expect(Object.keys(merged).length).toBe(1);
      expect(newProducts.length).toBe(0);
    });

    it('should handle multiple variants of same product', () => {
      const newEntries = [
        createMockEntry(1, 1, 'SKU-001-V1'),
        createMockEntry(1, 2, 'SKU-001-V2'),
        createMockEntry(1, 3, 'SKU-001-V3'),
      ];

      const { merged, newProducts } = compareAndMerge(null, newEntries);

      expect(Object.keys(merged).length).toBe(3);
      expect(newProducts.length).toBe(3);
      expect(merged['1_1']).toBeDefined();
      expect(merged['1_2']).toBeDefined();
      expect(merged['1_3']).toBeDefined();
    });
  });
});

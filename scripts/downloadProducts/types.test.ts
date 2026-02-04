import { getCacheKey, parseCacheKey } from 'scripts/downloadProducts/types';
import { describe, expect, it } from 'vitest';

describe('Types', () => {
  describe('getCacheKey', () => {
    it('should generate unique keys for different product/variant combinations', () => {
      const key1 = getCacheKey(100, 200);
      const key2 = getCacheKey(100, 201);
      const key3 = getCacheKey(101, 200);

      expect(key1).not.toBe(key2);
      expect(key1).not.toBe(key3);
      expect(key2).not.toBe(key3);
    });

    it('should generate same key for same product/variant combination', () => {
      const key1 = getCacheKey(123, 456);
      const key2 = getCacheKey(123, 456);

      expect(key1).toBe(key2);
    });

    it('should handle large IDs', () => {
      const key = getCacheKey(9999999999, 8888888888);
      expect(key).toBe('9999999999_8888888888');
    });

    it('should handle synthetic negative IDs', () => {
      const key = getCacheKey(-1000, -1000);
      expect(key).toBe('-1000_-1000');
    });
  });

  describe('parseCacheKey', () => {
    it('should correctly parse cache key to IDs', () => {
      const result = parseCacheKey('123_456');

      expect(result.productId).toBe(123);
      expect(result.variantId).toBe(456);
    });

    it('should handle large IDs', () => {
      const result = parseCacheKey('9999999999_8888888888');

      expect(result.productId).toBe(9999999999);
      expect(result.variantId).toBe(8888888888);
    });

    it('should handle negative IDs', () => {
      const result = parseCacheKey('-1000_-2000');

      expect(result.productId).toBe(-1000);
      expect(result.variantId).toBe(-2000);
    });

    it('should round-trip with getCacheKey', () => {
      const originalProductId = 12345;
      const originalVariantId = 67890;

      const key = getCacheKey(originalProductId, originalVariantId);
      const parsed = parseCacheKey(key);

      expect(parsed.productId).toBe(originalProductId);
      expect(parsed.variantId).toBe(originalVariantId);
    });
  });
});

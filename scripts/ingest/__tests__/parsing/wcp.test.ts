import { parseWCPBelts } from 'scripts/ingest/parsing/wcp/belts';
import { parseWCPGears } from 'scripts/ingest/parsing/wcp/gears';
import { parseWCPPulleys } from 'scripts/ingest/parsing/wcp/pulleys';
import { parseWCPSprockets } from 'scripts/ingest/parsing/wcp/sprockets';
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
    sku: 'SKU-001',
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
  const id = overrides.id;
  return {
    title: 'Test Product',
    handle: 'test-product',
    vendor: 'WCP',
    product_type: '',
    tags: [],
    images: [],
    options: [],
    variants: [makeVariant({ id: id * 10, product_id: id })],
    ...overrides,
  } as unknown as ShopifyProduct;
}

describe('WCP Parsers', () => {
  describe('parseWCPPulleys', () => {
    it('should parse valid HTD pulley', () => {
      const product = makeProduct({
        id: 1,
        title:
          'WCP-0432 20t x 9mm Wide Flanged HTD 5mm Pulley (HTD 5mm, 1/2" Hex Bore)',
        handle: 'wcp-0432-20t-9mm-htd-pulley',
      });

      const result = parseWCPPulleys([product]);
      expect(result).toHaveLength(1);
      expect(result[0].teeth).toBe(20);
      expect(result[0].width).toBe(9);
      expect(result[0].profile).toBe('HTD');
      expect(result[0].pitch).toBe(5);
      expect(result[0].bore).toBe('1/2" Hex');
      expect(result[0].vendor).toBe('WCP');
    });

    it('should parse GT2 pulley', () => {
      const product = makeProduct({
        id: 2,
        title: 'WCP-0100 16t x 9mm Wide GT2 3mm Pulley (GT2 3mm, 8mm Bore)',
        handle: 'wcp-0100-16t-9mm-gt2-pulley',
      });

      const result = parseWCPPulleys([product]);
      expect(result).toHaveLength(1);
      expect(result[0].profile).toBe('GT2');
      expect(result[0].pitch).toBe(3);
    });

    it('should skip products without bore', () => {
      const product = makeProduct({
        id: 3,
        title: 'WCP-0050 20t x 9mm Wide Flanged HTD 5mm Pulley',
        handle: 'wcp-0050-20t-9mm-htd-pulley',
      });

      const result = parseWCPPulleys([product]);
      expect(result).toHaveLength(0);
    });

    it('should skip non-pulley products', () => {
      const product = makeProduct({
        id: 4,
        title: 'WCP-0001 Timing Belt',
        handle: 'wcp-0001-belt',
      });

      const result = parseWCPPulleys([product]);
      expect(result).toHaveLength(0);
    });

    it('should handle multiple products', () => {
      const products = [
        makeProduct({
          id: 1,
          title:
            'WCP-0432 20t x 9mm Wide Flanged HTD 5mm Pulley (HTD 5mm, 1/2" Hex Bore)',
          handle: 'wcp-0432',
        }),
        makeProduct({
          id: 2,
          title:
            'WCP-0433 24t x 9mm Wide Flanged HTD 5mm Pulley (HTD 5mm, 8mm Bore)',
          handle: 'wcp-0433',
        }),
      ];

      const result = parseWCPPulleys(products);
      expect(result).toHaveLength(2);
    });

    it('should map 8mm SplineXS bore to SplineXS', () => {
      const product = makeProduct({
        id: 5,
        title:
          'WCP-0100 20t x 9mm Wide Flanged HTD 5mm Pulley (HTD 5mm, 8mm SplineXS Bore)',
        handle: 'wcp-0100-splinexs',
      });

      const result = parseWCPPulleys([product]);
      expect(result).toHaveLength(1);
      expect(result[0].bore).toBe('SplineXS');
    });
  });

  describe('parseWCPBelts', () => {
    it('should parse valid HTD belt', () => {
      const product = makeProduct({
        id: 10,
        title: 'WCP-0001 100t x 15mm Timing Belt (HTD 5mm)',
        handle: 'wcp-0001-100t-15mm-belt',
      });

      const result = parseWCPBelts([product]);
      expect(result).toHaveLength(1);
      expect(result[0].teeth).toBe(100);
      expect(result[0].width).toBe(15);
      expect(result[0].profile).toBe('HTD');
      expect(result[0].pitch).toBe(5);
      expect(result[0].vendor).toBe('WCP');
    });

    it('should skip non-belt products', () => {
      const product = makeProduct({
        id: 11,
        title: 'WCP-0432 20t Pulley',
        handle: 'wcp-0432',
      });

      const result = parseWCPBelts([product]);
      expect(result).toHaveLength(0);
    });
  });

  describe('parseWCPSprockets', () => {
    it('should parse valid #25 sprocket', () => {
      const product = makeProduct({
        id: 20,
        title: 'WCP-0200 16t Sprocket (#25 Chain, 1/2" Hex Bore)',
        handle: 'wcp-0200-16t-sprocket',
      });

      const result = parseWCPSprockets([product]);
      expect(result).toHaveLength(1);
      expect(result[0].teeth).toBe(16);
      expect(result[0].chainType).toBe('#25');
      expect(result[0].bore).toBe('1/2" Hex');
      expect(result[0].vendor).toBe('WCP');
    });

    it('should parse valid #35 sprocket', () => {
      const product = makeProduct({
        id: 21,
        title: 'WCP-0201 20t Sprocket (#35 Chain, 8mm Key Bore)',
        handle: 'wcp-0201-20t-35-sprocket',
      });

      const result = parseWCPSprockets([product]);
      expect(result).toHaveLength(1);
      expect(result[0].chainType).toBe('#35');
      expect(result[0].bore).toBe('8mm');
    });
  });

  describe('parseWCPGears', () => {
    it('should parse valid gear', () => {
      const product = makeProduct({
        id: 30,
        title: 'WCP-0300 20t Gear (20 DP, 1/2" Hex Bore)',
        handle: 'wcp-0300-20t-gear',
      });

      const result = parseWCPGears([product]);
      expect(result).toHaveLength(1);
      expect(result[0].teeth).toBe(20);
      expect(result[0].dp).toBe(20);
      expect(result[0].bore).toBe('1/2" Hex');
      expect(result[0].vendor).toBe('WCP');
    });

    it('should map BAG Bore to BAG', () => {
      const product = makeProduct({
        id: 31,
        title: 'WCP-0301 20t Gear (20 DP, BAG Bore)',
        handle: 'wcp-0301-20t-gear-bag',
      });

      const result = parseWCPGears([product]);
      expect(result).toHaveLength(1);
      expect(result[0].bore).toBe('BAG');
    });
  });
});

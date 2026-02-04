import { parseWCPPulleys } from 'scripts/downloadProducts/parsers/pulleys';
import { describe, expect, it } from 'vitest';

import type { JSONPulley } from '~/lib/types/pulleys';
import type { ShopifyProduct } from '~/lib/types/shopify';

describe('Pulley Parser', () => {
  describe('parseWCPPulleys', () => {
    it('should parse valid WCP pulley product', () => {
      const mockProduct: ShopifyProduct = {
        id: 12345,
        title: '24t x 15mm Wide HTD 5mm Pulley, 1/2" Hex Bore)',
        handle: 'wcp-pulley-24t',
        body_html: '',
        published_at: '',
        created_at: '',
        updated_at: '',
        vendor: 'WCP',
        product_type: 'Pulley',
        tags: [],
        variants: [
          {
            id: 67890,
            title: 'Default',
            option1: 'Default',
            option2: null,
            option3: null,
            sku: 'WCP-1234',
            requires_shipping: true,
            taxable: false,
            featured_image: null,
            available: true,
            price: '10.00',
            grams: 100,
            compare_at_price: null,
            position: 1,
            product_id: 12345,
            created_at: '',
            updated_at: '',
          },
        ],
        images: [],
        options: [],
      };

      const results = parseWCPPulleys([mockProduct]);

      expect(results).toHaveLength(1);
      expect(results[0].productId).toBe(12345);
      expect(results[0].variantId).toBe(67890);
      expect(results[0].parsedData).toMatchObject({
        teeth: 24,
        width: 15,
        profile: 'HTD',
        pitch: 5,
        bore: '1/2" Hex',
        vendor: 'WCP',
      });
    });

    it('should skip products without bore information', () => {
      const mockProduct: ShopifyProduct = {
        id: 12345,
        title: '24t x 15mm Wide HTD 5mm Pulley',
        handle: 'wcp-pulley-24t',
        body_html: '',
        published_at: '',
        created_at: '',
        updated_at: '',
        vendor: 'WCP',
        product_type: 'Pulley',
        tags: [],
        variants: [
          {
            id: 67890,
            title: 'Default',
            option1: 'Default',
            option2: null,
            option3: null,
            sku: 'WCP-1234',
            requires_shipping: true,
            taxable: false,
            featured_image: null,
            available: true,
            price: '10.00',
            grams: 100,
            compare_at_price: null,
            position: 1,
            product_id: 12345,
            created_at: '',
            updated_at: '',
          },
        ],
        images: [],
        options: [],
      };

      const results = parseWCPPulleys([mockProduct]);

      expect(results).toHaveLength(0);
    });

    it('should only parse products with "Pulley" in title', () => {
      const mockBelt: ShopifyProduct = {
        id: 12345,
        title: '24t x 15mm Timing Belt HTD 5mm',
        handle: 'wcp-belt-24t',
        body_html: '',
        published_at: '',
        created_at: '',
        updated_at: '',
        vendor: 'WCP',
        product_type: 'Belt',
        tags: [],
        variants: [
          {
            id: 67890,
            title: 'Default',
            option1: 'Default',
            option2: null,
            option3: null,
            sku: 'WCP-1234',
            requires_shipping: true,
            taxable: false,
            featured_image: null,
            available: true,
            price: '10.00',
            grams: 100,
            compare_at_price: null,
            position: 1,
            product_id: 12345,
            created_at: '',
            updated_at: '',
          },
        ],
        images: [],
        options: [],
      };

      const results = parseWCPPulleys([mockBelt]);

      expect(results).toHaveLength(0);
    });

    it('should parse GT2 pulleys', () => {
      const mockProduct: ShopifyProduct = {
        id: 12345,
        title: '16t x 15mm Wide GT2 3mm Pulley, 8mm Bore)',
        handle: 'wcp-gt2-pulley',
        body_html: '',
        published_at: '',
        created_at: '',
        updated_at: '',
        vendor: 'WCP',
        product_type: 'Pulley',
        tags: [],
        variants: [
          {
            id: 67890,
            title: 'Default',
            option1: 'Default',
            option2: null,
            option3: null,
            sku: 'WCP-0393',
            requires_shipping: true,
            taxable: false,
            featured_image: null,
            available: true,
            price: '10.00',
            grams: 100,
            compare_at_price: null,
            position: 1,
            product_id: 12345,
            created_at: '',
            updated_at: '',
          },
        ],
        images: [],
        options: [],
      };

      const results = parseWCPPulleys([mockProduct]);

      expect(results).toHaveLength(1);
      expect(results[0].parsedData).toMatchObject({
        teeth: 16,
        width: 15,
        profile: 'GT2',
        pitch: 3,
        bore: '8mm',
        vendor: 'WCP',
      });
    });

    it('should handle multiple products', () => {
      const mockProducts: ShopifyProduct[] = [
        {
          id: 1,
          title: '20t x 9mm Wide HTD 5mm Pulley, 1/2" Hex Bore)',
          handle: 'pulley-1',
          body_html: '',
          published_at: '',
          created_at: '',
          updated_at: '',
          vendor: 'WCP',
          product_type: 'Pulley',
          tags: [],
          variants: [
            {
              id: 10,
              title: 'Default',
              option1: 'Default',
              option2: null,
              option3: null,
              sku: 'WCP-001',
              requires_shipping: true,
              taxable: false,
              featured_image: null,
              available: true,
              price: '10.00',
              grams: 100,
              compare_at_price: null,
              position: 1,
              product_id: 1,
              created_at: '',
              updated_at: '',
            },
          ],
          images: [],
          options: [],
        },
        {
          id: 2,
          title: '24t x 15mm Wide HTD 5mm Pulley, 8mm Bore)',
          handle: 'pulley-2',
          body_html: '',
          published_at: '',
          created_at: '',
          updated_at: '',
          vendor: 'WCP',
          product_type: 'Pulley',
          tags: [],
          variants: [
            {
              id: 20,
              title: 'Default',
              option1: 'Default',
              option2: null,
              option3: null,
              sku: 'WCP-002',
              requires_shipping: true,
              taxable: false,
              featured_image: null,
              available: true,
              price: '12.00',
              grams: 120,
              compare_at_price: null,
              position: 1,
              product_id: 2,
              created_at: '',
              updated_at: '',
            },
          ],
          images: [],
          options: [],
        },
      ];

      const results = parseWCPPulleys(mockProducts);

      expect(results).toHaveLength(2);
      expect((results[0].parsedData as JSONPulley).teeth).toBe(20);
      expect((results[1].parsedData as JSONPulley).teeth).toBe(24);
    });
  });
});

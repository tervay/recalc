import { parseThriftyPulleys } from 'scripts/ingest/parsing/thrifty/pulleys';
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
    vendor: 'Thrifty',
    product_type: '',
    tags: [],
    images: [],
    options: [],
    variants: [makeVariant({ id: id * 10, product_id: id })],
    ...overrides,
  } as unknown as ShopifyProduct;
}

function makeHexPulleyProduct(variantTitles: string[]): ShopifyProduct {
  return makeProduct({
    id: 1,
    title: '1/2" Hex Bore Aluminum HTD Pulleys',
    handle: '1-2-hex-pulleys',
    variants: variantTitles.map((title, i) =>
      makeVariant({
        id: 100 + i,
        product_id: 1,
        title,
        sku: `TTB-${String(i).padStart(4, '0')}`,
      }),
    ),
  });
}

function makeSplinePulleyProduct(variantTitles: string[]): ShopifyProduct {
  return makeProduct({
    id: 2,
    title: 'Kraken Spline Bore Aluminum HTD Pulleys',
    handle: 'kraken-spline-pulleys',
    variants: variantTitles.map((title, i) =>
      makeVariant({
        id: 200 + i,
        product_id: 2,
        title,
        sku: `TTB-${String(200 + i)}`,
      }),
    ),
  });
}

describe('Thrifty Parsers', () => {
  describe('parseThriftyPulleys', () => {
    it('should read a 9.5mm width from the variant title', () => {
      const result = parseThriftyPulleys([
        makeHexPulleyProduct(['9.5mm Wide 24 Tooth 1/2" Hex']),
      ]);

      expect(result).toHaveLength(1);
      expect(result[0].width).toBe(9.5);
    });

    it('should read an 18.5mm width from the variant title', () => {
      const result = parseThriftyPulleys([
        makeHexPulleyProduct(['18.5mm Wide 24 Tooth 1/2" Hex']),
      ]);

      expect(result).toHaveLength(1);
      expect(result[0].width).toBe(18.5);
    });

    it('should not conflate 9.5mm and 18.5mm variants of the same tooth count', () => {
      const result = parseThriftyPulleys([
        makeHexPulleyProduct([
          '9.5mm Wide 36 Tooth 1/2" Hex',
          '18.5mm Wide 36 Tooth 1/2" Hex',
        ]),
      ]);

      expect(result.map((p) => p.width)).toEqual([9.5, 18.5]);
    });

    it('should parse a variant with a parenthetical before the bore', () => {
      const result = parseThriftyPulleys([
        makeHexPulleyProduct(['18.5mm Wide 36 Tooth (Lightened) 1/2" Hex']),
      ]);

      expect(result).toHaveLength(1);
    });

    it('should extract teeth from a variant with a parenthetical before the bore', () => {
      const result = parseThriftyPulleys([
        makeHexPulleyProduct(['18.5mm Wide 36 Tooth (Lightened) 1/2" Hex']),
      ]);

      expect(result[0].teeth).toBe(36);
    });

    it('should extract width from a variant with a parenthetical before the bore', () => {
      const result = parseThriftyPulleys([
        makeHexPulleyProduct(['18.5mm Wide 36 Tooth (Lightened) 1/2" Hex']),
      ]);

      expect(result[0].width).toBe(18.5);
    });

    it('should extract bore from a variant with a parenthetical before the bore', () => {
      const result = parseThriftyPulleys([
        makeHexPulleyProduct(['18.5mm Wide 36 Tooth (Lightened) 1/2" Hex']),
      ]);

      expect(result[0].bore).toBe('1/2" Hex');
    });

    it('should parse a variant with a trailing parenthetical and no bore', () => {
      const result = parseThriftyPulleys([
        makeHexPulleyProduct(['18.5mm Wide 36 Tooth (Lightened)']),
      ]);

      expect(result).toHaveLength(1);
    });

    it('should fall back to the product default bore when the variant omits it', () => {
      const result = parseThriftyPulleys([
        makeHexPulleyProduct(['18.5mm Wide 36 Tooth (Lightened)']),
      ]);

      expect(result[0].bore).toBe('1/2" Hex');
    });

    it('should map a SplineXS variant bore to SplineXS', () => {
      const result = parseThriftyPulleys([
        makeSplinePulleyProduct(['9.5mm Wide 18 Tooth SplineXS']),
      ]);

      expect(result[0].bore).toBe('SplineXS');
    });

    it('should map a spaced "Spline XS" variant bore to SplineXS', () => {
      const result = parseThriftyPulleys([
        makeSplinePulleyProduct(['18.5mm Wide 11 Tooth Spline XS']),
      ]);

      expect(result[0].bore).toBe('SplineXS');
    });

    it('should read the width of a Kraken Spline variant from its title', () => {
      const result = parseThriftyPulleys([
        makeSplinePulleyProduct(['9.5mm Wide 18 Tooth SplineXS']),
      ]);

      expect(result[0].width).toBe(9.5);
    });

    it('should set HTD profile and 5mm pitch on variant pulleys', () => {
      const result = parseThriftyPulleys([
        makeHexPulleyProduct(['9.5mm Wide 15 Tooth 1/2" Hex']),
      ]);

      expect(result[0]).toMatchObject({
        teeth: 15,
        width: 9.5,
        profile: 'HTD',
        pitch: 5,
        bore: '1/2" Hex',
        vendor: 'Thrifty',
        url: 'https://www.thethriftybot.com/products/1-2-hex-pulleys',
      });
    });

    it('should skip a variant whose title does not describe a pulley', () => {
      const result = parseThriftyPulleys([
        makeHexPulleyProduct(['Default Title']),
      ]);

      expect(result).toHaveLength(0);
    });

    it('should parse a bearing/hub bore pulley from the product title', () => {
      const product = makeProduct({
        id: 3,
        title: 'QTY 1 - 48 Tooth HTD Pulley - Bearing / Hub Bore',
        handle: '48-tooth-htd-pulley',
        variants: [makeVariant({ id: 300, product_id: 3, sku: 'TTB-0128' })],
      });

      const result = parseThriftyPulleys([product]);
      expect(result[0]).toMatchObject({
        teeth: 48,
        width: 18.5,
        profile: 'HTD',
        bore: '1.125" Round',
      });
    });

    it('should parse a motor output pulley from the product title', () => {
      const product = makeProduct({
        id: 4,
        title: 'QTY 1 - 11 Tooth HTD Falcon Motor Output Pulley',
        handle: 'falcon-motor-output-pulley',
        variants: [makeVariant({ id: 400, product_id: 4, sku: 'TTB-0061' })],
      });

      const result = parseThriftyPulleys([product]);
      expect(result[0]).toMatchObject({
        teeth: 11,
        width: 18.5,
        bore: 'Falcon',
      });
    });

    it('should skip non-pulley products', () => {
      const product = makeProduct({
        id: 5,
        title: '3" Flywheel Mass Disc Kit',
        handle: '3-flywheel-mass-disc-kit',
      });

      expect(parseThriftyPulleys([product])).toHaveLength(0);
    });
  });
});

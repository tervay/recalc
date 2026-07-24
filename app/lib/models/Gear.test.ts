import { describe, expect, it } from 'vitest';

import Gear from '~/lib/models/Gear';
import Model from '~/lib/models/Model';
import type { JSONGear } from '~/lib/types/gears';

describe('Gear', () => {
  describe('fromJson', () => {
    it('maps every field from valid json', () => {
      const json: JSONGear = {
        teeth: 20,
        dp: 20,
        bore: '1/2" Hex',
        url: 'https://example.com/gear',
        sku: 'AM-0001',
        vendor: 'AndyMark',
      };
      const gear = Gear.fromJson(json);
      expect(gear.teeth).toBe(20);
      expect(gear.dp).toBe(20);
      expect(gear.bore).toBe('1/2" Hex');
      expect(gear.url).toBe('https://example.com/gear');
      expect(gear.sku).toBe('AM-0001');
      expect(gear.vendor).toBe('AndyMark');
    });

    it('handles sku: null', () => {
      const json: JSONGear = {
        teeth: 40,
        dp: 32,
        bore: '8mm',
        url: 'https://example.com/gear2',
        sku: null,
        vendor: 'REV',
      };
      const gear = Gear.fromJson(json);
      expect(gear.sku).toBeNull();
    });

    it('preserves teeth value', () => {
      const json: JSONGear = {
        teeth: 12,
        dp: 20,
        bore: '3/8" Hex',
        url: 'https://example.com',
        sku: null,
        vendor: 'WCP',
      };
      const gear = Gear.fromJson(json);
      expect(gear.teeth).toBe(12);
    });

    it('preserves dp value', () => {
      const json: JSONGear = {
        teeth: 24,
        dp: 32,
        bore: '3/8" Hex',
        url: 'https://example.com',
        sku: null,
        vendor: 'VEX',
      };
      const gear = Gear.fromJson(json);
      expect(gear.dp).toBe(32);
    });

    it('preserves bore value', () => {
      const json: JSONGear = {
        teeth: 20,
        dp: 20,
        bore: 'MAXSpline',
        url: 'https://example.com',
        sku: null,
        vendor: 'REV',
      };
      const gear = Gear.fromJson(json);
      expect(gear.bore).toBe('MAXSpline');
    });

    it('preserves url value', () => {
      const json: JSONGear = {
        teeth: 20,
        dp: 20,
        bore: '8mm',
        url: 'https://store.andymark.com/products/gear',
        sku: null,
        vendor: 'AndyMark',
      };
      const gear = Gear.fromJson(json);
      expect(gear.url).toBe('https://store.andymark.com/products/gear');
    });

    it('preserves vendor value', () => {
      const json: JSONGear = {
        teeth: 20,
        dp: 20,
        bore: '8mm',
        url: 'https://example.com',
        sku: null,
        vendor: 'SDS',
      };
      const gear = Gear.fromJson(json);
      expect(gear.vendor).toBe('SDS');
    });
  });

  describe('toDict', () => {
    it('returns teeth, dp, and bore', () => {
      const gear = new Gear(
        20,
        20,
        '1/2" Hex',
        'https://example.com',
        'AM-0001',
        'AndyMark',
      );
      const dict = gear.toDict();
      expect(dict.teeth).toBe(20);
      expect(dict.dp).toBe(20);
      expect(dict.bore).toBe('1/2" Hex');
    });

    it('does not include url in toDict', () => {
      const gear = new Gear(20, 20, '8mm', 'https://example.com', null, 'REV');
      const dict = gear.toDict();
      expect('url' in dict).toBe(false);
    });

    it('does not include sku in toDict', () => {
      const gear = new Gear(
        20,
        20,
        '8mm',
        'https://example.com',
        'SKU-1',
        'REV',
      );
      const dict = gear.toDict();
      expect('sku' in dict).toBe(false);
    });

    it('does not include vendor in toDict', () => {
      const gear = new Gear(20, 20, '8mm', 'https://example.com', null, 'REV');
      const dict = gear.toDict();
      expect('vendor' in dict).toBe(false);
    });

    it('returns exactly three keys', () => {
      const gear = new Gear(20, 20, '8mm', 'https://example.com', null, 'REV');
      const dict = gear.toDict();
      expect(Object.keys(dict)).toHaveLength(3);
    });
  });

  describe('eq', () => {
    const base = new Gear(
      20,
      20,
      '1/2" Hex',
      'https://example.com',
      'AM-0001',
      'AndyMark',
    );

    it('returns true for identical gears', () => {
      const other = new Gear(
        20,
        20,
        '1/2" Hex',
        'https://example.com',
        'AM-0001',
        'AndyMark',
      );
      expect(base.eq(other)).toBe(true);
    });

    it('returns false when teeth differ', () => {
      const other = new Gear(
        40,
        20,
        '1/2" Hex',
        'https://example.com',
        'AM-0001',
        'AndyMark',
      );
      expect(base.eq(other)).toBe(false);
    });

    it('returns false when dp differs', () => {
      const other = new Gear(
        20,
        32,
        '1/2" Hex',
        'https://example.com',
        'AM-0001',
        'AndyMark',
      );
      expect(base.eq(other)).toBe(false);
    });

    it('returns false when bore differs', () => {
      const other = new Gear(
        20,
        20,
        '3/8" Hex',
        'https://example.com',
        'AM-0001',
        'AndyMark',
      );
      expect(base.eq(other)).toBe(false);
    });

    it('returns false when url differs', () => {
      const other = new Gear(
        20,
        20,
        '1/2" Hex',
        'https://other.com',
        'AM-0001',
        'AndyMark',
      );
      expect(base.eq(other)).toBe(false);
    });

    it('returns false when sku differs', () => {
      const other = new Gear(
        20,
        20,
        '1/2" Hex',
        'https://example.com',
        'AM-0002',
        'AndyMark',
      );
      expect(base.eq(other)).toBe(false);
    });

    it('returns false when sku is null vs non-null', () => {
      const withNullSku = new Gear(
        20,
        20,
        '1/2" Hex',
        'https://example.com',
        null,
        'AndyMark',
      );
      expect(base.eq(withNullSku)).toBe(false);
    });

    it('returns false when vendor differs', () => {
      const other = new Gear(
        20,
        20,
        '1/2" Hex',
        'https://example.com',
        'AM-0001',
        'REV',
      );
      expect(base.eq(other)).toBe(false);
    });

    it('returns false when compared against a different Model type', () => {
      const other = {} as Model;
      expect(base.eq(other)).toBe(false);
    });
  });
});

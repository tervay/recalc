import { describe, expect, it } from 'vitest';

import { Belt, SimpleBelt } from '~/lib/models/Belt';
import Measurement from '~/lib/models/Measurement';
import Model from '~/lib/models/Model';
import type { JSONBelt } from '~/lib/types/belts';

describe('SimpleBelt', () => {
  describe('constructor', () => {
    it('handles zero teeth', () => {
      const pitch = new Measurement(5, 'mm');
      const belt = new SimpleBelt(0, pitch);
      expect(belt.teeth).toBe(0);
      expect(belt.length.scalar).toBe(0);
    });

    it('handles negative teeth', () => {
      const pitch = new Measurement(5, 'mm');
      const belt = new SimpleBelt(-5, pitch);
      expect(belt.teeth).toBe(-5);
      expect(belt.length.scalar).toBe(-25);
    });

    it('handles zero pitch', () => {
      const pitch = new Measurement(0, 'mm');
      const belt = new SimpleBelt(100, pitch);
      expect(belt.pitch.scalar).toBe(0);
      expect(belt.length.scalar).toBe(0);
    });

    it('handles negative pitch', () => {
      const pitch = new Measurement(-5, 'mm');
      const belt = new SimpleBelt(100, pitch);
      expect(belt.pitch.scalar).toBe(-5);
      expect(belt.length.scalar).toBe(-500);
    });

    it('handles very large teeth', () => {
      const pitch = new Measurement(5, 'mm');
      const belt = new SimpleBelt(1e6, pitch);
      expect(belt.teeth).toBe(1e6);
      expect(belt.length.scalar).toBe(5e6);
    });

    it('handles very large pitch', () => {
      const pitch = new Measurement(1e6, 'mm');
      const belt = new SimpleBelt(100, pitch);
      expect(belt.pitch.scalar).toBe(1e6);
      expect(belt.length.scalar).toBe(1e8);
    });

    it('handles very small pitch', () => {
      const pitch = new Measurement(0.001, 'mm');
      const belt = new SimpleBelt(1000, pitch);
      expect(belt.pitch.scalar).toBe(0.001);
      expect(belt.length.scalar).toBe(1);
    });

    it('calculates length correctly', () => {
      const pitch = new Measurement(5, 'mm');
      const belt = new SimpleBelt(100, pitch);
      expect(belt.length.scalar).toBe(500);
      expect(belt.length.units()).toBe('mm');
    });
  });

  describe('toDict', () => {
    it('returns correct dict structure', () => {
      const pitch = new Measurement(5, 'mm');
      const belt = new SimpleBelt(100, pitch);
      const dict = belt.toDict();
      expect(dict.teeth).toBe(100);
      expect(dict.pitch).toEqual(pitch.toDict());
    });

    it('handles zero teeth', () => {
      const pitch = new Measurement(5, 'mm');
      const belt = new SimpleBelt(0, pitch);
      const dict = belt.toDict();
      expect(dict.teeth).toBe(0);
    });

    it('handles negative teeth', () => {
      const pitch = new Measurement(5, 'mm');
      const belt = new SimpleBelt(-5, pitch);
      const dict = belt.toDict();
      expect(dict.teeth).toBe(-5);
    });
  });

  describe('eq', () => {
    it('returns true for equal belts', () => {
      const pitch = new Measurement(5, 'mm');
      const belt1 = new SimpleBelt(100, pitch);
      const belt2 = new SimpleBelt(100, pitch);
      expect(belt1.eq(belt2)).toBe(true);
    });

    it('returns false for different teeth', () => {
      const pitch = new Measurement(5, 'mm');
      const belt1 = new SimpleBelt(100, pitch);
      const belt2 = new SimpleBelt(101, pitch);
      expect(belt1.eq(belt2)).toBe(false);
    });

    it('returns false for different pitch', () => {
      const pitch1 = new Measurement(5, 'mm');
      const pitch2 = new Measurement(6, 'mm');
      const belt1 = new SimpleBelt(100, pitch1);
      const belt2 = new SimpleBelt(100, pitch2);
      expect(belt1.eq(belt2)).toBe(false);
    });

    it('returns false for different types', () => {
      const pitch = new Measurement(5, 'mm');
      const belt = new SimpleBelt(100, pitch);
      const other = {} as Model;
      expect(belt.eq(other)).toBe(false);
    });

    it('returns false when comparing SimpleBelt to Belt', () => {
      const pitch = new Measurement(5, 'mm');
      const simpleBelt = new SimpleBelt(100, pitch);
      const belt = new Belt(
        100,
        pitch,
        new Measurement(10, 'mm'),
        'HTD',
        null,
        'https://example.com',
        'Vendor',
      );
      expect(simpleBelt.eq(belt)).toBe(false);
    });
  });
});

describe('Belt', () => {
  describe('constructor', () => {
    it('handles zero teeth', () => {
      const pitch = new Measurement(5, 'mm');
      const width = new Measurement(10, 'mm');
      const belt = new Belt(
        0,
        pitch,
        width,
        'HTD',
        null,
        'https://example.com',
        'Vendor',
      );
      expect(belt.teeth).toBe(0);
      expect(belt.length.scalar).toBe(0);
    });

    it('handles negative teeth', () => {
      const pitch = new Measurement(5, 'mm');
      const width = new Measurement(10, 'mm');
      const belt = new Belt(
        -5,
        pitch,
        width,
        'HTD',
        null,
        'https://example.com',
        'Vendor',
      );
      expect(belt.teeth).toBe(-5);
      expect(belt.length.scalar).toBe(-25);
    });

    it('handles zero pitch', () => {
      const pitch = new Measurement(0, 'mm');
      const width = new Measurement(10, 'mm');
      const belt = new Belt(
        100,
        pitch,
        width,
        'HTD',
        null,
        'https://example.com',
        'Vendor',
      );
      expect(belt.pitch.scalar).toBe(0);
      expect(belt.length.scalar).toBe(0);
    });

    it('handles null sku', () => {
      const pitch = new Measurement(5, 'mm');
      const width = new Measurement(10, 'mm');
      const belt = new Belt(
        100,
        pitch,
        width,
        'HTD',
        null,
        'https://example.com',
        'Vendor',
      );
      expect(belt.sku).toBeNull();
    });

    it('handles non-null sku', () => {
      const pitch = new Measurement(5, 'mm');
      const width = new Measurement(10, 'mm');
      const belt = new Belt(
        100,
        pitch,
        width,
        'HTD',
        'SKU123',
        'https://example.com',
        'Vendor',
      );
      expect(belt.sku).toBe('SKU123');
    });

    it('handles very large teeth', () => {
      const pitch = new Measurement(5, 'mm');
      const width = new Measurement(10, 'mm');
      const belt = new Belt(
        1e6,
        pitch,
        width,
        'HTD',
        null,
        'https://example.com',
        'Vendor',
      );
      expect(belt.teeth).toBe(1e6);
      expect(belt.length.scalar).toBe(5e6);
    });
  });

  describe('fromJson', () => {
    it('creates belt from valid json', () => {
      const json: JSONBelt = {
        teeth: 100,
        pitch: 5,
        width: 10,
        profile: 'HTD',
        sku: 'SKU123',
        url: 'https://example.com',
        vendor: 'Vendor',
      };
      const belt = Belt.fromJson(json);
      expect(belt.teeth).toBe(100);
      expect(belt.pitch.scalar).toBe(5);
      expect(belt.width.scalar).toBe(10);
      expect(belt.profile).toBe('HTD');
      expect(belt.sku).toBe('SKU123');
      expect(belt.url).toBe('https://example.com');
      expect(belt.vendor).toBe('Vendor');
    });

    it('handles null sku', () => {
      const json: JSONBelt = {
        teeth: 100,
        pitch: 5,
        width: 10,
        profile: 'HTD',
        sku: null,
        url: 'https://example.com',
        vendor: 'Vendor',
      };
      const belt = Belt.fromJson(json);
      expect(belt.sku).toBeNull();
    });

    it('handles zero teeth', () => {
      const json: JSONBelt = {
        teeth: 0,
        pitch: 5,
        width: 10,
        profile: 'HTD',
        sku: null,
        url: 'https://example.com',
        vendor: 'Vendor',
      };
      const belt = Belt.fromJson(json);
      expect(belt.teeth).toBe(0);
      expect(belt.length.scalar).toBe(0);
    });

    it('handles negative teeth', () => {
      const json: JSONBelt = {
        teeth: -5,
        pitch: 5,
        width: 10,
        profile: 'HTD',
        sku: null,
        url: 'https://example.com',
        vendor: 'Vendor',
      };
      const belt = Belt.fromJson(json);
      expect(belt.teeth).toBe(-5);
      expect(belt.length.scalar).toBe(-25);
    });

    it('handles minimum pitch value', () => {
      const json: JSONBelt = {
        teeth: 100,
        pitch: 1,
        width: 10,
        profile: 'HTD',
        sku: null,
        url: 'https://example.com',
        vendor: 'Vendor',
      };
      const belt = Belt.fromJson(json);
      expect(belt.pitch.scalar).toBe(1);
    });

    it('handles very large pitch', () => {
      const json: JSONBelt = {
        teeth: 100,
        pitch: 1e6,
        width: 10,
        profile: 'HTD',
        sku: null,
        url: 'https://example.com',
        vendor: 'Vendor',
      };
      const belt = Belt.fromJson(json);
      expect(belt.pitch.scalar).toBe(1e6);
      expect(belt.length.scalar).toBe(1e8);
    });

    it('handles minimum width value', () => {
      const json: JSONBelt = {
        teeth: 100,
        pitch: 5,
        width: 1,
        profile: 'HTD',
        sku: null,
        url: 'https://example.com',
        vendor: 'Vendor',
      };
      const belt = Belt.fromJson(json);
      expect(belt.width.scalar).toBe(1);
    });

    it('handles empty profile string', () => {
      const json: JSONBelt = {
        teeth: 100,
        pitch: 5,
        width: 10,
        profile: '',
        sku: null,
        url: 'https://example.com',
        vendor: 'Vendor',
      };
      const belt = Belt.fromJson(json);
      expect(belt.profile).toBe('');
    });

    it('handles empty vendor string', () => {
      const json: JSONBelt = {
        teeth: 100,
        pitch: 5,
        width: 10,
        profile: 'HTD',
        sku: null,
        url: 'https://example.com',
        vendor: '',
      };
      const belt = Belt.fromJson(json);
      expect(belt.vendor).toBe('');
    });
  });

  describe('toDict', () => {
    it('returns correct dict structure', () => {
      const pitch = new Measurement(5, 'mm');
      const width = new Measurement(10, 'mm');
      const belt = new Belt(
        100,
        pitch,
        width,
        'HTD',
        null,
        'https://example.com',
        'Vendor',
      );
      const dict = belt.toDict();
      expect(dict.teeth).toBe(100);
      expect(dict.pitch).toEqual(pitch.toDict());
    });

    it('handles zero teeth', () => {
      const pitch = new Measurement(5, 'mm');
      const width = new Measurement(10, 'mm');
      const belt = new Belt(
        0,
        pitch,
        width,
        'HTD',
        null,
        'https://example.com',
        'Vendor',
      );
      const dict = belt.toDict();
      expect(dict.teeth).toBe(0);
    });
  });

  describe('eq', () => {
    it('returns true for equal belts', () => {
      const pitch = new Measurement(5, 'mm');
      const width = new Measurement(10, 'mm');
      const belt1 = new Belt(
        100,
        pitch,
        width,
        'HTD',
        null,
        'https://example.com',
        'Vendor',
      );
      const belt2 = new Belt(
        100,
        pitch,
        width,
        'HTD',
        null,
        'https://example.com',
        'Vendor',
      );
      expect(belt1.eq(belt2)).toBe(true);
    });

    it('returns false for different teeth', () => {
      const pitch = new Measurement(5, 'mm');
      const width = new Measurement(10, 'mm');
      const belt1 = new Belt(
        100,
        pitch,
        width,
        'HTD',
        null,
        'https://example.com',
        'Vendor',
      );
      const belt2 = new Belt(
        101,
        pitch,
        width,
        'HTD',
        null,
        'https://example.com',
        'Vendor',
      );
      expect(belt1.eq(belt2)).toBe(false);
    });

    it('returns false for different pitch', () => {
      const pitch1 = new Measurement(5, 'mm');
      const pitch2 = new Measurement(6, 'mm');
      const width = new Measurement(10, 'mm');
      const belt1 = new Belt(
        100,
        pitch1,
        width,
        'HTD',
        null,
        'https://example.com',
        'Vendor',
      );
      const belt2 = new Belt(
        100,
        pitch2,
        width,
        'HTD',
        null,
        'https://example.com',
        'Vendor',
      );
      expect(belt1.eq(belt2)).toBe(false);
    });

    it('returns false for different width', () => {
      const pitch = new Measurement(5, 'mm');
      const width1 = new Measurement(10, 'mm');
      const width2 = new Measurement(11, 'mm');
      const belt1 = new Belt(
        100,
        pitch,
        width1,
        'HTD',
        null,
        'https://example.com',
        'Vendor',
      );
      const belt2 = new Belt(
        100,
        pitch,
        width2,
        'HTD',
        null,
        'https://example.com',
        'Vendor',
      );
      expect(belt1.eq(belt2)).toBe(false);
    });

    it('returns false for different profile', () => {
      const pitch = new Measurement(5, 'mm');
      const width = new Measurement(10, 'mm');
      const belt1 = new Belt(
        100,
        pitch,
        width,
        'HTD',
        null,
        'https://example.com',
        'Vendor',
      );
      const belt2 = new Belt(
        100,
        pitch,
        width,
        'GT2',
        null,
        'https://example.com',
        'Vendor',
      );
      expect(belt1.eq(belt2)).toBe(false);
    });

    it('returns false for different sku', () => {
      const pitch = new Measurement(5, 'mm');
      const width = new Measurement(10, 'mm');
      const belt1 = new Belt(
        100,
        pitch,
        width,
        'HTD',
        'SKU1',
        'https://example.com',
        'Vendor',
      );
      const belt2 = new Belt(
        100,
        pitch,
        width,
        'HTD',
        'SKU2',
        'https://example.com',
        'Vendor',
      );
      expect(belt1.eq(belt2)).toBe(false);
    });

    it('returns false when one sku is null and other is not', () => {
      const pitch = new Measurement(5, 'mm');
      const width = new Measurement(10, 'mm');
      const belt1 = new Belt(
        100,
        pitch,
        width,
        'HTD',
        null,
        'https://example.com',
        'Vendor',
      );
      const belt2 = new Belt(
        100,
        pitch,
        width,
        'HTD',
        'SKU1',
        'https://example.com',
        'Vendor',
      );
      expect(belt1.eq(belt2)).toBe(false);
    });

    it('returns false for different url', () => {
      const pitch = new Measurement(5, 'mm');
      const width = new Measurement(10, 'mm');
      const belt1 = new Belt(
        100,
        pitch,
        width,
        'HTD',
        null,
        'https://example.com',
        'Vendor',
      );
      const belt2 = new Belt(
        100,
        pitch,
        width,
        'HTD',
        null,
        'https://example2.com',
        'Vendor',
      );
      expect(belt1.eq(belt2)).toBe(false);
    });

    it('returns false for different vendor', () => {
      const pitch = new Measurement(5, 'mm');
      const width = new Measurement(10, 'mm');
      const belt1 = new Belt(
        100,
        pitch,
        width,
        'HTD',
        null,
        'https://example.com',
        'Vendor1',
      );
      const belt2 = new Belt(
        100,
        pitch,
        width,
        'HTD',
        null,
        'https://example.com',
        'Vendor2',
      );
      expect(belt1.eq(belt2)).toBe(false);
    });

    it('returns false for different types', () => {
      const pitch = new Measurement(5, 'mm');
      const width = new Measurement(10, 'mm');
      const belt = new Belt(
        100,
        pitch,
        width,
        'HTD',
        null,
        'https://example.com',
        'Vendor',
      );
      const other = {} as Model;
      expect(belt.eq(other)).toBe(false);
    });

    it('returns false when comparing Belt to SimpleBelt', () => {
      const pitch = new Measurement(5, 'mm');
      const width = new Measurement(10, 'mm');
      const belt = new Belt(
        100,
        pitch,
        width,
        'HTD',
        null,
        'https://example.com',
        'Vendor',
      );
      const simpleBelt = new SimpleBelt(100, pitch);
      expect(belt.eq(simpleBelt)).toBe(false);
    });
  });
});

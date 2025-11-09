import { describe, expect, it } from 'vitest';

import Measurement from '~/lib/models/Measurement';
import Model from '~/lib/models/Model';
import Pulley, { SimplePulley } from '~/lib/models/Pulley';
import type { Bore } from '~/lib/types/common';
import type { JSONPulley } from '~/lib/types/pulleys';

describe('SimplePulley', () => {
  describe('constructor', () => {
    it('handles zero teeth', () => {
      const pitch = new Measurement(5, 'mm');
      const pulley = new SimplePulley(0, pitch);
      expect(pulley.teeth).toBe(0);
      expect(pulley.pitchDiameter.scalar).toBe(0);
    });

    it('handles negative teeth', () => {
      const pitch = new Measurement(5, 'mm');
      const pulley = new SimplePulley(-5, pitch);
      expect(pulley.teeth).toBe(-5);
      expect(pulley.pitchDiameter.scalar).toBeCloseTo((-5 * 5) / Math.PI);
    });

    it('handles zero pitch', () => {
      const pitch = new Measurement(0, 'mm');
      const pulley = new SimplePulley(100, pitch);
      expect(pulley.pitch.scalar).toBe(0);
      expect(pulley.pitchDiameter.scalar).toBe(0);
    });

    it('handles negative pitch', () => {
      const pitch = new Measurement(-5, 'mm');
      const pulley = new SimplePulley(100, pitch);
      expect(pulley.pitch.scalar).toBe(-5);
      expect(pulley.pitchDiameter.scalar).toBeCloseTo((-5 * 100) / Math.PI);
    });

    it('handles very large teeth', () => {
      const pitch = new Measurement(5, 'mm');
      const pulley = new SimplePulley(1e6, pitch);
      expect(pulley.teeth).toBe(1e6);
      expect(pulley.pitchDiameter.scalar).toBeCloseTo((5 * 1e6) / Math.PI);
    });

    it('handles very large pitch', () => {
      const pitch = new Measurement(1e6, 'mm');
      const pulley = new SimplePulley(100, pitch);
      expect(pulley.pitch.scalar).toBe(1e6);
      expect(pulley.pitchDiameter.scalar).toBeCloseTo((1e6 * 100) / Math.PI);
    });

    it('handles very small pitch', () => {
      const pitch = new Measurement(0.001, 'mm');
      const pulley = new SimplePulley(1000, pitch);
      expect(pulley.pitch.scalar).toBe(0.001);
      expect(pulley.pitchDiameter.scalar).toBeCloseTo((0.001 * 1000) / Math.PI);
    });

    it('calculates pitchDiameter correctly', () => {
      const pitch = new Measurement(5, 'mm');
      const pulley = new SimplePulley(100, pitch);
      const expectedDiameter = (5 * 100) / Math.PI;
      expect(pulley.pitchDiameter.scalar).toBeCloseTo(expectedDiameter);
      expect(pulley.pitchDiameter.units()).toBe('mm');
    });
  });

  describe('toDict', () => {
    it('returns correct dict structure', () => {
      const pitch = new Measurement(5, 'mm');
      const pulley = new SimplePulley(100, pitch);
      const dict = pulley.toDict();
      expect(dict.teeth).toBe(100);
      expect(dict.pitch).toEqual(pitch.toDict());
    });

    it('handles zero teeth', () => {
      const pitch = new Measurement(5, 'mm');
      const pulley = new SimplePulley(0, pitch);
      const dict = pulley.toDict();
      expect(dict.teeth).toBe(0);
    });

    it('handles negative teeth', () => {
      const pitch = new Measurement(5, 'mm');
      const pulley = new SimplePulley(-5, pitch);
      const dict = pulley.toDict();
      expect(dict.teeth).toBe(-5);
    });
  });

  describe('eq', () => {
    it('returns true for equal pulleys', () => {
      const pitch = new Measurement(5, 'mm');
      const pulley1 = new SimplePulley(100, pitch);
      const pulley2 = new SimplePulley(100, pitch);
      expect(pulley1.eq(pulley2)).toBe(true);
    });

    it('returns false for different teeth', () => {
      const pitch = new Measurement(5, 'mm');
      const pulley1 = new SimplePulley(100, pitch);
      const pulley2 = new SimplePulley(101, pitch);
      expect(pulley1.eq(pulley2)).toBe(false);
    });

    it('returns false for different pitch', () => {
      const pitch1 = new Measurement(5, 'mm');
      const pitch2 = new Measurement(6, 'mm');
      const pulley1 = new SimplePulley(100, pitch1);
      const pulley2 = new SimplePulley(100, pitch2);
      expect(pulley1.eq(pulley2)).toBe(false);
    });

    it('returns false for different types', () => {
      const pitch = new Measurement(5, 'mm');
      const pulley = new SimplePulley(100, pitch);
      const other = {} as Model;
      expect(pulley.eq(other)).toBe(false);
    });

    it('returns true when comparing SimplePulley to Pulley with same teeth and pitch', () => {
      const pitch = new Measurement(5, 'mm');
      const simplePulley = new SimplePulley(100, pitch);
      const pulley = new Pulley(
        100,
        new Measurement(10, 'mm'),
        'HTD',
        pitch,
        null,
        'https://example.com',
        '8mm',
        'Vendor',
      );
      expect(simplePulley.eq(pulley)).toBe(true);
    });
  });
});

describe('Pulley', () => {
  describe('constructor', () => {
    it('handles zero teeth', () => {
      const pitch = new Measurement(5, 'mm');
      const width = new Measurement(10, 'mm');
      const pulley = new Pulley(
        0,
        width,
        'HTD',
        pitch,
        null,
        'https://example.com',
        '8mm',
        'Vendor',
      );
      expect(pulley.teeth).toBe(0);
      expect(pulley.pitchDiameter.scalar).toBe(0);
    });

    it('handles negative teeth', () => {
      const pitch = new Measurement(5, 'mm');
      const width = new Measurement(10, 'mm');
      const pulley = new Pulley(
        -5,
        width,
        'HTD',
        pitch,
        null,
        'https://example.com',
        '8mm',
        'Vendor',
      );
      expect(pulley.teeth).toBe(-5);
      expect(pulley.pitchDiameter.scalar).toBeCloseTo((-5 * 5) / Math.PI);
    });

    it('handles zero pitch', () => {
      const pitch = new Measurement(0, 'mm');
      const width = new Measurement(10, 'mm');
      const pulley = new Pulley(
        100,
        width,
        'HTD',
        pitch,
        null,
        'https://example.com',
        '8mm',
        'Vendor',
      );
      expect(pulley.pitch.scalar).toBe(0);
      expect(pulley.pitchDiameter.scalar).toBe(0);
    });

    it('handles null sku', () => {
      const pitch = new Measurement(5, 'mm');
      const width = new Measurement(10, 'mm');
      const pulley = new Pulley(
        100,
        width,
        'HTD',
        pitch,
        null,
        'https://example.com',
        '8mm',
        'Vendor',
      );
      expect(pulley.sku).toBeNull();
    });

    it('handles non-null sku', () => {
      const pitch = new Measurement(5, 'mm');
      const width = new Measurement(10, 'mm');
      const pulley = new Pulley(
        100,
        width,
        'HTD',
        pitch,
        'SKU123',
        'https://example.com',
        '8mm',
        'Vendor',
      );
      expect(pulley.sku).toBe('SKU123');
    });

    it('handles all valid bore types', () => {
      const pitch = new Measurement(5, 'mm');
      const width = new Measurement(10, 'mm');
      const bores: Bore[] = [
        '8mm',
        '1.125" Round',
        '1/4" Round',
        '1/2" Hex',
        '3/8" Hex',
        'SplineXS',
        'SplineXL',
        'Falcon',
        'RS775',
        'RS550',
        'BAG',
      ];
      bores.forEach((bore) => {
        const pulley = new Pulley(
          100,
          width,
          'HTD',
          pitch,
          null,
          'https://example.com',
          bore,
          'Vendor',
        );
        expect(pulley.bore).toBe(bore);
      });
    });

    it('handles very large teeth', () => {
      const pitch = new Measurement(5, 'mm');
      const width = new Measurement(10, 'mm');
      const pulley = new Pulley(
        1e6,
        width,
        'HTD',
        pitch,
        null,
        'https://example.com',
        '8mm',
        'Vendor',
      );
      expect(pulley.teeth).toBe(1e6);
      expect(pulley.pitchDiameter.scalar).toBeCloseTo((5 * 1e6) / Math.PI);
    });
  });

  describe('fromJson', () => {
    it('creates pulley from valid json', () => {
      const json: JSONPulley = {
        teeth: 100,
        pitch: 5,
        width: 10,
        profile: 'HTD',
        sku: 'SKU123',
        url: 'https://example.com',
        bore: '8mm',
        vendor: 'Vendor',
      };
      const pulley = Pulley.fromJson(json);
      expect(pulley.teeth).toBe(100);
      expect(pulley.pitch.scalar).toBe(5);
      expect(pulley.width.scalar).toBe(10);
      expect(pulley.profile).toBe('HTD');
      expect(pulley.sku).toBe('SKU123');
      expect(pulley.url).toBe('https://example.com');
      expect(pulley.bore).toBe('8mm');
      expect(pulley.vendor).toBe('Vendor');
    });

    it('handles null sku', () => {
      const json: JSONPulley = {
        teeth: 100,
        pitch: 5,
        width: 10,
        profile: 'HTD',
        sku: null,
        url: 'https://example.com',
        bore: '8mm',
        vendor: 'Vendor',
      };
      const pulley = Pulley.fromJson(json);
      expect(pulley.sku).toBeNull();
    });

    it('handles zero teeth', () => {
      const json: JSONPulley = {
        teeth: 0,
        pitch: 5,
        width: 10,
        profile: 'HTD',
        sku: null,
        url: 'https://example.com',
        bore: '8mm',
        vendor: 'Vendor',
      };
      const pulley = Pulley.fromJson(json);
      expect(pulley.teeth).toBe(0);
      expect(pulley.pitchDiameter.scalar).toBe(0);
    });

    it('handles negative teeth', () => {
      const json: JSONPulley = {
        teeth: -5,
        pitch: 5,
        width: 10,
        profile: 'HTD',
        sku: null,
        url: 'https://example.com',
        bore: '8mm',
        vendor: 'Vendor',
      };
      const pulley = Pulley.fromJson(json);
      expect(pulley.teeth).toBe(-5);
      expect(pulley.pitchDiameter.scalar).toBeCloseTo((-5 * 5) / Math.PI);
    });

    it('handles minimum pitch value', () => {
      const json: JSONPulley = {
        teeth: 100,
        pitch: 1,
        width: 10,
        profile: 'HTD',
        sku: null,
        url: 'https://example.com',
        bore: '8mm',
        vendor: 'Vendor',
      };
      const pulley = Pulley.fromJson(json);
      expect(pulley.pitch.scalar).toBe(1);
    });

    it('handles very large pitch', () => {
      const json: JSONPulley = {
        teeth: 100,
        pitch: 1e6,
        width: 10,
        profile: 'HTD',
        sku: null,
        url: 'https://example.com',
        bore: '8mm',
        vendor: 'Vendor',
      };
      const pulley = Pulley.fromJson(json);
      expect(pulley.pitch.scalar).toBe(1e6);
      expect(pulley.pitchDiameter.scalar).toBeCloseTo((1e6 * 100) / Math.PI);
    });

    it('handles minimum width value', () => {
      const json: JSONPulley = {
        teeth: 100,
        pitch: 5,
        width: 1,
        profile: 'HTD',
        sku: null,
        url: 'https://example.com',
        bore: '8mm',
        vendor: 'Vendor',
      };
      const pulley = Pulley.fromJson(json);
      expect(pulley.width.scalar).toBe(1);
    });

    it('handles empty profile string', () => {
      const json: JSONPulley = {
        teeth: 100,
        pitch: 5,
        width: 10,
        profile: '',
        sku: null,
        url: 'https://example.com',
        bore: '8mm',
        vendor: 'Vendor',
      };
      const pulley = Pulley.fromJson(json);
      expect(pulley.profile).toBe('');
    });

    it('handles empty vendor string', () => {
      const json: JSONPulley = {
        teeth: 100,
        pitch: 5,
        width: 10,
        profile: 'HTD',
        sku: null,
        url: 'https://example.com',
        bore: '8mm',
        vendor: '',
      };
      const pulley = Pulley.fromJson(json);
      expect(pulley.vendor).toBe('');
    });

    it('handles all valid bore types', () => {
      const bores: Bore[] = [
        '8mm',
        '1.125" Round',
        '1/4" Round',
        '1/2" Hex',
        '3/8" Hex',
        'SplineXS',
        'SplineXL',
        'Falcon',
        'RS775',
        'RS550',
        'BAG',
      ];
      bores.forEach((bore) => {
        const json: JSONPulley = {
          teeth: 100,
          pitch: 5,
          width: 10,
          profile: 'HTD',
          sku: null,
          url: 'https://example.com',
          bore,
          vendor: 'Vendor',
        };
        const pulley = Pulley.fromJson(json);
        expect(pulley.bore).toBe(bore);
      });
    });
  });

  describe('toDict', () => {
    it('returns correct dict structure', () => {
      const pitch = new Measurement(5, 'mm');
      const width = new Measurement(10, 'mm');
      const pulley = new Pulley(
        100,
        width,
        'HTD',
        pitch,
        null,
        'https://example.com',
        '8mm',
        'Vendor',
      );
      const dict = pulley.toDict();
      expect(dict.teeth).toBe(100);
      expect(dict.pitch).toEqual(pitch.toDict());
    });

    it('handles zero teeth', () => {
      const pitch = new Measurement(5, 'mm');
      const width = new Measurement(10, 'mm');
      const pulley = new Pulley(
        0,
        width,
        'HTD',
        pitch,
        null,
        'https://example.com',
        '8mm',
        'Vendor',
      );
      const dict = pulley.toDict();
      expect(dict.teeth).toBe(0);
    });
  });

  describe('eq', () => {
    it('returns true for equal pulleys', () => {
      const pitch = new Measurement(5, 'mm');
      const width = new Measurement(10, 'mm');
      const pulley1 = new Pulley(
        100,
        width,
        'HTD',
        pitch,
        null,
        'https://example.com',
        '8mm',
        'Vendor',
      );
      const pulley2 = new Pulley(
        100,
        width,
        'HTD',
        pitch,
        null,
        'https://example.com',
        '8mm',
        'Vendor',
      );
      expect(pulley1.eq(pulley2)).toBe(true);
    });

    it('returns false for different teeth', () => {
      const pitch = new Measurement(5, 'mm');
      const width = new Measurement(10, 'mm');
      const pulley1 = new Pulley(
        100,
        width,
        'HTD',
        pitch,
        null,
        'https://example.com',
        '8mm',
        'Vendor',
      );
      const pulley2 = new Pulley(
        101,
        width,
        'HTD',
        pitch,
        null,
        'https://example.com',
        '8mm',
        'Vendor',
      );
      expect(pulley1.eq(pulley2)).toBe(false);
    });

    it('returns false for different pitch', () => {
      const pitch1 = new Measurement(5, 'mm');
      const pitch2 = new Measurement(6, 'mm');
      const width = new Measurement(10, 'mm');
      const pulley1 = new Pulley(
        100,
        width,
        'HTD',
        pitch1,
        null,
        'https://example.com',
        '8mm',
        'Vendor',
      );
      const pulley2 = new Pulley(
        100,
        width,
        'HTD',
        pitch2,
        null,
        'https://example.com',
        '8mm',
        'Vendor',
      );
      expect(pulley1.eq(pulley2)).toBe(false);
    });

    it('returns false for different width', () => {
      const pitch = new Measurement(5, 'mm');
      const width1 = new Measurement(10, 'mm');
      const width2 = new Measurement(11, 'mm');
      const pulley1 = new Pulley(
        100,
        width1,
        'HTD',
        pitch,
        null,
        'https://example.com',
        '8mm',
        'Vendor',
      );
      const pulley2 = new Pulley(
        100,
        width2,
        'HTD',
        pitch,
        null,
        'https://example.com',
        '8mm',
        'Vendor',
      );
      expect(pulley1.eq(pulley2)).toBe(false);
    });

    it('returns false for different profile', () => {
      const pitch = new Measurement(5, 'mm');
      const width = new Measurement(10, 'mm');
      const pulley1 = new Pulley(
        100,
        width,
        'HTD',
        pitch,
        null,
        'https://example.com',
        '8mm',
        'Vendor',
      );
      const pulley2 = new Pulley(
        100,
        width,
        'GT2',
        pitch,
        null,
        'https://example.com',
        '8mm',
        'Vendor',
      );
      expect(pulley1.eq(pulley2)).toBe(false);
    });

    it('returns false for different sku', () => {
      const pitch = new Measurement(5, 'mm');
      const width = new Measurement(10, 'mm');
      const pulley1 = new Pulley(
        100,
        width,
        'HTD',
        pitch,
        'SKU1',
        'https://example.com',
        '8mm',
        'Vendor',
      );
      const pulley2 = new Pulley(
        100,
        width,
        'HTD',
        pitch,
        'SKU2',
        'https://example.com',
        '8mm',
        'Vendor',
      );
      expect(pulley1.eq(pulley2)).toBe(false);
    });

    it('returns false when one sku is null and other is not', () => {
      const pitch = new Measurement(5, 'mm');
      const width = new Measurement(10, 'mm');
      const pulley1 = new Pulley(
        100,
        width,
        'HTD',
        pitch,
        null,
        'https://example.com',
        '8mm',
        'Vendor',
      );
      const pulley2 = new Pulley(
        100,
        width,
        'HTD',
        pitch,
        'SKU1',
        'https://example.com',
        '8mm',
        'Vendor',
      );
      expect(pulley1.eq(pulley2)).toBe(false);
    });

    it('returns false for different url', () => {
      const pitch = new Measurement(5, 'mm');
      const width = new Measurement(10, 'mm');
      const pulley1 = new Pulley(
        100,
        width,
        'HTD',
        pitch,
        null,
        'https://example.com',
        '8mm',
        'Vendor',
      );
      const pulley2 = new Pulley(
        100,
        width,
        'HTD',
        pitch,
        null,
        'https://example2.com',
        '8mm',
        'Vendor',
      );
      expect(pulley1.eq(pulley2)).toBe(false);
    });

    it('returns false for different bore', () => {
      const pitch = new Measurement(5, 'mm');
      const width = new Measurement(10, 'mm');
      const pulley1 = new Pulley(
        100,
        width,
        'HTD',
        pitch,
        null,
        'https://example.com',
        '8mm',
        'Vendor',
      );
      const pulley2 = new Pulley(
        100,
        width,
        'HTD',
        pitch,
        null,
        'https://example.com',
        '1/2" Hex',
        'Vendor',
      );
      expect(pulley1.eq(pulley2)).toBe(false);
    });

    it('returns false for different vendor', () => {
      const pitch = new Measurement(5, 'mm');
      const width = new Measurement(10, 'mm');
      const pulley1 = new Pulley(
        100,
        width,
        'HTD',
        pitch,
        null,
        'https://example.com',
        '8mm',
        'Vendor1',
      );
      const pulley2 = new Pulley(
        100,
        width,
        'HTD',
        pitch,
        null,
        'https://example.com',
        '8mm',
        'Vendor2',
      );
      expect(pulley1.eq(pulley2)).toBe(false);
    });

    it('returns false for different types', () => {
      const pitch = new Measurement(5, 'mm');
      const width = new Measurement(10, 'mm');
      const pulley = new Pulley(
        100,
        width,
        'HTD',
        pitch,
        null,
        'https://example.com',
        '8mm',
        'Vendor',
      );
      const other = {} as Model;
      expect(pulley.eq(other)).toBe(false);
    });

    it('returns false when comparing Pulley to SimplePulley', () => {
      const pitch = new Measurement(5, 'mm');
      const width = new Measurement(10, 'mm');
      const pulley = new Pulley(
        100,
        width,
        'HTD',
        pitch,
        null,
        'https://example.com',
        '8mm',
        'Vendor',
      );
      const simplePulley = new SimplePulley(100, pitch);
      expect(pulley.eq(simplePulley)).toBe(false);
    });
  });
});

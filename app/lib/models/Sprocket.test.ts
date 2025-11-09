import { describe, expect, it } from 'vitest';

import Model from '~/lib/models/Model';
import Sprocket, { SimpleSprocket } from '~/lib/models/Sprocket';
import type { Bore } from '~/lib/types/common';
import type { JSONSprocket } from '~/lib/types/sprockets';

describe('SimpleSprocket', () => {
  describe('constructor', () => {
    it('handles zero teeth', () => {
      const sprocket = new SimpleSprocket(0, '#25');
      expect(sprocket.teeth).toBe(0);
      expect(sprocket.pitchDiameter.scalar).toBe(0);
    });

    it('handles negative teeth', () => {
      const sprocket = new SimpleSprocket(-5, '#25');
      expect(sprocket.teeth).toBe(-5);
      expect(sprocket.pitch.scalar).toBe(0.25);
      expect(sprocket.pitchDiameter.scalar).toBeCloseTo((-5 * 0.25) / Math.PI);
    });

    it('handles #25 chain type', () => {
      const sprocket = new SimpleSprocket(100, '#25');
      expect(sprocket.chainType).toBe('#25');
      expect(sprocket.pitch.scalar).toBe(0.25);
      expect(sprocket.pitch.units()).toBe('in');
    });

    it('handles #35 chain type', () => {
      const sprocket = new SimpleSprocket(100, '#35');
      expect(sprocket.chainType).toBe('#35');
      expect(sprocket.pitch.scalar).toBe(0.375);
    });

    it('handles #40 chain type', () => {
      const sprocket = new SimpleSprocket(100, '#40');
      expect(sprocket.chainType).toBe('#40');
      expect(sprocket.pitch.scalar).toBe(0.5);
    });

    it('handles invalid chain type (defaults to zero pitch)', () => {
      const sprocket = new SimpleSprocket(100, '#50');
      expect(sprocket.chainType).toBe('#50');
      expect(sprocket.pitch.scalar).toBe(0);
      expect(sprocket.pitchDiameter.scalar).toBe(0);
    });

    it('handles unknown chain type', () => {
      const sprocket = new SimpleSprocket(100, 'invalid');
      expect(sprocket.chainType).toBe('invalid');
      expect(sprocket.pitch.scalar).toBe(0);
      expect(sprocket.pitchDiameter.scalar).toBe(0);
    });

    it('handles empty chain type string', () => {
      const sprocket = new SimpleSprocket(100, '');
      expect(sprocket.chainType).toBe('');
      expect(sprocket.pitch.scalar).toBe(0);
    });

    it('handles very large teeth', () => {
      const sprocket = new SimpleSprocket(1e6, '#25');
      expect(sprocket.teeth).toBe(1e6);
      expect(sprocket.pitchDiameter.scalar).toBeCloseTo((1e6 * 0.25) / Math.PI);
    });

    it('calculates pitchDiameter correctly for #25', () => {
      const sprocket = new SimpleSprocket(100, '#25');
      const expectedDiameter = (100 * 0.25) / Math.PI;
      expect(sprocket.pitchDiameter.scalar).toBeCloseTo(expectedDiameter);
      expect(sprocket.pitchDiameter.units()).toBe('in');
    });

    it('calculates pitchDiameter correctly for #35', () => {
      const sprocket = new SimpleSprocket(100, '#35');
      const expectedDiameter = (100 * 0.375) / Math.PI;
      expect(sprocket.pitchDiameter.scalar).toBeCloseTo(expectedDiameter);
    });

    it('calculates pitchDiameter correctly for #40', () => {
      const sprocket = new SimpleSprocket(100, '#40');
      const expectedDiameter = (100 * 0.5) / Math.PI;
      expect(sprocket.pitchDiameter.scalar).toBeCloseTo(expectedDiameter);
    });
  });

  describe('toDict', () => {
    it('returns correct dict structure', () => {
      const sprocket = new SimpleSprocket(100, '#25');
      const dict = sprocket.toDict();
      expect(dict.teeth).toBe(100);
      expect(dict.chainType).toBe('#25');
    });

    it('handles zero teeth', () => {
      const sprocket = new SimpleSprocket(0, '#25');
      const dict = sprocket.toDict();
      expect(dict.teeth).toBe(0);
    });

    it('handles negative teeth', () => {
      const sprocket = new SimpleSprocket(-5, '#25');
      const dict = sprocket.toDict();
      expect(dict.teeth).toBe(-5);
    });

    it('handles invalid chain type', () => {
      const sprocket = new SimpleSprocket(100, '#50');
      const dict = sprocket.toDict();
      expect(dict.chainType).toBe('#50');
    });
  });

  describe('eq', () => {
    it('returns true for equal sprockets', () => {
      const sprocket1 = new SimpleSprocket(100, '#25');
      const sprocket2 = new SimpleSprocket(100, '#25');
      expect(sprocket1.eq(sprocket2)).toBe(true);
    });

    it('returns false for different teeth', () => {
      const sprocket1 = new SimpleSprocket(100, '#25');
      const sprocket2 = new SimpleSprocket(101, '#25');
      expect(sprocket1.eq(sprocket2)).toBe(false);
    });

    it('returns false for different chain types', () => {
      const sprocket1 = new SimpleSprocket(100, '#25');
      const sprocket2 = new SimpleSprocket(100, '#35');
      expect(sprocket1.eq(sprocket2)).toBe(false);
    });

    it('returns false for different types', () => {
      const sprocket = new SimpleSprocket(100, '#25');
      const other = {} as Model;
      expect(sprocket.eq(other)).toBe(false);
    });

    it('returns true when comparing SimpleSprocket to Sprocket with same teeth and chainType', () => {
      const simpleSprocket = new SimpleSprocket(100, '#25');
      const sprocket = new Sprocket(
        100,
        '8mm',
        '#25',
        'https://example.com',
        null,
        'Vendor',
      );
      expect(simpleSprocket.eq(sprocket)).toBe(true);
    });
  });
});

describe('Sprocket', () => {
  describe('constructor', () => {
    it('handles zero teeth', () => {
      const sprocket = new Sprocket(
        0,
        '8mm',
        '#25',
        'https://example.com',
        null,
        'Vendor',
      );
      expect(sprocket.teeth).toBe(0);
      expect(sprocket.pitchDiameter.scalar).toBe(0);
    });

    it('handles negative teeth', () => {
      const sprocket = new Sprocket(
        -5,
        '8mm',
        '#25',
        'https://example.com',
        null,
        'Vendor',
      );
      expect(sprocket.teeth).toBe(-5);
      expect(sprocket.pitch.scalar).toBe(0.25);
      expect(sprocket.pitchDiameter.scalar).toBeCloseTo((-5 * 0.25) / Math.PI);
    });

    it('handles null sku', () => {
      const sprocket = new Sprocket(
        100,
        '8mm',
        '#25',
        'https://example.com',
        null,
        'Vendor',
      );
      expect(sprocket.sku).toBeNull();
    });

    it('handles non-null sku', () => {
      const sprocket = new Sprocket(
        100,
        '8mm',
        '#25',
        'https://example.com',
        'SKU123',
        'Vendor',
      );
      expect(sprocket.sku).toBe('SKU123');
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
        const sprocket = new Sprocket(
          100,
          bore,
          '#25',
          'https://example.com',
          null,
          'Vendor',
        );
        expect(sprocket.bore).toBe(bore);
      });
    });

    it('handles invalid chain type', () => {
      const sprocket = new Sprocket(
        100,
        '8mm',
        '#50',
        'https://example.com',
        null,
        'Vendor',
      );
      expect(sprocket.chainType).toBe('#50');
      expect(sprocket.pitch.scalar).toBe(0);
    });

    it('handles very large teeth', () => {
      const sprocket = new Sprocket(
        1e6,
        '8mm',
        '#25',
        'https://example.com',
        null,
        'Vendor',
      );
      expect(sprocket.teeth).toBe(1e6);
      expect(sprocket.pitchDiameter.scalar).toBeCloseTo((1e6 * 0.25) / Math.PI);
    });
  });

  describe('fromJson', () => {
    it('creates sprocket from valid json', () => {
      const json: JSONSprocket = {
        teeth: 100,
        bore: '8mm',
        chainType: '#25',
        url: 'https://example.com',
        sku: 'SKU123',
        vendor: 'Vendor',
      };
      const sprocket = Sprocket.fromJson(json);
      expect(sprocket.teeth).toBe(100);
      expect(sprocket.bore).toBe('8mm');
      expect(sprocket.chainType).toBe('#25');
      expect(sprocket.url).toBe('https://example.com');
      expect(sprocket.sku).toBe('SKU123');
      expect(sprocket.vendor).toBe('Vendor');
    });

    it('handles null sku', () => {
      const json: JSONSprocket = {
        teeth: 100,
        bore: '8mm',
        chainType: '#25',
        url: 'https://example.com',
        sku: null,
        vendor: 'Vendor',
      };
      const sprocket = Sprocket.fromJson(json);
      expect(sprocket.sku).toBeNull();
    });

    it('handles zero teeth', () => {
      const json: JSONSprocket = {
        teeth: 0,
        bore: '8mm',
        chainType: '#25',
        url: 'https://example.com',
        sku: null,
        vendor: 'Vendor',
      };
      const sprocket = Sprocket.fromJson(json);
      expect(sprocket.teeth).toBe(0);
      expect(sprocket.pitchDiameter.scalar).toBe(0);
    });

    it('handles negative teeth', () => {
      const json: JSONSprocket = {
        teeth: -5,
        bore: '8mm',
        chainType: '#25',
        url: 'https://example.com',
        sku: null,
        vendor: 'Vendor',
      };
      const sprocket = Sprocket.fromJson(json);
      expect(sprocket.teeth).toBe(-5);
      expect(sprocket.pitchDiameter.scalar).toBeCloseTo((-5 * 0.25) / Math.PI);
    });

    it('handles #25 chain type', () => {
      const json: JSONSprocket = {
        teeth: 100,
        bore: '8mm',
        chainType: '#25',
        url: 'https://example.com',
        sku: null,
        vendor: 'Vendor',
      };
      const sprocket = Sprocket.fromJson(json);
      expect(sprocket.chainType).toBe('#25');
      expect(sprocket.pitch.scalar).toBe(0.25);
    });

    it('handles #35 chain type', () => {
      const json: JSONSprocket = {
        teeth: 100,
        bore: '8mm',
        chainType: '#35',
        url: 'https://example.com',
        sku: null,
        vendor: 'Vendor',
      };
      const sprocket = Sprocket.fromJson(json);
      expect(sprocket.chainType).toBe('#35');
      expect(sprocket.pitch.scalar).toBe(0.375);
    });

    it('handles empty vendor string', () => {
      const json: JSONSprocket = {
        teeth: 100,
        bore: '8mm',
        chainType: '#25',
        url: 'https://example.com',
        sku: null,
        vendor: '',
      };
      const sprocket = Sprocket.fromJson(json);
      expect(sprocket.vendor).toBe('');
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
        const json: JSONSprocket = {
          teeth: 100,
          bore,
          chainType: '#25',
          url: 'https://example.com',
          sku: null,
          vendor: 'Vendor',
        };
        const sprocket = Sprocket.fromJson(json);
        expect(sprocket.bore).toBe(bore);
      });
    });
  });

  describe('toDict', () => {
    it('returns correct dict structure', () => {
      const sprocket = new Sprocket(
        100,
        '8mm',
        '#25',
        'https://example.com',
        null,
        'Vendor',
      );
      const dict = sprocket.toDict();
      expect(dict.teeth).toBe(100);
      expect(dict.chainType).toBe('#25');
    });

    it('handles zero teeth', () => {
      const sprocket = new Sprocket(
        0,
        '8mm',
        '#25',
        'https://example.com',
        null,
        'Vendor',
      );
      const dict = sprocket.toDict();
      expect(dict.teeth).toBe(0);
    });
  });

  describe('eq', () => {
    it('returns true for equal sprockets', () => {
      const sprocket1 = new Sprocket(
        100,
        '8mm',
        '#25',
        'https://example.com',
        null,
        'Vendor',
      );
      const sprocket2 = new Sprocket(
        100,
        '8mm',
        '#25',
        'https://example.com',
        null,
        'Vendor',
      );
      expect(sprocket1.eq(sprocket2)).toBe(true);
    });

    it('returns false for different teeth', () => {
      const sprocket1 = new Sprocket(
        100,
        '8mm',
        '#25',
        'https://example.com',
        null,
        'Vendor',
      );
      const sprocket2 = new Sprocket(
        101,
        '8mm',
        '#25',
        'https://example.com',
        null,
        'Vendor',
      );
      expect(sprocket1.eq(sprocket2)).toBe(false);
    });

    it('returns false for different chain types', () => {
      const sprocket1 = new Sprocket(
        100,
        '8mm',
        '#25',
        'https://example.com',
        null,
        'Vendor',
      );
      const sprocket2 = new Sprocket(
        100,
        '8mm',
        '#35',
        'https://example.com',
        null,
        'Vendor',
      );
      expect(sprocket1.eq(sprocket2)).toBe(false);
    });

    it('returns false for different bore', () => {
      const sprocket1 = new Sprocket(
        100,
        '8mm',
        '#25',
        'https://example.com',
        null,
        'Vendor',
      );
      const sprocket2 = new Sprocket(
        100,
        '1/2" Hex',
        '#25',
        'https://example.com',
        null,
        'Vendor',
      );
      expect(sprocket1.eq(sprocket2)).toBe(false);
    });

    it('returns false for different url', () => {
      const sprocket1 = new Sprocket(
        100,
        '8mm',
        '#25',
        'https://example.com',
        null,
        'Vendor',
      );
      const sprocket2 = new Sprocket(
        100,
        '8mm',
        '#25',
        'https://example2.com',
        null,
        'Vendor',
      );
      expect(sprocket1.eq(sprocket2)).toBe(false);
    });

    it('returns false for different sku', () => {
      const sprocket1 = new Sprocket(
        100,
        '8mm',
        '#25',
        'https://example.com',
        'SKU1',
        'Vendor',
      );
      const sprocket2 = new Sprocket(
        100,
        '8mm',
        '#25',
        'https://example.com',
        'SKU2',
        'Vendor',
      );
      expect(sprocket1.eq(sprocket2)).toBe(false);
    });

    it('returns false when one sku is null and other is not', () => {
      const sprocket1 = new Sprocket(
        100,
        '8mm',
        '#25',
        'https://example.com',
        null,
        'Vendor',
      );
      const sprocket2 = new Sprocket(
        100,
        '8mm',
        '#25',
        'https://example.com',
        'SKU1',
        'Vendor',
      );
      expect(sprocket1.eq(sprocket2)).toBe(false);
    });

    it('returns false for different vendor', () => {
      const sprocket1 = new Sprocket(
        100,
        '8mm',
        '#25',
        'https://example.com',
        null,
        'Vendor1',
      );
      const sprocket2 = new Sprocket(
        100,
        '8mm',
        '#25',
        'https://example.com',
        null,
        'Vendor2',
      );
      expect(sprocket1.eq(sprocket2)).toBe(false);
    });

    it('returns false for different types', () => {
      const sprocket = new Sprocket(
        100,
        '8mm',
        '#25',
        'https://example.com',
        null,
        'Vendor',
      );
      const other = {} as Model;
      expect(sprocket.eq(other)).toBe(false);
    });

    it('returns false when comparing Sprocket to SimpleSprocket', () => {
      const sprocket = new Sprocket(
        100,
        '8mm',
        '#25',
        'https://example.com',
        null,
        'Vendor',
      );
      const simpleSprocket = new SimpleSprocket(100, '#25');
      expect(sprocket.eq(simpleSprocket)).toBe(false);
    });
  });
});

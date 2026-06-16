import { describe, expect, it } from 'vitest';

import Gear from '~/lib/models/Gear';
import Model from '~/lib/models/Model';
import Planetary from '~/lib/models/Planetary';
import type { Bore } from '~/lib/types/common';
import type { JSONPlanetary } from '~/lib/types/planetary';

const BASE_JSON: JSONPlanetary = {
  slices: [3, 5],
  maxSlices: 2,
  inputBores: ['1/2" Hex', 'MAXSpline'],
  outputBores: ['Falcon', 'Vortex'],
  sku: 'SKU-001',
  url: 'https://example.com/planetary',
  vendor: 'REV',
};

describe('Planetary', () => {
  describe('fromJson', () => {
    it('maps every field correctly', () => {
      const p = Planetary.fromJson(BASE_JSON);
      expect(p.slices).toEqual([3, 5]);
      expect(p.maxSlices).toBe(2);
      expect(p.inputBores).toEqual(['1/2" Hex', 'MAXSpline']);
      expect(p.outputBores).toEqual(['Falcon', 'Vortex']);
      expect(p.sku).toBe('SKU-001');
      expect(p.url).toBe('https://example.com/planetary');
      expect(p.vendor).toBe('REV');
    });

    it('preserves slices array order', () => {
      const json: JSONPlanetary = { ...BASE_JSON, slices: [7, 1, 4] };
      const p = Planetary.fromJson(json);
      expect(p.slices).toEqual([7, 1, 4]);
    });

    it('preserves multiple inputBores', () => {
      const bores: Bore[] = ['8mm', '1/2" Hex', 'SplineXS'];
      const json: JSONPlanetary = { ...BASE_JSON, inputBores: bores };
      const p = Planetary.fromJson(json);
      expect(p.inputBores).toEqual(bores);
    });

    it('preserves multiple outputBores', () => {
      const bores: Bore[] = ['Falcon', 'MAXSpline'];
      const json: JSONPlanetary = { ...BASE_JSON, outputBores: bores };
      const p = Planetary.fromJson(json);
      expect(p.outputBores).toEqual(bores);
    });

    it('handles single-element slices array', () => {
      const json: JSONPlanetary = { ...BASE_JSON, slices: [3] };
      const p = Planetary.fromJson(json);
      expect(p.slices).toEqual([3]);
    });
  });

  describe('toDict', () => {
    it('returns the expected object with all array fields', () => {
      const p = Planetary.fromJson(BASE_JSON);
      const dict = p.toDict();
      expect(dict).toEqual({
        slices: [3, 5],
        maxSlices: 2,
        inputBores: ['1/2" Hex', 'MAXSpline'],
        outputBores: ['Falcon', 'Vortex'],
      });
    });

    it('does not include sku, url, or vendor', () => {
      const p = Planetary.fromJson(BASE_JSON);
      const dict = p.toDict();
      expect(dict).not.toHaveProperty('sku');
      expect(dict).not.toHaveProperty('url');
      expect(dict).not.toHaveProperty('vendor');
    });

    it('preserves slices order in dict', () => {
      const json: JSONPlanetary = { ...BASE_JSON, slices: [9, 1, 5] };
      const p = Planetary.fromJson(json);
      expect(p.toDict().slices).toEqual([9, 1, 5]);
    });
  });

  describe('eq', () => {
    it('returns true for two separate instances built from identical data (regression: array reference equality)', () => {
      const json1: JSONPlanetary = {
        slices: [3, 5],
        maxSlices: 2,
        inputBores: ['1/2" Hex', 'MAXSpline'],
        outputBores: ['Falcon', 'Vortex'],
        sku: 'SKU-001',
        url: 'https://example.com/planetary',
        vendor: 'REV',
      };
      const json2: JSONPlanetary = {
        slices: [3, 5],
        maxSlices: 2,
        inputBores: ['1/2" Hex', 'MAXSpline'],
        outputBores: ['Falcon', 'Vortex'],
        sku: 'SKU-001',
        url: 'https://example.com/planetary',
        vendor: 'REV',
      };
      const p1 = Planetary.fromJson(json1);
      const p2 = Planetary.fromJson(json2);
      // Confirm the arrays are truly distinct object references
      expect(p1.slices).not.toBe(p2.slices);
      expect(p1.inputBores).not.toBe(p2.inputBores);
      expect(p1.outputBores).not.toBe(p2.outputBores);
      // Despite being different references, eq must return true
      expect(p1.eq(p2)).toBe(true);
    });

    it('returns true when comparing instance to itself', () => {
      const p = Planetary.fromJson(BASE_JSON);
      expect(p.eq(p)).toBe(true);
    });

    it('returns false when slices contents differ', () => {
      const p1 = Planetary.fromJson(BASE_JSON);
      const p2 = Planetary.fromJson({ ...BASE_JSON, slices: [4, 5] });
      expect(p1.eq(p2)).toBe(false);
    });

    it('returns false when slices length differs', () => {
      const p1 = Planetary.fromJson(BASE_JSON);
      const p2 = Planetary.fromJson({ ...BASE_JSON, slices: [3, 5, 7] });
      expect(p1.eq(p2)).toBe(false);
    });

    it('returns false when slices order differs ([1,2] vs [2,1])', () => {
      const p1 = Planetary.fromJson({ ...BASE_JSON, slices: [1, 2] });
      const p2 = Planetary.fromJson({ ...BASE_JSON, slices: [2, 1] });
      expect(p1.eq(p2)).toBe(false);
    });

    it('returns false when maxSlices differs', () => {
      const p1 = Planetary.fromJson(BASE_JSON);
      const p2 = Planetary.fromJson({ ...BASE_JSON, maxSlices: 3 });
      expect(p1.eq(p2)).toBe(false);
    });

    it('returns false when inputBores contents differ', () => {
      const p1 = Planetary.fromJson(BASE_JSON);
      const p2 = Planetary.fromJson({
        ...BASE_JSON,
        inputBores: ['8mm', 'MAXSpline'],
      });
      expect(p1.eq(p2)).toBe(false);
    });

    it('returns false when inputBores length differs', () => {
      const p1 = Planetary.fromJson(BASE_JSON);
      const p2 = Planetary.fromJson({ ...BASE_JSON, inputBores: ['1/2" Hex'] });
      expect(p1.eq(p2)).toBe(false);
    });

    it('returns false when outputBores contents differ', () => {
      const p1 = Planetary.fromJson(BASE_JSON);
      const p2 = Planetary.fromJson({
        ...BASE_JSON,
        outputBores: ['MAXSpline', 'Vortex'],
      });
      expect(p1.eq(p2)).toBe(false);
    });

    it('returns false when outputBores length differs', () => {
      const p1 = Planetary.fromJson(BASE_JSON);
      const p2 = Planetary.fromJson({ ...BASE_JSON, outputBores: ['Falcon'] });
      expect(p1.eq(p2)).toBe(false);
    });

    it('returns false when sku differs', () => {
      const p1 = Planetary.fromJson(BASE_JSON);
      const p2 = Planetary.fromJson({ ...BASE_JSON, sku: 'SKU-999' });
      expect(p1.eq(p2)).toBe(false);
    });

    it('returns false when url differs', () => {
      const p1 = Planetary.fromJson(BASE_JSON);
      const p2 = Planetary.fromJson({
        ...BASE_JSON,
        url: 'https://other.com/planetary',
      });
      expect(p1.eq(p2)).toBe(false);
    });

    it('returns false when vendor differs', () => {
      const p1 = Planetary.fromJson(BASE_JSON);
      const p2 = Planetary.fromJson({ ...BASE_JSON, vendor: 'WCP' });
      expect(p1.eq(p2)).toBe(false);
    });

    it('returns false when compared against a Gear (different Model type)', () => {
      const p = Planetary.fromJson(BASE_JSON);
      const g = new Gear(
        20,
        20,
        '1/2" Hex',
        'https://example.com',
        'G-001',
        'REV',
      );
      expect(p.eq(g)).toBe(false);
    });

    it('returns false when compared against a plain Model-shaped object', () => {
      const p = Planetary.fromJson(BASE_JSON);
      const other = {} as Model;
      expect(p.eq(other)).toBe(false);
    });
  });
});

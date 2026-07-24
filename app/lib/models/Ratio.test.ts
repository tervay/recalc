import { describe, expect, it } from 'vitest';

import Model from '~/lib/models/Model';
import Ratio, { RatioType } from '~/lib/models/Ratio';

describe('Ratio', () => {
  describe('constructor', () => {
    it('handles zero magnitude', () => {
      const ratio = new Ratio(0);
      expect(ratio.magnitude).toBe(0);
      expect(ratio.ratioType).toBe(RatioType.REDUCTION);
    });

    it('handles negative magnitude', () => {
      const ratio = new Ratio(-5);
      expect(ratio.magnitude).toBe(-5);
      expect(ratio.ratioType).toBe(RatioType.REDUCTION);
    });

    it('handles very large magnitude', () => {
      const ratio = new Ratio(1e15);
      expect(ratio.magnitude).toBe(1e15);
    });

    it('handles very small magnitude', () => {
      const ratio = new Ratio(1e-15);
      expect(ratio.magnitude).toBe(1e-15);
    });

    it('defaults to REDUCTION type', () => {
      const ratio = new Ratio(5);
      expect(ratio.ratioType).toBe(RatioType.REDUCTION);
    });

    it('handles explicit REDUCTION type', () => {
      const ratio = new Ratio(5, RatioType.REDUCTION);
      expect(ratio.ratioType).toBe(RatioType.REDUCTION);
    });

    it('handles STEP_UP type', () => {
      const ratio = new Ratio(5, RatioType.STEP_UP);
      expect(ratio.ratioType).toBe(RatioType.STEP_UP);
    });
  });

  describe('asNumber', () => {
    it('returns magnitude for REDUCTION type', () => {
      const ratio = new Ratio(5, RatioType.REDUCTION);
      expect(ratio.asNumber()).toBe(5);
    });

    it('returns inverse for STEP_UP type', () => {
      const ratio = new Ratio(5, RatioType.STEP_UP);
      expect(ratio.asNumber()).toBeCloseTo(1 / 5);
    });

    it('handles zero magnitude with REDUCTION', () => {
      const ratio = new Ratio(0, RatioType.REDUCTION);
      expect(ratio.asNumber()).toBe(0);
    });

    it('handles zero magnitude with STEP_UP', () => {
      const ratio = new Ratio(0, RatioType.STEP_UP);
      expect(ratio.asNumber()).toBe(0);
    });

    it('handles negative magnitude with REDUCTION', () => {
      const ratio = new Ratio(-5, RatioType.REDUCTION);
      expect(ratio.asNumber()).toBe(-5);
    });

    it('handles negative magnitude with STEP_UP', () => {
      const ratio = new Ratio(-5, RatioType.STEP_UP);
      expect(ratio.asNumber()).toBeCloseTo(1 / -5);
    });

    it('handles very large magnitude with REDUCTION', () => {
      const ratio = new Ratio(1e15, RatioType.REDUCTION);
      expect(ratio.asNumber()).toBe(1e15);
    });

    it('handles very large magnitude with STEP_UP', () => {
      const ratio = new Ratio(1e15, RatioType.STEP_UP);
      expect(ratio.asNumber()).toBeCloseTo(1 / 1e15);
    });

    it('handles very small magnitude with REDUCTION', () => {
      const ratio = new Ratio(1e-15, RatioType.REDUCTION);
      expect(ratio.asNumber()).toBe(1e-15);
    });

    it('handles very small magnitude with STEP_UP', () => {
      const ratio = new Ratio(1e-15, RatioType.STEP_UP);
      expect(ratio.asNumber()).toBeCloseTo(1 / 1e-15);
    });

    it('handles 1:1 ratio with REDUCTION', () => {
      const ratio = new Ratio(1, RatioType.REDUCTION);
      expect(ratio.asNumber()).toBe(1);
    });

    it('handles 1:1 ratio with STEP_UP', () => {
      const ratio = new Ratio(1, RatioType.STEP_UP);
      expect(ratio.asNumber()).toBe(1);
    });
  });

  describe('to', () => {
    it('returns same ratio when types match', () => {
      const ratio = new Ratio(5, RatioType.REDUCTION);
      const result = ratio.to(RatioType.REDUCTION);
      expect(result).toBe(ratio);
    });

    it('converts REDUCTION to STEP_UP', () => {
      const ratio = new Ratio(5, RatioType.REDUCTION);
      const result = ratio.to(RatioType.STEP_UP);
      expect(result.magnitude).toBeCloseTo(1 / 5);
      expect(result.ratioType).toBe(RatioType.STEP_UP);
    });

    it('converts STEP_UP to REDUCTION', () => {
      const ratio = new Ratio(5, RatioType.STEP_UP);
      const result = ratio.to(RatioType.REDUCTION);
      expect(result.magnitude).toBeCloseTo(1 / 5);
      expect(result.ratioType).toBe(RatioType.REDUCTION);
    });

    it('handles zero magnitude conversion', () => {
      const ratio = new Ratio(0, RatioType.REDUCTION);
      const result = ratio.to(RatioType.STEP_UP);
      expect(result.magnitude).toBe(Infinity);
    });

    it('handles negative magnitude conversion', () => {
      const ratio = new Ratio(-5, RatioType.REDUCTION);
      const result = ratio.to(RatioType.STEP_UP);
      expect(result.magnitude).toBeCloseTo(1 / -5);
    });

    it('handles very large magnitude conversion', () => {
      const ratio = new Ratio(1e15, RatioType.REDUCTION);
      const result = ratio.to(RatioType.STEP_UP);
      expect(result.magnitude).toBeCloseTo(1 / 1e15);
    });

    it('handles very small magnitude conversion', () => {
      const ratio = new Ratio(1e-15, RatioType.REDUCTION);
      const result = ratio.to(RatioType.STEP_UP);
      expect(result.magnitude).toBeCloseTo(1 / 1e-15);
    });

    it('round-trip conversion maintains numeric value', () => {
      const ratio = new Ratio(5, RatioType.REDUCTION);
      const converted = ratio.to(RatioType.STEP_UP);
      const back = converted.to(RatioType.REDUCTION);
      expect(back.asNumber()).toBeCloseTo(ratio.asNumber());
    });
  });

  describe('toDict', () => {
    it('returns correct dict structure', () => {
      const ratio = new Ratio(5, RatioType.REDUCTION);
      const dict = ratio.toDict();
      expect(dict.magnitude).toBe(5);
      expect(dict.ratioType).toBe(RatioType.REDUCTION);
    });

    it('handles zero magnitude', () => {
      const ratio = new Ratio(0);
      const dict = ratio.toDict();
      expect(dict.magnitude).toBe(0);
    });

    it('handles negative magnitude', () => {
      const ratio = new Ratio(-5);
      const dict = ratio.toDict();
      expect(dict.magnitude).toBe(-5);
    });

    it('handles STEP_UP type', () => {
      const ratio = new Ratio(5, RatioType.STEP_UP);
      const dict = ratio.toDict();
      expect(dict.ratioType).toBe(RatioType.STEP_UP);
    });
  });

  describe('fromDict', () => {
    it('creates ratio from valid dict', () => {
      const dict = { magnitude: 5, ratioType: RatioType.REDUCTION };
      const ratio = Ratio.fromDict(dict);
      expect(ratio.magnitude).toBe(5);
      expect(ratio.ratioType).toBe(RatioType.REDUCTION);
    });

    it('handles zero magnitude', () => {
      const dict = { magnitude: 0, ratioType: RatioType.REDUCTION };
      const ratio = Ratio.fromDict(dict);
      expect(ratio.magnitude).toBe(0);
    });

    it('handles negative magnitude', () => {
      const dict = { magnitude: -5, ratioType: RatioType.REDUCTION };
      const ratio = Ratio.fromDict(dict);
      expect(ratio.magnitude).toBe(-5);
    });

    it('handles STEP_UP type', () => {
      const dict = { magnitude: 5, ratioType: RatioType.STEP_UP };
      const ratio = Ratio.fromDict(dict);
      expect(ratio.ratioType).toBe(RatioType.STEP_UP);
    });

    it('round-trip serialization maintains values', () => {
      const ratio = new Ratio(5, RatioType.REDUCTION);
      const dict = ratio.toDict();
      const restored = Ratio.fromDict(dict);
      expect(restored.magnitude).toBe(ratio.magnitude);
      expect(restored.ratioType).toBe(ratio.ratioType);
    });
  });

  describe('eq', () => {
    it('returns true for equal ratios', () => {
      const ratio1 = new Ratio(5, RatioType.REDUCTION);
      const ratio2 = new Ratio(5, RatioType.REDUCTION);
      expect(ratio1.eq(ratio2)).toBe(true);
    });

    it('returns false for different magnitudes', () => {
      const ratio1 = new Ratio(5, RatioType.REDUCTION);
      const ratio2 = new Ratio(6, RatioType.REDUCTION);
      expect(ratio1.eq(ratio2)).toBe(false);
    });

    it('returns false for different types', () => {
      const ratio1 = new Ratio(5, RatioType.REDUCTION);
      const ratio2 = new Ratio(5, RatioType.STEP_UP);
      expect(ratio1.eq(ratio2)).toBe(false);
    });

    it('returns false for different types but same numeric value', () => {
      const ratio1 = new Ratio(5, RatioType.REDUCTION);
      const ratio2 = new Ratio(1 / 5, RatioType.STEP_UP);
      expect(ratio1.eq(ratio2)).toBe(false);
    });

    it('returns false for different types', () => {
      const ratio = new Ratio(5, RatioType.REDUCTION);
      const other = {} as Model;
      expect(ratio.eq(other)).toBe(false);
    });

    it('handles zero magnitude equality', () => {
      const ratio1 = new Ratio(0, RatioType.REDUCTION);
      const ratio2 = new Ratio(0, RatioType.REDUCTION);
      expect(ratio1.eq(ratio2)).toBe(true);
    });

    it('handles negative magnitude equality', () => {
      const ratio1 = new Ratio(-5, RatioType.REDUCTION);
      const ratio2 = new Ratio(-5, RatioType.REDUCTION);
      expect(ratio1.eq(ratio2)).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('handles infinity magnitude', () => {
      const ratio = new Ratio(Infinity, RatioType.REDUCTION);
      expect(ratio.magnitude).toBe(Infinity);
      expect(ratio.asNumber()).toBe(Infinity);
    });

    it('handles negative infinity magnitude', () => {
      const ratio = new Ratio(-Infinity, RatioType.REDUCTION);
      expect(ratio.magnitude).toBe(-Infinity);
      expect(ratio.asNumber()).toBe(-Infinity);
    });

    it('handles NaN magnitude', () => {
      const ratio = new Ratio(NaN, RatioType.REDUCTION);
      expect(Number.isNaN(ratio.magnitude)).toBe(true);
      expect(Number.isNaN(ratio.asNumber())).toBe(true);
    });

    it('handles very small positive magnitude', () => {
      const ratio = new Ratio(Number.MIN_VALUE, RatioType.REDUCTION);
      expect(ratio.magnitude).toBe(Number.MIN_VALUE);
    });

    it('handles very large positive magnitude', () => {
      const ratio = new Ratio(Number.MAX_VALUE, RatioType.REDUCTION);
      expect(ratio.magnitude).toBe(Number.MAX_VALUE);
    });
  });
});

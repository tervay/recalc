import { describe, expect, it } from 'vitest';

import Measurement from '~/lib/models/Measurement';
import Model from '~/lib/models/Model';

describe('Measurement', () => {
  describe('constructor', () => {
    it('handles zero magnitude', () => {
      const m = new Measurement(0, 'in');
      expect(m.scalar).toBe(0);
      expect(m.units()).toBe('in');
    });

    it('handles negative magnitude', () => {
      const m = new Measurement(-5, 'in');
      expect(m.scalar).toBe(-5);
    });

    it('handles very large magnitude', () => {
      const m = new Measurement(1e15, 'in');
      expect(m.scalar).toBe(1e15);
    });

    it('handles very small magnitude', () => {
      const m = new Measurement(1e-15, 'in');
      expect(m.scalar).toBe(1e-15);
    });

    it('handles undefined units', () => {
      const m = new Measurement(5);
      expect(m.scalar).toBe(5);
    });
  });

  describe('add', () => {
    it('handles adding zero Measurement', () => {
      const m1 = new Measurement(5, 'in');
      const m2 = new Measurement(0, 'in');
      const result = m1.add(m2);
      expect(result.scalar).toBe(5);
    });

    it('handles adding zero number', () => {
      const m = new Measurement(5, 'in');
      const result = m.add(0);
      expect(result.scalar).toBe(5);
    });

    it('handles adding negative Measurement', () => {
      const m1 = new Measurement(5, 'in');
      const m2 = new Measurement(-3, 'in');
      const result = m1.add(m2);
      expect(result.scalar).toBe(2);
    });

    it('handles adding negative number', () => {
      const m = new Measurement(5, 'in');
      const result = m.add(-3);
      expect(result.scalar).toBe(2);
    });

    it('throws error with incompatible units', () => {
      const m1 = new Measurement(5, 'in');
      const m2 = new Measurement(3, 'kg');
      expect(() => m1.add(m2)).toThrow();
    });
  });

  describe('sub', () => {
    it('handles subtracting zero Measurement', () => {
      const m1 = new Measurement(5, 'in');
      const m2 = new Measurement(0, 'in');
      const result = m1.sub(m2);
      expect(result.scalar).toBe(5);
    });

    it('handles subtracting zero number', () => {
      const m = new Measurement(5, 'in');
      const result = m.sub(0);
      expect(result.scalar).toBe(5);
    });

    it('handles subtracting negative Measurement', () => {
      const m1 = new Measurement(5, 'in');
      const m2 = new Measurement(-3, 'in');
      const result = m1.sub(m2);
      expect(result.scalar).toBe(8);
    });

    it('handles subtracting negative number', () => {
      const m = new Measurement(5, 'in');
      const result = m.sub(-3);
      expect(result.scalar).toBe(8);
    });

    it('throws error with incompatible units', () => {
      const m1 = new Measurement(5, 'in');
      const m2 = new Measurement(3, 'kg');
      expect(() => m1.sub(m2)).toThrow();
    });
  });

  describe('mul', () => {
    it('handles multiplying by zero Measurement', () => {
      const m1 = new Measurement(5, 'in');
      const m2 = new Measurement(0, 'in');
      const result = m1.mul(m2);
      expect(result.scalar).toBe(0);
    });

    it('handles multiplying by zero number', () => {
      const m = new Measurement(5, 'in');
      const result = m.mul(0);
      expect(result.scalar).toBe(0);
    });

    it('handles multiplying by negative Measurement', () => {
      const m1 = new Measurement(5, 'in');
      const m2 = new Measurement(-2, 'in');
      const result = m1.mul(m2);
      expect(result.scalar).toBe(-10);
    });

    it('handles multiplying by negative number', () => {
      const m = new Measurement(5, 'in');
      const result = m.mul(-2);
      expect(result.scalar).toBe(-10);
    });

    it('handles multiplying by very large number', () => {
      const m = new Measurement(5, 'in');
      const result = m.mul(1e15);
      expect(result.scalar).toBe(5e15);
    });

    it('handles multiplying by very small number', () => {
      const m = new Measurement(5, 'in');
      const result = m.mul(1e-15);
      expect(result.scalar).toBeCloseTo(5e-15);
    });
  });

  describe('div', () => {
    it('handles dividing by zero number', () => {
      const m = new Measurement(5, 'in');
      expect(() => m.div(0)).toThrow();
    });

    it('handles dividing by zero Measurement', () => {
      const m1 = new Measurement(5, 'in');
      const m2 = new Measurement(0, 'in');
      expect(() => m1.div(m2)).toThrow();
    });

    it('handles dividing by negative Measurement', () => {
      const m1 = new Measurement(10, 'in');
      const m2 = new Measurement(-2, 'in');
      const result = m1.div(m2);
      expect(result.scalar).toBe(-5);
    });

    it('handles dividing by negative number', () => {
      const m = new Measurement(10, 'in');
      const result = m.div(-2);
      expect(result.scalar).toBe(-5);
    });

    it('handles dividing by very large number', () => {
      const m = new Measurement(5, 'in');
      const result = m.div(1e15);
      expect(result.scalar).toBe(5e-15);
    });

    it('handles dividing by very small number', () => {
      const m = new Measurement(5, 'in');
      const result = m.div(1e-15);
      expect(result.scalar).toBe(5e15);
    });

    it('handles dividing zero by non-zero', () => {
      const m = new Measurement(0, 'in');
      const result = m.div(5);
      expect(result.scalar).toBe(0);
    });
  });

  describe('comparison methods', () => {
    it('lt handles zero values', () => {
      const m1 = new Measurement(0, 'in');
      const m2 = new Measurement(5, 'in');
      expect(m1.lt(m2)).toBe(true);
      expect(m2.lt(m1)).toBe(false);
    });

    it('lte handles equal values', () => {
      const m1 = new Measurement(5, 'in');
      const m2 = new Measurement(5, 'in');
      expect(m1.lte(m2)).toBe(true);
    });

    it('gt handles negative values', () => {
      const m1 = new Measurement(-5, 'in');
      const m2 = new Measurement(5, 'in');
      expect(m2.gt(m1)).toBe(true);
      expect(m1.gt(m2)).toBe(false);
    });

    it('gte handles equal values', () => {
      const m1 = new Measurement(5, 'in');
      const m2 = new Measurement(5, 'in');
      expect(m1.gte(m2)).toBe(true);
    });
  });

  describe('static min', () => {
    it('returns first when equal', () => {
      const m1 = new Measurement(5, 'in');
      const m2 = new Measurement(5, 'in');
      const result = Measurement.min(m1, m2);
      expect(result.scalar).toBe(m1.scalar);
      expect(result.units()).toBe(m1.units());
    });

    it('handles negative values', () => {
      const m1 = new Measurement(-5, 'in');
      const m2 = new Measurement(5, 'in');
      const result = Measurement.min(m1, m2);
      expect(result).toBe(m1);
    });
  });

  describe('static max', () => {
    it('returns first when equal', () => {
      const m1 = new Measurement(5, 'in');
      const m2 = new Measurement(5, 'in');
      const result = Measurement.max(m1, m2);
      expect(result.scalar).toBe(m1.scalar);
      expect(result.units()).toBe(m1.units());
    });

    it('handles negative values', () => {
      const m1 = new Measurement(-5, 'in');
      const m2 = new Measurement(5, 'in');
      const result = Measurement.max(m1, m2);
      expect(result).toBe(m2);
    });
  });

  describe('static maxAll', () => {
    it('handles empty array', () => {
      const result = Measurement.maxAll([]);
      expect(result).toBeUndefined();
    });

    it('handles single element', () => {
      const m = new Measurement(5, 'in');
      const result = Measurement.maxAll([m]);
      expect(result).toBe(m);
    });

    it('handles all negative values', () => {
      const ms = [
        new Measurement(-5, 'in'),
        new Measurement(-3, 'in'),
        new Measurement(-10, 'in'),
      ];
      const result = Measurement.maxAll(ms);
      expect(result.scalar).toBe(-3);
    });

    it('handles mixed positive and negative', () => {
      const ms = [
        new Measurement(-5, 'in'),
        new Measurement(3, 'in'),
        new Measurement(-10, 'in'),
      ];
      const result = Measurement.maxAll(ms);
      expect(result.scalar).toBe(3);
    });
  });

  describe('static minAll', () => {
    it('handles empty array', () => {
      const result = Measurement.minAll([]);
      expect(result).toBeUndefined();
    });

    it('handles single element', () => {
      const m = new Measurement(5, 'in');
      const result = Measurement.minAll([m]);
      expect(result).toBe(m);
    });

    it('handles all negative values', () => {
      const ms = [
        new Measurement(-5, 'in'),
        new Measurement(-3, 'in'),
        new Measurement(-10, 'in'),
      ];
      const result = Measurement.minAll(ms);
      expect(result.scalar).toBe(-10);
    });
  });

  describe('clamp', () => {
    it('returns floor when value is below floor', () => {
      const m = new Measurement(5, 'in');
      const floor = new Measurement(10, 'in');
      const ceiling = new Measurement(20, 'in');
      const result = m.clamp(floor, ceiling);
      expect(result).toBe(floor);
    });

    it('returns ceiling when value is above ceiling', () => {
      const m = new Measurement(25, 'in');
      const floor = new Measurement(10, 'in');
      const ceiling = new Measurement(20, 'in');
      const result = m.clamp(floor, ceiling);
      expect(result).toBe(ceiling);
    });

    it('returns value when within range', () => {
      const m = new Measurement(15, 'in');
      const floor = new Measurement(10, 'in');
      const ceiling = new Measurement(20, 'in');
      const result = m.clamp(floor, ceiling);
      expect(result).toBe(m);
    });

    it('handles inverted floor and ceiling', () => {
      const m = new Measurement(15, 'in');
      const floor = new Measurement(20, 'in');
      const ceiling = new Measurement(10, 'in');
      const result = m.clamp(floor, ceiling);
      expect(result.scalar).toBe(20);
    });

    it('handles negative values', () => {
      const m = new Measurement(-5, 'in');
      const floor = new Measurement(-10, 'in');
      const ceiling = new Measurement(10, 'in');
      const result = m.clamp(floor, ceiling);
      expect(result).toBe(m);
    });
  });

  describe('inverse', () => {
    it('handles zero value', () => {
      const m = new Measurement(0, 'in');
      expect(() => m.inverse()).toThrow();
    });

    it('handles negative value', () => {
      const m = new Measurement(-5, 'in');
      const result = m.inverse();
      expect(result.scalar).toBeCloseTo(-0.2);
    });

    it('handles very small value', () => {
      const m = new Measurement(1e-10, 'in');
      const result = m.inverse();
      expect(result.scalar).toBe(1e10);
    });
  });

  describe('abs', () => {
    it('handles positive value', () => {
      const m = new Measurement(5, 'in');
      const result = m.abs();
      expect(result.scalar).toBe(5);
    });

    it('handles negative value', () => {
      const m = new Measurement(-5, 'in');
      const result = m.abs();
      expect(result.scalar).toBe(5);
    });

    it('handles zero', () => {
      const m = new Measurement(0, 'in');
      const result = m.abs();
      expect(result.scalar).toBe(0);
    });
  });

  describe('negate', () => {
    it('handles positive value', () => {
      const m = new Measurement(5, 'in');
      const result = m.negate();
      expect(result.scalar).toBe(-5);
    });

    it('handles negative value', () => {
      const m = new Measurement(-5, 'in');
      const result = m.negate();
      expect(result.scalar).toBe(5);
    });

    it('handles zero', () => {
      const m = new Measurement(0, 'in');
      const result = m.negate();
      expect(result.scalar).toBe(-0);
    });
  });

  describe('forcePositive', () => {
    it('handles positive value', () => {
      const m = new Measurement(5, 'in');
      const result = m.forcePositive();
      expect(result.scalar).toBe(5);
    });

    it('handles negative value', () => {
      const m = new Measurement(-5, 'in');
      const result = m.forcePositive();
      expect(result.scalar).toBe(0);
    });

    it('handles zero', () => {
      const m = new Measurement(0, 'in');
      const result = m.forcePositive();
      expect(result.scalar).toBe(0);
    });
  });

  describe('round', () => {
    it('handles zero decimal places', () => {
      const m = new Measurement(5.678, 'in');
      const result = m.round(0);
      expect(result.scalar).toBe(6);
    });

    it('handles negative decimal places', () => {
      const m = new Measurement(5.678, 'in');
      expect(() => m.round(-1)).toThrow();
    });

    it('handles very large number of decimal places', () => {
      const m = new Measurement(5.123456789, 'in');
      const result = m.round(10);
      expect(result.scalar).toBe(5.123456789);
    });
  });

  describe('toPrecision', () => {
    it('handles zero precision', () => {
      const m = new Measurement(5.678, 'in');
      expect(() => m.toPrecision(0)).toThrow();
    });

    it('handles negative precision', () => {
      const m = new Measurement(5.678, 'in');
      const result = m.toPrecision(-1);
      expect(result.scalar).toBeGreaterThanOrEqual(0);
    });
  });

  describe('to', () => {
    it('handles unit conversion', () => {
      const m = new Measurement(12, 'in');
      const result = m.to('ft');
      expect(result.scalar).toBe(1);
    });

    it('handles incompatible unit conversion', () => {
      const m = new Measurement(5, 'in');
      expect(() => m.to('kg')).toThrow();
    });
  });

  describe('fromDict', () => {
    it('handles valid dict', () => {
      const dict = { s: 5, u: 'in' };
      const m = Measurement.fromDict(dict);
      expect(m.scalar).toBe(5);
      expect(m.units()).toBe('in');
    });

    it('handles zero scalar', () => {
      const dict = { s: 0, u: 'in' };
      const m = Measurement.fromDict(dict);
      expect(m.scalar).toBe(0);
    });

    it('handles negative scalar', () => {
      const dict = { s: -5, u: 'in' };
      const m = Measurement.fromDict(dict);
      expect(m.scalar).toBe(-5);
    });

    it('handles empty units string', () => {
      const dict = { s: 5, u: '' };
      const m = Measurement.fromDict(dict);
      expect(m.scalar).toBe(5);
    });
  });

  describe('toDict', () => {
    it('returns correct dict structure', () => {
      const m = new Measurement(5, 'in');
      const dict = m.toDict();
      expect(dict).toEqual({ s: 5, u: 'in' });
    });

    it('handles zero value', () => {
      const m = new Measurement(0, 'in');
      const dict = m.toDict();
      expect(dict).toEqual({ s: 0, u: 'in' });
    });
  });

  describe('eq', () => {
    it('returns true for equal measurements', () => {
      const m1 = new Measurement(5, 'in');
      const m2 = new Measurement(5, 'in');
      expect(m1.eq(m2)).toBe(true);
    });

    it('returns false for different types', () => {
      const m = new Measurement(5, 'in');
      const other = {} as Model;
      expect(m.eq(other)).toBe(false);
    });

    it('returns false for different values', () => {
      const m1 = new Measurement(5, 'in');
      const m2 = new Measurement(6, 'in');
      expect(m1.eq(m2)).toBe(false);
    });

    it('returns true for equivalent units', () => {
      const m1 = new Measurement(12, 'in');
      const m2 = new Measurement(1, 'ft');
      expect(m1.eq(m2)).toBe(true);
    });
  });

  describe('copy', () => {
    it('creates independent copy', () => {
      const m1 = new Measurement(5, 'in');
      const m2 = m1.copy();
      expect(m2.scalar).toBe(m1.scalar);
      expect(m2.units()).toBe(m1.units());
      expect(m2).not.toBe(m1);
    });
  });

  describe('static GRAVITY', () => {
    it('returns negative gravity value', () => {
      const g = Measurement.GRAVITY;
      expect(g.scalar).toBe(-9.81);
      expect(g.units()).toMatch(/m\/s2/);
    });
  });

  describe('static anyAreZero', () => {
    it('returns true when any measurement is zero', () => {
      const m1 = new Measurement(5, 'in');
      const m2 = new Measurement(0, 'in');
      const m3 = new Measurement(3, 'in');
      expect(Measurement.anyAreZero(m1, m2, m3)).toBe(true);
    });

    it('returns true when any number is zero', () => {
      expect(Measurement.anyAreZero(5, 0, 3)).toBe(true);
    });

    it('returns false when none are zero', () => {
      const m1 = new Measurement(5, 'in');
      const m2 = new Measurement(3, 'in');
      expect(Measurement.anyAreZero(m1, m2)).toBe(false);
    });

    it('handles empty arguments', () => {
      expect(Measurement.anyAreZero()).toBe(false);
    });
  });

  describe('static CIRCLE_* methods', () => {
    it('CIRCLE_RIGHT returns 0 degrees', () => {
      const m = Measurement.CIRCLE_RIGHT();
      expect(m.scalar).toBe(0);
      expect(m.units()).toBe('deg');
    });

    it('CIRCLE_UP returns 90 degrees', () => {
      const m = Measurement.CIRCLE_UP();
      expect(m.scalar).toBe(90);
    });

    it('CIRCLE_LEFT returns 180 degrees', () => {
      const m = Measurement.CIRCLE_LEFT();
      expect(m.scalar).toBe(180);
    });

    it('CIRCLE_DOWN returns 270 degrees', () => {
      const m = Measurement.CIRCLE_DOWN();
      expect(m.scalar).toBe(270);
    });
  });

  describe('static STANDARD_BREAKER_ESTIMATE_I2T', () => {
    it('returns correct value', () => {
      const result = Measurement.STANDARD_BREAKER_ESTIMATE_I2T();
      expect(result.scalar).toBe(16000);
      expect(result.units()).toMatch(/A2\*s/);
    });
  });

  describe('linearizeRadialPosition', () => {
    it('handles zero inches per revolution', () => {
      const m = new Measurement(1, 'rad');
      const inchesPerRev = new Measurement(0, 'in');
      const result = m.linearizeRadialPosition(inchesPerRev);
      expect(result.scalar).toBe(0);
    });

    it('handles zero radial position', () => {
      const m = new Measurement(0, 'rad');
      const inchesPerRev = new Measurement(2, 'in');
      const result = m.linearizeRadialPosition(inchesPerRev);
      expect(result.scalar).toBe(0);
    });
  });

  describe('radializeLinearPosition', () => {
    it('handles zero inches per revolution', () => {
      const m = new Measurement(5, 'in');
      const inchesPerRev = new Measurement(0, 'in');
      expect(() => m.radializeLinearPosition(inchesPerRev)).toThrow();
    });

    it('handles zero linear position', () => {
      const m = new Measurement(0, 'in');
      const inchesPerRev = new Measurement(2, 'in');
      const result = m.radializeLinearPosition(inchesPerRev);
      expect(result.scalar).toBe(0);
    });
  });

  describe('sign', () => {
    it('returns 1 for positive', () => {
      const m = new Measurement(5, 'in');
      expect(m.sign()).toBe(1);
    });

    it('returns -1 for negative', () => {
      const m = new Measurement(-5, 'in');
      expect(m.sign()).toBe(-1);
    });

    it('returns 0 for zero', () => {
      const m = new Measurement(0, 'in');
      expect(m.sign()).toBe(0);
    });
  });
});

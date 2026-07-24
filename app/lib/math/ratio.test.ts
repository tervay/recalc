import { describe, expect, it } from 'vitest';

import { calculateInverseRatio, calculateNetRatio } from '~/lib/math/ratio';
import type { RatioPair } from '~/lib/types/queryParams';

describe('calculateNetRatio', () => {
  it('calculates net ratio for single stage', () => {
    const pairs: RatioPair[] = [[18, 72]];
    const result = calculateNetRatio(pairs);
    expect(result).toBeCloseTo(0.25, 3);
  });

  it('calculates net ratio for multiple stages', () => {
    const pairs: RatioPair[] = [
      [18, 72],
      [24, 48],
    ];
    const result = calculateNetRatio(pairs);
    expect(result).toBeCloseTo(0.125, 3);
  });

  it('calculates net ratio for step-up', () => {
    const pairs: RatioPair[] = [[72, 18]];
    const result = calculateNetRatio(pairs);
    expect(result).toBeCloseTo(4.0, 3);
  });

  it('handles 1:1 ratio', () => {
    const pairs: RatioPair[] = [[1, 1]];
    const result = calculateNetRatio(pairs);
    expect(result).toBe(1);
  });

  it('handles multiple 1:1 ratios', () => {
    const pairs: RatioPair[] = [
      [1, 1],
      [1, 1],
      [1, 1],
    ];
    const result = calculateNetRatio(pairs);
    expect(result).toBe(1);
  });

  it('returns 1 for empty array', () => {
    const pairs: RatioPair[] = [];
    const result = calculateNetRatio(pairs);
    expect(result).toBe(1);
  });

  it('handles zero driven (divide by zero)', () => {
    const pairs: RatioPair[] = [[18, 0]];
    const result = calculateNetRatio(pairs);
    expect(result).toBe(0);
  });

  it('handles zero driving', () => {
    const pairs: RatioPair[] = [[0, 72]];
    const result = calculateNetRatio(pairs);
    expect(result).toBe(0);
  });

  it('calculates mixed stages correctly', () => {
    const pairs: RatioPair[] = [
      [10, 50],
      [20, 40],
      [30, 60],
    ];
    const result = calculateNetRatio(pairs);
    expect(result).toBeCloseTo(0.05, 3);
  });
});

describe('calculateInverseRatio', () => {
  it('calculates inverse ratio correctly', () => {
    const result = calculateInverseRatio(0.125);
    expect(result).toBeCloseTo(8.0, 3);
  });

  it('handles 1:1 ratio', () => {
    const result = calculateInverseRatio(1);
    expect(result).toBe(1);
  });

  it('handles step-up ratios', () => {
    const result = calculateInverseRatio(4);
    expect(result).toBeCloseTo(0.25, 3);
  });

  it('returns 0 for zero input', () => {
    const result = calculateInverseRatio(0);
    expect(result).toBe(0);
  });

  it('handles very small ratios', () => {
    const result = calculateInverseRatio(0.001);
    expect(result).toBeCloseTo(1000.0, 3);
  });

  it('handles very large ratios', () => {
    const result = calculateInverseRatio(1000);
    expect(result).toBeCloseTo(0.001, 3);
  });
});

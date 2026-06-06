import { describe, expect, it } from 'vitest';

import { roundToNearestMultiple } from '~/lib/utils';

describe('roundToNearestMultiple', () => {
  it('rounds up to nearest multiple', () => {
    expect(roundToNearestMultiple(7, 5)).toBe(10);
    expect(roundToNearestMultiple(13, 5)).toBe(15);
    expect(roundToNearestMultiple(22, 10)).toBe(30);
  });

  it('returns the number if it is already a multiple', () => {
    expect(roundToNearestMultiple(10, 5)).toBe(10);
    expect(roundToNearestMultiple(15, 5)).toBe(15);
    expect(roundToNearestMultiple(20, 10)).toBe(20);
  });

  it('handles zero correctly', () => {
    expect(roundToNearestMultiple(0, 5)).toBe(0);
    expect(roundToNearestMultiple(0, 10)).toBe(0);
  });

  it('handles numbers smaller than the multiple', () => {
    expect(roundToNearestMultiple(3, 5)).toBe(5);
    expect(roundToNearestMultiple(1, 10)).toBe(10);
    expect(roundToNearestMultiple(0.5, 1)).toBe(1);
  });

  it('handles decimal numbers', () => {
    expect(roundToNearestMultiple(7.3, 5)).toBe(10);
    expect(roundToNearestMultiple(12.7, 5)).toBe(15);
    expect(roundToNearestMultiple(3.14, 1)).toBe(4);
  });

  it('handles negative numbers', () => {
    expect(roundToNearestMultiple(-7, 5)).toBe(-5);
    expect(roundToNearestMultiple(-13, 5)).toBe(-10);
    expect(roundToNearestMultiple(-22, 10)).toBe(-20);
  });

  it('handles negative multiples', () => {
    // Math.ceil rounds up, so with negative multiples:
    // 7 / -5 = -1.4, ceil(-1.4) = -1, -1 * -5 = 5
    expect(roundToNearestMultiple(7, -5)).toBe(5);
    // -7 / -5 = 1.4, ceil(1.4) = 2, 2 * -5 = -10
    expect(roundToNearestMultiple(-7, -5)).toBe(-10);
  });

  it('handles very large numbers', () => {
    expect(roundToNearestMultiple(1000001, 1000)).toBe(1001000);
    expect(roundToNearestMultiple(999999, 1000)).toBe(1000000);
  });

  it('handles very small multiples', () => {
    expect(roundToNearestMultiple(0.7, 0.1)).toBeCloseTo(0.7, 10);
    expect(roundToNearestMultiple(0.75, 0.1)).toBeCloseTo(0.8, 10);
  });
});

import { describe, expect, it } from 'vitest';

import { range, roundToNearestMultiple, toFixed } from '~/lib/utils';

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

describe('range', () => {
  it('returns a normal ascending range inclusive of both endpoints', () => {
    expect(range(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(range(0, 3)).toEqual([0, 1, 2, 3]);
    expect(range(10, 13)).toEqual([10, 11, 12, 13]);
  });

  it('returns a single-element array when min === max', () => {
    expect(range(3, 3)).toEqual([3]);
    expect(range(0, 0)).toEqual([0]);
    expect(range(-1, -1)).toEqual([-1]);
  });

  it('handles ranges that include zero and negative bounds', () => {
    expect(range(-2, 2)).toEqual([-2, -1, 0, 1, 2]);
    expect(range(-3, 0)).toEqual([-3, -2, -1, 0]);
    expect(range(-5, -3)).toEqual([-5, -4, -3]);
  });

  it('returns an empty array when max < min (negative length coerces to 0)', () => {
    // Array.from({ length: max - min + 1 }, ...) with a negative length
    // silently coerces to length 0, producing an empty array.
    expect(range(5, 1)).toEqual([]);
    expect(range(0, -1)).toEqual([]);
    expect(range(10, 5)).toEqual([]);
  });
});

describe('toFixed', () => {
  it('rounds to SNAPSHOT_PRECISION (5) when precision is omitted', () => {
    expect(toFixed(3.14159265)).toBe(3.14159);
    expect(toFixed(2.718281828)).toBe(2.71828);
    expect(toFixed(1.0)).toBe(1);
  });

  it('rounds to an explicit precision', () => {
    expect(toFixed(3.14159, 2)).toBe(3.14);
    expect(toFixed(3.14159, 4)).toBe(3.1416);
    expect(toFixed(3.14159, 0)).toBe(3);
  });

  it('returns a number, not a string', () => {
    expect(typeof toFixed(3.14159)).toBe('number');
    expect(typeof toFixed(1.5, 0)).toBe('number');
  });

  it('handles precision 0', () => {
    expect(toFixed(1.5, 0)).toBe(2);
    expect(toFixed(1.4, 0)).toBe(1);
    expect(toFixed(42.9, 0)).toBe(43);
  });

  it('handles values that need no rounding', () => {
    expect(toFixed(3, 2)).toBe(3);
    expect(toFixed(1.5, 5)).toBe(1.5);
    expect(toFixed(0, 3)).toBe(0);
  });

  it('documents IEEE 754 rounding at the boundary: 1.005 rounds down at precision 2', () => {
    // 1.005 cannot be represented exactly in IEEE 754 — it is stored as
    // slightly less than 1.005, so (1.005).toFixed(2) yields "1.00", not "1.01".
    // parseFloat("1.00") === 1, which is what this function returns.
    expect(toFixed(1.005, 2)).toBe(1);
  });
});

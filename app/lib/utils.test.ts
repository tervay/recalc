import { describe, expect, it } from 'vitest';

import { obliterateArray, roundToNearestMultiple } from '~/lib/utils';

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

describe('obliterateArray', () => {
  it('returns every 3rd element with first and last', () => {
    const arr = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    const result = obliterateArray(arr, 3);
    expect(result).toEqual([0, 3, 6, 8]);
  });

  it('returns every 5th element with first and last', () => {
    const arr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const result = obliterateArray(arr, 5);
    expect(result).toEqual([0, 5, 10, 12]);
  });

  it('does not duplicate last element if already included', () => {
    const arr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const result = obliterateArray(arr, 3);
    expect(result).toEqual([0, 3, 6, 9]);
  });

  it('handles empty array', () => {
    const result = obliterateArray([], 3);
    expect(result).toEqual([]);
  });

  it('handles single element array', () => {
    const result = obliterateArray([42], 3);
    expect(result).toEqual([42]);
  });

  it('handles array shorter than n', () => {
    const arr = [0, 1, 2];
    const result = obliterateArray(arr, 5);
    expect(result).toEqual([0, 2]);
  });

  it('handles array with exactly n elements', () => {
    const arr = [0, 1, 2];
    const result = obliterateArray(arr, 3);
    expect(result).toEqual([0, 2]);
  });

  it('handles array with n+1 elements', () => {
    const arr = [0, 1, 2, 3];
    const result = obliterateArray(arr, 3);
    expect(result).toEqual([0, 3]);
  });

  it('handles n = 1 (every element)', () => {
    const arr = [0, 1, 2, 3, 4];
    const result = obliterateArray(arr, 1);
    expect(result).toEqual([0, 1, 2, 3, 4]);
  });

  it('handles n = 2 (every other element)', () => {
    const arr = [0, 1, 2, 3, 4, 5];
    const result = obliterateArray(arr, 2);
    expect(result).toEqual([0, 2, 4, 5]);
  });

  it('handles n = 0 by returning original array', () => {
    const arr = [0, 1, 2, 3];
    const result = obliterateArray(arr, 0);
    expect(result).toEqual([0, 1, 2, 3]);
  });

  it('handles negative n by returning original array', () => {
    const arr = [0, 1, 2, 3];
    const result = obliterateArray(arr, -5);
    expect(result).toEqual([0, 1, 2, 3]);
  });

  it('works with string arrays', () => {
    const arr = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
    const result = obliterateArray(arr, 3);
    expect(result).toEqual(['a', 'd', 'g']);
  });

  it('works with object arrays', () => {
    const arr = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }];
    const result = obliterateArray(arr, 2);
    expect(result).toEqual([{ id: 1 }, { id: 3 }, { id: 5 }]);
  });

  it('preserves object references', () => {
    const obj1 = { id: 1 };
    const obj2 = { id: 2 };
    const obj3 = { id: 3 };
    const arr = [obj1, obj2, obj3];
    const result = obliterateArray(arr, 2);
    expect(result[0]).toBe(obj1);
    expect(result[1]).toBe(obj3);
  });

  it('handles large n value', () => {
    const arr = [0, 1, 2, 3, 4, 5];
    const result = obliterateArray(arr, 100);
    expect(result).toEqual([0, 5]);
  });

  it('handles array where last element is at index n', () => {
    const arr = [0, 1, 2, 3, 4];
    const result = obliterateArray(arr, 4);
    expect(result).toEqual([0, 4]);
  });
});

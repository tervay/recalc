import { describe, expect, it } from 'vitest';

import { calculateSpacing } from '~/lib/math/gears';

describe('calculateSpacing', () => {
  it('calculates spacing for 20T + 40T at DP 20', () => {
    // (20/20/2) + (40/20/2) = 0.5 + 1.0 = 1.5 in
    const result = calculateSpacing(20, 40, 20);
    expect(result.to('in').scalar).toBeCloseTo(1.5, 10);
    expect(result.units()).toBe('in');
  });

  it('calculates spacing for equal gears 18T + 18T at DP 32', () => {
    // (18/32/2) + (18/32/2) = 0.28125 + 0.28125 = 0.5625 in
    const result = calculateSpacing(18, 18, 32);
    expect(result.to('in').scalar).toBeCloseTo(0.5625, 10);
  });

  it('calculates spacing for 12T + 60T at DP 12', () => {
    // (12/12/2) + (60/12/2) = 0.5 + 2.5 = 3.0 in
    const result = calculateSpacing(12, 60, 12);
    expect(result.to('in').scalar).toBeCloseTo(3.0, 10);
  });

  it('calculates spacing for decimal values: 24T + 48T at DP 16', () => {
    // (24/16/2) + (48/16/2) = 0.75 + 1.5 = 2.25 in
    const result = calculateSpacing(24, 48, 16);
    expect(result.to('in').scalar).toBeCloseTo(2.25, 10);
  });

  it('returns Measurement(0, in) when gear1Teeth is 0', () => {
    const result = calculateSpacing(0, 40, 20);
    expect(result.to('in').scalar).toBe(0);
    expect(result.units()).toBe('in');
  });

  it('returns Measurement(0, in) when gear2Teeth is 0', () => {
    const result = calculateSpacing(20, 0, 20);
    expect(result.to('in').scalar).toBe(0);
    expect(result.units()).toBe('in');
  });

  it('returns Measurement(0, in) when gearDP is 0', () => {
    const result = calculateSpacing(20, 40, 0);
    expect(result.to('in').scalar).toBe(0);
    expect(result.units()).toBe('in');
  });

  it('result is symmetric: swapping gear1 and gear2 yields same spacing', () => {
    const result1 = calculateSpacing(20, 40, 20);
    const result2 = calculateSpacing(40, 20, 20);
    expect(result1.to('in').scalar).toBeCloseTo(result2.to('in').scalar, 10);
  });
});

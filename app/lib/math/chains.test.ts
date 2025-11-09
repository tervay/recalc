import { describe, expect, it } from 'vitest';

import { calculateCenterDistance, calculateCenters } from '~/lib/math/chains';
import Measurement from '~/lib/models/Measurement';

describe('calculateCenterDistance', () => {
  it('calculates center distance correctly', () => {
    const result = calculateCenterDistance('#25', 20, 30, 50);

    expect(result.to('in').scalar).toBeCloseTo(3.099, 3);
  });

  it('handles zero teeth for p1', () => {
    const result = calculateCenterDistance('#25', 0, 30, 50);

    expect(result.to('in').scalar).toBeCloseTo(4.206, 3);
  });

  it('handles zero teeth for p2', () => {
    const result = calculateCenterDistance('#25', 20, 0, 50);

    expect(result.to('in').scalar).toBeCloseTo(4.936, 3);
  });

  it('handles zero links', () => {
    const result = calculateCenterDistance('#25', 20, 30, 0);

    expect(result.to('in').scalar).toBeCloseTo(-0.026, 3);
  });

  it('handles equal sprockets', () => {
    const result = calculateCenterDistance('#25', 20, 20, 50);

    expect(result.to('in').scalar).toBeCloseTo(3.75, 3);
  });

  it('works with different chain types', () => {
    const result25 = calculateCenterDistance('#25', 20, 30, 50);
    const result35 = calculateCenterDistance('#35', 20, 30, 50);
    const result40 = calculateCenterDistance('#40', 20, 30, 50);

    expect(result25.to('in').scalar).toBeCloseTo(3.099, 3);
    expect(result35.to('in').scalar).toBeCloseTo(4.649, 3);
    expect(result40.to('in').scalar).toBeCloseTo(6.199, 3);
    expect(result40.to('in').scalar).toBeGreaterThan(result25.to('in').scalar);
  });

  it('handles very small number of links', () => {
    const result = calculateCenterDistance('#25', 20, 30, 10);

    expect(result.to('in').scalar).toBeCloseTo(-0.043, 3);
  });

  it('handles large number of links', () => {
    const result = calculateCenterDistance('#25', 20, 30, 200);

    expect(result.to('in').scalar).toBeCloseTo(21.871, 3);
  });
});

describe('calculateCenters', () => {
  it('calculates centers correctly', () => {
    const result = calculateCenters(
      '#25',
      20,
      30,
      new Measurement(10, 'in'),
      false,
    );

    expect(result.larger.distance.to('in').scalar).toBeCloseTo(10.117, 3);
    expect(result.smaller.distance.to('in').scalar).toBeCloseTo(9.867, 3);
    expect(result.larger.links).toBe(106);
    expect(result.smaller.links).toBe(104);
  });

  it('handles zero desired center', () => {
    const result = calculateCenters(
      '#25',
      20,
      30,
      new Measurement(0, 'in'),
      false,
    );

    expect(result.larger.distance.to('in').scalar).toBe(0);
    expect(result.smaller.distance.to('in').scalar).toBe(0);
    expect(result.larger.links).toBe(0);
    expect(result.smaller.links).toBe(0);
  });

  it('handles zero teeth for p1', () => {
    const result = calculateCenters(
      '#25',
      0,
      30,
      new Measurement(10, 'in'),
      false,
    );

    expect(result.larger.distance.to('in').scalar).toBe(0);
    expect(result.smaller.distance.to('in').scalar).toBe(0);
    expect(result.larger.links).toBe(0);
    expect(result.smaller.links).toBe(0);
  });

  it('handles zero teeth for p2', () => {
    const result = calculateCenters(
      '#25',
      20,
      0,
      new Measurement(10, 'in'),
      false,
    );

    expect(result.larger.distance.to('in').scalar).toBe(0);
    expect(result.smaller.distance.to('in').scalar).toBe(0);
    expect(result.larger.links).toBe(0);
    expect(result.smaller.links).toBe(0);
  });

  it('handles invalid configuration (pitch diameter too large)', () => {
    const result = calculateCenters(
      '#25',
      200,
      200,
      new Measurement(1, 'in'),
      false,
    );

    expect(result.larger.distance.to('in').scalar).toBe(0);
    expect(result.smaller.distance.to('in').scalar).toBe(0);
    expect(result.larger.links).toBe(0);
    expect(result.smaller.links).toBe(0);
  });

  it('works with allowHalfLinks true', () => {
    const result = calculateCenters(
      '#25',
      20,
      30,
      new Measurement(10, 'in'),
      true,
    );

    expect(result.larger.distance.to('in').scalar).toBeCloseTo(10.117, 3);
    expect(result.smaller.distance.to('in').scalar).toBeCloseTo(9.992, 3);
    expect(result.larger.links).toBe(106);
    expect(result.smaller.links).toBe(105);
  });

  it('works with allowHalfLinks false (rounds to even)', () => {
    const result = calculateCenters(
      '#25',
      20,
      30,
      new Measurement(10, 'in'),
      false,
    );

    expect(result.larger.links).toBe(106);
    expect(result.smaller.links).toBe(104);
    expect(result.larger.links % 2).toBe(0);
    expect(result.smaller.links % 2).toBe(0);
  });

  it('handles equal sprockets', () => {
    const result = calculateCenters(
      '#25',
      20,
      20,
      new Measurement(10, 'in'),
      false,
    );

    expect(result.larger.distance.to('in').scalar).toBeCloseTo(10.0, 3);
    expect(result.smaller.distance.to('in').scalar).toBeCloseTo(10.0, 3);
  });

  it('handles very small desired center', () => {
    const result = calculateCenters(
      '#25',
      20,
      30,
      new Measurement(0.1, 'in'),
      false,
    );

    expect(result.larger.distance.to('in').scalar).toBe(0);
    expect(result.smaller.distance.to('in').scalar).toBe(0);
  });

  it('handles very large desired center', () => {
    const result = calculateCenters(
      '#25',
      20,
      30,
      new Measurement(100, 'in'),
      false,
    );

    expect(result.larger.distance.to('in').scalar).toBeCloseTo(100.124, 3);
    expect(result.smaller.distance.to('in').scalar).toBeCloseTo(99.874, 3);
  });
});

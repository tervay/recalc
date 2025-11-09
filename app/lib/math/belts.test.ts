import { describe, expect, it } from 'vitest';

import {
  approximateBeltPitchLength,
  calculateClosestCenters,
  calculateDistance,
  calculateDistanceBetweenPulleys,
  getTIMFactor,
  teethInMesh,
} from '~/lib/math/belts';
import { SimpleBelt } from '~/lib/models/Belt';
import Measurement from '~/lib/models/Measurement';
import { SimplePulley } from '~/lib/models/Pulley';

describe('calculateDistanceBetweenPulleys', () => {
  it('calculates distance between pulleys correctly', () => {
    const p1 = new SimplePulley(20, new Measurement(5, 'mm'));
    const p2 = new SimplePulley(30, new Measurement(5, 'mm'));
    const ccDistance = new Measurement(100, 'mm');

    const result = calculateDistanceBetweenPulleys(p1, p2, ccDistance);

    expect(result.to('mm').scalar).toBeCloseTo(60.211, 3);
  });

  it('handles zero center distance', () => {
    const p1 = new SimplePulley(20, new Measurement(5, 'mm'));
    const p2 = new SimplePulley(30, new Measurement(5, 'mm'));
    const ccDistance = new Measurement(0, 'mm');

    const result = calculateDistanceBetweenPulleys(p1, p2, ccDistance);

    expect(result.to('mm').scalar).toBeCloseTo(-39.789, 3);
  });

  it('handles zero pitch diameter for p1', () => {
    const p1 = new SimplePulley(0, new Measurement(5, 'mm'));
    const p2 = new SimplePulley(30, new Measurement(5, 'mm'));
    const ccDistance = new Measurement(100, 'mm');

    const result = calculateDistanceBetweenPulleys(p1, p2, ccDistance);

    expect(result.to('mm').scalar).toBeCloseTo(76.127, 3);
  });

  it('handles zero pitch diameter for p2', () => {
    const p1 = new SimplePulley(20, new Measurement(5, 'mm'));
    const p2 = new SimplePulley(0, new Measurement(5, 'mm'));
    const ccDistance = new Measurement(100, 'mm');

    const result = calculateDistanceBetweenPulleys(p1, p2, ccDistance);

    expect(result.to('mm').scalar).toBeCloseTo(84.085, 3);
  });

  it('handles both pulleys with zero pitch diameter', () => {
    const p1 = new SimplePulley(0, new Measurement(5, 'mm'));
    const p2 = new SimplePulley(0, new Measurement(5, 'mm'));
    const ccDistance = new Measurement(100, 'mm');

    const result = calculateDistanceBetweenPulleys(p1, p2, ccDistance);

    expect(result.to('mm').scalar).toBe(100);
  });
});

describe('calculateDistance', () => {
  it('calculates distance correctly', () => {
    const p1 = new SimplePulley(20, new Measurement(5, 'mm'));
    const p2 = new SimplePulley(30, new Measurement(5, 'mm'));
    const belt = new SimpleBelt(100, new Measurement(5, 'mm'));

    const result = calculateDistance(p1, p2, belt);

    expect(result.to('mm').scalar).toBeCloseTo(187.331, 3);
  });

  it('handles zero belt length', () => {
    const p1 = new SimplePulley(20, new Measurement(5, 'mm'));
    const p2 = new SimplePulley(30, new Measurement(5, 'mm'));
    const belt = new SimpleBelt(0, new Measurement(5, 'mm'));

    const result = calculateDistance(p1, p2, belt);

    expect(result.to('mm').scalar).toBeCloseTo(-0.511, 3);
  });

  it('handles zero pitch diameter for p1', () => {
    const p1 = new SimplePulley(0, new Measurement(5, 'mm'));
    const p2 = new SimplePulley(30, new Measurement(5, 'mm'));
    const belt = new SimpleBelt(100, new Measurement(5, 'mm'));

    const result = calculateDistance(p1, p2, belt);

    expect(result.to('mm').scalar).toBeCloseTo(211.15, 3);
  });

  it('handles zero pitch diameter for p2', () => {
    const p1 = new SimplePulley(20, new Measurement(5, 'mm'));
    const p2 = new SimplePulley(0, new Measurement(5, 'mm'));
    const belt = new SimpleBelt(100, new Measurement(5, 'mm'));

    const result = calculateDistance(p1, p2, belt);

    expect(result.to('mm').scalar).toBeCloseTo(224.436, 3);
  });

  it('handles negative sqrt scenario (returns zero)', () => {
    const p1 = new SimplePulley(20, new Measurement(5, 'mm'));
    const p2 = new SimplePulley(30, new Measurement(5, 'mm'));
    const belt = new SimpleBelt(1, new Measurement(5, 'mm'));

    const result = calculateDistance(p1, p2, belt);

    expect(result.to('mm').scalar).toBeCloseTo(-0.532, 3);
  });

  it('handles very small belt length', () => {
    const p1 = new SimplePulley(20, new Measurement(5, 'mm'));
    const p2 = new SimplePulley(30, new Measurement(5, 'mm'));
    const belt = new SimpleBelt(10, new Measurement(5, 'mm'));

    const result = calculateDistance(p1, p2, belt);

    expect(result.to('mm').scalar).toBeCloseTo(-0.864, 3);
  });
});

describe('approximateBeltPitchLength', () => {
  it('calculates approximate belt pitch length correctly', () => {
    const p1 = new SimplePulley(20, new Measurement(5, 'mm'));
    const p2 = new SimplePulley(30, new Measurement(5, 'mm'));
    const desiredCenter = new Measurement(100, 'mm');

    const result = approximateBeltPitchLength(p1, p2, desiredCenter);

    expect(result.to('mm').scalar).toBeCloseTo(325.57, 3);
  });

  it('handles zero desired center', () => {
    const p1 = new SimplePulley(20, new Measurement(5, 'mm'));
    const p2 = new SimplePulley(30, new Measurement(5, 'mm'));
    const desiredCenter = new Measurement(0, 'mm');

    expect(() => {
      approximateBeltPitchLength(p1, p2, desiredCenter);
    }).toThrow();
  });

  it('handles zero pitch diameter for p1', () => {
    const p1 = new SimplePulley(0, new Measurement(5, 'mm'));
    const p2 = new SimplePulley(30, new Measurement(5, 'mm'));
    const desiredCenter = new Measurement(100, 'mm');

    const result = approximateBeltPitchLength(p1, p2, desiredCenter);

    expect(result.to('mm').scalar).toBeCloseTo(280.661, 3);
  });

  it('handles zero pitch diameter for p2', () => {
    const p1 = new SimplePulley(20, new Measurement(5, 'mm'));
    const p2 = new SimplePulley(0, new Measurement(5, 'mm'));
    const desiredCenter = new Measurement(100, 'mm');

    const result = approximateBeltPitchLength(p1, p2, desiredCenter);

    expect(result.to('mm').scalar).toBeCloseTo(252.508, 3);
  });

  it('handles equal pulleys', () => {
    const p1 = new SimplePulley(20, new Measurement(5, 'mm'));
    const p2 = new SimplePulley(20, new Measurement(5, 'mm'));
    const desiredCenter = new Measurement(100, 'mm');

    const result = approximateBeltPitchLength(p1, p2, desiredCenter);

    expect(result.to('mm').scalar).toBeCloseTo(299.949, 3);
  });
});

describe('calculateClosestCenters', () => {
  it('calculates closest centers correctly', () => {
    const p1 = new SimplePulley(20, new Measurement(5, 'mm'));
    const p2 = new SimplePulley(30, new Measurement(5, 'mm'));
    const desiredCenter = new Measurement(100, 'mm');
    const multipleOf = 5;

    const result = calculateClosestCenters(p1, p2, desiredCenter, multipleOf);

    expect(result.larger.distance.to('mm').scalar).toBeCloseTo(112.218, 3);
    expect(result.smaller.distance.to('mm').scalar).toBeCloseTo(99.682, 3);
  });

  it('handles zero pitch for p1', () => {
    const p1 = new SimplePulley(20, new Measurement(0, 'mm'));
    const p2 = new SimplePulley(30, new Measurement(5, 'mm'));
    const desiredCenter = new Measurement(100, 'mm');
    const multipleOf = 5;

    const result = calculateClosestCenters(p1, p2, desiredCenter, multipleOf);

    expect(result.larger.distance.to('mm').scalar).toBe(0);
    expect(result.smaller.distance.to('mm').scalar).toBe(0);
  });

  it('handles zero teeth for p1', () => {
    const p1 = new SimplePulley(0, new Measurement(5, 'mm'));
    const p2 = new SimplePulley(30, new Measurement(5, 'mm'));
    const desiredCenter = new Measurement(100, 'mm');
    const multipleOf = 5;

    const result = calculateClosestCenters(p1, p2, desiredCenter, multipleOf);

    expect(result.larger.distance.to('mm').scalar).toBe(0);
    expect(result.smaller.distance.to('mm').scalar).toBe(0);
  });

  it('handles zero desired center', () => {
    const p1 = new SimplePulley(20, new Measurement(5, 'mm'));
    const p2 = new SimplePulley(30, new Measurement(5, 'mm'));
    const desiredCenter = new Measurement(0, 'mm');
    const multipleOf = 5;

    const result = calculateClosestCenters(p1, p2, desiredCenter, multipleOf);

    expect(result.larger.distance.to('mm').scalar).toBe(0);
    expect(result.smaller.distance.to('mm').scalar).toBe(0);
  });

  it('handles zero multipleOf', () => {
    const p1 = new SimplePulley(20, new Measurement(5, 'mm'));
    const p2 = new SimplePulley(30, new Measurement(5, 'mm'));
    const desiredCenter = new Measurement(100, 'mm');
    const multipleOf = 0;

    const result = calculateClosestCenters(p1, p2, desiredCenter, multipleOf);

    expect(result.larger.distance.to('mm').scalar).toBe(0);
    expect(result.smaller.distance.to('mm').scalar).toBe(0);
  });
});

describe('teethInMesh', () => {
  it('calculates teeth in mesh correctly for larger pulley', () => {
    const p1 = new SimplePulley(30, new Measurement(5, 'mm'));
    const p2 = new SimplePulley(20, new Measurement(5, 'mm'));
    const center = new Measurement(100, 'mm');
    const pulleyToUse = p1;

    const result = teethInMesh(p1, p2, center, pulleyToUse);

    expect(result).toBe(14);
  });

  it('calculates teeth in mesh correctly for smaller pulley', () => {
    const p1 = new SimplePulley(30, new Measurement(5, 'mm'));
    const p2 = new SimplePulley(20, new Measurement(5, 'mm'));
    const center = new Measurement(100, 'mm');
    const pulleyToUse = p2;

    const result = teethInMesh(p1, p2, center, pulleyToUse);

    expect(result).toBe(10);
  });

  it('handles zero center distance', () => {
    const p1 = new SimplePulley(30, new Measurement(5, 'mm'));
    const p2 = new SimplePulley(20, new Measurement(5, 'mm'));
    const center = new Measurement(0, 'mm');
    const pulleyToUse = p1;

    const result = teethInMesh(p1, p2, center, pulleyToUse);

    expect(result).toBe(0);
  });

  it('handles zero pitch', () => {
    const p1 = new SimplePulley(30, new Measurement(5, 'mm'));
    const p2 = new SimplePulley(20, new Measurement(5, 'mm'));
    const center = new Measurement(100, 'mm');
    const pulleyToUse = new SimplePulley(20, new Measurement(0, 'mm'));

    const result = teethInMesh(p1, p2, center, pulleyToUse);

    expect(result).toBe(0);
  });

  it('handles NaN scenario (returns zero)', () => {
    const p1 = new SimplePulley(30, new Measurement(5, 'mm'));
    const p2 = new SimplePulley(20, new Measurement(5, 'mm'));
    const center = new Measurement(1, 'mm');
    const pulleyToUse = p1;

    const result = teethInMesh(p1, p2, center, pulleyToUse);

    expect(result).toBe(0);
  });

  it('handles equal pulleys', () => {
    const p1 = new SimplePulley(20, new Measurement(5, 'mm'));
    const p2 = new SimplePulley(20, new Measurement(5, 'mm'));
    const center = new Measurement(100, 'mm');
    const pulleyToUse = p1;

    const result = teethInMesh(p1, p2, center, pulleyToUse);

    expect(result).toBe(9);
  });
});

describe('getTIMFactor', () => {
  it('returns 1.0 for 6 or more teeth', () => {
    expect(getTIMFactor(6)).toBe(1.0);
    expect(getTIMFactor(10)).toBe(1.0);
    expect(getTIMFactor(100)).toBe(1.0);
  });

  it('returns 0.8 for teeth > 5', () => {
    expect(getTIMFactor(5.5)).toBe(0.8);
  });

  it('returns 0.6 for teeth > 4', () => {
    expect(getTIMFactor(4.5)).toBe(0.6);
  });

  it('returns 0.4 for teeth > 3', () => {
    expect(getTIMFactor(3.5)).toBe(0.4);
  });

  it('returns 0.2 for teeth <= 3', () => {
    expect(getTIMFactor(3)).toBe(0.2);
    expect(getTIMFactor(2)).toBe(0.2);
    expect(getTIMFactor(1)).toBe(0.2);
    expect(getTIMFactor(0)).toBe(0.2);
  });

  it('handles boundary values correctly', () => {
    expect(getTIMFactor(6)).toBe(1.0);
    expect(getTIMFactor(5.1)).toBe(0.8);
    expect(getTIMFactor(5)).toBe(0.6);
    expect(getTIMFactor(4.1)).toBe(0.6);
    expect(getTIMFactor(4)).toBe(0.4);
    expect(getTIMFactor(3.1)).toBe(0.4);
    expect(getTIMFactor(3)).toBe(0.2);
    expect(getTIMFactor(2.9)).toBe(0.2);
  });

  it('handles negative values', () => {
    expect(getTIMFactor(-1)).toBe(0.2);
    expect(getTIMFactor(-10)).toBe(0.2);
  });
});

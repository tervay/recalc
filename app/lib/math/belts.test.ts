import { describe, expect, it } from 'vitest';

import {
  approximateBeltPitchLength,
  calculateClosestCenters,
  calculateCustomBeltCenter,
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
    }).toThrow('Divide by zero');
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
    const extraCenter = new Measurement(0, 'mm');
    const multipleOf = 5;

    const result = calculateClosestCenters(
      p1,
      p2,
      desiredCenter,
      extraCenter,
      multipleOf,
    );

    expect(result.larger.distance.to('mm').scalar).toBeCloseTo(112.218, 3);
    expect(result.smaller.distance.to('mm').scalar).toBeCloseTo(99.682, 3);
  });

  it('handles zero pitch for p1', () => {
    const p1 = new SimplePulley(20, new Measurement(0, 'mm'));
    const p2 = new SimplePulley(30, new Measurement(5, 'mm'));
    const desiredCenter = new Measurement(100, 'mm');
    const extraCenter = new Measurement(0, 'mm');
    const multipleOf = 5;

    const result = calculateClosestCenters(
      p1,
      p2,
      desiredCenter,
      extraCenter,
      multipleOf,
    );

    expect(result.larger.distance.to('mm').scalar).toBe(0);
    expect(result.smaller.distance.to('mm').scalar).toBe(0);
  });

  it('handles zero teeth for p1', () => {
    const p1 = new SimplePulley(0, new Measurement(5, 'mm'));
    const p2 = new SimplePulley(30, new Measurement(5, 'mm'));
    const desiredCenter = new Measurement(100, 'mm');
    const extraCenter = new Measurement(0, 'mm');
    const multipleOf = 5;

    const result = calculateClosestCenters(
      p1,
      p2,
      desiredCenter,
      extraCenter,
      multipleOf,
    );

    expect(result.larger.distance.to('mm').scalar).toBe(0);
    expect(result.smaller.distance.to('mm').scalar).toBe(0);
  });

  it('handles zero desired center', () => {
    const p1 = new SimplePulley(20, new Measurement(5, 'mm'));
    const p2 = new SimplePulley(30, new Measurement(5, 'mm'));
    const desiredCenter = new Measurement(0, 'mm');
    const extraCenter = new Measurement(0, 'mm');
    const multipleOf = 5;

    const result = calculateClosestCenters(
      p1,
      p2,
      desiredCenter,
      extraCenter,
      multipleOf,
    );

    expect(result.larger.distance.to('mm').scalar).toBe(0);
    expect(result.smaller.distance.to('mm').scalar).toBe(0);
  });

  it('handles zero multipleOf', () => {
    const p1 = new SimplePulley(20, new Measurement(5, 'mm'));
    const p2 = new SimplePulley(30, new Measurement(5, 'mm'));
    const desiredCenter = new Measurement(100, 'mm');
    const extraCenter = new Measurement(0, 'mm');
    const multipleOf = 0;

    const result = calculateClosestCenters(
      p1,
      p2,
      desiredCenter,
      extraCenter,
      multipleOf,
    );

    expect(result.larger.distance.to('mm').scalar).toBe(0);
    expect(result.smaller.distance.to('mm').scalar).toBe(0);
  });

  it('adds extra center to both reported distances', () => {
    const p1 = new SimplePulley(20, new Measurement(5, 'mm'));
    const p2 = new SimplePulley(30, new Measurement(5, 'mm'));
    const desiredCenter = new Measurement(100, 'mm');
    const multipleOf = 5;

    const withoutExtra = calculateClosestCenters(
      p1,
      p2,
      desiredCenter,
      new Measurement(0, 'mm'),
      multipleOf,
    );
    const withExtra = calculateClosestCenters(
      p1,
      p2,
      desiredCenter,
      new Measurement(3, 'mm'),
      multipleOf,
    );

    expect(withExtra.smaller.distance.to('mm').scalar).toBeCloseTo(
      withoutExtra.smaller.distance.to('mm').scalar + 3,
      6,
    );
    expect(withExtra.larger.distance.to('mm').scalar).toBeCloseTo(
      withoutExtra.larger.distance.to('mm').scalar + 3,
      6,
    );
  });

  it('shrinks the pulley gap by the same amount extra center adds', () => {
    const p1 = new SimplePulley(20, new Measurement(5, 'mm'));
    const p2 = new SimplePulley(30, new Measurement(5, 'mm'));
    const desiredCenter = new Measurement(100, 'mm');

    const result = calculateClosestCenters(
      p1,
      p2,
      desiredCenter,
      new Measurement(3, 'mm'),
      5,
    );

    expect(result.smaller.gapBetweenPulleys.to('mm').scalar).toBeCloseTo(
      calculateDistanceBetweenPulleys(p1, p2, result.smaller.distance).to('mm')
        .scalar,
      6,
    );
  });

  it('excludes extra center from the difference from target', () => {
    const p1 = new SimplePulley(20, new Measurement(5, 'mm'));
    const p2 = new SimplePulley(30, new Measurement(5, 'mm'));
    const desiredCenter = new Measurement(100, 'mm');

    const withoutExtra = calculateClosestCenters(
      p1,
      p2,
      desiredCenter,
      new Measurement(0, 'mm'),
      5,
    );
    const withExtra = calculateClosestCenters(
      p1,
      p2,
      desiredCenter,
      new Measurement(3, 'mm'),
      5,
    );

    expect(withExtra.smaller.differenceFromTarget.to('mm').scalar).toBeCloseTo(
      withoutExtra.smaller.differenceFromTarget.to('mm').scalar,
      6,
    );
  });

  it('measures teeth in mesh at each belt own center distance', () => {
    const p1 = new SimplePulley(20, new Measurement(5, 'mm'));
    const p2 = new SimplePulley(30, new Measurement(5, 'mm'));
    const desiredCenter = new Measurement(100, 'mm');

    const result = calculateClosestCenters(
      p1,
      p2,
      desiredCenter,
      new Measurement(0, 'mm'),
      5,
    );

    expect(result.smaller.p1TeethInMesh).toBe(
      teethInMesh(p1, p2, result.smaller.distance, p1),
    );
    expect(result.smaller.p2TeethInMesh).toBe(
      teethInMesh(p1, p2, result.smaller.distance, p2),
    );
    expect(result.larger.p1TeethInMesh).toBe(
      teethInMesh(p1, p2, result.larger.distance, p1),
    );
    expect(result.larger.p2TeethInMesh).toBe(
      teethInMesh(p1, p2, result.larger.distance, p2),
    );
  });

  it('reports different teeth in mesh for the smaller and larger belt', () => {
    const p1 = new SimplePulley(16, new Measurement(3, 'mm'));
    const p2 = new SimplePulley(61, new Measurement(3, 'mm'));
    const desiredCenter = new Measurement(30, 'mm');

    const result = calculateClosestCenters(
      p1,
      p2,
      desiredCenter,
      new Measurement(0, 'mm'),
      5,
    );

    expect(result.smaller.belt.teeth).toBe(60);
    expect(result.larger.belt.teeth).toBe(65);
    expect(result.smaller.p2TeethInMesh).toBe(29);
    expect(result.larger.p2TeethInMesh).toBe(30);
  });
});

describe('calculateCustomBeltCenter', () => {
  it('solves the center distance for a specific belt', () => {
    const pitch = new Measurement(5, 'mm');
    const p1 = new SimplePulley(16, pitch);
    const p2 = new SimplePulley(24, pitch);

    const result = calculateCustomBeltCenter(
      p1,
      p2,
      125,
      new Measurement(0, 'mm'),
    );

    expect(result.distance.to('mm').scalar).toBeCloseTo(262.423, 3);
  });

  it('reports the belt it was given', () => {
    const pitch = new Measurement(5, 'mm');
    const result = calculateCustomBeltCenter(
      new SimplePulley(16, pitch),
      new SimplePulley(24, pitch),
      125,
      new Measurement(0, 'mm'),
    );

    expect(result.belt.teeth).toBe(125);
    expect(result.belt.pitch.to('mm').scalar).toBe(5);
  });

  it('agrees with calculateDistance', () => {
    const pitch = new Measurement(5, 'mm');
    const p1 = new SimplePulley(16, pitch);
    const p2 = new SimplePulley(24, pitch);

    const result = calculateCustomBeltCenter(
      p1,
      p2,
      125,
      new Measurement(0, 'mm'),
    );

    expect(result.distance.to('mm').scalar).toBeCloseTo(
      calculateDistance(p1, p2, new SimpleBelt(125, pitch)).to('mm').scalar,
      6,
    );
  });

  it('adds extra center to the reported distance', () => {
    const pitch = new Measurement(5, 'mm');
    const result = calculateCustomBeltCenter(
      new SimplePulley(16, pitch),
      new SimplePulley(24, pitch),
      125,
      new Measurement(3, 'mm'),
    );

    expect(result.distance.to('mm').scalar).toBeCloseTo(262.423 + 3, 3);
  });

  it('measures teeth in mesh at the computed center distance', () => {
    const pitch = new Measurement(5, 'mm');
    const p1 = new SimplePulley(16, pitch);
    const p2 = new SimplePulley(24, pitch);

    const result = calculateCustomBeltCenter(
      p1,
      p2,
      125,
      new Measurement(0, 'mm'),
    );

    expect(result.p1TeethInMesh).toBe(teethInMesh(p1, p2, result.distance, p1));
    expect(result.p2TeethInMesh).toBe(teethInMesh(p1, p2, result.distance, p2));
  });

  it('reports the gap between the pulleys', () => {
    const pitch = new Measurement(5, 'mm');
    const p1 = new SimplePulley(16, pitch);
    const p2 = new SimplePulley(24, pitch);

    const result = calculateCustomBeltCenter(
      p1,
      p2,
      125,
      new Measurement(0, 'mm'),
    );

    expect(result.gapBetweenPulleys.to('mm').scalar).toBeCloseTo(
      calculateDistanceBetweenPulleys(p1, p2, result.distance).to('mm').scalar,
      6,
    );
  });

  it('handles zero belt teeth', () => {
    const pitch = new Measurement(5, 'mm');
    const result = calculateCustomBeltCenter(
      new SimplePulley(16, pitch),
      new SimplePulley(24, pitch),
      0,
      new Measurement(0, 'mm'),
    );

    expect(result.distance.to('mm').scalar).toBe(0);
    expect(result.gapBetweenPulleys.to('mm').scalar).toBe(0);
    expect(result.p1TeethInMesh).toBe(0);
    expect(result.p2TeethInMesh).toBe(0);
  });

  it('handles zero pitch', () => {
    const pitch = new Measurement(0, 'mm');
    const result = calculateCustomBeltCenter(
      new SimplePulley(16, pitch),
      new SimplePulley(24, pitch),
      125,
      new Measurement(0, 'mm'),
    );

    expect(result.distance.to('mm').scalar).toBe(0);
  });

  it('handles zero teeth for p1', () => {
    const pitch = new Measurement(5, 'mm');
    const result = calculateCustomBeltCenter(
      new SimplePulley(0, pitch),
      new SimplePulley(24, pitch),
      125,
      new Measurement(0, 'mm'),
    );

    expect(result.distance.to('mm').scalar).toBe(0);
  });

  it('handles zero teeth for p2', () => {
    const pitch = new Measurement(5, 'mm');
    const result = calculateCustomBeltCenter(
      new SimplePulley(16, pitch),
      new SimplePulley(0, pitch),
      125,
      new Measurement(0, 'mm'),
    );

    expect(result.distance.to('mm').scalar).toBe(0);
  });

  it('handles a belt too short to wrap the pulleys', () => {
    const pitch = new Measurement(5, 'mm');
    const result = calculateCustomBeltCenter(
      new SimplePulley(20, pitch),
      new SimplePulley(30, pitch),
      25,
      new Measurement(0, 'mm'),
    );

    expect(result.distance.to('mm').scalar).toBe(0);
    expect(result.gapBetweenPulleys.to('mm').scalar).toBe(0);
    expect(result.p1TeethInMesh).toBe(0);
    expect(result.p2TeethInMesh).toBe(0);
  });

  it('handles a belt shorter than half the combined pulley teeth', () => {
    // A 20 tooth belt cannot span 20T and 30T pulleys. The discriminant stays
    // positive here, so the raw formula yields a negative center distance.
    const pitch = new Measurement(5, 'mm');
    const result = calculateCustomBeltCenter(
      new SimplePulley(20, pitch),
      new SimplePulley(30, pitch),
      20,
      new Measurement(0, 'mm'),
    );

    expect(result.distance.to('mm').scalar).toBe(0);
    expect(result.gapBetweenPulleys.to('mm').scalar).toBe(0);
    expect(result.p1TeethInMesh).toBe(0);
    expect(result.p2TeethInMesh).toBe(0);
  });

  it('does not add extra center to a belt too short to wrap the pulleys', () => {
    const pitch = new Measurement(5, 'mm');
    const result = calculateCustomBeltCenter(
      new SimplePulley(20, pitch),
      new SimplePulley(30, pitch),
      25,
      new Measurement(3, 'mm'),
    );

    expect(result.distance.to('mm').scalar).toBe(0);
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

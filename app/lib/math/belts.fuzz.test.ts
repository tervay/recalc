import { describe, expect, it } from 'vitest';

import {
  calculateClosestCenters,
  calculateCustomBeltCenter,
} from '~/lib/math/belts';
import { cartesian } from '~/lib/math/fuzzTestUtils';
import Measurement from '~/lib/models/Measurement';
import { SimplePulley } from '~/lib/models/Pulley';

const PITCHES_MM = [3, 5, 6.35];
const TEETH = [10, 12, 16, 18, 24, 30, 36, 42, 48, 60, 72];
const TARGETS_MM = [40, 63.5, 101.6, 150, 222.3, 306.5, 500];
const INCREMENTS = [1, 5, 8];

const pulley = (teeth: number, pitchMm: number) =>
  new SimplePulley(teeth, new Measurement(pitchMm, 'mm'));

const feasibleCases = cartesian(
  PITCHES_MM,
  TEETH,
  TEETH,
  TARGETS_MM,
  INCREMENTS,
).filter(
  ([pitch, t1, t2, target]) =>
    target >=
    (pulley(t1, pitch).pitchDiameter.to('mm').scalar +
      pulley(t2, pitch).pitchDiameter.to('mm').scalar) /
      2,
);

const closest = ([
  pitch,
  t1,
  t2,
  target,
  increment,
]: (typeof feasibleCases)[number]) =>
  calculateClosestCenters(
    pulley(t1, pitch),
    pulley(t2, pitch),
    new Measurement(target, 'mm'),
    new Measurement(0, 'mm'),
    increment,
  );

describe('belt calculator invariants', { timeout: 30_000 }, () => {
  it('covers a meaningful number of feasible cases', () => {
    expect(feasibleCases.length).toBeGreaterThan(1000);
  });

  it('never offers a smaller belt whose center exceeds the target', () => {
    const violations = feasibleCases.filter(
      (c) => closest(c).smaller.distance.to('mm').scalar > c[3] + 1e-6,
    );

    expect(violations).toEqual([]);
  });

  it('never offers a larger belt whose center falls short of the target', () => {
    const violations = feasibleCases.filter(
      (c) => closest(c).larger.distance.to('mm').scalar < c[3] - 1e-6,
    );

    expect(violations).toEqual([]);
  });

  it('offers belts exactly one tooth increment apart', () => {
    const violations = feasibleCases.filter((c) => {
      const result = closest(c);
      return result.larger.belt.teeth - result.smaller.belt.teeth !== c[4];
    });

    expect(violations).toEqual([]);
  });

  it('gives the same centers when the pulleys are swapped', () => {
    const violations = feasibleCases.filter(
      ([pitch, t1, t2, target, increment]) => {
        const forward = closest([pitch, t1, t2, target, increment]);
        const swapped = closest([pitch, t2, t1, target, increment]);
        return (
          Math.abs(
            forward.larger.distance.to('mm').scalar -
              swapped.larger.distance.to('mm').scalar,
          ) > 1e-9 ||
          Math.abs(
            forward.smaller.distance.to('mm').scalar -
              swapped.smaller.distance.to('mm').scalar,
          ) > 1e-9
        );
      },
    );

    expect(violations).toEqual([]);
  });

  it('swaps the teeth in mesh when the pulleys are swapped', () => {
    const violations = feasibleCases.filter(
      ([pitch, t1, t2, target, increment]) => {
        const forward = closest([pitch, t1, t2, target, increment]).larger;
        const swapped = closest([pitch, t2, t1, target, increment]).larger;
        return (
          forward.p1TeethInMesh !== swapped.p2TeethInMesh ||
          forward.p2TeethInMesh !== swapped.p1TeethInMesh
        );
      },
    );

    expect(violations).toEqual([]);
  });

  it('meshes at most half the smaller pulley and at least half the larger pulley', () => {
    const violations = feasibleCases.filter((c) => {
      const [, t1, t2] = c;
      const { larger } = closest(c);
      const small = t1 <= t2 ? larger.p1TeethInMesh : larger.p2TeethInMesh;
      const large = t1 <= t2 ? larger.p2TeethInMesh : larger.p1TeethInMesh;
      return (
        small > Math.min(t1, t2) / 2 || large < Math.floor(Math.max(t1, t2) / 2)
      );
    });

    expect(violations).toEqual([]);
  });

  it('gives the same centers for a target in inches as in millimeters', () => {
    const violations = feasibleCases.filter(
      ([pitch, t1, t2, target, increment]) => {
        const inMm = closest([pitch, t1, t2, target, increment]);
        const inInches = calculateClosestCenters(
          pulley(t1, pitch),
          pulley(t2, pitch),
          new Measurement(target / 25.4, 'in'),
          new Measurement(0, 'mm'),
          increment,
        );
        return (
          Math.abs(
            inMm.larger.distance.to('mm').scalar -
              inInches.larger.distance.to('mm').scalar,
          ) > 1e-6
        );
      },
    );

    expect(violations).toEqual([]);
  });

  it('lengthens the center distance with every added belt tooth', () => {
    const violations = cartesian(PITCHES_MM, TEETH, TEETH).filter(
      ([pitch, t1, t2]) => {
        const centers = Array.from({ length: 60 }, (_, i) => t1 + t2 + i * 4)
          .map(
            (teeth) =>
              calculateCustomBeltCenter(
                pulley(t1, pitch),
                pulley(t2, pitch),
                teeth,
                new Measurement(0, 'mm'),
              ).distance.to('mm').scalar,
          )
          .filter((center) => center > 0);
        return centers.some((center, i) => i > 0 && center <= centers[i - 1]);
      },
    );

    expect(violations).toEqual([]);
  });
});

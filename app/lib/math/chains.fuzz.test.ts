import { describe, expect, it } from 'vitest';

import { calculateCenters } from '~/lib/math/chains';
import { cartesian } from '~/lib/math/fuzzTestUtils';
import Measurement from '~/lib/models/Measurement';

const PITCHES_IN = [0.25, 0.375];
const TEETH = [8, 9, 10, 12, 15, 16, 18, 22, 24, 30, 36, 42, 48, 58, 72];
const TARGETS_IN = [2.5, 3, 4, 5.5, 6.85, 8, 10.125, 12.25, 18];
const HALF_LINKS = [false, true];

const cases = cartesian(PITCHES_IN, TEETH, TEETH, TARGETS_IN, HALF_LINKS);

const centers = ([pitch, z1, z2, target, half]: (typeof cases)[number]) =>
  calculateCenters(
    new Measurement(pitch, 'in'),
    z1,
    z2,
    new Measurement(target, 'in'),
    new Measurement(0, 'in'),
    half,
  );

const solved = cases.filter((c) => centers(c).smaller.links > 0);

describe('chain calculator invariants', { timeout: 30_000 }, () => {
  it('covers a meaningful number of solvable cases', () => {
    expect(solved.length).toBeGreaterThan(5000);
  });

  it('never offers a smaller chain whose center exceeds the target', () => {
    const violations = solved.filter(
      (c) => centers(c).smaller.distance.to('in').scalar > c[3] + 1e-6,
    );

    expect(violations).toEqual([]);
  });

  it('never offers a larger chain whose center falls short of the target', () => {
    const violations = solved.filter(
      (c) => centers(c).larger.distance.to('in').scalar < c[3] - 1e-6,
    );

    expect(violations).toEqual([]);
  });

  it('offers chains exactly one link step apart', () => {
    const violations = solved.filter((c) => {
      const { smaller, larger } = centers(c);
      return larger.links - smaller.links !== (c[4] ? 1 : 2);
    });

    expect(violations).toEqual([]);
  });

  it('uses an even number of links when half links are not allowed', () => {
    const violations = solved.filter((c) => {
      const { smaller, larger } = centers(c);
      return !c[4] && (smaller.links % 2 !== 0 || larger.links % 2 !== 0);
    });

    expect(violations).toEqual([]);
  });

  it('reports finite center distances', () => {
    const violations = cases.filter((c) => {
      const { smaller, larger } = centers(c);
      return ![smaller.distance, larger.distance].every((d) =>
        Number.isFinite(d.to('in').scalar),
      );
    });

    expect(violations).toEqual([]);
  });

  it('gives the same centers when the sprockets are swapped', () => {
    const violations = solved.filter(([pitch, z1, z2, target, half]) => {
      const forward = centers([pitch, z1, z2, target, half]);
      const swapped = centers([pitch, z2, z1, target, half]);
      return (
        Math.abs(
          forward.larger.distance.to('in').scalar -
            swapped.larger.distance.to('in').scalar,
        ) > 1e-9
      );
    });

    expect(violations).toEqual([]);
  });

  it('gives the same centers for a target in millimeters as in inches', () => {
    const violations = solved.filter(([pitch, z1, z2, target, half]) => {
      const inInches = centers([pitch, z1, z2, target, half]);
      const inMm = calculateCenters(
        new Measurement(pitch, 'in'),
        z1,
        z2,
        new Measurement(target * 25.4, 'mm'),
        new Measurement(0, 'in'),
        half,
      );
      return inInches.larger.links !== inMm.larger.links;
    });

    expect(violations).toEqual([]);
  });
});

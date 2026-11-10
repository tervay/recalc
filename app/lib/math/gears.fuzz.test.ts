import { describe, expect, it } from 'vitest';

import { cartesian } from '~/lib/math/fuzzTestUtils';
import { calculateSpacing } from '~/lib/math/gears';

const TEETH = [8, 9, 10, 12, 14, 18, 24, 36, 48, 60, 72, 84];
const DIAMETRAL_PITCHES = [12, 20, 24, 32, 48];

const cases = cartesian(TEETH, TEETH, DIAMETRAL_PITCHES);

const spacingInches = (t1: number, t2: number, dp: number) =>
  calculateSpacing(t1, t2, dp).to('in').scalar;

describe('gear spacing invariants', () => {
  it('gives the same spacing when the gears are swapped', () => {
    const violations = cases.filter(
      ([t1, t2, dp]) => spacingInches(t1, t2, dp) !== spacingInches(t2, t1, dp),
    );

    expect(violations).toEqual([]);
  });

  it('equals the sum of the two pitch radii', () => {
    const violations = cases.filter(
      ([t1, t2, dp]) =>
        Math.abs(spacingInches(t1, t2, dp) - (t1 / dp + t2 / dp) / 2) > 1e-12,
    );

    expect(violations).toEqual([]);
  });

  it('halves the spacing when the diametral pitch doubles', () => {
    const violations = cases.filter(
      ([t1, t2, dp]) =>
        Math.abs(
          spacingInches(t1, t2, dp * 2) - spacingInches(t1, t2, dp) / 2,
        ) > 1e-12,
    );

    expect(violations).toEqual([]);
  });
});

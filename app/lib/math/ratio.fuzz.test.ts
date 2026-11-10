import { describe, expect, it } from 'vitest';

import { cartesian } from '~/lib/math/fuzzTestUtils';
import { calculateInverseRatio, calculateNetRatio } from '~/lib/math/ratio';
import Ratio, { RatioType } from '~/lib/models/Ratio';
import type { RatioPair } from '~/lib/types/queryParams';

const TEETH = [8, 12, 14, 18, 24, 36, 50, 72];
const MAGNITUDES = [0.25, 0.5, 1, 1.5, 3, 7.5, 20, 100];
const RATIO_TYPES = [RatioType.REDUCTION, RatioType.STEP_UP];

const stages = cartesian(TEETH, TEETH).map(([driving, driven]): RatioPair => [
  driving,
  driven,
]);
const twoStageGearboxes = cartesian(stages, stages);

const closeTo = (a: number, b: number) =>
  Math.abs(a - b) <= 1e-12 * Math.max(1, Math.abs(a), Math.abs(b));

describe('ratio calculator invariants', () => {
  it('gives the same net ratio regardless of stage order', () => {
    const violations = twoStageGearboxes.filter(
      ([a, b]) =>
        !closeTo(calculateNetRatio([a, b]), calculateNetRatio([b, a])),
    );

    expect(violations).toEqual([]);
  });

  it('inverts the net ratio when every stage is flipped', () => {
    const violations = twoStageGearboxes.filter(([a, b]) => {
      const flipped: RatioPair[] = [
        [a[1], a[0]],
        [b[1], b[0]],
      ];
      return !closeTo(
        calculateNetRatio(flipped),
        calculateInverseRatio(calculateNetRatio([a, b])),
      );
    });

    expect(violations).toEqual([]);
  });

  it('multiplies the net ratio of independent stages', () => {
    const violations = twoStageGearboxes.filter(
      ([a, b]) =>
        !closeTo(
          calculateNetRatio([a, b]),
          calculateNetRatio([a]) * calculateNetRatio([b]),
        ),
    );

    expect(violations).toEqual([]);
  });
});

describe('Ratio model invariants', () => {
  const ratios = cartesian(MAGNITUDES, RATIO_TYPES).map(
    ([magnitude, type]) => new Ratio(magnitude, type),
  );

  it('keeps the same numeric ratio after converting between types', () => {
    const violations = ratios.filter(
      (ratio) =>
        !RATIO_TYPES.every((type) =>
          closeTo(ratio.to(type).asNumber(), ratio.asNumber()),
        ),
    );

    expect(violations).toEqual([]);
  });

  it('inverts the numeric ratio when inverted', () => {
    const violations = ratios.filter(
      (ratio) => !closeTo(ratio.inverse().asNumber() * ratio.asNumber(), 1),
    );

    expect(violations).toEqual([]);
  });

  it('round-trips through its dictionary form', () => {
    const violations = ratios.filter(
      (ratio) => !Ratio.fromDict(ratio.toDict()).eq(ratio),
    );

    expect(violations).toEqual([]);
  });
});

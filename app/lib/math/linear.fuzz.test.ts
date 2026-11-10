import { describe, expect, it } from 'vitest';

import {
  cartesian,
  LINEAR_FUZZ_MOTORS,
  measurement,
  reduction,
  sampleForSnapshot,
  snapshotMeasurement,
  snapshotNumber,
} from '~/lib/math/fuzzTestUtils';
import { calculateGuessedLimits, calculateStallLoad } from '~/lib/math/linear';
import { trapezoidProfileDurationSeconds } from '~/lib/math/optimizerUtils';
import Motor from '~/lib/models/Motor';
import Ratio, { RatioType } from '~/lib/models/Ratio';

const efficiencies = [50, 90, 100];
const angles = [-90, 0, 45, 90];

const stallCases = cartesian(
  LINEAR_FUZZ_MOTORS,
  [0.5, 2, 10],
  [0.5, 2, 10],
  [1, 20, 60, 100],
  [50, 90, 100],
).map(([motor, spoolDiameter, ratio, current, efficiency]) => ({
  name: `${motor[0]} spool=${spoolDiameter} ratio=${ratio} current=${current} efficiency=${efficiency}`,
  motor: motor[1],
  spoolDiameter,
  ratio,
  current,
  efficiency,
}));

const guessedLimitCases = cartesian(
  LINEAR_FUZZ_MOTORS,
  [1, 10, 50],
  [0.5, 2, 6],
  [1, 4, 20],
  [20, 60, 100],
  [20, 60],
  angles,
  efficiencies,
  [false, true],
).map(
  ([
    motor,
    load,
    spoolDiameter,
    ratio,
    statorLimit,
    supplyLimit,
    angle,
    efficiency,
    cascade,
  ]) => ({
    name: `${motor[0]} load=${load} spool=${spoolDiameter} ratio=${ratio} stator=${statorLimit} supply=${supplyLimit} angle=${angle} efficiency=${efficiency} cascade=${cascade}`,
    motor: motor[1],
    load,
    spoolDiameter,
    ratio,
    statorLimit,
    supplyLimit,
    angle,
    efficiency,
    cascade,
  }),
);

describe('linear formula fuzz cases', () => {
  it('produces stable stall-load results across the numeric input matrix', () => {
    const output = stallCases.map((testCase) => {
      const result = calculateStallLoad(
        testCase.motor,
        measurement(testCase.current, 'A'),
        measurement(testCase.spoolDiameter, 'in'),
        reduction(testCase.ratio),
        testCase.efficiency,
        measurement(12, 'V'),
      );

      const pounds = result.to('lb').scalar;
      expect(Number.isFinite(pounds)).toBe(true);
      expect(pounds).toBeGreaterThanOrEqual(0);

      return {
        name: testCase.name,
        loadLb: snapshotMeasurement(result, 'lb'),
      };
    });

    expect({
      caseCount: output.length,
      samples: sampleForSnapshot(output),
    }).toMatchSnapshot();
  });

  it('keeps stall-load scaling logical for every positive input', () => {
    for (const [, motor] of LINEAR_FUZZ_MOTORS) {
      for (const current of [20, 60, 100]) {
        const base = Math.abs(
          calculateStallLoad(
            motor,
            measurement(current, 'A'),
            measurement(2, 'in'),
            reduction(2),
            90,
            measurement(12, 'V'),
          ).to('lb').scalar,
        );
        const doubledCurrent = Math.abs(
          calculateStallLoad(
            motor,
            measurement(current * 2, 'A'),
            measurement(2, 'in'),
            reduction(2),
            90,
            measurement(12, 'V'),
          ).to('lb').scalar,
        );
        const doubledRatio = Math.abs(
          calculateStallLoad(
            motor,
            measurement(current, 'A'),
            measurement(2, 'in'),
            reduction(4),
            90,
            measurement(12, 'V'),
          ).to('lb').scalar,
        );

        expect(doubledCurrent).toBeGreaterThanOrEqual(base);
        expect(doubledRatio).toBeGreaterThanOrEqual(base);
        expect(base).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('produces stable guessed limits across realistic and boundary-adjacent mechanisms', () => {
    const output = guessedLimitCases.map((testCase) => {
      const result = calculateGuessedLimits(
        testCase.motor,
        reduction(testCase.ratio),
        measurement(testCase.load, 'lb'),
        measurement(testCase.spoolDiameter, 'in'),
        measurement(testCase.statorLimit, 'A'),
        measurement(testCase.supplyLimit, 'A'),
        measurement(12, 'V'),
        measurement(testCase.angle, 'deg'),
        testCase.efficiency,
        testCase.cascade,
        measurement(12, 'V'),
        measurement(60, 'in'),
      );

      const velocity = result.v_max_guessed.to('m/s').scalar;
      const acceleration = result.a_max_guessed.to('m/s^2').scalar;
      expect(Number.isFinite(velocity)).toBe(true);
      expect(Number.isFinite(acceleration)).toBe(true);
      expect(velocity).toBeGreaterThanOrEqual(0.1);
      expect(acceleration).toBeGreaterThanOrEqual(0.1);

      return {
        name: testCase.name,
        velocityMps: snapshotNumber(velocity),
        accelerationMps2: snapshotNumber(acceleration),
      };
    });

    expect({
      caseCount: output.length,
      samples: sampleForSnapshot(output),
    }).toMatchSnapshot();
  }, 120_000);

  it('does not increase guessed limits when the control-voltage cap is lowered', () => {
    for (const [, motor] of LINEAR_FUZZ_MOTORS) {
      for (const angle of angles) {
        const args = [
          motor,
          reduction(4),
          measurement(15, 'lb'),
          measurement(1.5, 'in'),
          measurement(80, 'A'),
          measurement(60, 'A'),
          measurement(12, 'V'),
          measurement(angle, 'deg'),
          90,
          false,
        ] as const;
        const fullVoltage = calculateGuessedLimits(
          ...args,
          measurement(12, 'V'),
        );
        const limitedVoltage = calculateGuessedLimits(
          ...args,
          measurement(6, 'V'),
        );

        expect(
          limitedVoltage.v_max_guessed.to('m/s').scalar,
        ).toBeLessThanOrEqual(fullVoltage.v_max_guessed.to('m/s').scalar);
        expect(
          limitedVoltage.a_max_guessed.to('m/s^2').scalar,
        ).toBeLessThanOrEqual(fullVoltage.a_max_guessed.to('m/s^2').scalar);
      }
    }
  });

  it('keeps guessed limits invariant when equivalent SI units are supplied', () => {
    const imperial = calculateGuessedLimits(
      Motor.KrakenX60sFOC(1),
      reduction(4),
      measurement(15, 'lb'),
      measurement(1.5, 'in'),
      measurement(80, 'A'),
      measurement(60, 'A'),
      measurement(12, 'V'),
      measurement(90, 'deg'),
      90,
      false,
      measurement(12, 'V'),
      measurement(60, 'in'),
    );
    const si = calculateGuessedLimits(
      Motor.KrakenX60sFOC(1),
      reduction(4),
      measurement(15 * 0.45359237, 'kg'),
      measurement(1.5 * 0.0254, 'm'),
      measurement(80, 'A'),
      measurement(60, 'A'),
      measurement(12, 'V'),
      measurement(Math.PI / 2, 'rad'),
      90,
      false,
      measurement(12, 'V'),
      measurement(60 * 0.0254, 'm'),
    );

    expect(si.v_max_guessed.to('m/s').scalar).toBeCloseTo(
      imperial.v_max_guessed.to('m/s').scalar,
      9,
    );
    expect(si.a_max_guessed.to('m/s^2').scalar).toBeCloseTo(
      imperial.a_max_guessed.to('m/s^2').scalar,
      9,
    );
  });

  it('returns zero limits for every guarded zero input', () => {
    const cases = [
      {
        name: 'zero spool',
        ratio: reduction(2),
        load: measurement(10, 'lb'),
        spool: measurement(0, 'in'),
        efficiency: 90,
      },
      {
        name: 'zero ratio',
        ratio: reduction(0),
        load: measurement(10, 'lb'),
        spool: measurement(2, 'in'),
        efficiency: 90,
      },
      {
        name: 'zero load',
        ratio: reduction(2),
        load: measurement(0, 'lb'),
        spool: measurement(2, 'in'),
        efficiency: 90,
      },
      {
        name: 'zero efficiency',
        ratio: reduction(2),
        load: measurement(10, 'lb'),
        spool: measurement(2, 'in'),
        efficiency: 0,
      },
    ];

    for (const testCase of cases) {
      const guarded = calculateGuessedLimits(
        Motor.KrakenX60sFOC(1),
        testCase.ratio,
        testCase.load,
        testCase.spool,
        measurement(60, 'A'),
        measurement(60, 'A'),
        measurement(12, 'V'),
        measurement(90, 'deg'),
        testCase.efficiency,
        false,
      );

      expect(guarded.v_max_guessed.to('m/s').scalar).toBe(0);
      expect(guarded.a_max_guessed.to('m/s^2').scalar).toBe(0);
    }
  });
});

type ProfileCase = {
  motor: Motor;
  ratio: number;
  loadLb: number;
  spoolIn: number;
  statorA: number;
  supplyA: number;
  supplyV: number;
  angleDeg: number;
  efficiency: number;
  cascade: boolean;
  rVolts: number;
  travelIn: number;
};

function guessedLimits(c: ProfileCase, travel: boolean, ratio?: Ratio) {
  return calculateGuessedLimits(
    c.motor,
    ratio ?? reduction(c.ratio),
    measurement(c.loadLb, 'lb'),
    measurement(c.spoolIn, 'in'),
    measurement(c.statorA, 'A'),
    measurement(c.supplyA, 'A'),
    measurement(c.supplyV, 'V'),
    measurement(c.angleDeg, 'deg'),
    c.efficiency,
    c.cascade,
    measurement(c.rVolts, 'V'),
    travel ? measurement(c.travelIn, 'in') : null,
  );
}

function profileSeconds(c: ProfileCase): number {
  const { v_max_guessed, a_max_guessed } = guessedLimits(c, true);
  return trapezoidProfileDurationSeconds(
    c.travelIn * 0.0254 * (c.cascade ? 0.5 : 1),
    v_max_guessed.to('m/s').scalar,
    a_max_guessed.to('m/s^2').scalar,
  );
}

function hitsGuessFloor(c: ProfileCase): boolean {
  const { v_max_guessed, a_max_guessed } = guessedLimits(c, false);
  return (
    v_max_guessed.to('m/s').scalar <= 0.1 + 1e-12 ||
    a_max_guessed.to('m/s^2').scalar <= 0.1 + 1e-12
  );
}

const PROFILE_TOLERANCE = 1e-3;

const profileCases: ProfileCase[] = cartesian(
  LINEAR_FUZZ_MOTORS,
  [3, 8, 20],
  [5, 15, 40],
  [1, 1.75],
  [40, 80, 120],
  [30, 60],
  [0, 90],
  [80],
  [false, true],
  [12, 40],
).map(
  ([
    [, motor],
    ratio,
    loadLb,
    spoolIn,
    statorA,
    supplyA,
    angleDeg,
    efficiency,
    cascade,
    travelIn,
  ]) => ({
    motor,
    ratio,
    loadLb,
    spoolIn,
    statorA,
    supplyA,
    supplyV: 12,
    angleDeg,
    efficiency,
    cascade,
    rVolts: 11,
    travelIn,
  }),
);

function monotonicViolations(
  bump: (c: ProfileCase) => ProfileCase,
  direction: 'faster' | 'slower',
) {
  return profileCases
    .filter((c) => !hitsGuessFloor(c) && !hitsGuessFloor(bump(c)))
    .map((c) => ({
      c,
      before: profileSeconds(c),
      after: profileSeconds(bump(c)),
    }))
    .filter(({ before, after }) =>
      direction === 'faster'
        ? after > before * (1 + PROFILE_TOLERANCE)
        : after < before * (1 - PROFILE_TOLERANCE),
    )
    .map(({ before, after }) => ({ before, after }));
}

describe('linear guessed profile invariants', { timeout: 30_000 }, () => {
  it('covers a meaningful number of unfloored mechanisms', () => {
    expect(
      profileCases.filter((c) => !hitsGuessFloor(c)).length,
    ).toBeGreaterThan(1000);
  });

  it('never slows the profile when the stator limit rises', () => {
    expect(
      monotonicViolations(
        (c) => ({ ...c, statorA: c.statorA * 1.25 }),
        'faster',
      ),
    ).toEqual([]);
  });

  it('never slows the profile when the supply limit rises', () => {
    expect(
      monotonicViolations(
        (c) => ({ ...c, supplyA: c.supplyA * 1.25 }),
        'faster',
      ),
    ).toEqual([]);
  });

  it('never slows the profile when efficiency rises', () => {
    expect(
      monotonicViolations(
        (c) => ({ ...c, efficiency: Math.min(100, c.efficiency + 10) }),
        'faster',
      ),
    ).toEqual([]);
  });

  it('never slows the profile when the control voltage rises toward the supply', () => {
    expect(
      monotonicViolations((c) => ({ ...c, rVolts: c.supplyV }), 'faster'),
    ).toEqual([]);
  });

  it('never speeds up the profile when the load rises', () => {
    expect(
      monotonicViolations((c) => ({ ...c, loadLb: c.loadLb * 1.25 }), 'slower'),
    ).toEqual([]);
  });

  it('never speeds up the profile when the travel rises', () => {
    expect(
      monotonicViolations(
        (c) => ({ ...c, travelIn: c.travelIn * 1.25 }),
        'slower',
      ),
    ).toEqual([]);
  });

  it('treats a reduction and the equivalent step-up identically', () => {
    const violations = profileCases.filter((c) => {
      const reductionLimits = guessedLimits(c, true);
      const stepUpLimits = guessedLimits(
        c,
        true,
        new Ratio(1 / c.ratio, RatioType.STEP_UP),
      );
      return (
        Math.abs(
          reductionLimits.a_max_guessed.to('m/s^2').scalar -
            stepUpLimits.a_max_guessed.to('m/s^2').scalar,
        ) > 1e-9
      );
    });

    expect(violations).toEqual([]);
  });
});

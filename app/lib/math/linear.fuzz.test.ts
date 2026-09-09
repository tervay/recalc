import { describe, expect, it } from 'vitest';

import { calculateGuessedLimits, calculateStallLoad } from '~/lib/math/linear';
import {
  cartesian,
  LINEAR_FUZZ_MOTORS,
  measurement,
  reduction,
  sampleForSnapshot,
  snapshotMeasurement,
  snapshotNumber,
} from '~/lib/math/linearFuzzTestUtils';
import Motor from '~/lib/models/Motor';

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

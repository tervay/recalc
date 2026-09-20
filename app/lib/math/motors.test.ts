import { describe, expect, it } from 'vitest';

import {
  buildComparisonChartData,
  buildMotorChartData,
  gearMotorChartDataToSameSpeed,
  type MotorChartRow,
} from '~/lib/math/motors';
import type { WpilibMotorSimState } from '~/lib/math/motors.worker';

function row(
  overrides: Partial<WpilibMotorSimState> = {},
): WpilibMotorSimState {
  return {
    angularVelocityRPM: 0,
    currentDrawAmps: 0,
    torqueNewtonMeters: 0,
    efficiency: 0,
    ...overrides,
  };
}

function chartRow(overrides: Partial<MotorChartRow> = {}): MotorChartRow {
  return {
    angularVelocityRPM: 0,
    currentDrawAmps: 0,
    torqueNewtonMeters: 0,
    efficiencyPercent: 0,
    percentOfFreeSpeed: 0,
    ...overrides,
  };
}

describe('buildMotorChartData', () => {
  it('scales efficiency from a 0-1 ratio to a 0-100 percentage', () => {
    const result = buildMotorChartData(
      [
        row({ efficiency: 0 }),
        row({ efficiency: 0.5 }),
        row({ efficiency: 1 }),
      ],
      6000,
    );

    expect(result.map((r) => r.efficiencyPercent)).toEqual([0, 50, 100]);
  });

  it('computes percentOfFreeSpeed relative to the given free speed', () => {
    const result = buildMotorChartData(
      [
        row({ angularVelocityRPM: 0 }),
        row({ angularVelocityRPM: 3000 }),
        row({ angularVelocityRPM: 6000 }),
      ],
      6000,
    );

    expect(result.map((r) => r.percentOfFreeSpeed)).toEqual([0, 50, 100]);
  });

  it('passes through angularVelocityRPM, currentDrawAmps, and torqueNewtonMeters unchanged', () => {
    const result = buildMotorChartData(
      [
        row({
          angularVelocityRPM: 1234,
          currentDrawAmps: 56,
          torqueNewtonMeters: 0.78,
        }),
      ],
      6000,
    );

    expect(result[0]).toMatchObject({
      angularVelocityRPM: 1234,
      currentDrawAmps: 56,
      torqueNewtonMeters: 0.78,
    });
  });

  it('returns an empty array for empty input', () => {
    expect(buildMotorChartData([], 6000)).toEqual([]);
  });

  it('falls back to 0 percentOfFreeSpeed when freeSpeedRPM is not positive', () => {
    const result = buildMotorChartData(
      [row({ angularVelocityRPM: 0 }), row({ angularVelocityRPM: 3000 })],
      0,
    );

    expect(result.map((r) => r.percentOfFreeSpeed)).toEqual([0, 0]);
  });
});

describe('buildComparisonChartData', () => {
  it('resamples both motors onto one shared, ascending x grid', () => {
    const motorA = [
      chartRow({ angularVelocityRPM: 0, currentDrawAmps: 0 }),
      chartRow({ angularVelocityRPM: 6000, currentDrawAmps: 60 }),
    ];

    const result = buildComparisonChartData(motorA, [], 'angularVelocityRPM');

    expect(result[0].x).toBe(0);
    expect(result.at(-1)!.x).toBe(6000);
    expect(result.every((r, i) => i === 0 || r.x >= result[i - 1].x)).toBe(
      true,
    );
  });

  it('linearly interpolates each motor at every grid x', () => {
    const motorA = [
      chartRow({ angularVelocityRPM: 0, currentDrawAmps: 0 }),
      chartRow({ angularVelocityRPM: 4000, currentDrawAmps: 40 }),
    ];

    const result = buildComparisonChartData(motorA, [], 'angularVelocityRPM');
    const midpoint = result.find((r) => r.x === 2000);

    expect(midpoint?.aCurrentDrawAmps).toBeCloseTo(20, 5);
  });

  it('returns null for a motor past its own last sample, so its line stops there', () => {
    const motorA = [
      chartRow({ angularVelocityRPM: 0, torqueNewtonMeters: 1 }),
      chartRow({ angularVelocityRPM: 3000, torqueNewtonMeters: 0.5 }),
    ];
    const motorB = [
      chartRow({ angularVelocityRPM: 0, torqueNewtonMeters: 1 }),
      chartRow({ angularVelocityRPM: 6000, torqueNewtonMeters: 0 }),
    ];

    const result = buildComparisonChartData(
      motorA,
      motorB,
      'angularVelocityRPM',
    );
    const pastMotorAFreeSpeed = result.find((r) => r.x === 6000);

    expect(pastMotorAFreeSpeed?.aTorqueNewtonMeters).toBeNull();
    expect(pastMotorAFreeSpeed?.bTorqueNewtonMeters).toBe(0);
  });

  it('fills every b-prefixed field with null when motor B has no rows', () => {
    const motorA = [
      chartRow({ angularVelocityRPM: 0 }),
      chartRow({ angularVelocityRPM: 6000 }),
    ];

    const result = buildComparisonChartData(motorA, [], 'angularVelocityRPM');

    for (const r of result) {
      expect(r.bCurrentDrawAmps).toBeNull();
      expect(r.bTorqueNewtonMeters).toBeNull();
      expect(r.bEfficiencyPercent).toBeNull();
    }
  });

  it('returns an empty array when both motors have no rows', () => {
    expect(buildComparisonChartData([], [], 'angularVelocityRPM')).toEqual([]);
  });

  it('uses the wider of the two motors free-speed ranges as the grid max', () => {
    const motorA = [
      chartRow({ angularVelocityRPM: 0 }),
      chartRow({ angularVelocityRPM: 3000 }),
    ];
    const motorB = [
      chartRow({ angularVelocityRPM: 0 }),
      chartRow({ angularVelocityRPM: 6000 }),
    ];

    const result = buildComparisonChartData(
      motorA,
      motorB,
      'angularVelocityRPM',
    );

    expect(result.at(-1)!.x).toBe(6000);
  });
});

describe('gearMotorChartDataToSameSpeed', () => {
  const motorARows = [
    chartRow({
      angularVelocityRPM: 3000,
      currentDrawAmps: 30,
      torqueNewtonMeters: 1.5,
      efficiencyPercent: 80,
      percentOfFreeSpeed: 50,
    }),
    chartRow({
      angularVelocityRPM: 6000,
      currentDrawAmps: 10,
      torqueNewtonMeters: 0.25,
      efficiencyPercent: 60,
      percentOfFreeSpeed: 100,
    }),
  ];
  const motorBRows = [
    chartRow({ angularVelocityRPM: 1500, torqueNewtonMeters: 2 }),
    chartRow({ angularVelocityRPM: 3000, torqueNewtonMeters: 0 }),
  ];

  it('divides the faster motor speed by the required reduction', () => {
    const result = gearMotorChartDataToSameSpeed({
      motorARows,
      motorAFreeSpeedRPM: 6000,
      motorBRows,
      motorBFreeSpeedRPM: 3000,
    });

    expect(result.motorARows.map((r) => r.angularVelocityRPM)).toEqual([
      1500, 3000,
    ]);
  });

  it('multiplies the faster motor torque by the required reduction', () => {
    const result = gearMotorChartDataToSameSpeed({
      motorARows,
      motorAFreeSpeedRPM: 6000,
      motorBRows,
      motorBFreeSpeedRPM: 3000,
    });

    expect(result.motorARows.map((r) => r.torqueNewtonMeters)).toEqual([
      3, 0.5,
    ]);
  });

  it('gears motor B when motor B has the higher free speed', () => {
    const result = gearMotorChartDataToSameSpeed({
      motorARows: motorBRows,
      motorAFreeSpeedRPM: 3000,
      motorBRows: motorARows,
      motorBFreeSpeedRPM: 6000,
    });

    expect(
      result.motorBRows.map((r) => ({
        angularVelocityRPM: r.angularVelocityRPM,
        torqueNewtonMeters: r.torqueNewtonMeters,
      })),
    ).toEqual([
      { angularVelocityRPM: 1500, torqueNewtonMeters: 3 },
      { angularVelocityRPM: 3000, torqueNewtonMeters: 0.5 },
    ]);
  });

  it('leaves current, efficiency, and percent of free speed unchanged', () => {
    const result = gearMotorChartDataToSameSpeed({
      motorARows,
      motorAFreeSpeedRPM: 6000,
      motorBRows,
      motorBFreeSpeedRPM: 3000,
    });

    expect(
      result.motorARows.map((r) => ({
        currentDrawAmps: r.currentDrawAmps,
        efficiencyPercent: r.efficiencyPercent,
        percentOfFreeSpeed: r.percentOfFreeSpeed,
      })),
    ).toEqual([
      {
        currentDrawAmps: 30,
        efficiencyPercent: 80,
        percentOfFreeSpeed: 50,
      },
      {
        currentDrawAmps: 10,
        efficiencyPercent: 60,
        percentOfFreeSpeed: 100,
      },
    ]);
  });

  it('leaves both motors unchanged when their free speeds are equal', () => {
    const result = gearMotorChartDataToSameSpeed({
      motorARows,
      motorAFreeSpeedRPM: 6000,
      motorBRows,
      motorBFreeSpeedRPM: 6000,
    });

    expect(result).toEqual({ motorARows, motorBRows });
  });

  it.each<[string, number, number]>([
    ['zero motor A free speed', 0, 3000],
    ['negative motor A free speed', -6000, 3000],
    ['non-finite motor A free speed', Number.NaN, 3000],
    ['zero motor B free speed', 6000, 0],
    ['negative motor B free speed', 6000, -3000],
    ['non-finite motor B free speed', 6000, Number.POSITIVE_INFINITY],
  ])(
    'leaves both motors unchanged for %s',
    (_, motorAFreeSpeedRPM, motorBFreeSpeedRPM) => {
      const result = gearMotorChartDataToSameSpeed({
        motorARows,
        motorAFreeSpeedRPM,
        motorBRows,
        motorBFreeSpeedRPM,
      });

      expect(result).toEqual({ motorARows, motorBRows });
    },
  );

  it.each<[string, MotorChartRow[], MotorChartRow[]]>([
    ['motor A', [], motorBRows],
    ['motor B', motorARows, []],
  ])(
    'leaves the available rows unchanged when %s rows are missing',
    (_, availableMotorARows, availableMotorBRows) => {
      const result = gearMotorChartDataToSameSpeed({
        motorARows: availableMotorARows,
        motorAFreeSpeedRPM: 6000,
        motorBRows: availableMotorBRows,
        motorBFreeSpeedRPM: 3000,
      });

      expect(result).toEqual({
        motorARows: availableMotorARows,
        motorBRows: availableMotorBRows,
      });
    },
  );
});

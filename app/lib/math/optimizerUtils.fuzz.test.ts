import { describe, expect, it } from 'vitest';

import {
  cartesian,
  LINEAR_FUZZ_NUMBERS,
  snapshotNumber,
} from '~/lib/math/linearFuzzTestUtils';
import {
  adaptiveSimSeconds,
  getMetric,
  makeGrid,
  OPTIMIZER_SIM_CEIL_SECONDS,
  peakSupplyCurrent,
  reduceConfigOutput,
  selectBest,
  trapezoidProfileDurationSeconds,
  type ConfigOptResult,
  type MetricSource,
  type OptimizationPriority,
  type SimState,
} from '~/lib/math/optimizerUtils';

const positive = LINEAR_FUZZ_NUMBERS.filter((value) => value > 0);
const priorities: OptimizationPriority[] = [
  'timeToGoal',
  'peakCurrent',
  'energy',
  'avgPower',
];

function metricCase(
  timeToGoalSeconds: number,
  peakCurrentAmps: number,
  energyJoules: number,
): MetricSource {
  return { timeToGoalSeconds, peakCurrentAmps, energyJoules };
}

function configCase(
  index: number,
  success: boolean,
  timeToGoalSeconds: number,
): ConfigOptResult {
  return {
    statorLimitAmps: (index + 1) * 10,
    supplyLimitAmps: (index + 1) * 10,
    optimalRatio: 0.5 + index,
    timeToGoalSeconds,
    peakCurrentAmps: 5 + index,
    energyJoules: 100 + index * 25,
    success,
  };
}

describe('optimizer utility fuzz cases', () => {
  it('matches the closed-form profile duration across triangular and trapezoidal cases', () => {
    const cases = cartesian(
      [0.001, 0.1, 1, 10, 100],
      [0.1, 1, 5, 20],
      [0.1, 1, 5, 20],
    );
    const snapshot = cases.map(([distance, velocity, acceleration]) => {
      const distanceToReachVelocity = velocity ** 2 / acceleration;
      const expected =
        distanceToReachVelocity >= distance
          ? 2 * Math.sqrt(distance / acceleration)
          : 2 * (velocity / acceleration) +
            (distance - distanceToReachVelocity) / velocity;
      const actual = trapezoidProfileDurationSeconds(
        distance,
        velocity,
        acceleration,
      );

      expect(actual).toBeCloseTo(expected, 10);
      expect(actual).toBeGreaterThan(0);
      return {
        distance,
        velocity,
        acceleration,
        duration: snapshotNumber(actual),
      };
    });

    expect(snapshot).toMatchSnapshot();
  });

  it('preserves profile-duration monotonicity across numeric inputs', () => {
    for (const distance of positive) {
      const slow = trapezoidProfileDurationSeconds(distance, 1, 1);
      const fast = trapezoidProfileDurationSeconds(distance, 10, 10);
      expect(fast).toBeLessThanOrEqual(slow);

      const longer = trapezoidProfileDurationSeconds(distance * 2, 1, 1);
      expect(longer).toBeGreaterThanOrEqual(slow);
    }
  });

  it('keeps adaptive simulation windows inside their configured bounds', () => {
    const snapshot = cartesian(
      [0, 0.001, 0.1, 1, 10, 100],
      [0.1, 1, 10],
      [0.1, 1, 10],
      [0.5, 1.5, 4],
    ).map(([distance, velocity, acceleration, floor]) => {
      const result = adaptiveSimSeconds(
        distance,
        velocity,
        acceleration,
        floor,
      );

      expect(Number.isFinite(result)).toBe(true);
      expect(result).toBeLessThanOrEqual(OPTIMIZER_SIM_CEIL_SECONDS);
      expect(result).toBeGreaterThanOrEqual(
        Math.min(floor, OPTIMIZER_SIM_CEIL_SECONDS),
      );

      return {
        distance,
        velocity,
        acceleration,
        floor,
        result: snapshotNumber(result),
      };
    });

    expect(snapshot).toMatchSnapshot();
  });

  it('selects a candidate from every generated priority/tolerance combination', () => {
    const candidates = positive
      .slice(0, 6)
      .map((value, index) =>
        metricCase(value, positive[positive.length - index - 1], value * 100),
      );
    const priorityCases = [
      ['timeToGoal'],
      ['peakCurrent'],
      ['energy'],
      ['avgPower'],
      ['timeToGoal', 'energy'],
      ['peakCurrent', 'timeToGoal', 'energy'],
    ] as OptimizationPriority[][];
    const tolerances = [0, 0.01, 0.1, 1];

    const snapshot = cartesian(priorityCases, tolerances).map(
      ([casePriorities, tolerance]) => {
        const result = selectBest(candidates, casePriorities, tolerance);
        expect(candidates).toContain(result.result);
        expect(result.tier1Count).toBeGreaterThan(0);
        expect(result.tier2Count).toBeGreaterThan(0);
        expect(result.tier2Count).toBeLessThanOrEqual(result.tier1Count);

        return {
          priorities: casePriorities,
          tolerance,
          selected: candidates.indexOf(result.result),
          tier1Count: result.tier1Count,
          tier2Count: result.tier2Count,
        };
      },
    );

    expect(snapshot).toMatchSnapshot();
  });

  it('returns the expected metric for every priority and positive source', () => {
    const cases = cartesian(positive.slice(0, 5), positive.slice(1, 6)).map(
      ([time, scale]) => metricCase(time, scale * 10, time * scale * 100),
    );

    const snapshot = cases.map((source) => {
      const values = priorities.map((priority) =>
        snapshotNumber(getMetric(source, priority)),
      );
      expect(values.every((value) => typeof value === 'number')).toBe(true);
      return { source, values };
    });

    expect(snapshot).toMatchSnapshot();
  });

  it('keeps grids ordered and bounded for every positive maximum', () => {
    const snapshot = [0, ...positive].map((maximum) => {
      const grid = makeGrid(maximum);
      expect(grid.every((value) => value > 0 && value <= maximum)).toBe(true);
      expect(
        grid.every((value, index) => index === 0 || value > grid[index - 1]),
      ).toBe(true);
      expect(
        (maximum === 0 && grid.length === 0) ||
          (maximum > 0 && grid.at(-1) === maximum),
      ).toBe(true);
      return { maximum, grid };
    });

    expect(snapshot).toMatchSnapshot();
  });

  it('reduces generated configuration results to the fastest successful result', () => {
    const cases = [
      [configCase(0, false, Number.POSITIVE_INFINITY)],
      [
        configCase(0, false, Number.POSITIVE_INFINITY),
        configCase(1, true, 2),
        configCase(2, true, 3),
      ],
      [
        configCase(0, true, 4),
        configCase(1, true, 1),
        configCase(2, false, Number.POSITIVE_INFINITY),
      ],
    ];

    const snapshot = cases.map((results) => {
      const reduced = reduceConfigOutput(results);
      const successful = results.filter((result) => result.success);
      expect(reduced.allResults).toEqual(results);
      const expectedRecommendation =
        successful.length === 0
          ? null
          : successful.reduce((best, result) =>
              result.timeToGoalSeconds < best.timeToGoalSeconds ? result : best,
            );
      expect(reduced.recommended).toBe(expectedRecommendation);
      return {
        resultCount: results.length,
        successCount: successful.length,
        recommended: reduced.recommended
          ? {
              stator: reduced.recommended.statorLimitAmps,
              supply: reduced.recommended.supplyLimitAmps,
              time: snapshotNumber(reduced.recommended.timeToGoalSeconds),
            }
          : null,
      };
    });

    expect(snapshot).toMatchSnapshot();
  });

  it('finds the maximum current in generated state sequences', () => {
    const states: SimState[][] = cartesian(
      [0, 1, 10],
      [0.001, 1, 100],
      [0, 50, 200],
    ).map(([first, second, third]) => [
      {
        supplyCurrentDrawAmps: first,
        timeSeconds: 1,
        energyJoules: 1,
        success: true,
      },
      {
        supplyCurrentDrawAmps: second,
        timeSeconds: 2,
        energyJoules: 2,
        success: true,
      },
      {
        supplyCurrentDrawAmps: third,
        timeSeconds: 3,
        energyJoules: 3,
        success: true,
      },
    ]);

    const snapshot = states.map((sequence) => {
      const expected = Math.max(
        ...sequence.map((state) => state.supplyCurrentDrawAmps),
      );
      expect(peakSupplyCurrent(sequence)).toBe(expected);
      return snapshotNumber(expected);
    });

    expect(snapshot).toMatchSnapshot();
  });
});

import { describe, expect, it } from 'vitest';

import {
  type ConfigOptResult,
  type OptimizationPriority,
  type SimState,
  type MetricSource,
  OPTIMIZER_SIM_CEIL_SECONDS,
  adaptiveSimSeconds,
  compareBucketedMetrics,
  peakSupplyCurrent,
  getMetric,
  reduceConfigOutput,
  searchOptimalRatio,
  selectBestBucketed,
  selectBest,
  makeCenteredCurrentGrid,
  trapezoidProfileDurationSeconds,
} from '~/lib/math/optimizerUtils';

describe('optimizerUtils', () => {
  function configResult(
    index: number,
    values: {
      timeToGoalSeconds: number;
      peakCurrentAmps: number;
      energyJoules: number;
      success?: boolean;
    },
  ): ConfigOptResult {
    return {
      statorLimitAmps: index + 1,
      supplyLimitAmps: index + 1,
      optimalRatio: index + 1,
      success: values.success ?? true,
      ...values,
    };
  }

  function metricCase(
    timeToGoalSeconds: number,
    peakCurrentAmps: number,
    energyJoules: number,
  ): MetricSource {
    return { timeToGoalSeconds, peakCurrentAmps, energyJoules };
  }

  describe('peakSupplyCurrent', () => {
    it('returns the maximum supply current from simulation states', () => {
      const states: SimState[] = [
        {
          supplyCurrentDrawAmps: 10,
          timeSeconds: 1,
          energyJoules: 100,
          success: true,
        },
        {
          supplyCurrentDrawAmps: 25,
          timeSeconds: 2,
          energyJoules: 200,
          success: true,
        },
        {
          supplyCurrentDrawAmps: 15,
          timeSeconds: 3,
          energyJoules: 300,
          success: true,
        },
      ];
      expect(peakSupplyCurrent(states)).toBe(25);
    });

    it('returns 0 for empty states array', () => {
      expect(peakSupplyCurrent([])).toBe(0);
    });
  });

  describe('getMetric', () => {
    const mockResult: MetricSource = {
      timeToGoalSeconds: 2.5,
      peakCurrentAmps: 30,
      energyJoules: 500,
    };

    it('returns timeToGoalSeconds for timeToGoal priority', () => {
      expect(getMetric(mockResult, 'timeToGoal')).toBe(2.5);
    });

    it('returns peakCurrentAmps for peakCurrent priority', () => {
      expect(getMetric(mockResult, 'peakCurrent')).toBe(30);
    });

    it('returns energyJoules for energy priority', () => {
      expect(getMetric(mockResult, 'energy')).toBe(500);
    });

    it('returns average power for avgPower priority', () => {
      expect(getMetric(mockResult, 'avgPower')).toBe(200); // 500 / 2.5
    });

    it('returns POSITIVE_INFINITY for avgPower when time is 0', () => {
      const zeroTimeResult = { ...mockResult, timeToGoalSeconds: 0 };
      expect(getMetric(zeroTimeResult, 'avgPower')).toBe(
        Number.POSITIVE_INFINITY,
      );
    });
  });

  describe('selectBest', () => {
    const candidates: MetricSource[] = [
      { timeToGoalSeconds: 3.0, peakCurrentAmps: 25, energyJoules: 600 },
      { timeToGoalSeconds: 2.0, peakCurrentAmps: 35, energyJoules: 400 },
      { timeToGoalSeconds: 2.1, peakCurrentAmps: 30, energyJoules: 420 },
      { timeToGoalSeconds: 4.0, peakCurrentAmps: 20, energyJoules: 800 },
    ];

    it('selects best candidate with single priority', () => {
      const priorities: OptimizationPriority[] = ['timeToGoal'];
      const result = selectBest(candidates, priorities, 0.1);

      expect(result.result.timeToGoalSeconds).toBe(2.0);
      expect(result.tier1Count).toBe(2); // 2.0 and 2.1 within 10% tolerance
      expect(result.tier2Count).toBe(2);
    });

    it('selects best candidate with multiple priorities', () => {
      const priorities: OptimizationPriority[] = ['timeToGoal', 'energy'];
      const result = selectBest(candidates, priorities, 0.1);

      // Should pick the one with best energy among the tier1 time candidates
      expect(result.result.timeToGoalSeconds).toBe(2.0);
      expect(result.result.energyJoules).toBe(400);
    });

    it('handles zero tolerance correctly', () => {
      const priorities: OptimizationPriority[] = ['timeToGoal'];
      const result = selectBest(candidates, priorities, 0);

      expect(result.result.timeToGoalSeconds).toBe(2.0);
      expect(result.tier1Count).toBe(1); // Only exact best with 0% tolerance
    });
  });

  describe('bucketed optimization', () => {
    it('prioritizes the time bucket before all later metrics', () => {
      const faster = metricCase(1.04, 100, 100);
      const slower = metricCase(1.05, 1, 1);

      expect(compareBucketedMetrics(faster, slower)).toBeLessThan(0);
      expect(selectBestBucketed([slower, faster])).toBe(faster);
    });

    it('uses peak-current buckets after matching time buckets', () => {
      const highCurrent = metricCase(1.01, 10, 1);
      const lowCurrent = metricCase(1.04, 5.1, 100);

      expect(selectBestBucketed([highCurrent, lowCurrent])).toBe(lowCurrent);
    });

    it('uses energy buckets before average power', () => {
      const lowerEnergyBucket = metricCase(1.01, 5.1, 9.99);
      const higherEnergyBucket = metricCase(1.04, 5.1, 10.01);

      expect(selectBestBucketed([higherEnergyBucket, lowerEnergyBucket])).toBe(
        lowerEnergyBucket,
      );
    });

    it('uses raw average power after matching all buckets', () => {
      const higherPower = metricCase(1.01, 5.1, 9);
      const lowerPower = metricCase(1.04, 5.1, 8);

      expect(selectBestBucketed([higherPower, lowerPower])).toBe(lowerPower);
    });

    it('keeps the first candidate for an exact objective tie', () => {
      const first = metricCase(1.01, 5.1, 9);
      const second = metricCase(1.01, 5.1, 9);

      expect(selectBestBucketed([first, second])).toBe(first);
    });

    it('searches a deterministic local ratio region after the coarse scan', () => {
      const evaluatedRatios: number[] = [];
      const result = searchOptimalRatio(
        (ratio) => {
          evaluatedRatios.push(ratio);
          return ratio > 4.64 && ratio < 10
            ? metricCase(1.01, 1, 1)
            : metricCase(1.04, 100, 100);
        },
        {
          lowerBound: 1,
          upperBound: 100,
          coarseSamples: 4,
          localSamples: 16,
        },
      );

      expect(result).not.toBeNull();
      expect(result?.metrics.timeToGoalSeconds).toBe(1.01);
      expect(result?.ratio).toBeGreaterThan(4.64);
      expect(result?.ratio).toBeLessThan(10);
      expect(new Set(evaluatedRatios).size).toBe(evaluatedRatios.length);
    });
  });

  describe('reduceConfigOutput', () => {
    it('selects the fastest time bucket before considering other metrics', () => {
      const results = [
        configResult(0, {
          timeToGoalSeconds: 1.04,
          peakCurrentAmps: 100,
          energyJoules: 100,
        }),
        configResult(1, {
          timeToGoalSeconds: 1.05,
          peakCurrentAmps: 1,
          energyJoules: 1,
        }),
      ];

      expect(reduceConfigOutput(results).recommended).toBe(results[0]);
    });

    it('selects lower peak current when times share a 0.05-second bucket', () => {
      const results = [
        configResult(0, {
          timeToGoalSeconds: 1.01,
          peakCurrentAmps: 20,
          energyJoules: 1,
        }),
        configResult(1, {
          timeToGoalSeconds: 1.04,
          peakCurrentAmps: 10,
          energyJoules: 1,
        }),
      ];

      expect(reduceConfigOutput(results).recommended).toBe(results[1]);
    });

    it('selects the lowest five-amp peak-current bucket', () => {
      const results = [
        configResult(0, {
          timeToGoalSeconds: 1.01,
          peakCurrentAmps: 10,
          energyJoules: 1,
        }),
        configResult(1, {
          timeToGoalSeconds: 1.02,
          peakCurrentAmps: 5.1,
          energyJoules: 1,
        }),
        configResult(2, {
          timeToGoalSeconds: 1.03,
          peakCurrentAmps: 9.9,
          energyJoules: 2,
        }),
      ];

      expect(reduceConfigOutput(results).recommended).toBe(results[1]);
    });

    it('uses total energy as the final tie-breaker', () => {
      const results = [
        configResult(0, {
          timeToGoalSeconds: 1.01,
          peakCurrentAmps: 5.1,
          energyJoules: 20,
        }),
        configResult(1, {
          timeToGoalSeconds: 1.04,
          peakCurrentAmps: 9.9,
          energyJoules: 10,
        }),
      ];

      expect(reduceConfigOutput(results).recommended).toBe(results[1]);
    });

    it('puts exact time boundaries in the higher time bucket', () => {
      const results = [
        configResult(0, {
          timeToGoalSeconds: 0.149999999,
          peakCurrentAmps: 100,
          energyJoules: 100,
        }),
        configResult(1, {
          timeToGoalSeconds: 0.15,
          peakCurrentAmps: 1,
          energyJoules: 1,
        }),
      ];

      expect(reduceConfigOutput(results).recommended).toBe(results[0]);
    });

    it('puts exact peak-current boundaries in the higher current bucket', () => {
      const results = [
        configResult(0, {
          timeToGoalSeconds: 1.01,
          peakCurrentAmps: 5,
          energyJoules: 1,
        }),
        configResult(1, {
          timeToGoalSeconds: 1.02,
          peakCurrentAmps: 4.999999,
          energyJoules: 2,
        }),
      ];

      expect(reduceConfigOutput(results).recommended).toBe(results[1]);
    });

    it('retains the first result for exact metric ties', () => {
      const results = [
        configResult(0, {
          timeToGoalSeconds: 1.01,
          peakCurrentAmps: 5.1,
          energyJoules: 10,
        }),
        configResult(1, {
          timeToGoalSeconds: 1.01,
          peakCurrentAmps: 5.1,
          energyJoules: 10,
        }),
      ];

      expect(reduceConfigOutput(results).recommended).toBe(results[0]);
    });

    it('ignores unsuccessful and non-finite configurations', () => {
      const results = [
        configResult(0, {
          timeToGoalSeconds: 0.1,
          peakCurrentAmps: 1,
          energyJoules: 1,
          success: false,
        }),
        configResult(1, {
          timeToGoalSeconds: Number.NaN,
          peakCurrentAmps: 1,
          energyJoules: 1,
        }),
        configResult(2, {
          timeToGoalSeconds: 0.1,
          peakCurrentAmps: Number.POSITIVE_INFINITY,
          energyJoules: 1,
        }),
        configResult(3, {
          timeToGoalSeconds: 0.1,
          peakCurrentAmps: 1,
          energyJoules: Number.POSITIVE_INFINITY,
        }),
        configResult(4, {
          timeToGoalSeconds: 1.01,
          peakCurrentAmps: 5.1,
          energyJoules: 10,
        }),
      ];

      expect(reduceConfigOutput(results).recommended).toBe(results[4]);
    });

    it('returns no recommendation for an empty or entirely invalid result set', () => {
      const results = [
        configResult(0, {
          timeToGoalSeconds: Number.POSITIVE_INFINITY,
          peakCurrentAmps: 1,
          energyJoules: 1,
        }),
      ];
      const empty = reduceConfigOutput([]);
      const invalid = reduceConfigOutput(results);

      expect(empty.recommended).toBeNull();
      expect(invalid.recommended).toBeNull();
    });

    it('preserves the generated result array and its order', () => {
      const results = [
        configResult(0, {
          timeToGoalSeconds: 1.01,
          peakCurrentAmps: 5.1,
          energyJoules: 10,
        }),
        configResult(1, {
          timeToGoalSeconds: 1.04,
          peakCurrentAmps: 5.1,
          energyJoules: 5,
        }),
      ];

      const reduced = reduceConfigOutput(results);

      expect(reduced.allResults).toBe(results);
      expect(reduced.allResults).toEqual(results);
    });
  });

  describe('makeCenteredCurrentGrid', () => {
    it('creates a three-point grid centered on the current input', () => {
      expect(makeCenteredCurrentGrid(80)).toEqual([70, 80, 90]);
    });

    it('creates three distinct points for a low current input', () => {
      expect(makeCenteredCurrentGrid(15)).toEqual([5, 15, 25]);
    });

    it('raises an input below 15 amps before creating the grid', () => {
      expect(makeCenteredCurrentGrid(5)).toEqual([5, 15, 25]);
    });

    it('raises a zero input before creating the grid', () => {
      expect(makeCenteredCurrentGrid(0)).toEqual([5, 15, 25]);
    });
  });

  describe('trapezoidProfileDurationSeconds', () => {
    it('uses the triangular profile when cruise velocity is never reached', () => {
      // 60 in at 3.5908 m/s^2, velocity high enough to stay triangular.
      expect(trapezoidProfileDurationSeconds(1.524, 100, 3.5908)).toBeCloseTo(
        2 * Math.sqrt(1.524 / 3.5908),
        6,
      );
    });

    it('adds a cruise phase once the velocity limit binds', () => {
      // dist to reach vmax (accel + decel) = v^2 / a = 1 m; 1 < 10.
      expect(trapezoidProfileDurationSeconds(10, 2, 4)).toBeCloseTo(
        2 * (2 / 4) + (10 - 1) / 2,
        6,
      );
    });

    it('is zero for a zero-distance move', () => {
      expect(trapezoidProfileDurationSeconds(0, 2, 4)).toBe(0);
    });

    it('is infinite when acceleration is non-positive', () => {
      expect(trapezoidProfileDurationSeconds(1.524, 2, 0)).toBe(
        Number.POSITIVE_INFINITY,
      );
    });

    it('is infinite when velocity is non-positive', () => {
      expect(trapezoidProfileDurationSeconds(1.524, 0, 4)).toBe(
        Number.POSITIVE_INFINITY,
      );
    });

    it('is infinite for a non-finite input', () => {
      expect(trapezoidProfileDurationSeconds(NaN, 2, 4)).toBe(
        Number.POSITIVE_INFINITY,
      );
    });
  });

  describe('adaptiveSimSeconds', () => {
    it('pads the profile duration when it exceeds the floor', () => {
      const duration = trapezoidProfileDurationSeconds(1.524, 3.4, 3.5908);
      expect(adaptiveSimSeconds(1.524, 3.4, 3.5908, 1.0)).toBeCloseTo(
        duration * 1.3 + 0.15,
        6,
      );
    });

    it('never returns less than the floor', () => {
      // Fast move: padded duration is well under a second.
      expect(adaptiveSimSeconds(1.524, 3.4, 80, 1.0)).toBe(1.0);
      expect(adaptiveSimSeconds(1.524, 3.4, 80, 1.5)).toBe(1.5);
    });

    it('never exceeds the ceiling', () => {
      expect(adaptiveSimSeconds(5, 1, 0.5, 1.0)).toBe(
        OPTIMIZER_SIM_CEIL_SECONDS,
      );
    });

    it('returns the ceiling for an unusable profile', () => {
      expect(adaptiveSimSeconds(1.524, 0, 4, 1.0)).toBe(
        OPTIMIZER_SIM_CEIL_SECONDS,
      );
    });
  });
});

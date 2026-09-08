import { describe, expect, it } from 'vitest';

import {
  type OptimizationPriority,
  type SimState,
  type MetricSource,
  OPTIMIZER_SIM_CEIL_SECONDS,
  adaptiveSimSeconds,
  peakSupplyCurrent,
  getMetric,
  selectBest,
  makeGrid,
  trapezoidProfileDurationSeconds,
} from '~/lib/math/optimizerUtils';

describe('optimizerUtils', () => {
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

  describe('makeGrid', () => {
    it('creates grid with 10-unit steps up to max', () => {
      expect(makeGrid(35)).toEqual([10, 20, 30, 35]);
    });

    it('creates grid with exact multiples of 10', () => {
      expect(makeGrid(30)).toEqual([10, 20, 30]);
    });

    it('handles small values', () => {
      expect(makeGrid(5)).toEqual([5]);
    });

    it('handles zero', () => {
      expect(makeGrid(0)).toEqual([]);
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

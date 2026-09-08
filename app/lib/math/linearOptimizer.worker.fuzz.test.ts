import { describe, expect, it } from 'vitest';

import {
  cartesian,
  measurement,
  snapshotNumber,
} from '~/lib/math/linearFuzzTestUtils';
import {
  optimizeConfiguration,
  optimizeConfigurationCell,
  optimizeRatio,
  simulateOnce,
  type OptimizeConfigurationParams,
  type OptimizeRatioParams,
  type SimulateOnceParams,
} from '~/lib/math/linearOptimizer.worker';
import Motor from '~/lib/models/Motor';

function makeBaseParams(
  overrides: Partial<OptimizeConfigurationParams> = {},
): OptimizeConfigurationParams {
  return {
    motorDict: Motor.KrakenX60sFOC(1).toDict(),
    loadDict: measurement(5, 'lb').toDict(),
    spoolDiameterDict: measurement(1, 'in').toDict(),
    travelDistanceDict: measurement(18, 'in').toDict(),
    batteryResistanceDict: measurement(0.005, 'Ohm').toDict(),
    batteryVoltageDict: measurement(12, 'V').toDict(),
    angleDict: measurement(90, 'deg').toDict(),
    efficiency: 1,
    cascade: false,
    batteryVoltageFilterTimeConstantSeconds: 0.1,
    maximumComfortableStatorLimitDict: measurement(20, 'A').toDict(),
    maximumComfortableSupplyLimitDict: measurement(20, 'A').toDict(),
    maxVelocityMPS: 1.5,
    maxAccelerationMPS2: 4,
    qPositionMeters: 0.02,
    qVelocityMPS: 0.4,
    rVolts: 12,
    sensorDelaySeconds: 0.001,
    kalmanFilterPositionStdDevDict: measurement(2, 'in').toDict(),
    kalmanFilterVelocityStdDevDict: measurement(40, 'in/s').toDict(),
    kalmanFilterEncoderPositionStdDevDict: measurement(0.001, 'in').toDict(),
    ...overrides,
  };
}

function asSimulateOnceParams(
  params: OptimizeConfigurationParams,
  ratioMagnitude: number,
  statorLimitAmps: number,
  supplyLimitAmps: number,
): SimulateOnceParams {
  return {
    ...params,
    ratioMagnitude,
    statorLimitAmps,
    supplyLimitAmps,
    maxVelocityMPS: params.maxVelocityMPS ?? 1.5,
    maxAccelerationMPS2: params.maxAccelerationMPS2 ?? 4,
  };
}

function asOptimizeRatioParams(
  params: OptimizeConfigurationParams,
  statorLimitAmps: number,
  initialRatio: number,
): OptimizeRatioParams {
  return {
    ...params,
    supplyLimitDict: measurement(60, 'A').toDict(),
    statorLimitAmps,
    initialRatio,
    maxVelocityMPS: params.maxVelocityMPS ?? 1.5,
    maxAccelerationMPS2: params.maxAccelerationMPS2 ?? 4,
  };
}

function snapshotMetric(value: number): number | string {
  return snapshotNumber(value);
}

describe('linear simulation optimizer fuzz cases', () => {
  it('keeps single simulations coherent across ratios and current limits', async () => {
    const params = makeBaseParams();
    const cases = cartesian(
      [0.25, 0.5, 1, 2, 5, 10],
      [10, 20, 40],
      [10, 20, 60],
    );
    const snapshot = [];

    for (const [ratioMagnitude, statorLimitAmps, supplyLimitAmps] of cases) {
      const result = await simulateOnce(
        asSimulateOnceParams(
          params,
          ratioMagnitude,
          statorLimitAmps,
          supplyLimitAmps,
        ),
      );

      expect(result.ratioMagnitude).toBe(ratioMagnitude);
      expect(result.statorLimitAmps).toBe(statorLimitAmps);
      expect(result.supplyLimitAmps).toBe(supplyLimitAmps);
      expect(Number.isNaN(result.timeToGoalSeconds)).toBe(false);
      expect(Number.isNaN(result.energyJoules)).toBe(false);
      expect(Number.isNaN(result.peakCurrentAmps)).toBe(false);
      expect(result.energyJoules).toBeGreaterThanOrEqual(0);
      expect(result.peakCurrentAmps).toBeGreaterThanOrEqual(0);
      expect(!result.success || Number.isFinite(result.timeToGoalSeconds)).toBe(
        true,
      );
      expect(!result.success || result.timeToGoalSeconds > 0).toBe(true);

      snapshot.push({
        ratio: snapshotMetric(result.ratioMagnitude),
        stator: snapshotMetric(result.statorLimitAmps),
        supply: snapshotMetric(result.supplyLimitAmps),
        time: snapshotMetric(result.timeToGoalSeconds),
        energy: snapshotMetric(result.energyJoules),
        peakCurrent: snapshotMetric(result.peakCurrentAmps),
        success: result.success,
      });
    }

    expect(snapshot).toMatchSnapshot();
  }, 180_000);

  it('keeps ratio optimization results inside the search domain', async () => {
    const params = makeBaseParams({
      maxVelocityMPS: null,
      maxAccelerationMPS2: null,
    });
    const cases = cartesian([10, 30, 60], [0.5, 1, 5, 20], [0.5, 0.75, 0.9, 1]);
    const snapshot = [];

    for (const [statorLimitAmps, initialRatio, efficiency] of cases) {
      expect(efficiency).toBeGreaterThanOrEqual(0.5);
      expect(efficiency).toBeLessThanOrEqual(1);

      const result = await optimizeRatio(
        asOptimizeRatioParams(
          { ...params, efficiency },
          statorLimitAmps,
          initialRatio,
        ),
      );

      expect(
        Number.isNaN(result.optimalRatio) ||
          (Number.isFinite(result.optimalRatio) &&
            result.optimalRatio >= 0.25 &&
            result.optimalRatio <= 50),
      ).toBe(true);
      expect(Number.isNaN(result.timeToGoalSeconds)).toBe(false);
      expect(Number.isNaN(result.energyJoules)).toBe(false);
      expect(Number.isNaN(result.peakCurrentAmps)).toBe(false);
      expect(
        !Number.isFinite(result.timeToGoalSeconds) ||
          result.timeToGoalSeconds > 0,
      ).toBe(true);
      expect(
        !Number.isFinite(result.timeToGoalSeconds) || result.energyJoules >= 0,
      ).toBe(true);
      expect(
        !Number.isFinite(result.timeToGoalSeconds) ||
          result.peakCurrentAmps >= 0,
      ).toBe(true);

      snapshot.push({
        stator: statorLimitAmps,
        initialRatio,
        efficiency,
        optimalRatio: snapshotMetric(result.optimalRatio),
        time: snapshotMetric(result.timeToGoalSeconds),
        energy: snapshotMetric(result.energyJoules),
        peakCurrent: snapshotMetric(result.peakCurrentAmps),
      });
    }

    expect(snapshot).toMatchSnapshot();
  }, 240_000);

  it('keeps configuration-cell results valid across grid-limit combinations', async () => {
    const params = makeBaseParams({
      maxVelocityMPS: null,
      maxAccelerationMPS2: null,
    });
    const cases = cartesian([10, 20, 40], [10, 20, 60], [false, true]);
    const snapshot = [];

    for (const [statorAmps, supplyAmps, cascade] of cases) {
      const result = await optimizeConfigurationCell({
        ...params,
        cascade,
        statorAmps,
        supplyAmps,
      });

      expect(result.statorLimitAmps).toBe(statorAmps);
      expect(result.supplyLimitAmps).toBe(supplyAmps);
      expect(Number.isNaN(result.timeToGoalSeconds)).toBe(false);
      expect(Number.isNaN(result.energyJoules)).toBe(false);
      expect(Number.isNaN(result.peakCurrentAmps)).toBe(false);
      expect(!result.success || Number.isFinite(result.optimalRatio)).toBe(
        true,
      );
      expect(!result.success || result.optimalRatio >= 0.25).toBe(true);
      expect(!result.success || result.optimalRatio <= 50).toBe(true);
      expect(!result.success || result.timeToGoalSeconds > 0).toBe(true);
      expect(!result.success || result.energyJoules >= 0).toBe(true);
      expect(!result.success || result.peakCurrentAmps >= 0).toBe(true);

      snapshot.push({
        stator: statorAmps,
        supply: supplyAmps,
        cascade,
        optimalRatio: snapshotMetric(result.optimalRatio),
        time: snapshotMetric(result.timeToGoalSeconds),
        energy: snapshotMetric(result.energyJoules),
        peakCurrent: snapshotMetric(result.peakCurrentAmps),
        success: result.success,
      });
    }

    expect(snapshot).toMatchSnapshot();
  }, 300_000);

  it('returns a complete and reducible result for a generated configuration grid', async () => {
    const params = makeBaseParams({
      maximumComfortableStatorLimitDict: measurement(20, 'A').toDict(),
      maximumComfortableSupplyLimitDict: measurement(20, 'A').toDict(),
      maxVelocityMPS: 1.5,
      maxAccelerationMPS2: 4,
    });
    const result = await optimizeConfiguration(params);

    expect(result.allResults).toHaveLength(4);
    expect(
      result.allResults.every(
        (cell) => Number.isNaN(cell.timeToGoalSeconds) === false,
      ),
    ).toBe(true);
    for (const cell of result.allResults) {
      expect(cell.statorLimitAmps).toBeGreaterThan(0);
      expect(cell.supplyLimitAmps).toBeGreaterThan(0);
      expect(
        Number.isNaN(cell.optimalRatio) ||
          (Number.isFinite(cell.optimalRatio) &&
            cell.optimalRatio >= 0.25 &&
            cell.optimalRatio <= 50),
      ).toBe(true);
    }

    const successful = result.allResults.filter((cell) => cell.success);
    const recommended = result.recommended;
    expect(recommended === null || recommended.success).toBe(true);
    expect(
      recommended === null || result.allResults.includes(recommended),
    ).toBe(true);
    expect(
      recommended === null ||
        recommended.timeToGoalSeconds ===
          Math.min(...successful.map((cell) => cell.timeToGoalSeconds)),
    ).toBe(true);

    expect({
      recommended: result.recommended
        ? {
            stator: result.recommended.statorLimitAmps,
            supply: result.recommended.supplyLimitAmps,
            ratio: snapshotMetric(result.recommended.optimalRatio),
            time: snapshotMetric(result.recommended.timeToGoalSeconds),
          }
        : null,
      cells: result.allResults.map((cell) => ({
        stator: cell.statorLimitAmps,
        supply: cell.supplyLimitAmps,
        ratio: snapshotMetric(cell.optimalRatio),
        time: snapshotMetric(cell.timeToGoalSeconds),
        success: cell.success,
      })),
    }).toMatchSnapshot();
  }, 300_000);
});

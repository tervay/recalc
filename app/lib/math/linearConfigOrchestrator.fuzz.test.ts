import { describe, expect, it } from 'vitest';

import { orchestrateConfigOptimization } from '~/lib/math/linearConfigOrchestrator';
import {
  cartesian,
  measurement,
  snapshotNumber,
} from '~/lib/math/linearFuzzTestUtils';
import type {
  ConfigOptResult,
  OptimizeConfigurationParams,
} from '~/lib/math/linearOptimizer.worker';
import { reduceConfigOutput } from '~/lib/math/optimizerUtils';
import Motor from '~/lib/models/Motor';

function makeParams(
  statorInputAmps: number,
  supplyInputAmps: number,
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
    statorInputAmps,
    supplyInputAmps,
    maxVelocityMPS: 1.5,
    maxAccelerationMPS2: 4,
    qPositionMeters: 0.02,
    qVelocityMPS: 0.4,
    rVolts: 12,
    sensorDelaySeconds: 0.001,
    kalmanFilterPositionStdDevDict: measurement(2, 'in').toDict(),
    kalmanFilterVelocityStdDevDict: measurement(40, 'in/s').toDict(),
    kalmanFilterEncoderPositionStdDevDict: measurement(0.001, 'in').toDict(),
  };
}

function fakeCell(
  statorLimitAmps: number,
  supplyLimitAmps: number,
): ConfigOptResult {
  const success = statorLimitAmps >= 20 && supplyLimitAmps >= 20;
  return {
    statorLimitAmps,
    supplyLimitAmps,
    optimalRatio: success ? 2 + statorLimitAmps / supplyLimitAmps : Number.NaN,
    timeToGoalSeconds: success
      ? 10 / (statorLimitAmps + supplyLimitAmps)
      : Number.POSITIVE_INFINITY,
    peakCurrentAmps: supplyLimitAmps,
    energyJoules: success ? statorLimitAmps * 2 : 0,
    success,
  };
}

describe('linear configuration orchestration fuzz cases', () => {
  it('enumerates every generated grid and preserves row-major order', async () => {
    const cases = cartesian([0, 5, 20, 25], [0, 5, 20, 25]);
    const snapshot = [];

    for (const [statorInputAmps, supplyInputAmps] of cases) {
      const calls: Array<[number, number]> = [];
      const result = await orchestrateConfigOptimization(
        makeParams(statorInputAmps, supplyInputAmps),
        async (statorAmps, supplyAmps) => {
          calls.push([statorAmps, supplyAmps]);
          // Completion order intentionally differs from invocation order.
          await new Promise<void>((resolve) => {
            setTimeout(
              () => {
                resolve();
              },
              (statorInputAmps - statorAmps + supplyInputAmps - supplyAmps) % 3,
            );
          });
          return fakeCell(statorAmps, supplyAmps);
        },
      );

      expect(
        result.allResults.map((cell) => [
          cell.statorLimitAmps,
          cell.supplyLimitAmps,
        ]),
      ).toEqual(calls);
      expect(result.allResults).toHaveLength(9);
      const expectedRecommendation = reduceConfigOutput(
        result.allResults,
      ).recommended;
      expect(result.recommended).toBe(expectedRecommendation);

      snapshot.push({
        statorInputAmps,
        supplyInputAmps,
        cells: result.allResults.map((cell) => ({
          stator: cell.statorLimitAmps,
          supply: cell.supplyLimitAmps,
          ratio: snapshotNumber(cell.optimalRatio),
          time: snapshotNumber(cell.timeToGoalSeconds),
          success: cell.success,
        })),
        recommended: result.recommended
          ? [
              result.recommended.statorLimitAmps,
              result.recommended.supplyLimitAmps,
            ]
          : null,
      });
    }

    expect(snapshot).toMatchSnapshot();
  });

  it('preserves successful and failed cell results when the runner rejects no cells', async () => {
    const result = await orchestrateConfigOptimization(
      makeParams(20, 20),
      async (statorAmps, supplyAmps) => fakeCell(statorAmps, supplyAmps),
    );

    expect(result.allResults).toHaveLength(9);
    expect(result.allResults.filter((cell) => cell.success)).toHaveLength(4);
    expect(result.recommended?.statorLimitAmps).toBe(30);
    expect(result.recommended?.supplyLimitAmps).toBe(30);
  });
});

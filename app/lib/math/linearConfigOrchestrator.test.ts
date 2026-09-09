import { describe, expect, it } from 'vitest';

import { orchestrateConfigOptimization } from '~/lib/math/linearConfigOrchestrator';
import {
  type ConfigOptResult,
  type OptimizeConfigurationParams,
  optimizeConfiguration,
  optimizeConfigurationCell,
} from '~/lib/math/linearOptimizer.worker';
import Measurement from '~/lib/models/Measurement';
import Motor from '~/lib/models/Motor';

// A realistic parameter set mirroring the /linear route defaults.
function makeParams(
  overrides?: Partial<OptimizeConfigurationParams>,
): OptimizeConfigurationParams {
  return {
    motorDict: Motor.KrakenX60sFOC(2).toDict(),
    loadDict: new Measurement(5, 'lb').toDict(),
    spoolDiameterDict: new Measurement(1, 'in').toDict(),
    travelDistanceDict: new Measurement(60, 'in').toDict(),
    batteryResistanceDict: new Measurement(0.015, 'Ohm').toDict(),
    batteryVoltageDict: new Measurement(12, 'V').toDict(),
    statorInputAmps: 40,
    supplyInputAmps: 20,
    angleDict: new Measurement(90, 'deg').toDict(),
    efficiency: 1.0,
    cascade: false,
    batteryVoltageFilterTimeConstantSeconds: 0.1,
    maxVelocityMPS: null,
    maxAccelerationMPS2: null,
    qPositionMeters: new Measurement(0.02, 'm').to('m').scalar,
    qVelocityMPS: new Measurement(0.4, 'm/s').to('m/s').scalar,
    rVolts: new Measurement(12, 'V').to('V').scalar,
    sensorDelaySeconds: new Measurement(1, 'ms').to('s').scalar,
    kalmanFilterPositionStdDevDict: new Measurement(2, 'in').toDict(),
    kalmanFilterVelocityStdDevDict: new Measurement(40, 'in/s').toDict(),
    kalmanFilterEncoderPositionStdDevDict: new Measurement(
      0.001,
      'in',
    ).toDict(),
    ...overrides,
  };
}

// Runs the grid in-process cell-by-cell, mirroring what the main-thread pool
// orchestration does but without an actual worker pool.
function runInProcess(params: OptimizeConfigurationParams) {
  return orchestrateConfigOptimization(params, (statorAmps, supplyAmps) =>
    optimizeConfigurationCell({ ...params, statorAmps, supplyAmps }),
  );
}

describe('orchestrateConfigOptimization', () => {
  it('applies the shared recommendation strategy to the parallel grid', async () => {
    const params = makeParams({
      statorInputAmps: 20,
      supplyInputAmps: 20,
    });
    const results: ConfigOptResult[] = [
      {
        statorLimitAmps: 10,
        supplyLimitAmps: 10,
        optimalRatio: 1,
        timeToGoalSeconds: 1.01,
        peakCurrentAmps: 5.1,
        energyJoules: 20,
        success: true,
      },
      {
        statorLimitAmps: 10,
        supplyLimitAmps: 20,
        optimalRatio: 2,
        timeToGoalSeconds: 1.04,
        peakCurrentAmps: 9.9,
        energyJoules: 10,
        success: true,
      },
      {
        statorLimitAmps: 20,
        supplyLimitAmps: 10,
        optimalRatio: 3,
        timeToGoalSeconds: 1.05,
        peakCurrentAmps: 1,
        energyJoules: 1,
        success: true,
      },
      {
        statorLimitAmps: 20,
        supplyLimitAmps: 20,
        optimalRatio: 4,
        timeToGoalSeconds: 1.02,
        peakCurrentAmps: 5.2,
        energyJoules: 5,
        success: true,
      },
      ...[
        [30, 10],
        [30, 20],
        [30, 30],
        [40, 10],
        [40, 20],
      ].map(([statorLimitAmps, supplyLimitAmps]) => ({
        statorLimitAmps,
        supplyLimitAmps,
        optimalRatio: 5,
        timeToGoalSeconds: 2,
        peakCurrentAmps: 100,
        energyJoules: 100,
        success: true,
      })),
    ];
    let resultIndex = 0;

    const output = await orchestrateConfigOptimization(params, async () => {
      const result = results[resultIndex];
      if (!result) {
        throw new Error('Unexpected extra configuration cell');
      }
      resultIndex += 1;
      return result;
    });

    expect(output.recommended).toBe(results[3]);
    expect(output.allResults).toEqual(results);
  });

  it('produces results identical to the serial optimizeConfiguration (guessed limits)', async () => {
    const params = makeParams();
    const [serial, parallel] = await Promise.all([
      optimizeConfiguration(params),
      runInProcess(params),
    ]);

    expect(parallel.allResults).toEqual(serial.allResults);
    expect(parallel.recommended).toEqual(serial.recommended);
  }, 120_000);

  it('produces identical results with explicit velocity/acceleration limits', async () => {
    const params = makeParams({
      maxVelocityMPS: 2,
      maxAccelerationMPS2: 10,
    });
    const [serial, parallel] = await Promise.all([
      optimizeConfiguration(params),
      runInProcess(params),
    ]);

    expect(parallel.allResults).toEqual(serial.allResults);
    expect(parallel.recommended).toEqual(serial.recommended);
  }, 120_000);

  it('enumerates the full stator x supply grid in row-major order', async () => {
    const params = makeParams();
    const parallel = await runInProcess(params);

    expect(parallel.allResults).toHaveLength(9);
    expect(
      parallel.allResults.map((r) => [r.statorLimitAmps, r.supplyLimitAmps]),
    ).toEqual([
      [30, 10],
      [30, 20],
      [30, 30],
      [40, 10],
      [40, 20],
      [40, 30],
      [50, 10],
      [50, 20],
      [50, 30],
    ]);
  }, 120_000);
});

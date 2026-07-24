import { describe, expect, it } from 'vitest';

import { orchestrateConfigOptimization } from '~/lib/math/linearConfigOrchestrator';
import {
  type OptimizeConfigurationParams,
  optimizeConfiguration,
  optimizeConfigurationCell,
} from '~/lib/math/linearOptimizer.worker';
import Measurement from '~/lib/models/Measurement';
import Motor from '~/lib/models/Motor';

// A realistic parameter set mirroring the /linear route defaults, but with a
// smaller comfortable-limit grid so the test stays fast. maxStator 40 -> 4 rows,
// maxSupply 20 -> 2 cols => 8 cells.
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
    maximumComfortableStatorLimitDict: new Measurement(40, 'A').toDict(),
    maximumComfortableSupplyLimitDict: new Measurement(20, 'A').toDict(),
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

    expect(parallel.allResults).toHaveLength(8);
    expect(
      parallel.allResults.map((r) => [r.statorLimitAmps, r.supplyLimitAmps]),
    ).toEqual([
      [10, 10],
      [10, 20],
      [20, 10],
      [20, 20],
      [30, 10],
      [30, 20],
      [40, 10],
      [40, 20],
    ]);
  }, 120_000);
});

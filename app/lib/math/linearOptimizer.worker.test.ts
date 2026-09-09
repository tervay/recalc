import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  optimizeConfiguration,
  optimizeConfigurationCell,
  optimizeRatio,
  simulateOnce,
  type OptimizeConfigurationCellParams,
  type OptimizeConfigurationParams,
  type OptimizeRatioParams,
  type SimulateOnceParams,
} from '~/lib/math/linearOptimizer.worker';
import Measurement from '~/lib/models/Measurement';
import Motor from '~/lib/models/Motor';

const motor = Motor.KrakenX60sFOC(1);

const baseParams: OptimizeConfigurationParams = {
  motorDict: motor.toDict(),
  loadDict: new Measurement(5, 'lb').toDict(),
  spoolDiameterDict: new Measurement(1, 'in').toDict(),
  travelDistanceDict: new Measurement(60, 'in').toDict(),
  batteryResistanceDict: new Measurement(0.015, 'Ohm').toDict(),
  batteryVoltageDict: new Measurement(12, 'V').toDict(),
  angleDict: new Measurement(90, 'deg').toDict(),
  efficiency: 1.0,
  cascade: false,
  batteryVoltageFilterTimeConstantSeconds: 0.5,
  statorInputAmps: 20,
  supplyInputAmps: 20,
  maxVelocityMPS: 2,
  maxAccelerationMPS2: 10,
  qPositionMeters: 0.02,
  qVelocityMPS: 0.4,
  rVolts: 12,
  sensorDelaySeconds: 0.001,
  kalmanFilterPositionStdDevDict: new Measurement(2, 'in').toDict(),
  kalmanFilterVelocityStdDevDict: new Measurement(40, 'in/s').toDict(),
  kalmanFilterEncoderPositionStdDevDict: new Measurement(0.001, 'in').toDict(),
};

describe('linearOptimizer wasm cleanup', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('deletes the wpilib DCMotor allocated by optimizeConfiguration', async () => {
    const toWpilibMotorSpy = vi.spyOn(Motor.prototype, 'toWpilibMotor');

    await optimizeConfiguration(baseParams);

    expect(toWpilibMotorSpy).toHaveBeenCalledTimes(1);
    const wpilibMotor = toWpilibMotorSpy.mock.results[0].value;
    expect(wpilibMotor.isDeleted()).toBe(true);
  }, 60_000);

  it('deletes the wpilib DCMotor allocated by optimizeConfigurationCell', async () => {
    const toWpilibMotorSpy = vi.spyOn(Motor.prototype, 'toWpilibMotor');

    const cellParams: OptimizeConfigurationCellParams = {
      ...baseParams,
      statorAmps: 20,
      supplyAmps: 20,
    };

    await optimizeConfigurationCell(cellParams);

    expect(toWpilibMotorSpy).toHaveBeenCalledTimes(1);
    const wpilibMotor = toWpilibMotorSpy.mock.results[0].value;
    expect(wpilibMotor.isDeleted()).toBe(true);
  }, 60_000);

  it('deletes the wpilib DCMotor allocated by optimizeRatio', async () => {
    const toWpilibMotorSpy = vi.spyOn(Motor.prototype, 'toWpilibMotor');

    const ratioParams: OptimizeRatioParams = {
      ...baseParams,
      supplyLimitDict: new Measurement(20, 'A').toDict(),
      statorLimitAmps: 20,
      initialRatio: 5,
      maxVelocityMPS: 2,
      maxAccelerationMPS2: 10,
    };

    await optimizeRatio(ratioParams);

    expect(toWpilibMotorSpy).toHaveBeenCalledTimes(1);
    const wpilibMotor = toWpilibMotorSpy.mock.results[0].value;
    expect(wpilibMotor.isDeleted()).toBe(true);
  }, 60_000);

  it('deletes the wpilib DCMotor allocated by simulateOnce', async () => {
    const toWpilibMotorSpy = vi.spyOn(Motor.prototype, 'toWpilibMotor');

    const simulateOnceParams: SimulateOnceParams = {
      ...baseParams,
      ratioMagnitude: 5,
      statorLimitAmps: 20,
      supplyLimitAmps: 20,
      maxVelocityMPS: 2,
      maxAccelerationMPS2: 10,
    };

    await simulateOnce(simulateOnceParams);

    expect(toWpilibMotorSpy).toHaveBeenCalledTimes(1);
    const wpilibMotor = toWpilibMotorSpy.mock.results[0].value;
    expect(wpilibMotor.isDeleted()).toBe(true);
  }, 60_000);
});

describe('optimizeConfiguration grid consistency', () => {
  // A pinned motion profile (both max velocity and max acceleration fixed)
  // makes time-to-goal identical for every feasible ratio, so the ratio search
  // has no minimum to seek. The grid must still be monotonic in headroom: once
  // a stator limit yields a config, every higher stator limit must too.
  it('never drops a config as the stator limit rises with a pinned profile', async () => {
    const out = await optimizeConfiguration({
      ...baseParams,
      efficiency: 0.9,
      batteryVoltageFilterTimeConstantSeconds: 0.1,
      statorInputAmps: 80,
      supplyInputAmps: 60,
      maxVelocityMPS: 3,
      maxAccelerationMPS2: 10,
    });

    const bySupply = new Map<number, { stator: number; success: boolean }[]>();
    for (const r of out.allResults) {
      const row = bySupply.get(r.supplyLimitAmps) ?? [];
      row.push({ stator: r.statorLimitAmps, success: r.success });
      bySupply.set(r.supplyLimitAmps, row);
    }

    for (const row of bySupply.values()) {
      row.sort((a, b) => a.stator - b.stator);
      const firstSuccess = row.findIndex((c) => c.success);
      const cellsToValidate =
        firstSuccess === -1 ? row : row.slice(firstSuccess);
      const expectedSuccess = firstSuccess !== -1;
      expect(
        cellsToValidate.every((cell) => cell.success === expectedSuccess),
      ).toBe(true);
    }
  }, 60_000);

  it('never lets a higher stator limit produce a materially slower config', async () => {
    const out = await optimizeConfiguration({
      ...baseParams,
      maxVelocityMPS: null,
      maxAccelerationMPS2: null,
      statorInputAmps: 80,
      supplyInputAmps: 60,
    });

    const bySupply = new Map<
      number,
      { stator: number; time: number; ratio: number }[]
    >();
    for (const r of out.allResults) {
      if (!r.success) continue;
      const row = bySupply.get(r.supplyLimitAmps) ?? [];
      row.push({
        stator: r.statorLimitAmps,
        time: r.timeToGoalSeconds,
        ratio: r.optimalRatio,
      });
      bySupply.set(r.supplyLimitAmps, row);
    }

    for (const row of bySupply.values()) {
      row.sort((a, b) => a.stator - b.stator);
      let bestSoFar = Number.POSITIVE_INFINITY;
      for (const cell of row) {
        expect(cell.time).toBeLessThanOrEqual(bestSoFar * 1.25);
        bestSoFar = Math.min(bestSoFar, cell.time);
      }
    }
  }, 60_000);

  it('never reports an outlier ratio in a supply-limited column', async () => {
    const ratios: number[] = [];
    for (const statorAmps of [10, 20, 30, 40, 50, 60]) {
      const cell = await optimizeConfigurationCell({
        ...baseParams,
        maxVelocityMPS: null,
        maxAccelerationMPS2: null,
        statorAmps,
        supplyAmps: 10,
      });
      expect(cell.success).toBe(true);
      ratios.push(cell.optimalRatio);
    }

    const median = [...ratios].sort((a, b) => a - b)[
      Math.floor(ratios.length / 2)
    ];
    for (const ratio of ratios) {
      expect(ratio).toBeLessThan(median * 2);
    }
  }, 60_000);
});

describe('simulateOnce', () => {
  it('reports whether the carriage reached the goal', async () => {
    const reached = await simulateOnce({
      ...baseParams,
      ratioMagnitude: 2,
      statorLimitAmps: 40,
      supplyLimitAmps: 60,
      maxVelocityMPS: 2,
      maxAccelerationMPS2: 10,
    });
    expect(reached.success).toBe(true);

    const stalled = await simulateOnce({
      ...baseParams,
      ratioMagnitude: 0.25,
      statorLimitAmps: 40,
      supplyLimitAmps: 60,
      maxVelocityMPS: 8,
      maxAccelerationMPS2: 200,
    });
    expect(stalled.success).toBe(false);
  }, 60_000);
});

describe('custom motion-limit feasibility', () => {
  it('does not recommend an infeasible current-limit configuration', async () => {
    const result = await optimizeConfiguration({
      ...baseParams,
      batteryVoltageFilterTimeConstantSeconds: 0.1,
      statorInputAmps: 10,
      supplyInputAmps: 10,
      maxVelocityMPS: 1000,
      maxAccelerationMPS2: 1000,
    });

    expect(result.recommended).toBeNull();
  }, 60_000);

  it('rejects a current-limit cell that cannot achieve the custom profile limits', async () => {
    const result = await optimizeConfigurationCell({
      ...baseParams,
      batteryVoltageFilterTimeConstantSeconds: 0.1,
      maxVelocityMPS: 4,
      maxAccelerationMPS2: 3,
      statorAmps: 10,
      supplyAmps: 10,
    });

    expect(result.success).toBe(false);
  }, 60_000);

  it('keeps a cell when both custom profile limits are achievable', async () => {
    const result = await optimizeConfigurationCell({
      ...baseParams,
      batteryVoltageFilterTimeConstantSeconds: 0.1,
      maxVelocityMPS: 2,
      maxAccelerationMPS2: 3,
      statorAmps: 20,
      supplyAmps: 20,
    });

    expect(result.success).toBe(true);
  }, 60_000);

  it('rejects a current-limit cell that cannot achieve the custom acceleration', async () => {
    const result = await optimizeConfigurationCell({
      ...baseParams,
      batteryVoltageFilterTimeConstantSeconds: 0.1,
      maxVelocityMPS: 1,
      maxAccelerationMPS2: 100,
      statorAmps: 10,
      supplyAmps: 10,
    });

    expect(result.success).toBe(false);
  }, 60_000);
});

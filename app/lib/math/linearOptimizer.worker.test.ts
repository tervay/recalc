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
  maximumComfortableStatorLimitDict: new Measurement(20, 'A').toDict(),
  maximumComfortableSupplyLimitDict: new Measurement(20, 'A').toDict(),
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

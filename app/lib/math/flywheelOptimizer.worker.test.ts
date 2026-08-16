import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import {
  type ConfigOptOutput,
  optimizeConfiguration,
  optimizeRatio,
} from '~/lib/math/flywheelOptimizer.worker';
import Measurement from '~/lib/models/Measurement';
import Motor from '~/lib/models/Motor';
import { initWpilibc } from '~/lib/wpilib/wpilibc';

const motor = Motor.KrakenX60sFOC(1);
const momentOfInertia = new Measurement(4.5, 'in2*lbs');
const targetRpm = new Measurement(3000, 'rpm');
const statorVoltage = new Measurement(12, 'V');
const supplyVoltage = new Measurement(12, 'V');
const batteryResistance = new Measurement(0.015, 'Ohm');
const maxStator = new Measurement(80, 'A');
const maxSupply = new Measurement(60, 'A');
const batteryVoltageFilterTimeConstantSeconds = 0.5;

function runConfiguration(overrides?: {
  maxStator?: Measurement;
  maxSupply?: Measurement;
  efficiency?: number;
}) {
  return optimizeConfiguration(
    motor.toDict(),
    momentOfInertia.toDict(),
    targetRpm.toDict(),
    statorVoltage.toDict(),
    batteryResistance.toDict(),
    supplyVoltage.toDict(),
    (overrides?.maxStator ?? maxStator).toDict(),
    (overrides?.maxSupply ?? maxSupply).toDict(),
    overrides?.efficiency ?? 1.0,
    batteryVoltageFilterTimeConstantSeconds,
  );
}

describe('flywheelOptimizer optimizeConfiguration', () => {
  let sharedResult: ConfigOptOutput;

  beforeAll(async () => {
    sharedResult = await runConfiguration();
  }, 60_000);

  it('returns a full stator x supply grid', () => {
    // makeGrid(80) -> 8 stator rows, makeGrid(60) -> 6 supply cols => 48 cells.
    expect(sharedResult.allResults).toHaveLength(48);
  });

  it('recommends the fastest successful configuration', () => {
    expect(sharedResult.recommended).not.toBeNull();
    const recommended = sharedResult.recommended!;
    expect(recommended.success).toBe(true);

    const successResults = sharedResult.allResults.filter((r) => r.success);
    expect(successResults.length).toBeGreaterThan(0);

    const fastest = Math.min(...successResults.map((r) => r.timeToGoalSeconds));
    expect(recommended.timeToGoalSeconds).toBeCloseTo(fastest, 6);
  });

  it('reports no recommendation when the target speed is unreachable', async () => {
    // An unreachably high target speed cannot be hit at any ratio within the
    // search bracket, so every cell fails.
    const result = await optimizeConfiguration(
      motor.toDict(),
      momentOfInertia.toDict(),
      new Measurement(1e6, 'rpm').toDict(),
      statorVoltage.toDict(),
      batteryResistance.toDict(),
      supplyVoltage.toDict(),
      new Measurement(10, 'A').toDict(),
      new Measurement(10, 'A').toDict(),
      1.0,
      batteryVoltageFilterTimeConstantSeconds,
    );

    expect(result.recommended).toBeNull();
    expect(result.allResults.every((r) => !r.success)).toBe(true);
  }, 60_000);
}, 60_000);

describe('flywheelOptimizer wasm cleanup', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('deletes the wpilib DCMotor allocated by optimizeRatio', async () => {
    const toWpilibMotorSpy = vi.spyOn(Motor.prototype, 'toWpilibMotor');

    await optimizeRatio(
      motor.toDict(),
      momentOfInertia.toDict(),
      targetRpm.toDict(),
      maxSupply.toDict(),
      statorVoltage.toDict(),
      batteryResistance.toDict(),
      supplyVoltage.toDict(),
      40,
      5,
      1.0,
      batteryVoltageFilterTimeConstantSeconds,
    );

    expect(toWpilibMotorSpy).toHaveBeenCalledTimes(1);
    const wpilibMotor = toWpilibMotorSpy.mock.results[0].value;
    expect(wpilibMotor.isDeleted()).toBe(true);
  }, 60_000);

  it('deletes the wpilib DCMotor allocated by optimizeConfiguration', async () => {
    const toWpilibMotorSpy = vi.spyOn(Motor.prototype, 'toWpilibMotor');

    await runConfiguration({
      maxStator: new Measurement(20, 'A'),
      maxSupply: new Measurement(20, 'A'),
    });

    expect(toWpilibMotorSpy).toHaveBeenCalledTimes(1);
    const wpilibMotor = toWpilibMotorSpy.mock.results[0].value;
    expect(wpilibMotor.isDeleted()).toBe(true);
  }, 60_000);
});

describe('flywheelOptimizer optimizeConfiguration empty-states guard', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not throw when a grid cell produces no simulation states', async () => {
    const wpilibc = await initWpilibc();
    vi.spyOn(wpilibc, 'simulateFlywheel').mockReturnValue([]);

    await expect(
      runConfiguration({
        maxStator: new Measurement(10, 'A'),
        maxSupply: new Measurement(10, 'A'),
      }),
    ).resolves.not.toThrow();
  }, 60_000);
});

import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import {
  type ConfigOptOutput,
  optimizeConfiguration,
} from '~/lib/math/armOptimizer.worker';
import { reduceConfigOutput } from '~/lib/math/optimizerUtils';
import Measurement from '~/lib/models/Measurement';
import Motor from '~/lib/models/Motor';

const motor = Motor.KrakenX60sFOC(1);
const momentOfInertia = new Measurement(10, 'in2*lbs');
const armLength = new Measurement(24, 'in');
const minAngle = new Measurement(0, 'deg');
const maxAngle = new Measurement(90, 'deg');
const statorVoltage = new Measurement(12, 'V');
const supplyVoltage = new Measurement(12, 'V');
const batteryResistance = new Measurement(0.015, 'Ohm');
const statorInput = new Measurement(80, 'A');
const supplyInput = new Measurement(60, 'A');

const MIN_RATIO = 5;
const MAX_RATIO = 500;

function run(overrides?: {
  statorInput?: Measurement;
  supplyInput?: Measurement;
  efficiency?: number;
}) {
  return optimizeConfiguration(
    motor.toDict(),
    momentOfInertia.toDict(),
    armLength.toDict(),
    minAngle.toDict(),
    maxAngle.toDict(),
    statorVoltage.toDict(),
    batteryResistance.toDict(),
    supplyVoltage.toDict(),
    overrides?.statorInput?.to('A').scalar ?? statorInput.to('A').scalar,
    overrides?.supplyInput?.to('A').scalar ?? supplyInput.to('A').scalar,
    overrides?.efficiency ?? 1.0,
  );
}

describe('armOptimizer', () => {
  let sharedResult: ConfigOptOutput;

  beforeAll(async () => {
    sharedResult = await run();
  }, 60_000);

  it('returns a full stator x supply grid', () => {
    expect(sharedResult.allResults).toHaveLength(9);

    const statorLimits = [
      ...new Set(sharedResult.allResults.map((r) => r.statorLimitAmps)),
    ].sort((a, b) => a - b);
    const supplyLimits = [
      ...new Set(sharedResult.allResults.map((r) => r.supplyLimitAmps)),
    ].sort((a, b) => a - b);

    expect(statorLimits).toEqual([70, 80, 90]);
    expect(supplyLimits).toEqual([50, 60, 70]);
  });

  it('uses the shared bucketed recommendation strategy', () => {
    expect(sharedResult.recommended).not.toBeNull();
    const recommended = sharedResult.recommended!;
    expect(recommended.success).toBe(true);

    const successResults = sharedResult.allResults.filter((r) => r.success);
    expect(successResults.length).toBeGreaterThan(0);

    expect(recommended).toBe(
      reduceConfigOutput(sharedResult.allResults).recommended,
    );
  });

  it('keeps optimal ratios within the search bracket for successful cells', () => {
    for (const cell of sharedResult.allResults.filter((r) => r.success)) {
      expect(cell.optimalRatio).toBeGreaterThanOrEqual(MIN_RATIO);
      expect(cell.optimalRatio).toBeLessThanOrEqual(MAX_RATIO);
      expect(Number.isFinite(cell.timeToGoalSeconds)).toBe(true);
      expect(cell.peakCurrentAmps).toBeGreaterThan(0);
    }
  });

  it('reports no recommendation when no configuration succeeds', async () => {
    // An enormous moment of inertia cannot reach the goal within the sim
    // timeout at any ratio in the search bracket, so every cell fails.
    const result = await optimizeConfiguration(
      motor.toDict(),
      new Measurement(1e6, 'in2*lbs').toDict(),
      armLength.toDict(),
      minAngle.toDict(),
      maxAngle.toDict(),
      statorVoltage.toDict(),
      batteryResistance.toDict(),
      supplyVoltage.toDict(),
      10,
      10,
      1.0,
    );

    expect(result.recommended).toBeNull();
    expect(result.allResults).toHaveLength(9);
    expect(result.allResults.every((r) => !r.success)).toBe(true);
  });
});

describe('armOptimizer wasm cleanup', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('deletes the wpilib DCMotor allocated by optimizeConfiguration', async () => {
    const toWpilibMotorSpy = vi.spyOn(Motor.prototype, 'toWpilibMotor');

    await run({
      statorInput: new Measurement(10, 'A'),
      supplyInput: new Measurement(10, 'A'),
    });

    expect(toWpilibMotorSpy).toHaveBeenCalledTimes(1);
    const wpilibMotor = toWpilibMotorSpy.mock.results[0].value;
    expect(wpilibMotor.isDeleted()).toBe(true);
  }, 60_000);
});

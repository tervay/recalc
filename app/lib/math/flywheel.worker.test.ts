import { describe, expect, it } from 'vitest';

import {
  FLYWHEEL_SIMULATION_TIMEOUT_SECONDS,
  computeFlywheelFeedforwardGains,
  simulateFlywheelWpilib,
} from '~/lib/math/flywheel.worker';
import Measurement from '~/lib/models/Measurement';
import Motor from '~/lib/models/Motor';
import Ratio, { RatioType } from '~/lib/models/Ratio';

describe('computeFlywheelFeedforwardGains', () => {
  it('returns sane, non-zero gains and no gravity term for a realistic flywheel configuration', async () => {
    const motor = Motor.KrakenX60sFOC(2);
    const ratio = new Ratio(1, RatioType.REDUCTION);
    const momentOfInertia = new Measurement(10, 'in2*lbs');

    const result = await computeFlywheelFeedforwardGains(
      motor.toDict(),
      ratio.toDict(),
      momentOfInertia.toDict(),
      1.0,
    );

    expect(result.kV).toBeGreaterThan(0);
    expect(result.kA).toBeGreaterThan(0);
    expect(result.kG).toBe(0);
  });
});

describe('simulateFlywheelWpilib timeout', () => {
  it('returns success: false when the flywheel cannot reach the setpoint within the timeout', async () => {
    // Massive MOI with minimal current limits makes it impossible to spin up in time
    const motor = Motor.NEO(1);
    const ratio = new Ratio(1, RatioType.REDUCTION);
    const statorLimit = new Measurement(5, 'A');
    const supplyLimit = new Measurement(5, 'A');
    const statorVoltage = new Measurement(12, 'V');
    const supplyVoltage = new Measurement(12, 'V');
    const batteryResistance = new Measurement(0.015, 'Ohm');
    const momentOfInertia = new Measurement(10000, 'in2*lbs');
    const targetRPM = new Measurement(5000, 'rpm');

    const result = await simulateFlywheelWpilib(
      motor.toDict(),
      ratio.toDict(),
      statorLimit.toDict(),
      supplyLimit.toDict(),
      statorVoltage.toDict(),
      batteryResistance.toDict(),
      supplyVoltage.toDict(),
      momentOfInertia.toDict(),
      targetRPM.toDict(),
      1.0,
      0.1,
    );

    const last = result[result.length - 1];
    expect(last.success).toBe(false);
    expect(last.timeSeconds).toBeCloseTo(
      FLYWHEEL_SIMULATION_TIMEOUT_SECONDS,
      0,
    );
  });
});

describe('simulateFlywheelWpilib', () => {
  it('simulates a flywheel correctly', async () => {
    const motor = Motor.KrakenX60sFOC(2);
    const ratio = new Ratio(1, RatioType.REDUCTION);
    const statorLimit = new Measurement(60, 'A');
    const supplyLimit = new Measurement(90, 'A');
    const statorVoltage = new Measurement(12, 'V');
    const supplyVoltage = new Measurement(12, 'V');
    const batteryResistance = new Measurement(0.015, 'Ohm');
    const momentOfInertia = new Measurement(10, 'in2*lbs');
    const targetRPM = new Measurement(3000, 'rpm');

    const result = await simulateFlywheelWpilib(
      motor.toDict(),
      ratio.toDict(),
      statorLimit.toDict(),
      supplyLimit.toDict(),
      statorVoltage.toDict(),
      batteryResistance.toDict(),
      supplyVoltage.toDict(),
      momentOfInertia.toDict(),
      targetRPM.toDict(),
      1.0,
      0.1,
    );

    expect(result).toMatchSnapshot();
  });
});

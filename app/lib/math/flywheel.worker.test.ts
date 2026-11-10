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

describe('simulateFlywheelWpilib degenerate electrical inputs', () => {
  const spinUp = (overrides: {
    statorLimit?: Measurement;
    supplyLimit?: Measurement;
    batteryResistance?: Measurement;
  }) =>
    simulateFlywheelWpilib(
      Motor.KrakenX60sFOC(2).toDict(),
      new Ratio(1, RatioType.REDUCTION).toDict(),
      (overrides.statorLimit ?? new Measurement(80, 'A')).toDict(),
      (overrides.supplyLimit ?? new Measurement(60, 'A')).toDict(),
      new Measurement(12, 'V').toDict(),
      (overrides.batteryResistance ?? new Measurement(0.015, 'Ohm')).toDict(),
      new Measurement(12, 'V').toDict(),
      new Measurement(10, 'in2*lbs').toDict(),
      new Measurement(3000, 'rpm').toDict(),
      1.0,
      0.1,
    );

  it('reaches the target with an ideal zero-resistance battery', async () => {
    const states = await spinUp({
      batteryResistance: new Measurement(0, 'Ohm'),
    });

    expect(states.at(-1)?.success).toBe(true);
  });

  it('reports a timeout rather than no result for a zero stator limit', async () => {
    const states = await spinUp({ statorLimit: new Measurement(0, 'A') });

    expect(states.at(-1)?.success).toBe(false);
  });

  it('reports a timeout rather than no result for a zero supply limit', async () => {
    const states = await spinUp({ supplyLimit: new Measurement(0, 'A') });

    expect(states.at(-1)?.success).toBe(false);
  });
});

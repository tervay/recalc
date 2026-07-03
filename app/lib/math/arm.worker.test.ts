import { describe, expect, it } from 'vitest';

import {
  computeArmFeedforwardGains,
  simulateArmWpilib,
} from '~/lib/math/arm.worker';
import Measurement from '~/lib/models/Measurement';
import Motor from '~/lib/models/Motor';
import Ratio, { RatioType } from '~/lib/models/Ratio';

const motor = Motor.KrakenX60sFOC(1);
const ratio = new Ratio(100, RatioType.REDUCTION);
const momentOfInertia = new Measurement(10, 'in2*lbs');
const armLength = new Measurement(24, 'in');
const minAngle = new Measurement(0, 'deg');
const maxAngle = new Measurement(90, 'deg');
const statorVoltage = new Measurement(12, 'V');
const supplyVoltage = new Measurement(12, 'V');
const statorLimit = new Measurement(60, 'A');
const supplyLimit = new Measurement(90, 'A');
const batteryResistance = new Measurement(0.015, 'Ohm');

describe('computeArmFeedforwardGains', () => {
  it('returns sane, non-zero gains for a realistic arm configuration', async () => {
    const result = await computeArmFeedforwardGains(
      motor.toDict(),
      ratio.toDict(),
      momentOfInertia.toDict(),
      1.0,
      new Measurement(15, 'lb').toDict(),
      armLength.toDict(),
    );

    expect(result.kV).toBeGreaterThan(0);
    expect(result.kA).toBeGreaterThan(0);
    expect(result.kG).toBeGreaterThanOrEqual(0);
  });
});

describe('arm', () => {
  it('should calculate the time to goal going up', async () => {
    const result = await simulateArmWpilib(
      motor.toDict(),
      ratio.toDict(),
      momentOfInertia.toDict(),
      armLength.toDict(),
      minAngle.toDict(),
      maxAngle.toDict(),
      minAngle.toDict(),
      statorVoltage.toDict(),
      supplyVoltage.toDict(),
      statorLimit.toDict(),
      supplyLimit.toDict(),
      batteryResistance.toDict(),
      'up',
      1.0,
      0.1,
    );

    expect(result).toMatchSnapshot();
  });

  it('should calculate the time to goal going down', async () => {
    const result = await simulateArmWpilib(
      motor.toDict(),
      ratio.toDict(),
      momentOfInertia.toDict(),
      armLength.toDict(),
      minAngle.toDict(),
      maxAngle.toDict(),
      maxAngle.toDict(),
      statorVoltage.toDict(),
      supplyVoltage.toDict(),
      statorLimit.toDict(),
      supplyLimit.toDict(),
      batteryResistance.toDict(),
      'down',
      1.0,
      0.1,
    );

    expect(result).toMatchSnapshot();
  });

  it('efficiency below 1.0 should result in slower movement', async () => {
    const fullEfficiency = await simulateArmWpilib(
      motor.toDict(),
      ratio.toDict(),
      momentOfInertia.toDict(),
      armLength.toDict(),
      minAngle.toDict(),
      maxAngle.toDict(),
      minAngle.toDict(),
      statorVoltage.toDict(),
      supplyVoltage.toDict(),
      statorLimit.toDict(),
      supplyLimit.toDict(),
      batteryResistance.toDict(),
      'up',
      1.0,
      0.1,
    );

    const reducedEfficiency = await simulateArmWpilib(
      motor.toDict(),
      ratio.toDict(),
      momentOfInertia.toDict(),
      armLength.toDict(),
      minAngle.toDict(),
      maxAngle.toDict(),
      minAngle.toDict(),
      statorVoltage.toDict(),
      supplyVoltage.toDict(),
      statorLimit.toDict(),
      supplyLimit.toDict(),
      batteryResistance.toDict(),
      'up',
      0.7,
      0.1,
    );

    const fullTime =
      fullEfficiency[fullEfficiency.length - 1]?.timeSeconds ?? 0;
    const reducedTime =
      reducedEfficiency[reducedEfficiency.length - 1]?.timeSeconds ?? 0;

    expect(reducedTime).toBeGreaterThan(fullTime);
  });

  it('should return empty array for zero ratio', async () => {
    const zeroRatio = new Ratio(0, RatioType.REDUCTION);
    const result = await simulateArmWpilib(
      motor.toDict(),
      zeroRatio.toDict(),
      momentOfInertia.toDict(),
      armLength.toDict(),
      minAngle.toDict(),
      maxAngle.toDict(),
      minAngle.toDict(),
      statorVoltage.toDict(),
      supplyVoltage.toDict(),
      statorLimit.toDict(),
      supplyLimit.toDict(),
      batteryResistance.toDict(),
      'up',
      1.0,
      0.1,
    );
    expect(result).toEqual([]);
  });
});

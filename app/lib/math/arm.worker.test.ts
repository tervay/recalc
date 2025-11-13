import { describe, expect, it } from 'vitest';

import { simulateArmWpilib } from '~/lib/math/arm.worker';
import Measurement from '~/lib/models/Measurement';
import Motor from '~/lib/models/Motor';
import Ratio, { RatioType } from '~/lib/models/Ratio';

describe('arm', () => {
  it('should calculate the time to goal going up', async () => {
    const motor = Motor.KrakenX60sFOC(1);
    const ratio = new Ratio(100, RatioType.REDUCTION);
    const momentOfInertia = new Measurement(10, 'in2*lbs');
    const armLength = new Measurement(24, 'in');
    const minAngle = new Measurement(0, 'deg');
    const maxAngle = new Measurement(90, 'deg');
    const statorVoltage = new Measurement(12, 'V');
    const supplyVoltage = new Measurement(12, 'V');
    const currentLimit = new Measurement(60, 'A');
    const batteryResistance = new Measurement(0.015, 'Ohm');
    const goingDownOrUp = 'up';

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
      currentLimit.toDict(),
      batteryResistance.toDict(),
      goingDownOrUp,
    );

    expect(result).toMatchSnapshot();
  });

  it('should calculate the time to goal going down', async () => {
    const motor = Motor.KrakenX60sFOC(1);
    const ratio = new Ratio(100, RatioType.REDUCTION);
    const momentOfInertia = new Measurement(10, 'in2*lbs');
    const armLength = new Measurement(24, 'in');
    const minAngle = new Measurement(0, 'deg');
    const maxAngle = new Measurement(90, 'deg');
    const statorVoltage = new Measurement(12, 'V');
    const supplyVoltage = new Measurement(12, 'V');
    const currentLimit = new Measurement(60, 'A');
    const batteryResistance = new Measurement(0.015, 'Ohm');
    const goingDownOrUp = 'down';

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
      currentLimit.toDict(),
      batteryResistance.toDict(),
      goingDownOrUp,
    );

    expect(result).toMatchSnapshot();
  });
});

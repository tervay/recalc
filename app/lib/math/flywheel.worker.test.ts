import { describe, expect, it } from 'vitest';

import { simulateFlywheelWpilib } from '~/lib/math/flywheel.worker';
import Measurement from '~/lib/models/Measurement';
import Motor from '~/lib/models/Motor';
import Ratio, { RatioType } from '~/lib/models/Ratio';

describe('simulateFlywheelWpilib', () => {
  it('simulates a flywheel correctly', async () => {
    const motor = Motor.KrakenX60sFOC(2);
    const ratio = new Ratio(1, RatioType.REDUCTION);
    const currentLimit = new Measurement(60, 'A');
    const statorVoltage = new Measurement(12, 'V');
    const supplyVoltage = new Measurement(12, 'V');
    const batteryResistance = new Measurement(0.015, 'Ohm');
    const momentOfInertia = new Measurement(10, 'in2*lbs');
    const targetRPM = new Measurement(3000, 'rpm');

    const result = await simulateFlywheelWpilib(
      motor.toDict(),
      ratio.toDict(),
      currentLimit.toDict(),
      statorVoltage.toDict(),
      supplyVoltage.toDict(),
      batteryResistance.toDict(),
      momentOfInertia.toDict(),
      targetRPM.toDict(),
    );

    expect(result).toMatchSnapshot();
  });
});

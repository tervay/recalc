import { describe, expect, it } from 'vitest';

import { simulateElevatorWpilib } from '~/lib/math/linear.worker';
import Measurement from '~/lib/models/Measurement';
import Motor from '~/lib/models/Motor';
import Ratio, { RatioType } from '~/lib/models/Ratio';

describe('simulateElevatorWpilib', () => {
  it('simulates a typical elevator correctly', async () => {
    const motor = Motor.KrakenX60sFOC(1);
    const ratio = new Ratio(2, RatioType.REDUCTION);
    const load = new Measurement(10, 'lb');
    const spoolDiameter = new Measurement(2, 'in');
    const travelDistance = new Measurement(40, 'in');
    const currentLimit = new Measurement(60, 'A');
    const statorVoltage = new Measurement(12, 'V');
    const batteryResistance = new Measurement(0.015, 'Ohm');
    const batteryVoltage = new Measurement(12, 'V');

    const result = await simulateElevatorWpilib(
      motor.toDict(),
      ratio.toDict(),
      load.toDict(),
      spoolDiameter.toDict(),
      travelDistance.toDict(),
      currentLimit.toDict(),
      statorVoltage.toDict(),
      batteryResistance.toDict(),
      batteryVoltage.toDict(),
    );

    expect(result).toMatchSnapshot();
  });
});

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
    const supplyLimit = new Measurement(90, 'A');
    const statorVoltage = new Measurement(12, 'V');
    const batteryResistance = new Measurement(0.015, 'Ohm');
    const batteryVoltage = new Measurement(12, 'V');

    const angle = new Measurement(90, 'deg');

    const result = await simulateElevatorWpilib(
      motor.toDict(),
      ratio.toDict(),
      load.toDict(),
      spoolDiameter.toDict(),
      travelDistance.toDict(),
      currentLimit.toDict(),
      supplyLimit.toDict(),
      statorVoltage.toDict(),
      batteryResistance.toDict(),
      batteryVoltage.toDict(),
      angle.toDict(),
      1.0,
      false,
      0.1,
    );

    expect(result).toMatchSnapshot();
  });

  it('cascade mode simulates first-stage mechanics: half travel, double load', async () => {
    const motor = Motor.KrakenX60sFOC(1);
    const ratio = new Ratio(4, RatioType.REDUCTION);
    const load = new Measurement(10, 'lb');
    const spoolDiameter = new Measurement(2, 'in');
    const travelDistance = new Measurement(40, 'in');
    const currentLimit = new Measurement(80, 'A');
    const supplyLimit = new Measurement(120, 'A');
    const statorVoltage = new Measurement(12, 'V');
    const batteryResistance = new Measurement(0.015, 'Ohm');
    const batteryVoltage = new Measurement(12, 'V');
    const angle = new Measurement(90, 'deg');

    const commonArgs = [
      motor.toDict(),
      ratio.toDict(),
      load.toDict(),
      spoolDiameter.toDict(),
      travelDistance.toDict(),
      currentLimit.toDict(),
      supplyLimit.toDict(),
      statorVoltage.toDict(),
      batteryResistance.toDict(),
      batteryVoltage.toDict(),
      angle.toDict(),
      1.0,
    ] as const;

    const [standard, cascade] = await Promise.all([
      simulateElevatorWpilib(...commonArgs, false, 0.1),
      simulateElevatorWpilib(...commonArgs, true, 0.1),
    ]);

    const travelDistanceMeters = travelDistance.to('m').scalar;

    // Non-cascade should reach approximately the full travel distance
    const standardFinalPos = standard[standard.length - 1].positionMeters;
    expect(standardFinalPos).toBeCloseTo(travelDistanceMeters, 2);

    // Cascade first-stage travel is half the carriage travel distance
    const cascadeFinalPos = cascade[cascade.length - 1].positionMeters;
    expect(cascadeFinalPos).toBeCloseTo(travelDistanceMeters / 2, 2);
  });
});

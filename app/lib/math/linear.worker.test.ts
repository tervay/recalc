import { describe, expect, it } from 'vitest';

import {
  generateODEData,
  simulateElevatorWpilib,
} from '~/lib/math/linear.worker';
import Measurement from '~/lib/models/Measurement';
import Motor from '~/lib/models/Motor';
import Ratio, { RatioType } from '~/lib/models/Ratio';

describe('generateODEData', () => {
  it('generates ODE data correctly', () => {
    const motor = Motor.KrakenX60sFOC(1);
    const statorVoltage = new Measurement(12, 'V');
    const supplyVoltage = new Measurement(12, 'V');
    const statorLimit = new Measurement(60, 'A');
    const supplyLimit = new Measurement(100, 'A');
    const travelDistance = new Measurement(10, 'in');
    const ratio = new Ratio(2, RatioType.REDUCTION);
    const spoolDiameter = new Measurement(2, 'in');
    const load = new Measurement(10, 'lb');
    const J = new Measurement(0.01, 'kg*m^2');
    const efficiency = 90;
    const angle = new Measurement(0, 'deg');

    const result = generateODEData(
      motor.toDict(),
      statorVoltage.toDict(),
      supplyVoltage.toDict(),
      statorLimit.toDict(),
      supplyLimit.toDict(),
      travelDistance.toDict(),
      ratio.toDict(),
      spoolDiameter.toDict(),
      load.toDict(),
      J.toDict(),
      efficiency,
      angle.toDict(),
    );

    expect(result.length).toBe(616);
    expect(result[0].timeSeconds).toBeCloseTo(0, 3);
    expect(result[0].positionInches).toBeCloseTo(0, 3);
    expect(result[0].velocityRPM).toBeCloseTo(0, 3);
    expect(result[0].statorDrawAmps).toBeCloseTo(60.0, 3);
    expect(result[0].powerWatts).toBeCloseTo(0, 3);
    expect(result[0].efficiency).toBeCloseTo(0, 3);
    expect(result[result.length - 1].timeSeconds).toBeCloseTo(0.615, 3);
    expect(result[result.length - 1].positionInches).toBeCloseTo(9.959, 3);
    expect(result[result.length - 1].velocityRPM).toBeCloseTo(617.853, 3);
  });

  it('handles zero ratio', () => {
    const motor = Motor.KrakenX60sFOC(1);
    const statorVoltage = new Measurement(12, 'V');
    const supplyVoltage = new Measurement(12, 'V');
    const statorLimit = new Measurement(60, 'A');
    const supplyLimit = new Measurement(100, 'A');
    const travelDistance = new Measurement(10, 'in');
    const ratio = new Ratio(0, RatioType.REDUCTION);
    const spoolDiameter = new Measurement(2, 'in');
    const load = new Measurement(10, 'lb');
    const J = new Measurement(0.01, 'kg*m^2');
    const efficiency = 90;
    const angle = new Measurement(0, 'deg');

    const result = generateODEData(
      motor.toDict(),
      statorVoltage.toDict(),
      supplyVoltage.toDict(),
      statorLimit.toDict(),
      supplyLimit.toDict(),
      travelDistance.toDict(),
      ratio.toDict(),
      spoolDiameter.toDict(),
      load.toDict(),
      J.toDict(),
      efficiency,
      angle.toDict(),
    );

    expect(result.length).toBe(0);
  });

  it('handles zero spool diameter', () => {
    const motor = Motor.KrakenX60sFOC(1);
    const statorVoltage = new Measurement(12, 'V');
    const supplyVoltage = new Measurement(12, 'V');
    const statorLimit = new Measurement(60, 'A');
    const supplyLimit = new Measurement(100, 'A');
    const travelDistance = new Measurement(10, 'in');
    const ratio = new Ratio(2, RatioType.REDUCTION);
    const spoolDiameter = new Measurement(0, 'in');
    const load = new Measurement(10, 'lb');
    const J = new Measurement(0.01, 'kg*m^2');
    const efficiency = 90;
    const angle = new Measurement(0, 'deg');

    const result = generateODEData(
      motor.toDict(),
      statorVoltage.toDict(),
      supplyVoltage.toDict(),
      statorLimit.toDict(),
      supplyLimit.toDict(),
      travelDistance.toDict(),
      ratio.toDict(),
      spoolDiameter.toDict(),
      load.toDict(),
      J.toDict(),
      efficiency,
      angle.toDict(),
    );

    expect(result.length).toBe(0);
  });

  it('handles zero stator limit', () => {
    const motor = Motor.KrakenX60sFOC(1);
    const statorVoltage = new Measurement(12, 'V');
    const supplyVoltage = new Measurement(12, 'V');
    const statorLimit = new Measurement(0, 'A');
    const supplyLimit = new Measurement(100, 'A');
    const travelDistance = new Measurement(10, 'in');
    const ratio = new Ratio(2, RatioType.REDUCTION);
    const spoolDiameter = new Measurement(2, 'in');
    const load = new Measurement(10, 'lb');
    const J = new Measurement(0.01, 'kg*m^2');
    const efficiency = 90;
    const angle = new Measurement(0, 'deg');

    const result = generateODEData(
      motor.toDict(),
      statorVoltage.toDict(),
      supplyVoltage.toDict(),
      statorLimit.toDict(),
      supplyLimit.toDict(),
      travelDistance.toDict(),
      ratio.toDict(),
      spoolDiameter.toDict(),
      load.toDict(),
      J.toDict(),
      efficiency,
      angle.toDict(),
    );

    expect(result.length).toBe(0);
  });

  it('handles zero supply limit', () => {
    const motor = Motor.KrakenX60sFOC(1);
    const statorVoltage = new Measurement(12, 'V');
    const supplyVoltage = new Measurement(12, 'V');
    const statorLimit = new Measurement(60, 'A');
    const supplyLimit = new Measurement(0, 'A');
    const travelDistance = new Measurement(10, 'in');
    const ratio = new Ratio(2, RatioType.REDUCTION);
    const spoolDiameter = new Measurement(2, 'in');
    const load = new Measurement(10, 'lb');
    const J = new Measurement(0.01, 'kg*m^2');
    const efficiency = 90;
    const angle = new Measurement(0, 'deg');

    const result = generateODEData(
      motor.toDict(),
      statorVoltage.toDict(),
      supplyVoltage.toDict(),
      statorLimit.toDict(),
      supplyLimit.toDict(),
      travelDistance.toDict(),
      ratio.toDict(),
      spoolDiameter.toDict(),
      load.toDict(),
      J.toDict(),
      efficiency,
      angle.toDict(),
    );

    expect(result.length).toBe(0);
  });

  it('handles non-zero angle', () => {
    const motor = Motor.KrakenX60sFOC(1);
    const statorVoltage = new Measurement(12, 'V');
    const supplyVoltage = new Measurement(12, 'V');
    const statorLimit = new Measurement(60, 'A');
    const supplyLimit = new Measurement(100, 'A');
    const travelDistance = new Measurement(10, 'in');
    const ratio = new Ratio(2, RatioType.REDUCTION);
    const spoolDiameter = new Measurement(2, 'in');
    const load = new Measurement(10, 'lb');
    const J = new Measurement(0.01, 'kg*m^2');
    const efficiency = 90;
    const angle = new Measurement(45, 'deg');

    const result = generateODEData(
      motor.toDict(),
      statorVoltage.toDict(),
      supplyVoltage.toDict(),
      statorLimit.toDict(),
      supplyLimit.toDict(),
      travelDistance.toDict(),
      ratio.toDict(),
      spoolDiameter.toDict(),
      load.toDict(),
      J.toDict(),
      efficiency,
      angle.toDict(),
    );

    expect(result.length).toBe(780);
    expect(result[0].timeSeconds).toBeCloseTo(0, 3);
    expect(result[0].positionInches).toBeCloseTo(0, 3);
  });

  it('handles zero efficiency', () => {
    const motor = Motor.KrakenX60sFOC(1);
    const statorVoltage = new Measurement(12, 'V');
    const supplyVoltage = new Measurement(12, 'V');
    const statorLimit = new Measurement(60, 'A');
    const supplyLimit = new Measurement(100, 'A');
    const travelDistance = new Measurement(10, 'in');
    const ratio = new Ratio(2, RatioType.REDUCTION);
    const spoolDiameter = new Measurement(2, 'in');
    const load = new Measurement(10, 'lb');
    const J = new Measurement(0.01, 'kg*m^2');
    const efficiency = 0;
    const angle = new Measurement(0, 'deg');

    const result = generateODEData(
      motor.toDict(),
      statorVoltage.toDict(),
      supplyVoltage.toDict(),
      statorLimit.toDict(),
      supplyLimit.toDict(),
      travelDistance.toDict(),
      ratio.toDict(),
      spoolDiameter.toDict(),
      load.toDict(),
      J.toDict(),
      efficiency,
      angle.toDict(),
    );

    expect(result.length).toBe(999);
    expect(result[0].timeSeconds).toBeCloseTo(0, 3);
  });

  it('handles zero load', () => {
    const motor = Motor.KrakenX60sFOC(1);
    const statorVoltage = new Measurement(12, 'V');
    const supplyVoltage = new Measurement(12, 'V');
    const statorLimit = new Measurement(60, 'A');
    const supplyLimit = new Measurement(100, 'A');
    const travelDistance = new Measurement(10, 'in');
    const ratio = new Ratio(2, RatioType.REDUCTION);
    const spoolDiameter = new Measurement(2, 'in');
    const load = new Measurement(0, 'lb');
    const J = new Measurement(0.01, 'kg*m^2');
    const efficiency = 90;
    const angle = new Measurement(0, 'deg');

    const result = generateODEData(
      motor.toDict(),
      statorVoltage.toDict(),
      supplyVoltage.toDict(),
      statorLimit.toDict(),
      supplyLimit.toDict(),
      travelDistance.toDict(),
      ratio.toDict(),
      spoolDiameter.toDict(),
      load.toDict(),
      J.toDict(),
      efficiency,
      angle.toDict(),
    );

    expect(result.length).toBe(616);
    expect(result[0].timeSeconds).toBeCloseTo(0, 3);
  });

  it('handles zero J', () => {
    const motor = Motor.KrakenX60sFOC(1);
    const statorVoltage = new Measurement(12, 'V');
    const supplyVoltage = new Measurement(12, 'V');
    const statorLimit = new Measurement(60, 'A');
    const supplyLimit = new Measurement(100, 'A');
    const travelDistance = new Measurement(10, 'in');
    const ratio = new Ratio(2, RatioType.REDUCTION);
    const spoolDiameter = new Measurement(2, 'in');
    const load = new Measurement(10, 'lb');
    const J = new Measurement(0, 'kg*m^2');
    const efficiency = 90;
    const angle = new Measurement(0, 'deg');

    const result = generateODEData(
      motor.toDict(),
      statorVoltage.toDict(),
      supplyVoltage.toDict(),
      statorLimit.toDict(),
      supplyLimit.toDict(),
      travelDistance.toDict(),
      ratio.toDict(),
      spoolDiameter.toDict(),
      load.toDict(),
      J.toDict(),
      efficiency,
      angle.toDict(),
    );

    expect(result.length).toBe(50);
    expect(result[0].timeSeconds).toBeCloseTo(0, 3);
  });
});

describe('simulateElevatorWpilib', () => {
  it('simulates a typical elevator correctly', () => {
    const motor = Motor.KrakenX60sFOC(1);
    const ratio = new Ratio(2, RatioType.REDUCTION);
    const load = new Measurement(10, 'lb');
    const spoolDiameter = new Measurement(2, 'in');
    const travelDistance = new Measurement(40, 'in');
    const currentLimit = new Measurement(60, 'A');
    const statorVoltage = new Measurement(12, 'V');

    const result = simulateElevatorWpilib(
      motor.toDict(),
      ratio.toDict(),
      load.toDict(),
      spoolDiameter.toDict(),
      travelDistance.toDict(),
      currentLimit.toDict(),
      statorVoltage.toDict(),
    );

    expect(result).toMatchSnapshot();
  });
});

import { describe, expect, it } from 'vitest';

import { calculateLoadedBatteryVoltage } from '~/lib/math/batterySim';
import Measurement from '~/lib/models/Measurement';

describe('calculateLoadedBatteryVoltage', () => {
  it('calculates loaded battery voltage correctly', () => {
    const supplyVoltage = new Measurement(12, 'V');
    const batteryResistance = new Measurement(0.01, 'ohm');
    const currents = [new Measurement(10, 'A'), new Measurement(5, 'A')];

    const result = calculateLoadedBatteryVoltage(
      supplyVoltage,
      batteryResistance,
      currents,
    );

    expect(result.to('V').scalar).toBeCloseTo(11.85, 3);
  });

  it('handles zero supply voltage', () => {
    const supplyVoltage = new Measurement(0, 'V');
    const batteryResistance = new Measurement(0.01, 'ohm');
    const currents = [new Measurement(10, 'A')];

    const result = calculateLoadedBatteryVoltage(
      supplyVoltage,
      batteryResistance,
      currents,
    );

    expect(result.to('V').scalar).toBeCloseTo(-0.1, 3);
  });

  it('handles zero resistance', () => {
    const supplyVoltage = new Measurement(12, 'V');
    const batteryResistance = new Measurement(0, 'ohm');
    const currents = [new Measurement(10, 'A')];

    const result = calculateLoadedBatteryVoltage(
      supplyVoltage,
      batteryResistance,
      currents,
    );

    expect(result.to('V').scalar).toBe(12);
  });

  it('handles empty currents array', () => {
    const supplyVoltage = new Measurement(12, 'V');
    const batteryResistance = new Measurement(0.01, 'ohm');
    const currents: Measurement[] = [];

    const result = calculateLoadedBatteryVoltage(
      supplyVoltage,
      batteryResistance,
      currents,
    );

    expect(result.to('V').scalar).toBe(12);
  });

  it('handles multiple currents', () => {
    const supplyVoltage = new Measurement(12, 'V');
    const batteryResistance = new Measurement(0.01, 'ohm');
    const currents = [
      new Measurement(10, 'A'),
      new Measurement(20, 'A'),
      new Measurement(5, 'A'),
    ];

    const result = calculateLoadedBatteryVoltage(
      supplyVoltage,
      batteryResistance,
      currents,
    );

    expect(result.to('V').scalar).toBeCloseTo(11.65, 3);
  });

  it('handles zero current', () => {
    const supplyVoltage = new Measurement(12, 'V');
    const batteryResistance = new Measurement(0.01, 'ohm');
    const currents = [new Measurement(0, 'A')];

    const result = calculateLoadedBatteryVoltage(
      supplyVoltage,
      batteryResistance,
      currents,
    );

    expect(result.to('V').scalar).toBe(12);
  });

  it('handles negative current', () => {
    const supplyVoltage = new Measurement(12, 'V');
    const batteryResistance = new Measurement(0.01, 'ohm');
    const currents = [new Measurement(-10, 'A')];

    const result = calculateLoadedBatteryVoltage(
      supplyVoltage,
      batteryResistance,
      currents,
    );

    expect(result.to('V').scalar).toBeCloseTo(12.1, 3);
  });

  it('handles very large current', () => {
    const supplyVoltage = new Measurement(12, 'V');
    const batteryResistance = new Measurement(0.01, 'ohm');
    const currents = [new Measurement(1000, 'A')];

    const result = calculateLoadedBatteryVoltage(
      supplyVoltage,
      batteryResistance,
      currents,
    );

    expect(result.to('V').scalar).toBeCloseTo(2.0, 3);
  });

  it('handles all zero values', () => {
    const supplyVoltage = new Measurement(0, 'V');
    const batteryResistance = new Measurement(0, 'ohm');
    const currents = [new Measurement(0, 'A')];

    const result = calculateLoadedBatteryVoltage(
      supplyVoltage,
      batteryResistance,
      currents,
    );

    expect(result.to('V').scalar).toBe(0);
  });

  it('handles very high resistance', () => {
    const supplyVoltage = new Measurement(12, 'V');
    const batteryResistance = new Measurement(1, 'ohm');
    const currents = [new Measurement(10, 'A')];

    const result = calculateLoadedBatteryVoltage(
      supplyVoltage,
      batteryResistance,
      currents,
    );

    expect(result.to('V').scalar).toBe(2);
  });
});

import { describe, expect, it } from 'vitest';

import { calculateStallLoad } from '~/lib/math/linear';
import Measurement from '~/lib/models/Measurement';
import Motor from '~/lib/models/Motor';
import Ratio, { RatioType } from '~/lib/models/Ratio';

describe('calculateStallLoad', () => {
  it('calculates stall load correctly', () => {
    const motor = Motor.KrakenX60sFOC(1);
    const currentLimit = new Measurement(60, 'A');
    const spoolDiameter = new Measurement(2, 'in');
    const ratio = new Ratio(2, RatioType.REDUCTION);
    const efficiency = 90;
    const statorVoltage = new Measurement(12, 'V');

    const result = calculateStallLoad(
      motor,
      currentLimit,
      spoolDiameter,
      ratio,
      efficiency,
      statorVoltage,
    );

    expect(result.to('lb').scalar).toBeCloseTo(-17.695, 3);
  });

  it('handles zero spool diameter', () => {
    const motor = Motor.KrakenX60sFOC(1);
    const currentLimit = new Measurement(60, 'A');
    const spoolDiameter = new Measurement(0, 'in');
    const ratio = new Ratio(2, RatioType.REDUCTION);
    const efficiency = 90;
    const statorVoltage = new Measurement(12, 'V');

    const result = calculateStallLoad(
      motor,
      currentLimit,
      spoolDiameter,
      ratio,
      efficiency,
      statorVoltage,
    );

    expect(result.to('lb').scalar).toBeCloseTo(0, 3);
  });

  it('handles zero motor quantity', () => {
    const motor = Motor.KrakenX60sFOC(0);
    const currentLimit = new Measurement(60, 'A');
    const spoolDiameter = new Measurement(2, 'in');
    const ratio = new Ratio(2, RatioType.REDUCTION);
    const efficiency = 90;
    const statorVoltage = new Measurement(12, 'V');

    const result = calculateStallLoad(
      motor,
      currentLimit,
      spoolDiameter,
      ratio,
      efficiency,
      statorVoltage,
    );

    expect(result.to('lb').scalar).toBeCloseTo(0, 3);
  });

  it('handles zero ratio', () => {
    const motor = Motor.KrakenX60sFOC(1);
    const currentLimit = new Measurement(60, 'A');
    const spoolDiameter = new Measurement(2, 'in');
    const ratio = new Ratio(0, RatioType.REDUCTION);
    const efficiency = 90;
    const statorVoltage = new Measurement(12, 'V');

    const result = calculateStallLoad(
      motor,
      currentLimit,
      spoolDiameter,
      ratio,
      efficiency,
      statorVoltage,
    );

    expect(result.to('lb').scalar).toBeCloseTo(0, 3);
  });

  it('handles zero efficiency', () => {
    const motor = Motor.KrakenX60sFOC(1);
    const currentLimit = new Measurement(60, 'A');
    const spoolDiameter = new Measurement(2, 'in');
    const ratio = new Ratio(2, RatioType.REDUCTION);
    const efficiency = 0;
    const statorVoltage = new Measurement(12, 'V');

    const result = calculateStallLoad(
      motor,
      currentLimit,
      spoolDiameter,
      ratio,
      efficiency,
      statorVoltage,
    );

    expect(result.to('lb').scalar).toBeCloseTo(0, 3);
  });

  it('handles zero current limit', () => {
    const motor = Motor.KrakenX60sFOC(1);
    const currentLimit = new Measurement(0, 'A');
    const spoolDiameter = new Measurement(2, 'in');
    const ratio = new Ratio(2, RatioType.REDUCTION);
    const efficiency = 90;
    const statorVoltage = new Measurement(12, 'V');

    const result = calculateStallLoad(
      motor,
      currentLimit,
      spoolDiameter,
      ratio,
      efficiency,
      statorVoltage,
    );

    expect(result.to('lb').scalar).toBeCloseTo(0, 3);
  });

  it('handles different ratios', () => {
    const motor = Motor.KrakenX60sFOC(1);
    const currentLimit = new Measurement(60, 'A');
    const spoolDiameter = new Measurement(2, 'in');
    const ratio1 = new Ratio(1, RatioType.REDUCTION);
    const ratio2 = new Ratio(4, RatioType.REDUCTION);
    const efficiency = 90;
    const statorVoltage = new Measurement(12, 'V');

    const result1 = calculateStallLoad(
      motor,
      currentLimit,
      spoolDiameter,
      ratio1,
      efficiency,
      statorVoltage,
    );

    const result2 = calculateStallLoad(
      motor,
      currentLimit,
      spoolDiameter,
      ratio2,
      efficiency,
      statorVoltage,
    );

    expect(result1.to('lb').scalar).toBeCloseTo(-8.848, 3);
    expect(result2.to('lb').scalar).toBeCloseTo(-35.39, 3);
    expect(Math.abs(result2.to('lb').scalar)).toBeGreaterThan(
      Math.abs(result1.to('lb').scalar),
    );
  });

  it('handles different efficiencies', () => {
    const motor = Motor.KrakenX60sFOC(1);
    const currentLimit = new Measurement(60, 'A');
    const spoolDiameter = new Measurement(2, 'in');
    const ratio = new Ratio(2, RatioType.REDUCTION);
    const efficiency1 = 50;
    const efficiency2 = 100;
    const statorVoltage = new Measurement(12, 'V');

    const result1 = calculateStallLoad(
      motor,
      currentLimit,
      spoolDiameter,
      ratio,
      efficiency1,
      statorVoltage,
    );

    const result2 = calculateStallLoad(
      motor,
      currentLimit,
      spoolDiameter,
      ratio,
      efficiency2,
      statorVoltage,
    );

    expect(result1.to('lb').scalar).toBeCloseTo(-9.831, 3);
    expect(result2.to('lb').scalar).toBeCloseTo(-19.661, 3);
    expect(Math.abs(result2.to('lb').scalar)).toBeGreaterThan(
      Math.abs(result1.to('lb').scalar),
    );
  });

  it('handles multiple motors', () => {
    const motor = Motor.KrakenX60sFOC(2);
    const currentLimit = new Measurement(60, 'A');
    const spoolDiameter = new Measurement(2, 'in');
    const ratio = new Ratio(2, RatioType.REDUCTION);
    const efficiency = 90;
    const statorVoltage = new Measurement(12, 'V');

    const result = calculateStallLoad(
      motor,
      currentLimit,
      spoolDiameter,
      ratio,
      efficiency,
      statorVoltage,
    );

    expect(result.to('lb').scalar).toBeCloseTo(-35.39, 3);
  });

  it('handles very small spool diameter', () => {
    const motor = Motor.KrakenX60sFOC(1);
    const currentLimit = new Measurement(60, 'A');
    const spoolDiameter = new Measurement(0.001, 'in');
    const ratio = new Ratio(2, RatioType.REDUCTION);
    const efficiency = 90;
    const statorVoltage = new Measurement(12, 'V');

    const result = calculateStallLoad(
      motor,
      currentLimit,
      spoolDiameter,
      ratio,
      efficiency,
      statorVoltage,
    );

    expect(result.to('lb').scalar).toBeCloseTo(-35390.403, 3);
  });
});

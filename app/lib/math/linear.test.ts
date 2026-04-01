import { describe, expect, it } from 'vitest';

import { calculateGuessedLimits, calculateStallLoad } from '~/lib/math/linear';
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

    expect(result.to('lb').scalar).toBeCloseTo(17.701, 3);
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

    expect(result1.to('lb').scalar).toBeCloseTo(8.851, 3);
    expect(result2.to('lb').scalar).toBeCloseTo(35.402, 3);
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

    expect(result1.to('lb').scalar).toBeCloseTo(9.834, 3);
    expect(result2.to('lb').scalar).toBeCloseTo(19.668, 3);
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

    expect(result.to('lb').scalar).toBeCloseTo(35.402, 3);
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

    expect(result.to('lb').scalar).toBeCloseTo(35402.49, 2);
  });
});

describe('calculateGuessedLimits', () => {
  it('produces reasonable guessed limits for a typical elevator', () => {
    const motor = Motor.KrakenX60sFOC(1);
    const ratio = new Ratio(4, RatioType.REDUCTION);
    const load = new Measurement(15, 'lb');
    const spoolDiameter = new Measurement(1.5, 'in');
    const statorLimit = new Measurement(80, 'A');
    const supplyLimit = new Measurement(60, 'A');
    const supplyVoltage = new Measurement(12, 'V');
    const angle = new Measurement(90, 'deg');
    const efficiency = 100;

    const { v_max_guessed, a_max_guessed } = calculateGuessedLimits(
      motor,
      ratio,
      load,
      spoolDiameter,
      statorLimit,
      supplyLimit,
      supplyVoltage,
      angle,
      efficiency,
      false,
    );

    expect(v_max_guessed.to('m/s').scalar).toBeGreaterThan(0.5);
    expect(a_max_guessed.to('m/s^2').scalar).toBeGreaterThan(1);
  });

  it('never returns the 0.1 floor for a reasonable mechanism', () => {
    const motor = Motor.KrakenX60sFOC(2);
    const ratio = new Ratio(2, RatioType.REDUCTION);
    const load = new Measurement(10, 'lb');
    const spoolDiameter = new Measurement(2, 'in');
    const statorLimit = new Measurement(40, 'A');
    const supplyLimit = new Measurement(40, 'A');
    const supplyVoltage = new Measurement(12, 'V');
    const angle = new Measurement(90, 'deg');
    const efficiency = 90;

    const { v_max_guessed, a_max_guessed } = calculateGuessedLimits(
      motor,
      ratio,
      load,
      spoolDiameter,
      statorLimit,
      supplyLimit,
      supplyVoltage,
      angle,
      efficiency,
      false,
    );

    expect(v_max_guessed.to('m/s').scalar).toBeGreaterThan(0.1);
    expect(a_max_guessed.to('m/s^2').scalar).toBeGreaterThan(0.1);
  });

  it('expects efficiency as a percentage, not a decimal', () => {
    const motor = Motor.KrakenX60sFOC(1);
    const ratio = new Ratio(4, RatioType.REDUCTION);
    const load = new Measurement(15, 'lb');
    const spoolDiameter = new Measurement(1.5, 'in');
    const statorLimit = new Measurement(80, 'A');
    const supplyLimit = new Measurement(60, 'A');
    const supplyVoltage = new Measurement(12, 'V');
    const angle = new Measurement(90, 'deg');

    const withPercentage = calculateGuessedLimits(
      motor,
      ratio,
      load,
      spoolDiameter,
      statorLimit,
      supplyLimit,
      supplyVoltage,
      angle,
      100,
      false,
    );

    const withDecimal = calculateGuessedLimits(
      motor,
      ratio,
      load,
      spoolDiameter,
      statorLimit,
      supplyLimit,
      supplyVoltage,
      angle,
      1,
      false,
    );

    expect(withPercentage.a_max_guessed.to('m/s^2').scalar).toBeGreaterThan(1);
    expect(withDecimal.a_max_guessed.to('m/s^2').scalar).toBeLessThan(0.2);
  });

  it('expects spoolDiameter, not spool radius', () => {
    const motor = Motor.KrakenX60sFOC(1);
    const ratio = new Ratio(4, RatioType.REDUCTION);
    const load = new Measurement(15, 'lb');
    const statorLimit = new Measurement(80, 'A');
    const supplyLimit = new Measurement(60, 'A');
    const supplyVoltage = new Measurement(12, 'V');
    const angle = new Measurement(90, 'deg');
    const efficiency = 100;

    const withDiameter = calculateGuessedLimits(
      motor,
      ratio,
      load,
      new Measurement(2, 'in'),
      statorLimit,
      supplyLimit,
      supplyVoltage,
      angle,
      efficiency,
      false,
    );

    const withRadius = calculateGuessedLimits(
      motor,
      ratio,
      load,
      new Measurement(1, 'in'),
      statorLimit,
      supplyLimit,
      supplyVoltage,
      angle,
      efficiency,
      false,
    );

    expect(withDiameter.v_max_guessed.to('m/s').scalar).toBeGreaterThan(
      withRadius.v_max_guessed.to('m/s').scalar,
    );
  });

  it('expects per-motor current limits, not total', () => {
    const motor = Motor.KrakenX60sFOC(2);
    const ratio = new Ratio(4, RatioType.REDUCTION);
    const load = new Measurement(15, 'lb');
    const spoolDiameter = new Measurement(1.5, 'in');
    const supplyVoltage = new Measurement(12, 'V');
    const angle = new Measurement(90, 'deg');
    const efficiency = 100;

    const perMotor = calculateGuessedLimits(
      motor,
      ratio,
      load,
      spoolDiameter,
      new Measurement(40, 'A'),
      new Measurement(40, 'A'),
      supplyVoltage,
      angle,
      efficiency,
      false,
    );

    const doubled = calculateGuessedLimits(
      motor,
      ratio,
      load,
      spoolDiameter,
      new Measurement(80, 'A'),
      new Measurement(80, 'A'),
      supplyVoltage,
      angle,
      efficiency,
      false,
    );

    expect(doubled.a_max_guessed.to('m/s^2').scalar).toBeGreaterThan(
      perMotor.a_max_guessed.to('m/s^2').scalar,
    );
  });
});

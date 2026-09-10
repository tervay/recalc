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

    expect(result.to('lb').scalar).toBeCloseTo(17.832, 3);
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

    expect(result1.to('lb').scalar).toBeCloseTo(8.916, 3);
    expect(result2.to('lb').scalar).toBeCloseTo(35.664, 3);
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

    expect(result1.to('lb').scalar).toBeCloseTo(9.907, 3);
    expect(result2.to('lb').scalar).toBeCloseTo(19.8135, 3);
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

    expect(result.to('lb').scalar).toBeCloseTo(35.664, 3);
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

    expect(result.to('lb').scalar).toBeCloseTo(35664.377, 2);
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

  it('shares gravity holding current across parallel motors when estimating velocity', () => {
    const { v_max_guessed } = calculateGuessedLimits(
      Motor.KrakenX60sFOC(4),
      new Ratio(4, RatioType.REDUCTION),
      new Measurement(15, 'lb'),
      new Measurement(1.5, 'in'),
      new Measurement(80, 'A'),
      new Measurement(60, 'A'),
      new Measurement(12, 'V'),
      new Measurement(90, 'deg'),
      100,
      false,
    );

    expect(v_max_guessed.to('m/s').scalar).toBeCloseTo(2.593352, 6);
  });

  it('returns zero guessed velocity when there are no motors', () => {
    const { v_max_guessed } = calculateGuessedLimits(
      Motor.KrakenX60sFOC(0),
      new Ratio(4, RatioType.REDUCTION),
      new Measurement(15, 'lb'),
      new Measurement(1.5, 'in'),
      new Measurement(80, 'A'),
      new Measurement(60, 'A'),
      new Measurement(12, 'V'),
      new Measurement(90, 'deg'),
      100,
      false,
    );

    expect(v_max_guessed.to('m/s').scalar).toBe(0);
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

  it('caps guessed velocity when rVolts is lower than supply voltage', () => {
    const motor = Motor.KrakenX60sFOC(1);
    const ratio = new Ratio(4, RatioType.REDUCTION);
    const load = new Measurement(15, 'lb');
    const spoolDiameter = new Measurement(1.5, 'in');
    const statorLimit = new Measurement(80, 'A');
    const supplyLimit = new Measurement(60, 'A');
    const supplyVoltage = new Measurement(12, 'V');
    const angle = new Measurement(90, 'deg');
    const efficiency = 100;

    const fullVoltage = calculateGuessedLimits(
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
      new Measurement(12, 'V'),
    );

    const halfVoltage = calculateGuessedLimits(
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
      new Measurement(6, 'V'),
    );

    expect(fullVoltage.v_max_guessed.to('m/s').scalar).toBeGreaterThan(
      halfVoltage.v_max_guessed.to('m/s').scalar,
    );
  });

  it('caps guessed acceleration when rVolts is the binding constraint', () => {
    const motor = Motor.KrakenX60sFOC(1);
    const ratio = new Ratio(4, RatioType.REDUCTION);
    const load = new Measurement(15, 'lb');
    const spoolDiameter = new Measurement(1.5, 'in');
    const statorLimit = new Measurement(200, 'A');
    const supplyLimit = new Measurement(200, 'A');
    const supplyVoltage = new Measurement(12, 'V');
    const angle = new Measurement(90, 'deg');
    const efficiency = 100;

    const fullVoltage = calculateGuessedLimits(
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
      new Measurement(12, 'V'),
    );

    const lowVoltage = calculateGuessedLimits(
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
      new Measurement(3, 'V'),
    );

    expect(fullVoltage.a_max_guessed.to('m/s^2').scalar).toBeGreaterThan(
      lowVoltage.a_max_guessed.to('m/s^2').scalar,
    );
  });

  it('uses parallel resistance when supply power limits acceleration', () => {
    const guessedAccelerationFor = (quantity: number) =>
      calculateGuessedLimits(
        Motor.KrakenX60sFOC(quantity),
        new Ratio(2, RatioType.REDUCTION),
        new Measurement(5 * quantity, 'lb'),
        new Measurement(1, 'in'),
        new Measurement(1000, 'A'),
        new Measurement(1, 'A'),
        new Measurement(12, 'V'),
        new Measurement(0, 'deg'),
        100,
        false,
      ).a_max_guessed.to('m/s^2').scalar;

    expect(guessedAccelerationFor(4)).toBeCloseTo(guessedAccelerationFor(1), 6);
  });

  const GRAVITY_MPS2 = 9.80665;

  function peakSupplyWatts(
    v: Measurement,
    a: Measurement,
    loadKg: number,
    travelMeters: number,
  ): number {
    const vMPS = v.to('m/s').scalar;
    const aMPS2 = a.to('m/s^2').scalar;
    const peakV = Math.min(vMPS, Math.sqrt(aMPS2 * travelMeters));
    return loadKg * (aMPS2 + GRAVITY_MPS2) * peakV;
  }

  it('clamps the guessed profile to the supply power budget when given a distance', () => {
    const motor = Motor.KrakenX60sFOC(1);
    const args = [
      motor,
      new Ratio(1.75, RatioType.REDUCTION),
      new Measurement(5, 'lb'),
      new Measurement(1, 'in'),
      new Measurement(50, 'A'),
      new Measurement(10, 'A'),
      new Measurement(12, 'V'),
      new Measurement(90, 'deg'),
      100,
      false,
      new Measurement(12, 'V'),
    ] as const;

    const unclamped = calculateGuessedLimits(...args);
    const clamped = calculateGuessedLimits(...args, new Measurement(60, 'in'));

    const loadKg = new Measurement(5, 'lb').to('kg').scalar;
    const travelMeters = new Measurement(60, 'in').to('m').scalar;
    const budget = 12 * 10;

    expect(
      peakSupplyWatts(
        unclamped.v_max_guessed,
        unclamped.a_max_guessed,
        loadKg,
        travelMeters,
      ),
    ).toBeGreaterThan(3 * budget);

    expect(
      peakSupplyWatts(
        clamped.v_max_guessed,
        clamped.a_max_guessed,
        loadKg,
        travelMeters,
      ),
    ).toBeLessThan(2 * budget);
  });

  it('uses parallel resistance in a distance-aware supply-limited profile', () => {
    const guessedProfileFor = (quantity: number) => {
      const result = calculateGuessedLimits(
        Motor.KrakenX60sFOC(quantity),
        new Ratio(1.75, RatioType.REDUCTION),
        new Measurement(5 * quantity, 'lb'),
        new Measurement(1, 'in'),
        new Measurement(50, 'A'),
        new Measurement(10, 'A'),
        new Measurement(12, 'V'),
        new Measurement(90, 'deg'),
        100,
        false,
        new Measurement(12, 'V'),
        new Measurement(60, 'in'),
      );

      return {
        accelerationMPS2: result.a_max_guessed.to('m/s^2').scalar,
        velocityMPS: result.v_max_guessed.to('m/s').scalar,
      };
    };

    const oneMotor = guessedProfileFor(1);
    const fourMotors = guessedProfileFor(4);

    expect(fourMotors.velocityMPS).toBeCloseTo(oneMotor.velocityMPS, 6);
    expect(fourMotors.accelerationMPS2).toBeCloseTo(
      oneMotor.accelerationMPS2,
      6,
    );
  });

  it('leaves an already-feasible profile untouched when given a distance', () => {
    const feasibleCases: Array<[number, number]> = [
      [80, 60],
      [50, 30],
    ];

    for (const [stator, supply] of feasibleCases) {
      const args = [
        Motor.KrakenX60sFOC(1),
        new Ratio(2, RatioType.REDUCTION),
        new Measurement(5, 'lb'),
        new Measurement(1, 'in'),
        new Measurement(stator, 'A'),
        new Measurement(supply, 'A'),
        new Measurement(12, 'V'),
        new Measurement(90, 'deg'),
        100,
        false,
        new Measurement(12, 'V'),
      ] as const;

      const without = calculateGuessedLimits(...args);
      const withDistance = calculateGuessedLimits(
        ...args,
        new Measurement(60, 'in'),
      );

      expect(withDistance.v_max_guessed.to('m/s').scalar).toBeCloseTo(
        without.v_max_guessed.to('m/s').scalar,
        6,
      );
      expect(withDistance.a_max_guessed.to('m/s^2').scalar).toBeCloseTo(
        without.a_max_guessed.to('m/s^2').scalar,
        6,
      );
    }
  });

  it('prefers a lower acceleration over a lower cruise when clamping for power', () => {
    const clamped = calculateGuessedLimits(
      Motor.KrakenX60sFOC(1),
      new Ratio(1.75, RatioType.REDUCTION),
      new Measurement(5, 'lb'),
      new Measurement(1, 'in'),
      new Measurement(50, 'A'),
      new Measurement(10, 'A'),
      new Measurement(12, 'V'),
      new Measurement(90, 'deg'),
      100,
      false,
      new Measurement(12, 'V'),
      new Measurement(60, 'in'),
    );

    const v = clamped.v_max_guessed.to('m/s').scalar;
    const a = clamped.a_max_guessed.to('m/s^2').scalar;

    expect(v).toBeGreaterThan(2);
    expect(v).toBeLessThan(3.2);
    expect(a).toBeGreaterThan(8);
    expect(a).toBeLessThan(20);
  });

  it('is unaffected by rVolts when it exceeds supply voltage', () => {
    const motor = Motor.KrakenX60sFOC(1);
    const ratio = new Ratio(4, RatioType.REDUCTION);
    const load = new Measurement(15, 'lb');
    const spoolDiameter = new Measurement(1.5, 'in');
    const statorLimit = new Measurement(80, 'A');
    const supplyLimit = new Measurement(60, 'A');
    const supplyVoltage = new Measurement(12, 'V');
    const angle = new Measurement(90, 'deg');
    const efficiency = 100;

    const at12V = calculateGuessedLimits(
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
      new Measurement(12, 'V'),
    );

    const at24V = calculateGuessedLimits(
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
      new Measurement(24, 'V'),
    );

    expect(at12V.v_max_guessed.to('m/s').scalar).toBeCloseTo(
      at24V.v_max_guessed.to('m/s').scalar,
      3,
    );
    expect(at12V.a_max_guessed.to('m/s^2').scalar).toBeCloseTo(
      at24V.a_max_guessed.to('m/s^2').scalar,
      3,
    );
  });
});

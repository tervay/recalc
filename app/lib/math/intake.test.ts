import { describe, expect, it } from 'vitest';

import {
  calculateAllRecommendedRatiosAndStallTorques,
  calculateLinearSurfaceSpeed,
  calculateRecommendedRatio,
} from '~/lib/math/intake';
import Measurement from '~/lib/models/Measurement';
import Motor, { ALL_MOTORS, IntendedProgram } from '~/lib/models/Motor';
import Ratio, { RatioType } from '~/lib/models/Ratio';

describe('calculateLinearSurfaceSpeed', () => {
  it('calculates linear surface speed correctly', () => {
    const motor = Motor.KrakenX60sFOC(1);
    const ratio = new Ratio(2, RatioType.REDUCTION);
    const rollerDiameter = new Measurement(2, 'in');

    const result = calculateLinearSurfaceSpeed(motor, ratio, rollerDiameter);

    expect(result.to('ft/s').scalar).toBeCloseTo(25.237, 3);
  });

  it('returns zero when ratio is zero', () => {
    const motor = Motor.KrakenX60sFOC(1);
    const ratio = new Ratio(0, RatioType.REDUCTION);
    const rollerDiameter = new Measurement(2, 'in');

    const result = calculateLinearSurfaceSpeed(motor, ratio, rollerDiameter);

    expect(result.scalar).toBe(0);
  });

  it('works with different roller diameters', () => {
    const motor = Motor.KrakenX60sFOC(1);
    const ratio = new Ratio(1, RatioType.REDUCTION);
    const rollerDiameter = new Measurement(4, 'in');

    const result = calculateLinearSurfaceSpeed(motor, ratio, rollerDiameter);

    expect(result.to('ft/s').scalar).toBeGreaterThan(0);
  });
});

describe('calculateRecommendedRatio', () => {
  it('calculates recommended ratio correctly', () => {
    const motor = Motor.KrakenX60sFOC(1);
    const drivetrainSpeed = new Measurement(14, 'ft/s');
    const rollerDiameter = new Measurement(2, 'in');

    const result = calculateRecommendedRatio(
      motor,
      drivetrainSpeed,
      rollerDiameter,
    );

    expect(result.magnitude).toBeCloseTo(1.803, 3);
    expect(result.ratioType).toBe(RatioType.REDUCTION);
  });

  it('returns 1:1 ratio when drivetrain speed is zero', () => {
    const motor = Motor.KrakenX60sFOC(1);
    const drivetrainSpeed = new Measurement(0, 'ft/s');
    const rollerDiameter = new Measurement(2, 'in');

    const result = calculateRecommendedRatio(
      motor,
      drivetrainSpeed,
      rollerDiameter,
    );

    expect(result.magnitude).toBe(1);
  });

  it('adjusts ratio based on motor speed', () => {
    const motor = Motor.NEO(1);
    const drivetrainSpeed = new Measurement(14, 'ft/s');
    const rollerDiameter = new Measurement(2, 'in');

    const result = calculateRecommendedRatio(
      motor,
      drivetrainSpeed,
      rollerDiameter,
    );

    expect(result.magnitude).toBeGreaterThan(0);
    expect(result.ratioType).toBe(RatioType.REDUCTION);
  });
});

describe('calculateAllRecommendedRatiosAndStallTorques', () => {
  const drivetrainSpeed = new Measurement(14, 'ft/s');
  const rollerDiameter = new Measurement(2, 'in');
  const statorCurrentLimit = new Measurement(30, 'A');

  function run(motor: Motor) {
    return calculateAllRecommendedRatiosAndStallTorques(
      drivetrainSpeed,
      rollerDiameter,
      motor,
      statorCurrentLimit,
    );
  }

  it('returns only FRC motors for an FRC motor', () => {
    const results = run(Motor.KrakenX60sFOC(1));

    expect(
      results.every((r) => r.motor.intendedProgram === IntendedProgram.FRC),
    ).toBe(true);
  });

  it('returns every FRC motor for an FRC motor', () => {
    const results = run(Motor.KrakenX60sFOC(1));

    expect(results).toHaveLength(
      ALL_MOTORS.filter((m) => m.intendedProgram === IntendedProgram.FRC)
        .length,
    );
  });

  it('returns only FTC motors for an FTC motor', () => {
    const results = run(Motor.fromName('HD Hex', 1));

    expect(results.map((r) => r.motor.identifier).sort()).toEqual(
      ALL_MOTORS.filter((m) => m.intendedProgram === IntendedProgram.FTC)
        .map((m) => m.name)
        .sort(),
    );
  });

  it('excludes FRC motors when an FTC motor is selected', () => {
    const results = run(Motor.fromName('HD Hex', 1));

    expect(results.map((r) => r.motor.identifier)).not.toContain('NEO');
  });

  it('returns only OTHER motors for an OTHER motor', () => {
    const results = run(Motor.fromName('V5 Smart Motor (Red)', 1));

    expect(results.map((r) => r.motor.identifier)).toEqual([
      'V5 Smart Motor (Red)',
    ]);
  });

  it('includes the selected motor in its own results', () => {
    const motor = Motor.NEO(1);
    const results = run(motor);

    expect(results.some((r) => r.motor.eq(motor))).toBe(true);
  });

  it('carries the selected motor quantity onto every result', () => {
    const results = run(Motor.KrakenX60sFOC(3));

    expect(results.every((r) => r.motor.quantity === 3)).toBe(true);
  });

  it('scales stall torque by quantity', () => {
    const single = run(Motor.KrakenX60sFOC(1));
    const double = run(Motor.KrakenX60sFOC(2));

    const find = (rs: typeof single) =>
      rs.find((r) => r.motor.identifier === 'Kraken X60 (FOC)')!;

    expect(find(double).stallTorque.to('N*m').scalar).toBeCloseTo(
      find(single).stallTorque.to('N*m').scalar * 2,
      6,
    );
  });
});

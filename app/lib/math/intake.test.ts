import { describe, expect, it } from 'vitest';

import {
  calculateLinearSurfaceSpeed,
  calculateRecommendedRatio,
} from '~/lib/math/intake';
import Measurement from '~/lib/models/Measurement';
import Motor from '~/lib/models/Motor';
import Ratio, { RatioType } from '~/lib/models/Ratio';

describe('calculateLinearSurfaceSpeed', () => {
  it('calculates linear surface speed correctly', () => {
    const motor = Motor.fromName('Kraken X60 (FOC)', 1);
    const ratio = new Ratio(2, RatioType.REDUCTION);
    const rollerDiameter = new Measurement(2, 'in');

    const result = calculateLinearSurfaceSpeed(motor, ratio, rollerDiameter);

    expect(result.to('ft/s').scalar).toBeCloseTo(25.3, 0);
  });

  it('returns zero when ratio is zero', () => {
    const motor = Motor.fromName('Kraken X60 (FOC)', 1);
    const ratio = new Ratio(0, RatioType.REDUCTION);
    const rollerDiameter = new Measurement(2, 'in');

    const result = calculateLinearSurfaceSpeed(motor, ratio, rollerDiameter);

    expect(result.scalar).toBe(0);
  });

  it('works with different roller diameters', () => {
    const motor = Motor.fromName('Kraken X60 (FOC)', 1);
    const ratio = new Ratio(1, RatioType.REDUCTION);
    const rollerDiameter = new Measurement(4, 'in');

    const result = calculateLinearSurfaceSpeed(motor, ratio, rollerDiameter);

    expect(result.to('ft/s').scalar).toBeGreaterThan(0);
  });
});

describe('calculateRecommendedRatio', () => {
  it('calculates recommended ratio correctly', () => {
    const motor = Motor.fromName('Kraken X60 (FOC)', 1);
    const drivetrainSpeed = new Measurement(14, 'ft/s');
    const rollerDiameter = new Measurement(2, 'in');

    const result = calculateRecommendedRatio(
      motor,
      drivetrainSpeed,
      rollerDiameter,
    );

    expect(result.magnitude).toBeCloseTo(1.81, 1);
    expect(result.ratioType).toBe(RatioType.REDUCTION);
  });

  it('returns 1:1 ratio when drivetrain speed is zero', () => {
    const motor = Motor.fromName('Kraken X60 (FOC)', 1);
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
    const motor = Motor.fromName('NEO', 1);
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

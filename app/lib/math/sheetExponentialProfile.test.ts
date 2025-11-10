import { describe, expect, it } from 'vitest';

import { generateProfile } from '~/lib/math/sheetExponentialProfile';
import Measurement from '~/lib/models/Measurement';
import Motor from '~/lib/models/Motor';
import Ratio, { RatioType } from '~/lib/models/Ratio';

describe.concurrent('generateProfile', () => {
  it('generates profile correctly', () => {
    const targetDistance = new Measurement(1, 'm');
    const maxVelocity = new Measurement(2, 'm/s');
    const motor = Motor.KrakenX60sFOC(1);
    const efficiency = 90;
    const ratio = new Ratio(2, RatioType.REDUCTION);
    const mass = new Measurement(1, 'kg');
    const statorLimit = new Measurement(60, 'A');
    const gravity = Measurement.GRAVITY;
    const wheelOrPulleyDiameter = new Measurement(4, 'in');
    const stopAtVelocity = new Measurement(1, 'm/s');

    const result = generateProfile(
      targetDistance,
      maxVelocity,
      motor,
      efficiency,
      ratio,
      mass,
      statorLimit,
      gravity,
      wheelOrPulleyDiameter,
      stopAtVelocity,
    );

    expect(result).toMatchSnapshot();
  });

  it('handles zero target distance', () => {
    const targetDistance = new Measurement(0, 'm');
    const maxVelocity = new Measurement(2, 'm/s');
    const motor = Motor.KrakenX60sFOC(1);
    const efficiency = 90;
    const ratio = new Ratio(2, RatioType.REDUCTION);
    const mass = new Measurement(1, 'kg');
    const statorLimit = new Measurement(60, 'A');
    const gravity = Measurement.GRAVITY;
    const wheelOrPulleyDiameter = new Measurement(4, 'in');
    const stopAtVelocity = new Measurement(0.1, 'm/s');

    const result = generateProfile(
      targetDistance,
      maxVelocity,
      motor,
      efficiency,
      ratio,
      mass,
      statorLimit,
      gravity,
      wheelOrPulleyDiameter,
      stopAtVelocity,
    );

    expect(result).toMatchSnapshot();
  });

  it('handles zero max velocity', () => {
    const targetDistance = new Measurement(1, 'm');
    const maxVelocity = new Measurement(0, 'm/s');
    const motor = Motor.KrakenX60sFOC(1);
    const efficiency = 90;
    const ratio = new Ratio(2, RatioType.REDUCTION);
    const mass = new Measurement(1, 'kg');
    const statorLimit = new Measurement(60, 'A');
    const gravity = Measurement.GRAVITY;
    const wheelOrPulleyDiameter = new Measurement(4, 'in');

    expect(() => {
      generateProfile(
        targetDistance,
        maxVelocity,
        motor,
        efficiency,
        ratio,
        mass,
        statorLimit,
        gravity,
        wheelOrPulleyDiameter,
      );
    }).toThrow();
  });

  it('handles zero mass', () => {
    const targetDistance = new Measurement(1, 'm');
    const maxVelocity = new Measurement(2, 'm/s');
    const motor = Motor.KrakenX60sFOC(1);
    const efficiency = 90;
    const ratio = new Ratio(2, RatioType.REDUCTION);
    const mass = new Measurement(0, 'kg');
    const statorLimit = new Measurement(60, 'A');
    const gravity = Measurement.GRAVITY;
    const wheelOrPulleyDiameter = new Measurement(4, 'in');

    const result = generateProfile(
      targetDistance,
      maxVelocity,
      motor,
      efficiency,
      ratio,
      mass,
      statorLimit,
      gravity,
      wheelOrPulleyDiameter,
    );

    expect(result).toMatchSnapshot();
  });

  it('handles zero diameter', () => {
    const targetDistance = new Measurement(1, 'm');
    const maxVelocity = new Measurement(2, 'm/s');
    const motor = Motor.KrakenX60sFOC(1);
    const efficiency = 90;
    const ratio = new Ratio(2, RatioType.REDUCTION);
    const mass = new Measurement(1, 'kg');
    const statorLimit = new Measurement(60, 'A');
    const gravity = Measurement.GRAVITY;
    const wheelOrPulleyDiameter = new Measurement(0, 'in');

    const result = generateProfile(
      targetDistance,
      maxVelocity,
      motor,
      efficiency,
      ratio,
      mass,
      statorLimit,
      gravity,
      wheelOrPulleyDiameter,
    );

    expect(result).toMatchSnapshot();
  });

  it('handles zero ratio', () => {
    const targetDistance = new Measurement(1, 'm');
    const maxVelocity = new Measurement(2, 'm/s');
    const motor = Motor.KrakenX60sFOC(1);
    const efficiency = 90;
    const ratio = new Ratio(0, RatioType.REDUCTION);
    const mass = new Measurement(1, 'kg');
    const statorLimit = new Measurement(60, 'A');
    const gravity = Measurement.GRAVITY;
    const wheelOrPulleyDiameter = new Measurement(4, 'in');

    const result = generateProfile(
      targetDistance,
      maxVelocity,
      motor,
      efficiency,
      ratio,
      mass,
      statorLimit,
      gravity,
      wheelOrPulleyDiameter,
    );

    expect(result).toMatchSnapshot();
  });

  it('handles zero efficiency', () => {
    const targetDistance = new Measurement(1, 'm');
    const maxVelocity = new Measurement(2, 'm/s');
    const motor = Motor.KrakenX60sFOC(1);
    const efficiency = 0;
    const ratio = new Ratio(2, RatioType.REDUCTION);
    const mass = new Measurement(1, 'kg');
    const statorLimit = new Measurement(60, 'A');
    const gravity = Measurement.GRAVITY;
    const wheelOrPulleyDiameter = new Measurement(4, 'in');
    const stopAtVelocity = new Measurement(0.5, 'm/s');

    const result = generateProfile(
      targetDistance,
      maxVelocity,
      motor,
      efficiency,
      ratio,
      mass,
      statorLimit,
      gravity,
      wheelOrPulleyDiameter,
      stopAtVelocity,
    );

    expect(result).toMatchSnapshot();
  });

  it('handles zero motor quantity', () => {
    const targetDistance = new Measurement(1, 'm');
    const maxVelocity = new Measurement(2, 'm/s');
    const motor = Motor.KrakenX60sFOC(0);
    const efficiency = 90;
    const ratio = new Ratio(2, RatioType.REDUCTION);
    const mass = new Measurement(1, 'kg');
    const statorLimit = new Measurement(60, 'A');
    const gravity = Measurement.GRAVITY;
    const wheelOrPulleyDiameter = new Measurement(4, 'in');
    const stopAtVelocity = new Measurement(0.5, 'm/s');

    const result = generateProfile(
      targetDistance,
      maxVelocity,
      motor,
      efficiency,
      ratio,
      mass,
      statorLimit,
      gravity,
      wheelOrPulleyDiameter,
      stopAtVelocity,
    );

    expect(result).toMatchSnapshot();
  });

  it('handles stopAtVelocity parameter', () => {
    const targetDistance = new Measurement(1, 'm');
    const maxVelocity = new Measurement(2, 'm/s');
    const motor = Motor.KrakenX60sFOC(1);
    const efficiency = 90;
    const ratio = new Ratio(2, RatioType.REDUCTION);
    const mass = new Measurement(1, 'kg');
    const statorLimit = new Measurement(60, 'A');
    const gravity = Measurement.GRAVITY;
    const wheelOrPulleyDiameter = new Measurement(4, 'in');
    const stopAtVelocity = new Measurement(1, 'm/s');

    const result = generateProfile(
      targetDistance,
      maxVelocity,
      motor,
      efficiency,
      ratio,
      mass,
      statorLimit,
      gravity,
      wheelOrPulleyDiameter,
      stopAtVelocity,
    );

    expect(result).toMatchSnapshot();
  });

  it('handles undefined stopAtVelocity', () => {
    const targetDistance = new Measurement(0.5, 'm');
    const maxVelocity = new Measurement(2, 'm/s');
    const motor = Motor.KrakenX60sFOC(1);
    const efficiency = 90;
    const ratio = new Ratio(2, RatioType.REDUCTION);
    const mass = new Measurement(1, 'kg');
    const statorLimit = new Measurement(60, 'A');
    const gravity = Measurement.GRAVITY;
    const wheelOrPulleyDiameter = new Measurement(4, 'in');

    const result = generateProfile(
      targetDistance,
      maxVelocity,
      motor,
      efficiency,
      ratio,
      mass,
      statorLimit,
      gravity,
      wheelOrPulleyDiameter,
      undefined,
    );

    expect(result).toMatchSnapshot();
  });

  it('handles very small target distance', () => {
    const targetDistance = new Measurement(0.1, 'm');
    const maxVelocity = new Measurement(2, 'm/s');
    const motor = Motor.KrakenX60sFOC(1);
    const efficiency = 90;
    const ratio = new Ratio(2, RatioType.REDUCTION);
    const mass = new Measurement(1, 'kg');
    const statorLimit = new Measurement(60, 'A');
    const gravity = Measurement.GRAVITY;
    const wheelOrPulleyDiameter = new Measurement(4, 'in');
    const stopAtVelocity = new Measurement(0.5, 'm/s');

    const result = generateProfile(
      targetDistance,
      maxVelocity,
      motor,
      efficiency,
      ratio,
      mass,
      statorLimit,
      gravity,
      wheelOrPulleyDiameter,
      stopAtVelocity,
    );

    expect(result).toMatchSnapshot();
  });

  it('handles very large target distance', () => {
    const targetDistance = new Measurement(5, 'm');
    const maxVelocity = new Measurement(2, 'm/s');
    const motor = Motor.KrakenX60sFOC(1);
    const efficiency = 90;
    const ratio = new Ratio(2, RatioType.REDUCTION);
    const mass = new Measurement(1, 'kg');
    const statorLimit = new Measurement(60, 'A');
    const gravity = Measurement.GRAVITY;
    const wheelOrPulleyDiameter = new Measurement(4, 'in');
    const stopAtVelocity = new Measurement(1.5, 'm/s');

    const result = generateProfile(
      targetDistance,
      maxVelocity,
      motor,
      efficiency,
      ratio,
      mass,
      statorLimit,
      gravity,
      wheelOrPulleyDiameter,
      stopAtVelocity,
    );

    expect(result).toMatchSnapshot();
  });

  it('handles different ratios', () => {
    const targetDistance = new Measurement(1, 'm');
    const maxVelocity = new Measurement(2, 'm/s');
    const motor = Motor.KrakenX60sFOC(1);
    const efficiency = 90;
    const ratio1 = new Ratio(1, RatioType.REDUCTION);
    const ratio2 = new Ratio(4, RatioType.REDUCTION);
    const mass = new Measurement(1, 'kg');
    const statorLimit = new Measurement(60, 'A');
    const gravity = Measurement.GRAVITY;
    const wheelOrPulleyDiameter = new Measurement(4, 'in');
    const stopAtVelocity = new Measurement(1, 'm/s');

    const result1 = generateProfile(
      targetDistance,
      maxVelocity,
      motor,
      efficiency,
      ratio1,
      mass,
      statorLimit,
      gravity,
      wheelOrPulleyDiameter,
      stopAtVelocity,
    );

    const result2 = generateProfile(
      targetDistance,
      maxVelocity,
      motor,
      efficiency,
      ratio2,
      mass,
      statorLimit,
      gravity,
      wheelOrPulleyDiameter,
      stopAtVelocity,
    );

    expect(result1).toMatchSnapshot('ratio-1');
    expect(result2).toMatchSnapshot('ratio-4');
  });

  it('handles different masses', () => {
    const targetDistance = new Measurement(1, 'm');
    const maxVelocity = new Measurement(2, 'm/s');
    const motor = Motor.KrakenX60sFOC(1);
    const efficiency = 90;
    const ratio = new Ratio(2, RatioType.REDUCTION);
    const mass1 = new Measurement(0.5, 'kg');
    const mass2 = new Measurement(2, 'kg');
    const statorLimit = new Measurement(60, 'A');
    const gravity = Measurement.GRAVITY;
    const wheelOrPulleyDiameter = new Measurement(4, 'in');
    const stopAtVelocity = new Measurement(1, 'm/s');

    const result1 = generateProfile(
      targetDistance,
      maxVelocity,
      motor,
      efficiency,
      ratio,
      mass1,
      statorLimit,
      gravity,
      wheelOrPulleyDiameter,
      stopAtVelocity,
    );

    const result2 = generateProfile(
      targetDistance,
      maxVelocity,
      motor,
      efficiency,
      ratio,
      mass2,
      statorLimit,
      gravity,
      wheelOrPulleyDiameter,
      stopAtVelocity,
    );

    expect(result1).toMatchSnapshot('mass-0.5');
    expect(result2).toMatchSnapshot('mass-2');
  });

  it('handles zero gravity', () => {
    const targetDistance = new Measurement(1, 'm');
    const maxVelocity = new Measurement(2, 'm/s');
    const motor = Motor.KrakenX60sFOC(1);
    const efficiency = 90;
    const ratio = new Ratio(2, RatioType.REDUCTION);
    const mass = new Measurement(1, 'kg');
    const statorLimit = new Measurement(60, 'A');
    const gravity = new Measurement(0, 'm/s^2');
    const wheelOrPulleyDiameter = new Measurement(4, 'in');
    const stopAtVelocity = new Measurement(1, 'm/s');

    const result = generateProfile(
      targetDistance,
      maxVelocity,
      motor,
      efficiency,
      ratio,
      mass,
      statorLimit,
      gravity,
      wheelOrPulleyDiameter,
      stopAtVelocity,
    );

    expect(result).toMatchSnapshot();
  });

  it('handles zero stator limit', () => {
    const targetDistance = new Measurement(1, 'm');
    const maxVelocity = new Measurement(2, 'm/s');
    const motor = Motor.KrakenX60sFOC(1);
    const efficiency = 90;
    const ratio = new Ratio(2, RatioType.REDUCTION);
    const mass = new Measurement(1, 'kg');
    const statorLimit = new Measurement(0, 'A');
    const gravity = Measurement.GRAVITY;
    const wheelOrPulleyDiameter = new Measurement(4, 'in');
    const stopAtVelocity = new Measurement(1, 'm/s');

    const result = generateProfile(
      targetDistance,
      maxVelocity,
      motor,
      efficiency,
      ratio,
      mass,
      statorLimit,
      gravity,
      wheelOrPulleyDiameter,
      stopAtVelocity,
    );

    expect(result).toMatchSnapshot();
  });

  it('generates samples with correct structure', () => {
    const targetDistance = new Measurement(1, 'm');
    const maxVelocity = new Measurement(2, 'm/s');
    const motor = Motor.KrakenX60sFOC(1);
    const efficiency = 90;
    const ratio = new Ratio(2, RatioType.REDUCTION);
    const mass = new Measurement(1, 'kg');
    const statorLimit = new Measurement(60, 'A');
    const gravity = Measurement.GRAVITY;
    const wheelOrPulleyDiameter = new Measurement(4, 'in');
    const stopAtVelocity = new Measurement(1, 'm/s');

    const result = generateProfile(
      targetDistance,
      maxVelocity,
      motor,
      efficiency,
      ratio,
      mass,
      statorLimit,
      gravity,
      wheelOrPulleyDiameter,
      stopAtVelocity,
    );

    expect(result).toMatchSnapshot();
  });

  it('handles very low stator limit that causes aLim to be zero', () => {
    const targetDistance = new Measurement(1, 'm');
    const maxVelocity = new Measurement(2, 'm/s');
    const motor = Motor.KrakenX60sFOC(1);
    const efficiency = 90;
    const ratio = new Ratio(2, RatioType.REDUCTION);
    const mass = new Measurement(1, 'kg');
    // Very low stator limit that could cause aLim to be zero or very small
    const statorLimit = new Measurement(1, 'A');
    const gravity = Measurement.GRAVITY;
    const wheelOrPulleyDiameter = new Measurement(4, 'in');
    const stopAtVelocity = new Measurement(0.1, 'm/s');

    // Should not throw - should return base case or handle gracefully
    const result = generateProfile(
      targetDistance,
      maxVelocity,
      motor,
      efficiency,
      ratio,
      mass,
      statorLimit,
      gravity,
      wheelOrPulleyDiameter,
      stopAtVelocity,
    );

    expect(result).toMatchSnapshot();
  });

  it('handles stator limit that causes aStop to be zero', () => {
    const targetDistance = new Measurement(1, 'm');
    const maxVelocity = new Measurement(2, 'm/s');
    const motor = Motor.KrakenX60sFOC(1);
    const efficiency = 90;
    const ratio = new Ratio(2, RatioType.REDUCTION);
    const mass = new Measurement(1, 'kg');
    // Very low stator limit that could cause aStop to be zero
    const statorLimit = new Measurement(0.5, 'A');
    const gravity = Measurement.GRAVITY;
    const wheelOrPulleyDiameter = new Measurement(4, 'in');
    const stopAtVelocity = new Measurement(0.1, 'm/s');

    // Should not throw - should handle division by zero gracefully
    const result = generateProfile(
      targetDistance,
      maxVelocity,
      motor,
      efficiency,
      ratio,
      mass,
      statorLimit,
      gravity,
      wheelOrPulleyDiameter,
      stopAtVelocity,
    );

    expect(result).toMatchSnapshot();
  });

  it('handles zero stator limit that causes aLim to be zero', () => {
    const targetDistance = new Measurement(1, 'm');
    const maxVelocity = new Measurement(2, 'm/s');
    const motor = Motor.KrakenX60sFOC(1);
    const efficiency = 90;
    const ratio = new Ratio(2, RatioType.REDUCTION);
    const mass = new Measurement(1, 'kg');
    const statorLimit = new Measurement(0, 'A');
    const gravity = Measurement.GRAVITY;
    const wheelOrPulleyDiameter = new Measurement(4, 'in');
    const stopAtVelocity = new Measurement(0.1, 'm/s');

    // Should not throw - should handle division by zero gracefully
    const result = generateProfile(
      targetDistance,
      maxVelocity,
      motor,
      efficiency,
      ratio,
      mass,
      statorLimit,
      gravity,
      wheelOrPulleyDiameter,
      stopAtVelocity,
    );

    expect(result).toMatchSnapshot();
  });

  it('handles stupid edge case', () => {
    const result = generateProfile(
      new Measurement(2540, 'm'),
      new Measurement(2540, 'm/s'),
      Motor.KrakenX60sFOC(2),
      100,
      new Ratio(2, RatioType.REDUCTION),
      new Measurement(0.37799364, 'kg'),
      new Measurement(30, 'A'),
      new Measurement(0, 'm/s^2'),
      new Measurement(0.1524, 'm'),
      new Measurement(23.0771, 'm/s'),
    );

    expect(result).toMatchSnapshot();
  });
});

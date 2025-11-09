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

    expect(result.samples.length).toBe(4);

    // Specific values for profile properties
    expect(result.aLim.to('m/s^2').scalar).toBeCloseTo(49.471, 3);
    expect(result.aStop.to('m/s^2').scalar).toBeCloseTo(29.851, 3);
    expect(result.vLim.to('m/s').scalar).toBeCloseTo(13.545, 3);
    expect(result.vFree.to('m/s').scalar).toBeCloseTo(15.794, 3);

    // First sample should start at t=0, x=0, v=0
    const firstSample = result.samples[0];
    expect(firstSample.t.to('s').scalar).toBe(0);
    expect(firstSample.x.to('m').scalar).toBe(0);
    expect(firstSample.v.to('m/s').scalar).toBe(0);

    // Last sample should meet stopAtVelocity condition
    const lastSample = result.samples[result.samples.length - 1];
    expect(lastSample.t.to('s').scalar).toBeCloseTo(0.03, 3);
    expect(lastSample.x.to('m').scalar).toBeCloseTo(0.022, 3);
    expect(lastSample.v.to('m/s').scalar).toBeCloseTo(1.484, 3);
    expect(lastSample.v.to('m/s').scalar).toBeGreaterThanOrEqual(
      stopAtVelocity.to('m/s').scalar,
    );

    // Samples should be in chronological order
    for (let i = 1; i < result.samples.length; i++) {
      expect(result.samples[i].t.to('s').scalar).toBeGreaterThan(
        result.samples[i - 1].t.to('s').scalar,
      );
      expect(result.samples[i].x.to('m').scalar).toBeGreaterThanOrEqual(
        result.samples[i - 1].x.to('m').scalar,
      );
    }
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

    expect(result.samples.length).toBeGreaterThan(0);
    const firstSample = result.samples[0];
    expect(firstSample.t.to('s').scalar).toBe(0);
    expect(firstSample.x.to('m').scalar).toBeCloseTo(0, 3);
    expect(firstSample.v.to('m/s').scalar).toBeCloseTo(0, 3);

    // With zero target distance, it may stop at target distance or velocity threshold
    const lastSample = result.samples[result.samples.length - 1];
    expect(lastSample.x.to('m').scalar).toBeGreaterThanOrEqual(0);
    expect(lastSample.v.to('m/s').scalar).toBeGreaterThanOrEqual(0);
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

    expect(result.samples.length).toBeGreaterThan(0);

    // aLim should be defined
    expect(result.aLim.to('m/s^2').scalar).toBeDefined();

    // First sample should start at zero
    const firstSample = result.samples[0];
    expect(firstSample.t.to('s').scalar).toBe(0);
    expect(firstSample.x.to('m').scalar).toBeCloseTo(0, 3);
    expect(firstSample.v.to('m/s').scalar).toBeCloseTo(0, 3);

    // Should stop at velocity threshold
    const lastSample = result.samples[result.samples.length - 1];
    expect(lastSample.v.to('m/s').scalar).toBeGreaterThanOrEqual(
      stopAtVelocity.to('m/s').scalar,
    );
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

    expect(result.samples.length).toBeGreaterThan(0);

    // aLim should be defined
    expect(result.aLim.to('m/s^2').scalar).toBeDefined();

    // First sample should start at zero
    const firstSample = result.samples[0];
    expect(firstSample.t.to('s').scalar).toBe(0);
    expect(firstSample.x.to('m').scalar).toBeCloseTo(0, 3);
    expect(firstSample.v.to('m/s').scalar).toBeCloseTo(0, 3);

    // Should stop at velocity threshold
    const lastSample = result.samples[result.samples.length - 1];
    expect(lastSample.v.to('m/s').scalar).toBeGreaterThanOrEqual(
      stopAtVelocity.to('m/s').scalar,
    );
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

    expect(result.samples.length).toBeGreaterThan(0);
    const lastSample = result.samples[result.samples.length - 1];
    expect(lastSample.v.to('m/s').scalar).toBeGreaterThanOrEqual(
      stopAtVelocity.to('m/s').scalar,
    );

    // First sample should start at zero
    const firstSample = result.samples[0];
    expect(firstSample.t.to('s').scalar).toBe(0);
    expect(firstSample.x.to('m').scalar).toBeCloseTo(0, 3);
    expect(firstSample.v.to('m/s').scalar).toBeCloseTo(0, 3);

    // Velocity should increase over time
    expect(lastSample.v.to('m/s').scalar).toBeGreaterThan(
      firstSample.v.to('m/s').scalar,
    );
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

    expect(result.samples.length).toBeGreaterThan(0);

    // First sample should start at zero
    const firstSample = result.samples[0];
    expect(firstSample.t.to('s').scalar).toBe(0);
    expect(firstSample.x.to('m').scalar).toBeCloseTo(0, 3);
    expect(firstSample.v.to('m/s').scalar).toBeCloseTo(0, 3);

    // Last sample should reach or exceed target distance
    const lastSample = result.samples[result.samples.length - 1];
    expect(lastSample.x.to('m').scalar).toBeGreaterThanOrEqual(
      targetDistance.to('m').scalar * 0.9,
    );
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

    expect(result.samples.length).toBeGreaterThan(0);

    // First sample should start at zero
    const firstSample = result.samples[0];
    expect(firstSample.t.to('s').scalar).toBe(0);
    expect(firstSample.x.to('m').scalar).toBeCloseTo(0, 3);
    expect(firstSample.v.to('m/s').scalar).toBeCloseTo(0, 3);

    // Should stop at velocity threshold
    const lastSample = result.samples[result.samples.length - 1];
    expect(lastSample.v.to('m/s').scalar).toBeGreaterThanOrEqual(
      stopAtVelocity.to('m/s').scalar,
    );
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

    expect(result.samples.length).toBeGreaterThan(0);

    // First sample should start at zero
    const firstSample = result.samples[0];
    expect(firstSample.t.to('s').scalar).toBe(0);
    expect(firstSample.x.to('m').scalar).toBeCloseTo(0, 3);
    expect(firstSample.v.to('m/s').scalar).toBeCloseTo(0, 3);

    // Should stop at velocity threshold
    const lastSample = result.samples[result.samples.length - 1];
    expect(lastSample.v.to('m/s').scalar).toBeGreaterThanOrEqual(
      stopAtVelocity.to('m/s').scalar,
    );

    // Position should increase over time
    expect(lastSample.x.to('m').scalar).toBeGreaterThan(
      firstSample.x.to('m').scalar,
    );
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

    expect(result1.samples.length).toBeGreaterThan(0);
    expect(result2.samples.length).toBeGreaterThan(0);

    // Specific values for different ratios
    expect(result1.aLim.to('m/s^2').scalar).toBeCloseTo(29.64, 3);
    expect(result2.aLim.to('m/s^2').scalar).toBeCloseTo(89.132, 3);

    // Higher ratio should produce higher acceleration limit
    expect(result2.aLim.to('m/s^2').scalar).toBeGreaterThan(
      result1.aLim.to('m/s^2').scalar,
    );

    // Both should start at zero
    expect(result1.samples[0].t.to('s').scalar).toBe(0);
    expect(result1.samples[0].x.to('m').scalar).toBe(0);
    expect(result2.samples[0].t.to('s').scalar).toBe(0);
    expect(result2.samples[0].x.to('m').scalar).toBe(0);
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

    expect(result1.samples.length).toBeGreaterThan(0);
    expect(result2.samples.length).toBeGreaterThan(0);

    // Specific values for different masses
    expect(result1.aLim.to('m/s^2').scalar).toBeCloseTo(89.132, 3);
    expect(result2.aLim.to('m/s^2').scalar).toBeCloseTo(29.64, 3);

    // Lower mass should produce higher acceleration limit
    expect(result1.aLim.to('m/s^2').scalar).toBeGreaterThan(
      result2.aLim.to('m/s^2').scalar,
    );

    // Both should start at zero
    expect(result1.samples[0].t.to('s').scalar).toBe(0);
    expect(result1.samples[0].x.to('m').scalar).toBe(0);
    expect(result2.samples[0].t.to('s').scalar).toBe(0);
    expect(result2.samples[0].x.to('m').scalar).toBe(0);
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

    expect(result.samples.length).toBeGreaterThan(0);

    // aLim should be defined
    expect(result.aLim.to('m/s^2').scalar).toBeDefined();

    // First sample should start at zero
    const firstSample = result.samples[0];
    expect(firstSample.t.to('s').scalar).toBe(0);
    expect(firstSample.x.to('m').scalar).toBeCloseTo(0, 3);
    expect(firstSample.v.to('m/s').scalar).toBeCloseTo(0, 3);

    // Should stop at velocity threshold
    const lastSample = result.samples[result.samples.length - 1];
    expect(lastSample.v.to('m/s').scalar).toBeGreaterThanOrEqual(
      stopAtVelocity.to('m/s').scalar,
    );
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

    expect(result.samples.length).toBeGreaterThan(0);

    // aLim should be defined
    expect(result.aLim.to('m/s^2').scalar).toBeDefined();

    // First sample should start at zero
    const firstSample = result.samples[0];
    expect(firstSample.t.to('s').scalar).toBe(0);
    expect(firstSample.x.to('m').scalar).toBeCloseTo(0, 3);
    expect(firstSample.v.to('m/s').scalar).toBeCloseTo(0, 3);

    // Should stop at velocity threshold
    const lastSample = result.samples[result.samples.length - 1];
    expect(lastSample.v.to('m/s').scalar).toBeGreaterThanOrEqual(
      stopAtVelocity.to('m/s').scalar,
    );
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

    expect(result.samples.length).toBeGreaterThan(0);
    const sample = result.samples[0];
    expect(sample.t).toBeDefined();
    expect(sample.x).toBeDefined();
    expect(sample.v).toBeDefined();
    expect(sample.motorRPM).toBeDefined();
    expect(sample.current).toBeDefined();
    expect(sample.torque).toBeDefined();
    expect(sample.power).toBeDefined();
    expect(sample.efficiency).toBeDefined();

    // First sample should have specific values
    expect(sample.t.to('s').scalar).toBe(0);
    expect(sample.x.to('m').scalar).toBeCloseTo(0, 3);
    expect(sample.v.to('m/s').scalar).toBeCloseTo(0, 3);
    expect(sample.motorRPM.to('rpm').scalar).toBeCloseTo(0, 3);
    expect(sample.current.to('A').scalar).toBeGreaterThanOrEqual(0);
    expect(sample.torque.to('N*m').scalar).toBeGreaterThanOrEqual(0);
    expect(sample.power.to('W').scalar).toBeGreaterThanOrEqual(0);
    expect(sample.efficiency.scalar).toBeGreaterThanOrEqual(0);
    expect(sample.efficiency.scalar).toBeLessThanOrEqual(1);

    // All samples should have valid values
    for (const s of result.samples) {
      expect(s.t.to('s').scalar).toBeGreaterThanOrEqual(0);
      expect(s.x.to('m').scalar).toBeGreaterThanOrEqual(0);
      expect(s.v.to('m/s').scalar).toBeGreaterThanOrEqual(0);
      expect(s.motorRPM.to('rpm').scalar).toBeGreaterThanOrEqual(0);
      expect(s.current.to('A').scalar).toBeGreaterThanOrEqual(0);
      expect(s.torque.to('N*m').scalar).toBeGreaterThanOrEqual(0);
      expect(s.power.to('W').scalar).toBeGreaterThanOrEqual(0);
      expect(s.efficiency.scalar).toBeGreaterThanOrEqual(0);
      expect(s.efficiency.scalar).toBeLessThanOrEqual(1);
    }
  });
});

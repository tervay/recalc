import { describe, expect, it } from 'vitest';

import {
  convertAcrossDomains,
  metersPerMotorRotation,
  toLinear,
} from '~/lib/math/motorRotations';
import Measurement from '~/lib/models/Measurement';
import Ratio, { RatioType } from '~/lib/models/Ratio';

describe('metersPerMotorRotation', () => {
  it('is pi * spoolDiameter / ratio, in m/rotation', () => {
    const factor = metersPerMotorRotation(
      new Measurement(1, 'in'),
      new Ratio(2, RatioType.REDUCTION),
    );
    expect(factor?.to('m/rotation').scalar).toBeCloseTo(
      (Math.PI * 0.0254) / 2,
      9,
    );
  });

  it('uses the step-up ratio direction', () => {
    const factor = metersPerMotorRotation(
      new Measurement(1, 'in'),
      new Ratio(2, RatioType.STEP_UP),
    );
    expect(factor?.to('m/rotation').scalar).toBeCloseTo(
      Math.PI * 0.0254 * 2,
      9,
    );
  });

  it('is null when the spool diameter is zero', () => {
    expect(
      metersPerMotorRotation(
        new Measurement(0, 'in'),
        new Ratio(2, RatioType.REDUCTION),
      ),
    ).toBeNull();
  });

  it('is null when the ratio is zero', () => {
    expect(
      metersPerMotorRotation(
        new Measurement(1, 'in'),
        new Ratio(0, RatioType.REDUCTION),
      ),
    ).toBeNull();
  });
});

describe('convertAcrossDomains', () => {
  const factor = new Measurement((Math.PI * 0.0254) / 2, 'm/rotation');

  it('passes through a conversion within the same domain', () => {
    const result = convertAcrossDomains(
      new Measurement(1, 'm/s'),
      'ft/s',
      factor,
    );
    expect(result.scalar).toBeCloseTo(3.28084, 4);
  });

  it('converts linear velocity into motor rotations per second', () => {
    const result = convertAcrossDomains(
      new Measurement(2, 'm/s'),
      'rotation/s',
      factor,
    );
    expect(result.scalar).toBeCloseTo(50.12754, 4);
  });

  it('converts linear velocity into rpm', () => {
    const result = convertAcrossDomains(
      new Measurement(2, 'm/s'),
      'rpm',
      factor,
    );
    expect(result.scalar).toBeCloseTo(3007.65246, 3);
  });

  it('converts motor rotations per second back into linear velocity', () => {
    const result = convertAcrossDomains(
      new Measurement(50.12754, 'rotation/s'),
      'm/s',
      factor,
    );
    expect(result.scalar).toBeCloseTo(2, 4);
  });

  it('converts linear acceleration into motor rotations per second squared', () => {
    const result = convertAcrossDomains(
      new Measurement(10, 'm/s^2'),
      'rotation/s^2',
      factor,
    );
    expect(result.scalar).toBeCloseTo(250.63771, 3);
  });

  it('converts linear kV into volts per motor rotation per second', () => {
    const result = convertAcrossDomains(
      new Measurement(3, 'V*s/m'),
      'V*s/rotation',
      factor,
    );
    expect(result.scalar).toBeCloseTo(0.11969, 4);
  });

  it('converts linear kA into motor-rotation units', () => {
    const result = convertAcrossDomains(
      new Measurement(3, 'V*s^2/m'),
      'V*s^2/rotation',
      factor,
    );
    expect(result.scalar).toBeCloseTo(0.11969, 4);
  });

  it('converts linear kP into motor-rotation units', () => {
    const result = convertAcrossDomains(
      new Measurement(3, 'V/m'),
      'V/rotation',
      factor,
    );
    expect(result.scalar).toBeCloseTo(0.11969, 4);
  });

  it('round-trips a gain through motor-rotation units and back', () => {
    const original = new Measurement(2.5, 'V*s/m');
    const rotational = convertAcrossDomains(original, 'V*s/rotation', factor);
    const back = convertAcrossDomains(rotational, 'V*s/m', factor);
    expect(back.scalar).toBeCloseTo(2.5, 9);
  });
});

describe('toLinear', () => {
  const factor = new Measurement((Math.PI * 0.0254) / 2, 'm/rotation');

  it('passes a value that is already linear straight through', () => {
    const result = toLinear(new Measurement(2, 'm/s'), 'm/s', factor);
    expect(result.scalar).toBeCloseTo(2, 9);
  });

  it('converts a rotational value into the linear unit', () => {
    const result = toLinear(
      new Measurement(50.12754, 'rotation/s'),
      'm/s',
      factor,
    );
    expect(result.scalar).toBeCloseTo(2, 4);
  });

  it('returns zero in the linear unit when the factor is null', () => {
    const result = toLinear(new Measurement(50, 'rotation/s'), 'm/s', null);
    expect(result.scalar).toBe(0);
    expect(result.units()).toBe('m/s');
  });

  it('still passes a linear value through when the factor is null', () => {
    const result = toLinear(new Measurement(2, 'm/s'), 'm/s', null);
    expect(result.scalar).toBeCloseTo(2, 9);
  });
});

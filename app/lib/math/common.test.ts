import { describe, expect, it } from 'vitest';

import { supplyLimitToStatorLimit } from '~/lib/math/common';
import Measurement from '~/lib/models/Measurement';

describe('supplyLimitToStatorLimit', () => {
  it('calculates stator limit correctly', () => {
    const supplyLimit = new Measurement(100, 'A');
    const supplyVoltage = new Measurement(12, 'V');
    const statorVoltage = new Measurement(12, 'V');

    const result = supplyLimitToStatorLimit({
      supplyLimit,
      supplyVoltage,
      statorVoltage,
    });

    expect(result.to('A').scalar).toBeCloseTo(100.0, 3);
  });

  it('handles different voltages correctly', () => {
    const supplyLimit = new Measurement(100, 'A');
    const supplyVoltage = new Measurement(12, 'V');
    const statorVoltage = new Measurement(6, 'V');

    const result = supplyLimitToStatorLimit({
      supplyLimit,
      supplyVoltage,
      statorVoltage,
    });

    expect(result.to('A').scalar).toBeCloseTo(200.0, 3);
  });

  it('handles zero stator voltage (divide by zero)', () => {
    const supplyLimit = new Measurement(100, 'A');
    const supplyVoltage = new Measurement(12, 'V');
    const statorVoltage = new Measurement(0, 'V');

    const result = supplyLimitToStatorLimit({
      supplyLimit,
      supplyVoltage,
      statorVoltage,
    });

    expect(result.to('A').scalar).toBe(0);
  });

  it('handles zero supply limit', () => {
    const supplyLimit = new Measurement(0, 'A');
    const supplyVoltage = new Measurement(12, 'V');
    const statorVoltage = new Measurement(12, 'V');

    const result = supplyLimitToStatorLimit({
      supplyLimit,
      supplyVoltage,
      statorVoltage,
    });

    expect(result.to('A').scalar).toBe(0);
  });

  it('handles zero supply voltage', () => {
    const supplyLimit = new Measurement(100, 'A');
    const supplyVoltage = new Measurement(0, 'V');
    const statorVoltage = new Measurement(12, 'V');

    const result = supplyLimitToStatorLimit({
      supplyLimit,
      supplyVoltage,
      statorVoltage,
    });

    expect(result.to('A').scalar).toBe(0);
  });

  it('handles all zero values', () => {
    const supplyLimit = new Measurement(0, 'A');
    const supplyVoltage = new Measurement(0, 'V');
    const statorVoltage = new Measurement(0, 'V');

    const result = supplyLimitToStatorLimit({
      supplyLimit,
      supplyVoltage,
      statorVoltage,
    });

    expect(result.to('A').scalar).toBe(0);
  });

  it('handles step-up voltage scenario', () => {
    const supplyLimit = new Measurement(50, 'A');
    const supplyVoltage = new Measurement(6, 'V');
    const statorVoltage = new Measurement(12, 'V');

    const result = supplyLimitToStatorLimit({
      supplyLimit,
      supplyVoltage,
      statorVoltage,
    });

    expect(result.to('A').scalar).toBeCloseTo(25.0, 3);
  });

  it('handles very small voltages', () => {
    const supplyLimit = new Measurement(100, 'A');
    const supplyVoltage = new Measurement(0.001, 'V');
    const statorVoltage = new Measurement(12, 'V');

    const result = supplyLimitToStatorLimit({
      supplyLimit,
      supplyVoltage,
      statorVoltage,
    });

    expect(result.to('A').scalar).toBeCloseTo(0.008, 3);
  });

  it('handles very large voltages', () => {
    const supplyLimit = new Measurement(100, 'A');
    const supplyVoltage = new Measurement(120, 'V');
    const statorVoltage = new Measurement(12, 'V');

    const result = supplyLimitToStatorLimit({
      supplyLimit,
      supplyVoltage,
      statorVoltage,
    });

    expect(result.to('A').scalar).toBeCloseTo(1000.0, 3);
  });
});

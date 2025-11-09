import { describe, expect, it } from 'vitest';

import { calculateKa, calculateKg, calculateKv } from '~/lib/math/kVkA';
import Measurement from '~/lib/models/Measurement';

describe('calculateKv', () => {
  it('calculates Kv correctly', () => {
    const maxSpeed = new Measurement(100, 'rpm');
    const radius = new Measurement(2, 'in');

    const result = calculateKv(maxSpeed, radius);

    expect(result.scalar).toBeCloseTo(0.06, 3);
  });

  it('handles zero maxSpeed', () => {
    const maxSpeed = new Measurement(0, 'rpm');
    const radius = new Measurement(2, 'in');

    const result = calculateKv(maxSpeed, radius);

    expect(result.scalar).toBe(0);
  });

  it('handles zero radius', () => {
    const maxSpeed = new Measurement(100, 'rpm');
    const radius = new Measurement(0, 'in');

    const result = calculateKv(maxSpeed, radius);

    expect(result.scalar).toBe(0);
  });

  it('handles both zero values', () => {
    const maxSpeed = new Measurement(0, 'rpm');
    const radius = new Measurement(0, 'in');

    const result = calculateKv(maxSpeed, radius);

    expect(result.scalar).toBe(0);
  });

  it('handles radius with radians', () => {
    const maxSpeed = new Measurement(100, 'rad/s');
    const radius = new Measurement(2, 'in');

    const result = calculateKv(maxSpeed, radius);

    expect(result.scalar).toBeCloseTo(0.06, 3);
  });

  it('handles different units', () => {
    const maxSpeed = new Measurement(100, 'ft/s');
    const radius = new Measurement(2, 'ft');

    const result = calculateKv(maxSpeed, radius);

    expect(result.scalar).toBeCloseTo(0.06, 3);
  });

  it('handles very small values', () => {
    const maxSpeed = new Measurement(0.001, 'rpm');
    const radius = new Measurement(0.001, 'in');

    const result = calculateKv(maxSpeed, radius);

    expect(result.scalar).toBeCloseTo(12000000.0, 3);
  });

  it('handles very large values', () => {
    const maxSpeed = new Measurement(10000, 'rpm');
    const radius = new Measurement(10, 'in');

    const result = calculateKv(maxSpeed, radius);

    expect(result.scalar).toBeCloseTo(0.00012, 3);
  });
});

describe('calculateKa', () => {
  it('calculates Ka correctly', () => {
    const stallTorque = new Measurement(10, 'N*m');
    const radius = new Measurement(2, 'in');
    const mass = new Measurement(10, 'kg');

    const result = calculateKa(stallTorque, radius, mass);

    expect(result.scalar).toBeCloseTo(24.0, 3);
  });

  it('handles zero stallTorque', () => {
    const stallTorque = new Measurement(0, 'N*m');
    const radius = new Measurement(2, 'in');
    const mass = new Measurement(10, 'kg');

    const result = calculateKa(stallTorque, radius, mass);

    expect(result.scalar).toBe(0);
  });

  it('handles zero radius', () => {
    const stallTorque = new Measurement(10, 'N*m');
    const radius = new Measurement(0, 'in');
    const mass = new Measurement(10, 'kg');

    const result = calculateKa(stallTorque, radius, mass);

    expect(result.scalar).toBe(0);
  });

  it('handles zero mass', () => {
    const stallTorque = new Measurement(10, 'N*m');
    const radius = new Measurement(2, 'in');
    const mass = new Measurement(0, 'kg');

    const result = calculateKa(stallTorque, radius, mass);

    expect(result.scalar).toBe(0);
  });

  it('handles all zero values', () => {
    const stallTorque = new Measurement(0, 'N*m');
    const radius = new Measurement(0, 'in');
    const mass = new Measurement(0, 'kg');

    const result = calculateKa(stallTorque, radius, mass);

    expect(result.scalar).toBe(0);
  });

  it('handles radius with radians', () => {
    const stallTorque = new Measurement(10, 'N*m');
    const radius = new Measurement(2, 'rad');
    const mass = new Measurement(10, 'kg');

    const result = calculateKa(stallTorque, radius, mass);

    expect(result.scalar).toBeCloseTo(24.0, 3);
  });

  it('handles very small values', () => {
    const stallTorque = new Measurement(0.001, 'N*m');
    const radius = new Measurement(0.001, 'in');
    const mass = new Measurement(0.001, 'kg');

    const result = calculateKa(stallTorque, radius, mass);

    expect(result.scalar).toBeCloseTo(0.012, 3);
  });

  it('handles very large values', () => {
    const stallTorque = new Measurement(1000, 'N*m');
    const radius = new Measurement(10, 'in');
    const mass = new Measurement(1000, 'kg');

    const result = calculateKa(stallTorque, radius, mass);

    expect(result.scalar).toBeCloseTo(120.0, 3);
  });
});

describe('calculateKg', () => {
  it('calculates Kg correctly', () => {
    const stallTorque = new Measurement(10, 'N*m');
    const radius = new Measurement(2, 'in');
    const mass = new Measurement(10, 'kg');

    const result = calculateKg(stallTorque, radius, mass);

    expect(result.scalar).toBeCloseTo(24.0, 3);
  });

  it('handles zero stallTorque', () => {
    const stallTorque = new Measurement(0, 'N*m');
    const radius = new Measurement(2, 'in');
    const mass = new Measurement(10, 'kg');

    const result = calculateKg(stallTorque, radius, mass);

    expect(result.scalar).toBe(0);
  });

  it('handles zero radius', () => {
    const stallTorque = new Measurement(10, 'N*m');
    const radius = new Measurement(0, 'in');
    const mass = new Measurement(10, 'kg');

    const result = calculateKg(stallTorque, radius, mass);

    expect(result.scalar).toBe(0);
  });

  it('handles zero mass', () => {
    const stallTorque = new Measurement(10, 'N*m');
    const radius = new Measurement(2, 'in');
    const mass = new Measurement(0, 'kg');

    const result = calculateKg(stallTorque, radius, mass);

    expect(result.scalar).toBe(0);
  });

  it('handles all zero values', () => {
    const stallTorque = new Measurement(0, 'N*m');
    const radius = new Measurement(0, 'in');
    const mass = new Measurement(0, 'kg');

    const result = calculateKg(stallTorque, radius, mass);

    expect(result.scalar).toBe(0);
  });

  it('handles very small values', () => {
    const stallTorque = new Measurement(0.001, 'N*m');
    const radius = new Measurement(0.001, 'in');
    const mass = new Measurement(0.001, 'kg');

    const result = calculateKg(stallTorque, radius, mass);

    expect(result.scalar).toBeCloseTo(0.012, 3);
  });

  it('handles very large values', () => {
    const stallTorque = new Measurement(1000, 'N*m');
    const radius = new Measurement(10, 'in');
    const mass = new Measurement(1000, 'kg');

    const result = calculateKg(stallTorque, radius, mass);

    expect(result.scalar).toBeCloseTo(120.0, 3);
  });

  it('handles different mass values', () => {
    const stallTorque = new Measurement(10, 'N*m');
    const radius = new Measurement(2, 'in');
    const mass1 = new Measurement(5, 'kg');
    const mass2 = new Measurement(20, 'kg');

    const result1 = calculateKg(stallTorque, radius, mass1);
    const result2 = calculateKg(stallTorque, radius, mass2);

    expect(result1.scalar).toBeCloseTo(12.0, 3);
    expect(result2.scalar).toBeCloseTo(48.0, 3);
    expect(result2.scalar).toBeGreaterThan(result1.scalar);
  });
});

import { describe, expect, it } from 'vitest';

import {
  calculateKa,
  calculateKg,
  calculateKv,
  calculateLinearFeedforwardKa,
  calculateLinearFeedforwardKg,
  calculateLinearFeedforwardKv,
  calculateLinearSupplyLimitedMaxVelocity,
} from '~/lib/math/kVkA';
import Measurement from '~/lib/models/Measurement';
import Motor from '~/lib/models/Motor';
import Ratio, { RatioType } from '~/lib/models/Ratio';

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

describe('calculateLinearFeedforwardKv', () => {
  it('returns correct units', () => {
    const motor = Motor.KrakenX60sFOC(1);
    const ratio = new Ratio(4, RatioType.REDUCTION);
    const spoolRadius = new Measurement(0.5, 'in');
    const result = calculateLinearFeedforwardKv(motor, ratio, spoolRadius, 1.0);
    expect(result.units()).toContain('V');
  });

  it('scales linearly with gearing', () => {
    const motor = Motor.KrakenX60sFOC(1);
    const spoolRadius = new Measurement(1, 'in');
    const r1 = calculateLinearFeedforwardKv(
      motor,
      new Ratio(2, RatioType.REDUCTION),
      spoolRadius,
      1.0,
    );
    const r2 = calculateLinearFeedforwardKv(
      motor,
      new Ratio(4, RatioType.REDUCTION),
      spoolRadius,
      1.0,
    );
    expect(r2.to('V*s/m').scalar).toBeCloseTo(r1.to('V*s/m').scalar * 2, 5);
  });

  it('scales inversely with spoolRadius', () => {
    const motor = Motor.KrakenX60sFOC(1);
    const ratio = new Ratio(4, RatioType.REDUCTION);
    const r1 = calculateLinearFeedforwardKv(
      motor,
      ratio,
      new Measurement(1, 'in'),
      1.0,
    );
    const r2 = calculateLinearFeedforwardKv(
      motor,
      ratio,
      new Measurement(2, 'in'),
      1.0,
    );
    expect(r2.to('V*s/m').scalar).toBeCloseTo(r1.to('V*s/m').scalar / 2, 5);
  });

  it('scales inversely with efficiency', () => {
    const motor = Motor.KrakenX60sFOC(1);
    const ratio = new Ratio(4, RatioType.REDUCTION);
    const spoolRadius = new Measurement(1, 'in');
    const r1 = calculateLinearFeedforwardKv(motor, ratio, spoolRadius, 1.0);
    const r2 = calculateLinearFeedforwardKv(motor, ratio, spoolRadius, 0.5);
    expect(r2.to('V*s/m').scalar).toBeCloseTo(r1.to('V*s/m').scalar * 2, 5);
  });

  it('returns zero when gearing is zero', () => {
    const motor = Motor.KrakenX60sFOC(1);
    const result = calculateLinearFeedforwardKv(
      motor,
      new Ratio(0, RatioType.REDUCTION),
      new Measurement(1, 'in'),
      1.0,
    );
    expect(result.scalar).toBe(0);
  });

  it('returns zero when spoolRadius is zero', () => {
    const motor = Motor.KrakenX60sFOC(1);
    const result = calculateLinearFeedforwardKv(
      motor,
      new Ratio(4, RatioType.REDUCTION),
      new Measurement(0, 'in'),
      1.0,
    );
    expect(result.scalar).toBe(0);
  });

  it('returns zero when efficiency is zero', () => {
    const motor = Motor.KrakenX60sFOC(1);
    const result = calculateLinearFeedforwardKv(
      motor,
      new Ratio(4, RatioType.REDUCTION),
      new Measurement(1, 'in'),
      0,
    );
    expect(result.scalar).toBe(0);
  });
});

describe('calculateLinearFeedforwardKa', () => {
  it('returns correct units', () => {
    const motor = Motor.KrakenX60sFOC(1);
    const ratio = new Ratio(4, RatioType.REDUCTION);
    const spoolRadius = new Measurement(0.5, 'in');
    const load = new Measurement(10, 'lb');
    const result = calculateLinearFeedforwardKa(
      motor,
      ratio,
      spoolRadius,
      load,
      1.0,
    );
    expect(result.units()).toContain('V');
  });

  it('scales linearly with load', () => {
    const motor = Motor.KrakenX60sFOC(1);
    const ratio = new Ratio(4, RatioType.REDUCTION);
    const spoolRadius = new Measurement(1, 'in');
    const r1 = calculateLinearFeedforwardKa(
      motor,
      ratio,
      spoolRadius,
      new Measurement(10, 'kg'),
      1.0,
    );
    const r2 = calculateLinearFeedforwardKa(
      motor,
      ratio,
      spoolRadius,
      new Measurement(20, 'kg'),
      1.0,
    );
    expect(r2.to('V*s^2/m').scalar).toBeCloseTo(r1.to('V*s^2/m').scalar * 2, 5);
  });

  it('scales inversely with gearing', () => {
    const motor = Motor.KrakenX60sFOC(1);
    const spoolRadius = new Measurement(1, 'in');
    const load = new Measurement(10, 'kg');
    const r1 = calculateLinearFeedforwardKa(
      motor,
      new Ratio(2, RatioType.REDUCTION),
      spoolRadius,
      load,
      1.0,
    );
    const r2 = calculateLinearFeedforwardKa(
      motor,
      new Ratio(4, RatioType.REDUCTION),
      spoolRadius,
      load,
      1.0,
    );
    expect(r2.to('V*s^2/m').scalar).toBeCloseTo(r1.to('V*s^2/m').scalar / 2, 5);
  });

  it('returns zero when gearing is zero', () => {
    const motor = Motor.KrakenX60sFOC(1);
    const result = calculateLinearFeedforwardKa(
      motor,
      new Ratio(0, RatioType.REDUCTION),
      new Measurement(1, 'in'),
      new Measurement(10, 'kg'),
      1.0,
    );
    expect(result.scalar).toBe(0);
  });

  it('returns zero when efficiency is zero', () => {
    const motor = Motor.KrakenX60sFOC(1);
    const result = calculateLinearFeedforwardKa(
      motor,
      new Ratio(4, RatioType.REDUCTION),
      new Measurement(1, 'in'),
      new Measurement(10, 'kg'),
      0,
    );
    expect(result.scalar).toBe(0);
  });

  it('multi-motor: R_eff halves with 2 motors so kA halves', () => {
    const motor1 = Motor.KrakenX60sFOC(1);
    const motor2 = Motor.KrakenX60sFOC(2);
    const ratio = new Ratio(4, RatioType.REDUCTION);
    const spoolRadius = new Measurement(1, 'in');
    const load = new Measurement(10, 'kg');
    const r1 = calculateLinearFeedforwardKa(
      motor1,
      ratio,
      spoolRadius,
      load,
      1.0,
    );
    const r2 = calculateLinearFeedforwardKa(
      motor2,
      ratio,
      spoolRadius,
      load,
      1.0,
    );
    expect(r2.to('V*s^2/m').scalar).toBeCloseTo(r1.to('V*s^2/m').scalar / 2, 5);
  });
});

describe('calculateLinearFeedforwardKg', () => {
  it('returns zero at horizontal (angle = 0)', () => {
    const kA = new Measurement(0.5, 'V*s^2/m');
    const result = calculateLinearFeedforwardKg(kA, new Measurement(0, 'deg'));
    expect(result.scalar).toBeCloseTo(0, 10);
  });

  it('returns kA * 9.80665 at vertical (angle = 90 deg)', () => {
    const kA = new Measurement(0.5, 'V*s^2/m');
    const result = calculateLinearFeedforwardKg(kA, new Measurement(90, 'deg'));
    expect(result.to('V').scalar).toBeCloseTo(0.5 * 9.80665, 5);
  });

  it('returns kA * 9.80665 * sin(45) at 45 degrees', () => {
    const kA = new Measurement(1.0, 'V*s^2/m');
    const result = calculateLinearFeedforwardKg(kA, new Measurement(45, 'deg'));
    expect(result.to('V').scalar).toBeCloseTo(
      9.80665 * Math.sin(Math.PI / 4),
      5,
    );
  });

  it('scales linearly with kA', () => {
    const angle = new Measurement(60, 'deg');
    const r1 = calculateLinearFeedforwardKg(
      new Measurement(1, 'V*s^2/m'),
      angle,
    );
    const r2 = calculateLinearFeedforwardKg(
      new Measurement(2, 'V*s^2/m'),
      angle,
    );
    expect(r2.to('V').scalar).toBeCloseTo(r1.to('V').scalar * 2, 5);
  });
});

describe('calculateLinearSupplyLimitedMaxVelocity', () => {
  // Helper: build kV and kG for Kraken X60 FOC, 2:1, 1in spool, 15 lb, 90 deg
  function buildParams(efficiency = 1.0) {
    const motor = Motor.KrakenX60sFOC(1);
    const ratio = new Ratio(2, RatioType.REDUCTION);
    const spoolRadius = new Measurement(0.5, 'in');
    const load = new Measurement(15, 'lb');
    const kV = calculateLinearFeedforwardKv(
      motor,
      ratio,
      spoolRadius,
      efficiency,
    );
    const kA = calculateLinearFeedforwardKa(
      motor,
      ratio,
      spoolRadius,
      load,
      efficiency,
    );
    const kG = calculateLinearFeedforwardKg(kA, new Measurement(90, 'deg'));
    return { motor, kV, kG };
  }

  it('returns ~1.62 m/s for the bug-report params (10A supply limit)', () => {
    const { motor, kV, kG } = buildParams();
    const result = calculateLinearSupplyLimitedMaxVelocity(
      kV,
      kG,
      new Measurement(10, 'A'),
      motor.resistance,
      new Measurement(12, 'V'),
      1.0,
    );
    expect(result.to('m/s').scalar).toBeCloseTo(1.622, 2);
  });

  it('returns unconstrained-sentinel (> 1000 m/s) when kG = 0 (horizontal mechanism)', () => {
    const motor = Motor.KrakenX60sFOC(1);
    const ratio = new Ratio(2, RatioType.REDUCTION);
    const spoolRadius = new Measurement(0.5, 'in');
    const kV = calculateLinearFeedforwardKv(motor, ratio, spoolRadius, 1.0);
    const kG = new Measurement(0, 'V');
    const result = calculateLinearSupplyLimitedMaxVelocity(
      kV,
      kG,
      new Measurement(10, 'A'),
      motor.resistance,
      new Measurement(12, 'V'),
      1.0,
    );
    expect(result.to('m/s').scalar).toBeGreaterThan(1000);
  });

  it('returns unconstrained-sentinel (> 1000 m/s) when kV = 0', () => {
    const kV = new Measurement(0, 'V*s/m');
    const kG = new Measurement(0.5, 'V');
    const result = calculateLinearSupplyLimitedMaxVelocity(
      kV,
      kG,
      new Measurement(10, 'A'),
      new Measurement(0.025, 'Ohm'),
      new Measurement(12, 'V'),
      1.0,
    );
    expect(result.to('m/s').scalar).toBeGreaterThan(1000);
  });

  it('increasing supply limit increases max velocity', () => {
    const { motor, kV, kG } = buildParams();
    const vSupply = new Measurement(12, 'V');
    const low = calculateLinearSupplyLimitedMaxVelocity(
      kV,
      kG,
      new Measurement(10, 'A'),
      motor.resistance,
      vSupply,
      1.0,
    );
    const high = calculateLinearSupplyLimitedMaxVelocity(
      kV,
      kG,
      new Measurement(60, 'A'),
      motor.resistance,
      vSupply,
      1.0,
    );
    expect(high.to('m/s').scalar).toBeGreaterThan(low.to('m/s').scalar);
  });

  it('η = 0.9 gives lower max velocity than η = 1 for same supply limit', () => {
    const motor = Motor.KrakenX60sFOC(1);
    const ratio = new Ratio(2, RatioType.REDUCTION);
    const spoolRadius = new Measurement(0.5, 'in');
    const load = new Measurement(15, 'lb');
    const vSupply = new Measurement(12, 'V');
    const iSupply = new Measurement(10, 'A');

    function getVMax(eta: number) {
      const kV = calculateLinearFeedforwardKv(motor, ratio, spoolRadius, eta);
      const kA = calculateLinearFeedforwardKa(
        motor,
        ratio,
        spoolRadius,
        load,
        eta,
      );
      const kG = calculateLinearFeedforwardKg(kA, new Measurement(90, 'deg'));
      return calculateLinearSupplyLimitedMaxVelocity(
        kV,
        kG,
        iSupply,
        motor.resistance,
        vSupply,
        eta,
      );
    }

    const v1 = getVMax(1.0);
    const v09 = getVMax(0.9);
    expect(v09.to('m/s').scalar).toBeLessThan(v1.to('m/s').scalar);
  });
});

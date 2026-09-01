import { describe, expect, it } from 'vitest';

import { calculateLinearSupplyLimitedMaxVelocity } from '~/lib/math/kVkA';
import Measurement from '~/lib/models/Measurement';
import Motor from '~/lib/models/Motor';
import Ratio, { RatioType } from '~/lib/models/Ratio';

describe('calculateLinearSupplyLimitedMaxVelocity', () => {
  // Build kV/kG for Kraken X60 FOC, 2:1, 1in spool, 15 lb, 90 deg, inlining
  // the (now C++/WASM-owned) linear feedforward formulas so this test can
  // exercise calculateLinearSupplyLimitedMaxVelocity in isolation:
  //   kV = gearing / (efficiency * Kv_motor * spoolRadius)
  //   kA = load * spoolRadius * R_eff / (efficiency * Kt * gearing)
  //   kG = kA * (-9.80665) * sin(angle)
  function buildParams(efficiency = 1.0) {
    const motor = Motor.KrakenX60sFOC(1);
    const ratio = new Ratio(2, RatioType.REDUCTION);
    const spoolRadius = new Measurement(0.5, 'in');
    const load = new Measurement(15, 'lb');
    const angle = new Measurement(90, 'deg');
    const rEff = motor.resistance.div(motor.quantity);

    const kV = new Measurement(ratio.asNumber())
      .div(efficiency)
      .div(motor.kV.removeRad())
      .div(spoolRadius);
    const kA = load
      .mul(spoolRadius)
      .mul(rEff)
      .div(motor.kT)
      .div(ratio.asNumber())
      .div(efficiency);
    const kG = kA
      .mul(Measurement.GRAVITY.negate())
      .mul(Math.sin(angle.to('rad').scalar));

    return { motor, kV, kG };
  }

  it('returns ~1.64 m/s for the bug-report params (10A supply limit)', () => {
    const { motor, kV, kG } = buildParams();
    const result = calculateLinearSupplyLimitedMaxVelocity(
      kV,
      kG,
      new Measurement(10, 'A'),
      motor.resistance,
      new Measurement(12, 'V'),
      1.0,
    );
    expect(result.to('m/s').scalar).toBeCloseTo(1.637, 2);
  });

  it('returns unconstrained-sentinel (> 1000 m/s) when kG = 0 (horizontal mechanism)', () => {
    const { motor, kV } = buildParams();
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

  it('returns a finite value when efficiency is passed out of the documented [0,1) range', () => {
    // Simulates a caller unit mixup (e.g. passing a percentage like 85 or a
    // doubled value instead of a 0-1 fraction). efficiency = 2 was computed
    // to drive disc = eta^2*kGSq + 4*(1-eta)*P negative (~-10.9) for these
    // kV/kG params, which previously caused Math.sqrt to return NaN.
    const { motor, kV, kG } = buildParams(1.0);
    const result = calculateLinearSupplyLimitedMaxVelocity(
      kV,
      kG,
      new Measurement(10, 'A'),
      motor.resistance,
      new Measurement(12, 'V'),
      2,
    );
    expect(Number.isFinite(result.to('m/s').scalar)).toBe(true);
  });

  it('η = 0.9 gives lower max velocity than η = 1 for same supply limit', () => {
    const vSupply = new Measurement(12, 'V');
    const iSupply = new Measurement(10, 'A');

    function getVMax(eta: number) {
      const { motor, kV, kG } = buildParams(eta);
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

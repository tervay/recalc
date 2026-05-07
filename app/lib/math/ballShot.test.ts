import { describe, expect, it } from 'vitest';

import { computeShotResult } from '~/lib/math/ballShot';
import Measurement from '~/lib/models/Measurement';

// Solid-sphere MOI helper: I = (2/5) * m * r^2
function solidSphereMoi(massKg: number, radiusM: number): Measurement {
  return new Measurement((2 / 5) * massKg * radiusM * radiusM, 'kg*m^2');
}

// Solid-disk MOI helper: I = (1/2) * m * r^2
function solidDiskMoi(massKg: number, radiusM: number): Measurement {
  return new Measurement(0.5 * massKg * radiusM * radiusM, 'kg*m^2');
}

const BASE_BALL_MASS = new Measurement(0.2268, 'kg');
const BASE_BALL_RADIUS = new Measurement(0.07506, 'm');
const BASE_BALL_MOI = solidSphereMoi(0.2268, 0.07506);
const BASE_SHOOTER_RADIUS = new Measurement(0.0508, 'm');
const BASE_COMBINED_MOI = new Measurement(1.463e-3, 'kg*m^2');
const BASE_OMEGA = new Measurement(622, 'rad/s');

describe('single-hooded', () => {
  it('m_b = 0 and I_b = 0 → ω_wf === ω_wi and V_bf === ω_wi·r_w/2', () => {
    const result = computeShotResult({
      mode: 'single-hooded',
      flywheelOmega: BASE_OMEGA,
      shooterRadius: BASE_SHOOTER_RADIUS,
      combinedMOI: BASE_COMBINED_MOI,
      ballMass: new Measurement(0, 'kg'),
      ballRadius: BASE_BALL_RADIUS,
      ballMOI: new Measurement(0, 'kg*m^2'),
    });
    const omegaWi = BASE_OMEGA.to('rad/s').scalar;
    const rW = BASE_SHOOTER_RADIUS.to('m').scalar;
    expect(result.postShotOmega.to('rad/s').scalar).toBeCloseTo(omegaWi, 5);
    expect(result.exitVelocity.to('m/s').scalar).toBeCloseTo(
      (rW / 2) * omegaWi,
      5,
    );
  });

  it('I_w = 0 → all zeros', () => {
    const result = computeShotResult({
      mode: 'single-hooded',
      flywheelOmega: BASE_OMEGA,
      shooterRadius: BASE_SHOOTER_RADIUS,
      combinedMOI: new Measurement(0, 'kg*m^2'),
      ballMass: BASE_BALL_MASS,
      ballRadius: BASE_BALL_RADIUS,
      ballMOI: BASE_BALL_MOI,
    });
    expect(result.exitVelocity.to('m/s').scalar).toBe(0);
    expect(result.postShotOmega.to('rad/s').scalar).toBe(0);
    expect(result.ballKineticEnergy.to('J').scalar).toBe(0);
    expect(result.flywheelEnergyLost.to('J').scalar).toBe(0);
  });

  it('heavier ball → larger speed drop', () => {
    const light = computeShotResult({
      mode: 'single-hooded',
      flywheelOmega: BASE_OMEGA,
      shooterRadius: BASE_SHOOTER_RADIUS,
      combinedMOI: BASE_COMBINED_MOI,
      ballMass: new Measurement(0.1, 'kg'),
      ballRadius: BASE_BALL_RADIUS,
      ballMOI: solidSphereMoi(0.1, 0.07506),
    });
    const heavy = computeShotResult({
      mode: 'single-hooded',
      flywheelOmega: BASE_OMEGA,
      shooterRadius: BASE_SHOOTER_RADIUS,
      combinedMOI: BASE_COMBINED_MOI,
      ballMass: new Measurement(0.5, 'kg'),
      ballRadius: BASE_BALL_RADIUS,
      ballMOI: solidSphereMoi(0.5, 0.07506),
    });
    expect(light.postShotOmega.to('rad/s').scalar).toBeGreaterThan(
      heavy.postShotOmega.to('rad/s').scalar,
    );
  });

  it('larger I_w → smaller speed drop', () => {
    const small = computeShotResult({
      mode: 'single-hooded',
      flywheelOmega: BASE_OMEGA,
      shooterRadius: BASE_SHOOTER_RADIUS,
      combinedMOI: new Measurement(0.5e-3, 'kg*m^2'),
      ballMass: BASE_BALL_MASS,
      ballRadius: BASE_BALL_RADIUS,
      ballMOI: BASE_BALL_MOI,
    });
    const large = computeShotResult({
      mode: 'single-hooded',
      flywheelOmega: BASE_OMEGA,
      shooterRadius: BASE_SHOOTER_RADIUS,
      combinedMOI: new Measurement(10e-3, 'kg*m^2'),
      ballMass: BASE_BALL_MASS,
      ballRadius: BASE_BALL_RADIUS,
      ballMOI: BASE_BALL_MOI,
    });
    expect(large.postShotOmega.to('rad/s').scalar).toBeGreaterThan(
      small.postShotOmega.to('rad/s').scalar,
    );
  });

  it('V_bf < ω_wi · r_w for any positive m_b', () => {
    const result = computeShotResult({
      mode: 'single-hooded',
      flywheelOmega: BASE_OMEGA,
      shooterRadius: BASE_SHOOTER_RADIUS,
      combinedMOI: BASE_COMBINED_MOI,
      ballMass: BASE_BALL_MASS,
      ballRadius: BASE_BALL_RADIUS,
      ballMOI: BASE_BALL_MOI,
    });
    const surfaceSpeed =
      BASE_OMEGA.to('rad/s').scalar * BASE_SHOOTER_RADIUS.to('m').scalar;
    expect(result.exitVelocity.to('m/s').scalar).toBeLessThan(surfaceSpeed);
  });

  it('ω_bf === V_bf / r_b (no-slip exit invariant)', () => {
    const result = computeShotResult({
      mode: 'single-hooded',
      flywheelOmega: BASE_OMEGA,
      shooterRadius: BASE_SHOOTER_RADIUS,
      combinedMOI: BASE_COMBINED_MOI,
      ballMass: BASE_BALL_MASS,
      ballRadius: BASE_BALL_RADIUS,
      ballMOI: BASE_BALL_MOI,
    });
    const vBf = result.exitVelocity.to('m/s').scalar;
    const rB = BASE_BALL_RADIUS.to('m').scalar;
    const omegaBfExpected = vBf / rB;
    const omegaBfActual =
      (result.exitSpinRate.to('rpm').scalar * 2 * Math.PI) / 60;
    expect(omegaBfActual).toBeCloseTo(omegaBfExpected, 5);

    // Halving r_b (with rescaled solid-sphere I_b) doubles spin rate
    const smallR = 0.03753;
    const smallResult = computeShotResult({
      mode: 'single-hooded',
      flywheelOmega: BASE_OMEGA,
      shooterRadius: BASE_SHOOTER_RADIUS,
      combinedMOI: BASE_COMBINED_MOI,
      ballMass: BASE_BALL_MASS,
      ballRadius: new Measurement(smallR, 'm'),
      ballMOI: solidSphereMoi(0.2268, smallR),
    });
    const omegaBfSmall =
      (smallResult.exitSpinRate.to('rpm').scalar * 2 * Math.PI) / 60;
    expect(omegaBfSmall).toBeCloseTo(
      smallResult.exitVelocity.to('m/s').scalar / smallR,
      5,
    );
  });

  it('0 < ballKE ≤ flywheelEnergyLost (inelastic-collision invariant)', () => {
    const result = computeShotResult({
      mode: 'single-hooded',
      flywheelOmega: BASE_OMEGA,
      shooterRadius: BASE_SHOOTER_RADIUS,
      combinedMOI: BASE_COMBINED_MOI,
      ballMass: BASE_BALL_MASS,
      ballRadius: BASE_BALL_RADIUS,
      ballMOI: BASE_BALL_MOI,
    });
    expect(result.ballKineticEnergy.to('J').scalar).toBeGreaterThan(0);
    expect(result.ballKineticEnergy.to('J').scalar).toBeLessThanOrEqual(
      result.flywheelEnergyLost.to('J').scalar,
    );
  });

  it('ω_wi = 0 → all zeros', () => {
    const result = computeShotResult({
      mode: 'single-hooded',
      flywheelOmega: new Measurement(0, 'rad/s'),
      shooterRadius: BASE_SHOOTER_RADIUS,
      combinedMOI: BASE_COMBINED_MOI,
      ballMass: BASE_BALL_MASS,
      ballRadius: BASE_BALL_RADIUS,
      ballMOI: BASE_BALL_MOI,
    });
    expect(result.exitVelocity.to('m/s').scalar).toBe(0);
    expect(result.postShotOmega.to('rad/s').scalar).toBe(0);
    expect(result.ballKineticEnergy.to('J').scalar).toBe(0);
  });

  it('r_w = 0 → all zeros', () => {
    const result = computeShotResult({
      mode: 'single-hooded',
      flywheelOmega: BASE_OMEGA,
      shooterRadius: new Measurement(0, 'm'),
      combinedMOI: BASE_COMBINED_MOI,
      ballMass: BASE_BALL_MASS,
      ballRadius: BASE_BALL_RADIUS,
      ballMOI: BASE_BALL_MOI,
    });
    expect(result.exitVelocity.to('m/s').scalar).toBe(0);
    expect(result.postShotOmega.to('rad/s').scalar).toBe(0);
    expect(result.ballKineticEnergy.to('J').scalar).toBe(0);
  });

  it('gsheet reference (449 Appendix A)', () => {
    // ω_wi=622 rad/s, r_b=0.07506m, m_b=0.2268kg,
    // I_b=5.111e-4 kg·m², r_w=0.0508m, I_w=1.463e-3 kg·m²
    const result = computeShotResult({
      mode: 'single-hooded',
      flywheelOmega: new Measurement(622, 'rad/s'),
      shooterRadius: new Measurement(0.0508, 'm'),
      combinedMOI: new Measurement(1.463e-3, 'kg*m^2'),
      ballMass: new Measurement(0.2268, 'kg'),
      ballRadius: new Measurement(0.07506, 'm'),
      ballMOI: new Measurement(5.111e-4, 'kg*m^2'),
    });

    expect(result.postShotOmega.to('rad/s').scalar).toBeCloseTo(545.6, 1);
    expect(result.exitVelocity.to('m/s').scalar).toBeCloseTo(13.86, 2);
    const omegaBfActual =
      (result.exitSpinRate.to('rpm').scalar * 2 * Math.PI) / 60;
    expect(omegaBfActual).toBeCloseTo(184.6, 1);
    expect(result.ballKineticEnergy.to('J').scalar).toBeCloseTo(30.49, 1);

    expect(
      result.ballKineticEnergy.to('J').scalar /
        result.flywheelEnergyLost.to('J').scalar,
    ).toBeCloseTo(0.4673, 3);
  });
});

describe('dual-shooter', () => {
  const iW = new Measurement(1.463e-3, 'kg*m^2');
  const rW1 = new Measurement(0.0508, 'm');
  const mB = BASE_BALL_MASS;
  const rB = BASE_BALL_RADIUS;
  const iB = BASE_BALL_MOI;

  it('G·r_w2 = r_w1 (B = 0) → ω_bf ≈ 0', () => {
    // r_w2 = r_w1, G = 1 → B = r_w1 - 1·r_w1 = 0
    const result = computeShotResult({
      mode: 'dual-shooter',
      flywheelOmega: BASE_OMEGA,
      shooterRadius: rW1,
      combinedMOI: iW,
      ballMass: mB,
      ballRadius: rB,
      ballMOI: iB,
      secondaryRadius: rW1,
      secondaryToShooterRatio: 1,
    });
    const omegaBfActual =
      (result.exitSpinRate.to('rpm').scalar * 2 * Math.PI) / 60;
    expect(omegaBfActual).toBeCloseTo(0, 8);
  });

  it('G·r_w2 = r_w1 → V_bf = r_w1 · ω_w1f', () => {
    // When B = 0, A = 2·r_w1, V_bf = (A/2)·ω_w1f = r_w1·ω_w1f
    const result = computeShotResult({
      mode: 'dual-shooter',
      flywheelOmega: BASE_OMEGA,
      shooterRadius: rW1,
      combinedMOI: iW,
      ballMass: mB,
      ballRadius: rB,
      ballMOI: iB,
      secondaryRadius: rW1,
      secondaryToShooterRatio: 1,
    });
    const rW1m = rW1.to('m').scalar;
    const omegaW1f = result.postShotOmega.to('rad/s').scalar;
    expect(result.exitVelocity.to('m/s').scalar).toBeCloseTo(
      rW1m * omegaW1f,
      5,
    );
  });

  it('G·r_w2 > r_w1 → exitSpinRate < 0 (backspin)', () => {
    // r_w2 = r_w1, G = 2 → B = r_w1 - 2·r_w1 = -r_w1 < 0
    const result = computeShotResult({
      mode: 'dual-shooter',
      flywheelOmega: BASE_OMEGA,
      shooterRadius: rW1,
      combinedMOI: iW,
      ballMass: mB,
      ballRadius: rB,
      ballMOI: iB,
      secondaryRadius: rW1,
      secondaryToShooterRatio: 2,
    });
    expect(result.exitSpinRate.to('rpm').scalar).toBeLessThan(0);
  });

  it('heavier ball → larger primary speed drop', () => {
    const light = computeShotResult({
      mode: 'dual-shooter',
      flywheelOmega: BASE_OMEGA,
      shooterRadius: rW1,
      combinedMOI: iW,
      ballMass: new Measurement(0.1, 'kg'),
      ballRadius: rB,
      ballMOI: solidSphereMoi(0.1, rB.to('m').scalar),
      secondaryRadius: rW1,
      secondaryToShooterRatio: 1,
    });
    const heavy = computeShotResult({
      mode: 'dual-shooter',
      flywheelOmega: BASE_OMEGA,
      shooterRadius: rW1,
      combinedMOI: iW,
      ballMass: new Measurement(0.5, 'kg'),
      ballRadius: rB,
      ballMOI: solidSphereMoi(0.5, rB.to('m').scalar),
      secondaryRadius: rW1,
      secondaryToShooterRatio: 1,
    });
    expect(light.postShotOmega.to('rad/s').scalar).toBeGreaterThan(
      heavy.postShotOmega.to('rad/s').scalar,
    );
  });

  it('G = 0 runs without NaN and result is finite', () => {
    const result = computeShotResult({
      mode: 'dual-shooter',
      flywheelOmega: BASE_OMEGA,
      shooterRadius: rW1,
      combinedMOI: iW,
      ballMass: mB,
      ballRadius: rB,
      ballMOI: iB,
      secondaryRadius: rW1,
      secondaryToShooterRatio: 0,
    });
    expect(Number.isFinite(result.exitVelocity.to('m/s').scalar)).toBe(true);
    expect(Number.isFinite(result.postShotOmega.to('rad/s').scalar)).toBe(true);
    expect(Number.isFinite(result.ballKineticEnergy.to('J').scalar)).toBe(true);
    expect(Number.isNaN(result.exitVelocity.to('m/s').scalar)).toBe(false);
  });

  it('secondaryRadius undefined → all zeros', () => {
    const result = computeShotResult({
      mode: 'dual-shooter',
      flywheelOmega: BASE_OMEGA,
      shooterRadius: rW1,
      combinedMOI: iW,
      ballMass: mB,
      ballRadius: rB,
      ballMOI: iB,
    });
    expect(result.exitVelocity.to('m/s').scalar).toBe(0);
    expect(result.postShotOmega.to('rad/s').scalar).toBe(0);
    expect(result.ballKineticEnergy.to('J').scalar).toBe(0);
  });
});

describe('single-hooded with V_bi', () => {
  it('V_bi > 0 increases exit velocity', () => {
    const base = computeShotResult({
      mode: 'single-hooded',
      flywheelOmega: BASE_OMEGA,
      shooterRadius: BASE_SHOOTER_RADIUS,
      combinedMOI: BASE_COMBINED_MOI,
      ballMass: BASE_BALL_MASS,
      ballRadius: BASE_BALL_RADIUS,
      ballMOI: BASE_BALL_MOI,
    });
    const withVbi = computeShotResult({
      mode: 'single-hooded',
      flywheelOmega: BASE_OMEGA,
      shooterRadius: BASE_SHOOTER_RADIUS,
      combinedMOI: BASE_COMBINED_MOI,
      ballMass: BASE_BALL_MASS,
      ballRadius: BASE_BALL_RADIUS,
      ballMOI: BASE_BALL_MOI,
      ballInitialVelocity: new Measurement(5, 'm/s'),
    });
    expect(withVbi.exitVelocity.to('m/s').scalar).toBeGreaterThan(
      base.exitVelocity.to('m/s').scalar,
    );
  });
});

describe('dual-shooter with V_bi', () => {
  it('V_bi > 0 increases exit velocity', () => {
    const rW1 = new Measurement(0.0508, 'm');
    const iW = new Measurement(1.463e-3, 'kg*m^2');
    const base = computeShotResult({
      mode: 'dual-shooter',
      flywheelOmega: BASE_OMEGA,
      shooterRadius: rW1,
      combinedMOI: iW,
      ballMass: BASE_BALL_MASS,
      ballRadius: BASE_BALL_RADIUS,
      ballMOI: BASE_BALL_MOI,
      secondaryRadius: rW1,
      secondaryToShooterRatio: 1,
    });
    const withVbi = computeShotResult({
      mode: 'dual-shooter',
      flywheelOmega: BASE_OMEGA,
      shooterRadius: rW1,
      combinedMOI: iW,
      ballMass: BASE_BALL_MASS,
      ballRadius: BASE_BALL_RADIUS,
      ballMOI: BASE_BALL_MOI,
      secondaryRadius: rW1,
      secondaryToShooterRatio: 1,
      ballInitialVelocity: new Measurement(5, 'm/s'),
    });
    expect(withVbi.exitVelocity.to('m/s').scalar).toBeGreaterThan(
      base.exitVelocity.to('m/s').scalar,
    );
  });
});

describe('compound', () => {
  // Reference values from the Compound Flywheel sheet of the whitepaper spreadsheet.
  // r_b=0.075057 m, m_b=0.226796 kg, I_b=5.111e-4 kg·m²,
  // r_w1=0.0508 m, r_w2=0.0127 m, I_w=0.006643 kg·m², G=3, ω_w1i=150 rad/s
  const COMPOUND_IW = new Measurement(0.006643, 'kg*m^2');
  const COMPOUND_RW1 = new Measurement(0.0508, 'm');
  const COMPOUND_RW2 = new Measurement(0.0127, 'm');
  const COMPOUND_OMEGA = new Measurement(150, 'rad/s');
  const COMPOUND_MB = new Measurement(0.226796, 'kg');
  const COMPOUND_RB = new Measurement(0.075057, 'm');
  const COMPOUND_IB = new Measurement(5.111e-4, 'kg*m^2');
  const G = 3;

  it('gsheet reference: ω_w1f ≈ 141.80, V_bf ≈ 6.303 m/s, ω_bf ≈ 114.56 rpm', () => {
    const result = computeShotResult({
      mode: 'compound',
      flywheelOmega: COMPOUND_OMEGA,
      shooterRadius: COMPOUND_RW1,
      combinedMOI: COMPOUND_IW,
      ballMass: COMPOUND_MB,
      ballRadius: COMPOUND_RB,
      ballMOI: COMPOUND_IB,
      secondaryRadius: COMPOUND_RW2,
      secondaryToShooterRatio: G,
    });
    expect(result.postShotOmega.to('rad/s').scalar).toBeCloseTo(141.8, 1);
    expect(result.exitVelocity.to('m/s').scalar).toBeCloseTo(6.303, 2);
    const omegaBfActual =
      (result.exitSpinRate.to('rpm').scalar * 2 * Math.PI) / 60;
    expect(omegaBfActual).toBeCloseTo(11.997, 2);
  });

  it('V_bi > 0 increases shot efficiency', () => {
    const base = computeShotResult({
      mode: 'compound',
      flywheelOmega: COMPOUND_OMEGA,
      shooterRadius: COMPOUND_RW1,
      combinedMOI: COMPOUND_IW,
      ballMass: COMPOUND_MB,
      ballRadius: COMPOUND_RB,
      ballMOI: COMPOUND_IB,
      secondaryRadius: COMPOUND_RW2,
      secondaryToShooterRatio: G,
    });
    const withVbi = computeShotResult({
      mode: 'compound',
      flywheelOmega: COMPOUND_OMEGA,
      shooterRadius: COMPOUND_RW1,
      combinedMOI: COMPOUND_IW,
      ballMass: COMPOUND_MB,
      ballRadius: COMPOUND_RB,
      ballMOI: COMPOUND_IB,
      secondaryRadius: COMPOUND_RW2,
      secondaryToShooterRatio: G,
      ballInitialVelocity: new Measurement(5, 'm/s'),
    });
    const baseEff =
      base.ballKineticEnergy.to('J').scalar /
      base.flywheelEnergyLost.to('J').scalar;
    const vbiEff =
      withVbi.ballKineticEnergy.to('J').scalar /
      withVbi.flywheelEnergyLost.to('J').scalar;
    expect(vbiEff).toBeGreaterThan(baseEff);
  });

  it('G = 0 degenerates to single-hooded result', () => {
    const compound = computeShotResult({
      mode: 'compound',
      flywheelOmega: COMPOUND_OMEGA,
      shooterRadius: COMPOUND_RW1,
      combinedMOI: COMPOUND_IW,
      ballMass: COMPOUND_MB,
      ballRadius: COMPOUND_RB,
      ballMOI: COMPOUND_IB,
      secondaryRadius: COMPOUND_RW2,
      secondaryToShooterRatio: 0,
    });
    const single = computeShotResult({
      mode: 'single-hooded',
      flywheelOmega: COMPOUND_OMEGA,
      shooterRadius: COMPOUND_RW1,
      combinedMOI: COMPOUND_IW,
      ballMass: COMPOUND_MB,
      ballRadius: COMPOUND_RB,
      ballMOI: COMPOUND_IB,
    });
    expect(compound.exitVelocity.to('m/s').scalar).toBeCloseTo(
      single.exitVelocity.to('m/s').scalar,
      5,
    );
    expect(compound.postShotOmega.to('rad/s').scalar).toBeCloseTo(
      single.postShotOmega.to('rad/s').scalar,
      5,
    );
  });

  it('solid sphere can exceed 50% total efficiency', () => {
    // High I_w relative to ball drives efficiency toward theoretical max.
    // Whitepaper Table: compound solid sphere max ~58.8%.
    const highIw = new Measurement(0.1, 'kg*m^2');
    const result = computeShotResult({
      mode: 'compound',
      flywheelOmega: COMPOUND_OMEGA,
      shooterRadius: COMPOUND_RW1,
      combinedMOI: highIw,
      ballMass: COMPOUND_MB,
      ballRadius: COMPOUND_RB,
      ballMOI: COMPOUND_IB,
      secondaryRadius: COMPOUND_RW2,
      secondaryToShooterRatio: G,
    });
    const eff =
      result.ballKineticEnergy.to('J').scalar /
      result.flywheelEnergyLost.to('J').scalar;
    expect(eff).toBeGreaterThan(0.5);
  });

  it('secondaryRadius undefined → all zeros', () => {
    const result = computeShotResult({
      mode: 'compound',
      flywheelOmega: COMPOUND_OMEGA,
      shooterRadius: COMPOUND_RW1,
      combinedMOI: COMPOUND_IW,
      ballMass: COMPOUND_MB,
      ballRadius: COMPOUND_RB,
      ballMOI: COMPOUND_IB,
    });
    expect(result.exitVelocity.to('m/s').scalar).toBe(0);
    expect(result.postShotOmega.to('rad/s').scalar).toBe(0);
    expect(result.ballKineticEnergy.to('J').scalar).toBe(0);
  });
});

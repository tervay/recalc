import { describe, expect, it } from 'vitest';

import { computeShotResult } from '~/lib/math/ballShot';
import Measurement from '~/lib/models/Measurement';

describe('computeShotResult', () => {
  it('post-shot speed equals pre-shot speed when ball mass is zero', () => {
    // Zero ball mass → no momentum exchange → ωf = ω₀.
    // Lynbrook model: V_b = (2/7)·ωf·r, so exit velocity = (2/7)·surface speed.
    const result = computeShotResult(
      new Measurement(3000, 'rpm'),
      new Measurement(3, 'in'),
      new Measurement(7.5, 'in2*lbs'),
      new Measurement(0, 'lb'),
      new Measurement(3.5, 'in'),
    );
    const surfaceSpeed = ((3000 * (2 * Math.PI)) / 60) * (3 * 0.0254);
    expect(result.postShotOmega.to('rpm').scalar).toBeCloseTo(3000, 3);
    expect(result.exitVelocity.to('m/s').scalar).toBeCloseTo(
      (2 / 7) * surfaceSpeed,
      3,
    );
  });

  it('post-shot speed and exit velocity approach zero when MOI is zero', () => {
    const result = computeShotResult(
      new Measurement(3000, 'rpm'),
      new Measurement(3, 'in'),
      new Measurement(0, 'in2*lbs'),
      new Measurement(0.5, 'lb'),
      new Measurement(3.5, 'in'),
    );
    expect(result.postShotOmega.to('rpm').scalar).toBeCloseTo(0, 5);
    expect(result.exitVelocity.to('m/s').scalar).toBeCloseTo(0, 5);
  });

  it('speed drop is larger for heavier balls', () => {
    const base = {
      omega: new Measurement(3000, 'rpm'),
      radius: new Measurement(3, 'in'),
      moi: new Measurement(50, 'in2*lbs'),
      ballRadius: new Measurement(3.5, 'in'),
    };
    const light = computeShotResult(
      base.omega,
      base.radius,
      base.moi,
      new Measurement(0.3, 'lb'),
      base.ballRadius,
    );
    const heavy = computeShotResult(
      base.omega,
      base.radius,
      base.moi,
      new Measurement(0.8, 'lb'),
      base.ballRadius,
    );
    expect(light.postShotOmega.to('rpm').scalar).toBeGreaterThan(
      heavy.postShotOmega.to('rpm').scalar,
    );
  });

  it('speed drop is larger for lighter flywheels', () => {
    const base = {
      omega: new Measurement(3000, 'rpm'),
      radius: new Measurement(3, 'in'),
      ballMass: new Measurement(0.5, 'lb'),
      ballRadius: new Measurement(3.5, 'in'),
    };
    const light = computeShotResult(
      base.omega,
      base.radius,
      new Measurement(10, 'in2*lbs'),
      base.ballMass,
      base.ballRadius,
    );
    const heavy = computeShotResult(
      base.omega,
      base.radius,
      new Measurement(100, 'in2*lbs'),
      base.ballMass,
      base.ballRadius,
    );
    expect(light.postShotOmega.to('rpm').scalar).toBeLessThan(
      heavy.postShotOmega.to('rpm').scalar,
    );
  });

  it('exit velocity is always less than the initial surface speed', () => {
    // Lynbrook model: V_b = (2/7)·ωf·r < ω₀·r always
    const result = computeShotResult(
      new Measurement(3000, 'rpm'),
      new Measurement(3, 'in'),
      new Measurement(7.5, 'in2*lbs'),
      new Measurement(0.5, 'lb'),
      new Measurement(3.5, 'in'),
    );
    const surfaceSpeed = ((3000 * (2 * Math.PI)) / 60) * (3 * 0.0254);
    expect(result.exitVelocity.to('m/s').scalar).toBeLessThan(surfaceSpeed);
  });

  it('ball diameter does not affect speed drop or exit velocity', () => {
    // r_ball only appears in spin rate formula; ωf and V_b are independent of it
    const base = {
      omega: new Measurement(3000, 'rpm'),
      radius: new Measurement(3, 'in'),
      moi: new Measurement(50, 'in2*lbs'),
      mass: new Measurement(0.5, 'lb'),
    };
    const small = computeShotResult(
      base.omega,
      base.radius,
      base.moi,
      base.mass,
      new Measurement(2, 'in'),
    );
    const large = computeShotResult(
      base.omega,
      base.radius,
      base.moi,
      base.mass,
      new Measurement(5, 'in'),
    );
    expect(small.postShotOmega.to('rpm').scalar).toBeCloseTo(
      large.postShotOmega.to('rpm').scalar,
      5,
    );
    expect(small.exitVelocity.to('m/s').scalar).toBeCloseTo(
      large.exitVelocity.to('m/s').scalar,
      5,
    );
  });

  it('spin rate scales inversely with ball radius', () => {
    // Lynbrook model: ω_bf = 5·V_b / (2·R_b), so halving R_b doubles spin rate
    const omega = new Measurement(3000, 'rpm');
    const shooterRadius = new Measurement(3, 'in');
    const moi = new Measurement(50, 'in2*lbs');
    const mass = new Measurement(0.5, 'lb');

    const small = computeShotResult(
      omega,
      shooterRadius,
      moi,
      mass,
      new Measurement(2, 'in'),
    );
    const large = computeShotResult(
      omega,
      shooterRadius,
      moi,
      mass,
      new Measurement(4, 'in'),
    );

    // Same exit velocity, half the radius → double the spin rate
    expect(small.exitSpinRate.to('rpm').scalar).toBeCloseTo(
      large.exitSpinRate.to('rpm').scalar * 2,
      3,
    );
  });

  it('ball KE is less than flywheel energy lost (remainder is friction heat)', () => {
    // Lynbrook rolling-contact is an inelastic collision: the grip phase
    // dissipates energy as heat, so ball KE < flywheel energy extracted.
    const result = computeShotResult(
      new Measurement(3000, 'rpm'),
      new Measurement(3, 'in'),
      new Measurement(50, 'in2*lbs'),
      new Measurement(0.5, 'lb'),
      new Measurement(3.5, 'in'),
    );
    expect(result.ballKineticEnergy.to('J').scalar).toBeLessThan(
      result.flywheelEnergyLost.to('J').scalar,
    );
    expect(result.ballKineticEnergy.to('J').scalar).toBeGreaterThan(0);
  });

  it('returns zeros for zero omega', () => {
    const result = computeShotResult(
      new Measurement(0, 'rpm'),
      new Measurement(3, 'in'),
      new Measurement(50, 'in2*lbs'),
      new Measurement(0.5, 'lb'),
      new Measurement(3.5, 'in'),
    );
    expect(result.exitVelocity.to('m/s').scalar).toBe(0);
    expect(result.postShotOmega.to('rpm').scalar).toBe(0);
    expect(result.ballKineticEnergy.to('J').scalar).toBe(0);
  });

  it('returns zeros for zero shooter radius', () => {
    const result = computeShotResult(
      new Measurement(3000, 'rpm'),
      new Measurement(0, 'in'),
      new Measurement(50, 'in2*lbs'),
      new Measurement(0.5, 'lb'),
      new Measurement(3.5, 'in'),
    );
    expect(result.exitVelocity.to('m/s').scalar).toBe(0);
    expect(result.postShotOmega.to('rpm').scalar).toBe(0);
  });

  it('known values: heavy flywheel, moderate ball', () => {
    // Lynbrook model: ωf = 7I·ω₀ / (7I + 2·m·r²)
    // I = 50 in²·lb ≈ 0.014632 kg·m², r = 3 in = 0.0762 m, ω₀ = 3000 rpm = 100π rad/s
    // m = 0.5 lb ≈ 0.22680 kg
    // 2·m·r² = 2 * 0.22680 * 0.005806 = 0.002634 kg·m²
    // 7·I = 0.10242 kg·m²
    // ωf = 0.10242 / (0.10242 + 0.002634) * 3000 ≈ 2925 rpm
    // V_b = (2/7)·ωf·r ≈ (2/7) * 306.3 * 0.0762 ≈ 6.67 m/s ≈ 21.9 ft/s
    const result = computeShotResult(
      new Measurement(3000, 'rpm'),
      new Measurement(3, 'in'),
      new Measurement(50, 'in2*lbs'),
      new Measurement(0.5, 'lb'),
      new Measurement(3.5, 'in'),
    );
    expect(result.postShotOmega.to('rpm').scalar).toBeCloseTo(2925, 0);
    expect(result.exitVelocity.to('ft/s').scalar).toBeCloseTo(22, 0);
  });
});

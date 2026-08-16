import Measurement from '~/lib/models/Measurement';

/**
 * Supply-current-limited maximum velocity for a linear (translational) mechanism.
 *
 * At cruise (a = 0, η = 1), the motor must overcome gravity, drawing stator
 * current kG/R. The resulting supply current is:
 *
 *   I_supply = (kG / R) × V_applied / V_supply = kG × (kG + kV×v) / (R × V_supply)
 *
 * Setting this equal to iMaxSupply and solving for v:
 *
 *   v_max = (iMaxSupply × R × V_supply / kG − kG) / kV
 *
 * For η ≠ 1, the stator current at cruise includes a velocity-dependent term,
 * leading to the quadratic (u = kV × v, P = iMaxSupply × R × V_supply):
 *
 *   (1−η)·u² + (2−η)·kG·u + (kG² − P) = 0
 *   discriminant = η²·kG² + 4·(1−η)·P
 *   u = [−(2−η)·kG + sqrt(disc)] / (2·(1−η))
 *
 * Returns Infinity when kG ≤ 0 (horizontal or downhill mechanism), because the
 * supply current at cruise approaches zero as velocity increases, so the supply
 * limit never binds.
 *
 * @param kV         Feedforward velocity gain (V·s/m)
 * @param kG         Feedforward gravity gain (V)
 * @param iMaxSupply Per-motor supply current limit (A)
 * @param motorResistance Per-motor winding resistance (Ω)
 * @param vSupply    Supply voltage (V)
 * @param efficiency Drivetrain efficiency (0–1)
 * @returns Supply-current-limited max velocity (m/s), or Infinity if unconstrained
 */
export function calculateLinearSupplyLimitedMaxVelocity(
  kV: Measurement,
  kG: Measurement,
  iMaxSupply: Measurement,
  motorResistance: Measurement,
  vSupply: Measurement,
  efficiency: number,
): Measurement {
  if (kV.scalar === 0 || kG.scalar <= 0) {
    // No supply constraint on cruise velocity when kG ≤ 0 (horizontal or
    // downhill mechanism: supply current at cruise → 0 as speed increases)
    // or when kV = 0. Return a value large enough that Measurement.min will
    // always prefer any physically realizable unconstrained velocity.
    return new Measurement(1e6, 'm/s');
  }

  const eta = efficiency;
  // P = iMaxSupply × R × V_supply  [V²]
  const P = iMaxSupply.mul(motorResistance).mul(vSupply);

  if (Math.abs(1 - eta) < 1e-9) {
    // η ≈ 1: linear equation  →  u = P/kG − kG,  v = u/kV
    return P.div(kG).sub(kG).div(kV);
  }

  // η ≠ 1: quadratic in u = kV × v
  // disc = η²·kG² + 4·(1−η)·P
  const kGSq = kG.mul(kG);
  const disc = kGSq.mul(eta * eta).add(P.mul(4 * (1 - eta)));
  const sqrtDisc = new Measurement(
    Math.sqrt(Math.max(0, disc.to('V^2').scalar)),
    'V',
  );
  const numerator = sqrtDisc.sub(kG.mul(2 - eta));
  return numerator.div(kV.mul(2 * (1 - eta)));
}

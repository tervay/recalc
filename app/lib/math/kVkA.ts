import Measurement from '~/lib/models/Measurement';
import Motor, { nominalVoltage } from '~/lib/models/Motor';
import Ratio from '~/lib/models/Ratio';

export function calculateKv(
  maxSpeed: Measurement,
  radius: Measurement,
): Measurement {
  if ([maxSpeed.scalar, radius.scalar].includes(0)) {
    const denominatorUnits = radius.units().includes('rad') ? 'rad' : 'm';
    return new Measurement(0, `V*s/${denominatorUnits}`);
  }

  return nominalVoltage.div(
    maxSpeed.mul(radius).div(new Measurement(1, 'radian')),
  );
}

export function calculateKa(
  stallTorque: Measurement,
  radius: Measurement,
  mass: Measurement,
): Measurement {
  if (stallTorque.scalar == 0) {
    const denominatorUnits = radius.units().includes('rad') ? 'rad' : 'm';
    return new Measurement(0, `V*s^2/${denominatorUnits}`);
  }

  return nominalVoltage.mul(mass).mul(radius).div(stallTorque);
}

/**
 * Feedforward velocity gain for a linear (translational) mechanism.
 *
 * kV = gearing / (efficiency * Kv_motor [rad/s/V] * spoolRadius)
 *
 * Derived by inverting the efficiency-modified plant state-space model.
 * All three linear feedforward gains include efficiency because the
 * AngledElevatorSim scales only the B matrix (motor force) by efficiency,
 * which affects the relationship between voltage and both force and
 * back-EMF damping in the inverted model.
 *
 * Named with a `Linear` prefix to distinguish from future rotational
 * (arm) feedforward functions that operate in rad, rad/s, rad/s².
 *
 * @returns V·s/m
 */
export function calculateLinearFeedforwardKv(
  motor: Motor,
  ratio: Ratio,
  spoolRadius: Measurement,
  efficiency: number,
): Measurement {
  if (
    Measurement.anyAreZero(ratio.asNumber(), efficiency, motor.kV, spoolRadius)
  ) {
    return new Measurement(0, 'V*s/m');
  }

  return new Measurement(ratio.asNumber())
    .div(efficiency)
    .div(motor.kV.removeRad())
    .div(spoolRadius);
}

/**
 * Feedforward acceleration gain for a linear (translational) mechanism.
 *
 * kA = mass * spoolRadius * R_eff / (efficiency * Kt * gearing)
 *
 * R_eff = motor.resistance / motor.quantity (parallel resistance of n motors).
 * Kt = motor.kT = stallTorque / stallCurrent (per motor, quantity-invariant).
 *
 * @returns V·s²/m
 */
export function calculateLinearFeedforwardKa(
  motor: Motor,
  ratio: Ratio,
  spoolRadius: Measurement,
  load: Measurement,
  efficiency: number,
): Measurement {
  const rEff = motor.resistance.div(motor.quantity);

  if (Measurement.anyAreZero(motor.kT, ratio.asNumber(), efficiency)) {
    return new Measurement(0, 'V*s^2/m');
  }

  return load
    .mul(spoolRadius)
    .mul(rEff)
    .div(motor.kT)
    .div(ratio.asNumber())
    .div(efficiency);
}

/**
 * Feedforward gravity gain for a linear (translational) mechanism.
 *
 * kG = kA * 9.80665 m/s² * sin(angle)
 *
 * Returns the voltage required to hold the mechanism stationary against
 * gravity at the given angle from horizontal (0 = horizontal, π/2 = vertical).
 *
 * @returns V
 */
export function calculateLinearFeedforwardKg(
  kA: Measurement,
  angle: Measurement,
): Measurement {
  return kA
    .mul(Measurement.GRAVITY.negate())
    .mul(Math.sin(angle.to('rad').scalar));
}

/**
 * Feedforward velocity gain for an angular (rotational) mechanism, e.g. an arm.
 *
 * kV = gearing / (efficiency * Kv_motor [rad/s/V])
 *
 * @returns V*s/rad
 */
export function calculateAngularFeedforwardKv(
  motor: Motor,
  ratio: Ratio,
  efficiency: number,
): Measurement {
  if (Measurement.anyAreZero(ratio.asNumber(), efficiency, motor.kV)) {
    return new Measurement(0, 'V*s/rad');
  }

  return new Measurement(ratio.asNumber()).div(efficiency).div(motor.kV);
}

/**
 * Feedforward acceleration gain for an angular (rotational) mechanism.
 *
 * kA = J * R_eff / (efficiency * Kt * gearing)
 *
 * R_eff = motor.resistance / motor.quantity (parallel resistance of n motors).
 *
 * J is supplied as a plain kg*m^2-style Measurement (no `rad` in its units,
 * matching how arm.tsx builds `momentOfInertia = load * armLength^2`). It is
 * divided by 1 rad (via `removeRad()`) before combining with R_eff and Kt so
 * that the result reduces to V*s²/rad through js-quantities' unit algebra.
 *
 * @param momentOfInertia J, in kg*m^2 (or equivalent)
 * @returns V*s^2/rad
 */
export function calculateAngularFeedforwardKa(
  motor: Motor,
  ratio: Ratio,
  momentOfInertia: Measurement,
  efficiency: number,
): Measurement {
  const rEff = motor.resistance.div(motor.quantity);

  if (Measurement.anyAreZero(motor.kT, ratio.asNumber(), efficiency)) {
    return new Measurement(0, 'V*s^2/rad');
  }

  return momentOfInertia
    .removeRad()
    .mul(rEff)
    .div(motor.kT)
    .div(ratio.asNumber())
    .div(efficiency);
}

/**
 * Feedforward gravity gain for an angular (rotational) mechanism, e.g. an arm
 * held out horizontally against gravity.
 *
 * kG = kA * g * comLength * comMass / J
 *
 * Returns the voltage required to hold the mechanism horizontal against
 * gravity (maximum gravity torque case). Caller is responsible for scaling
 * by cos(angle-from-horizontal) if a non-horizontal holding voltage is needed.
 *
 * momentOfInertia is divided by 1 rad (via `removeRad()`) to cancel the
 * `/rad` baked into kA by `calculateAngularFeedforwardKa`, so the result
 * reduces to plain volts.
 *
 * @returns V
 */
export function calculateAngularFeedforwardKg(
  kA: Measurement,
  momentOfInertia: Measurement,
  comMass: Measurement,
  comLength: Measurement,
): Measurement {
  if (momentOfInertia.scalar === 0) {
    return new Measurement(0, 'V');
  }

  return kA
    .mul(Measurement.GRAVITY.negate())
    .mul(comLength)
    .mul(comMass)
    .div(momentOfInertia.removeRad());
}

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
  const sqrtDisc = new Measurement(Math.sqrt(disc.to('V^2').scalar), 'V');
  const numerator = sqrtDisc.sub(kG.mul(2 - eta));
  return numerator.div(kV.mul(2 * (1 - eta)));
}

export function calculateKg(
  stallTorque: Measurement,
  radius: Measurement,
  mass: Measurement,
): Measurement {
  if (stallTorque.scalar == 0) {
    return new Measurement(0, 'V');
  }

  return nominalVoltage
    .mul(mass.mul(new Measurement(1, 'gee')))
    .mul(radius)
    .div(stallTorque);
}

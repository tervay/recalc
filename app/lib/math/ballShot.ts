import Measurement from '~/lib/models/Measurement';

export interface ShotResult {
  /** Ball translational exit velocity. */
  exitVelocity: Measurement;
  /** Ball angular velocity at exit (pure rolling). */
  exitSpinRate: Measurement;
  /** Flywheel angular velocity after the shot. */
  postShotOmega: Measurement;
  /** Total kinetic energy transferred to the ball (translational + rotational). */
  ballKineticEnergy: Measurement;
  /** Energy extracted from the flywheel (= ball KE for the ideal grip model). */
  flywheelEnergyLost: Measurement;
}

/**
 * Models a single ball passing through a flywheel shooter using the Lynbrook
 * rolling-contact model (Lynbrook Robotics, 2012).
 *
 * The ball is modelled as a solid sphere that rolls without slip on the shooter
 * wheel surface. The no-slip constraint at the contact point means the ball's
 * exit velocity is 2/7 of the final wheel surface speed:
 *
 *   Contact no-slip: V_b + ω_bf·R_b = ωf·r
 *   Ball spin (solid sphere, I_b = 2/5·m·R_b²): ω_bf = 5·V_b / (2·R_b)
 *   → V_b·(7/2) = ωf·r   →   V_b = (2/7)·ωf·r
 *
 * Combined with flywheel angular momentum conservation:
 *
 *   I·(ω₀ − ωf) = m·V_b·r
 *   → ωf = 7I·ω₀ / (7I + 2·m·r²)
 *   → V_b = 2·I·ω₀·r / (7I + 2·m·r²)
 *
 * As I → ∞ this gives ωf → ω₀ (correct limit). Ball KE includes both
 * translational and rotational components: KE_ball = (7/10)·m·V_b².
 * The difference between flywheel energy lost and ball KE is frictional heat
 * generated during the grip phase.
 *
 * @param flywheelOmega   - Pre-shot angular velocity of the flywheel (load side)
 * @param shooterRadius   - Radius of the shooter wheel (contact radius)
 * @param combinedMOI     - Combined flywheel + shooter MOI (load side)
 * @param ballMass        - Mass of the ball
 * @param ballRadius      - Radius of the ball (for spin rate display)
 * @returns ShotResult with post-shot flywheel speed, ball exit velocity, etc.
 */
export function computeShotResult(
  flywheelOmega: Measurement,
  shooterRadius: Measurement,
  combinedMOI: Measurement,
  ballMass: Measurement,
  ballRadius: Measurement,
): ShotResult {
  const omega0 = flywheelOmega.to('rad/s').scalar;
  const r = shooterRadius.to('m').scalar;
  const I = combinedMOI.to('kg*m^2').scalar;
  const m = ballMass.to('kg').scalar;
  const rBall = ballRadius.to('m').scalar;

  if (I === 0 || r === 0 || omega0 === 0) {
    const zero = new Measurement(0, 'J');
    return {
      exitVelocity: new Measurement(0, 'm/s'),
      exitSpinRate: new Measurement(0, 'rpm'),
      postShotOmega: new Measurement(0, 'rad/s'),
      ballKineticEnergy: zero,
      flywheelEnergyLost: zero,
    };
  }

  // Lynbrook rolling-contact model:
  //   ωf = 7I·ω₀ / (7I + 2·m·r²)
  //   V_b = (2/7)·ωf·r
  const omegaF = (7 * I * omega0) / (7 * I + 2 * m * r * r);
  const vExit = (2 / 7) * omegaF * r;

  // Ball spin at exit (solid sphere rolling): ω_bf = 5·V_b / (2·R_b)
  const spinRadS = rBall > 0 ? (5 * vExit) / (2 * rBall) : 0;
  const spinRpm = (spinRadS * 60) / (2 * Math.PI);

  // Ball total KE = (7/10)·m·V_b² (translational + rotational for solid sphere)
  const ballKEJ = (7 / 10) * m * vExit * vExit;

  // Flywheel energy actually extracted
  const flywheelKE0 = 0.5 * I * omega0 * omega0;
  const flywheelKEf = 0.5 * I * omegaF * omegaF;
  const energyLostJ = flywheelKE0 - flywheelKEf;

  return {
    exitVelocity: new Measurement(vExit, 'm/s'),
    exitSpinRate: new Measurement(spinRpm, 'rpm'),
    postShotOmega: new Measurement(omegaF, 'rad/s'),
    ballKineticEnergy: new Measurement(ballKEJ, 'J'),
    flywheelEnergyLost: new Measurement(energyLostJ, 'J'),
  };
}

import Measurement from '~/lib/models/Measurement';
import Motor from '~/lib/models/Motor';
import type Ratio from '~/lib/models/Ratio';
import { MotorRules } from '~/lib/rules';

const CASCADE_LOAD_FACTOR = 2.0;
const CASCADE_TRAVEL_FACTOR = 0.5;
const ACCEL_GUESS_FACTOR = 0.8;
const VELO_GUESS_FACTOR = 0.9;
const PROFILE_TRACKING_MARGIN = 2.0;

export function calculateStallLoad(
  motor: Motor,
  currentLimit: Measurement,
  spoolDiameter: Measurement,
  ratio: Ratio,
  efficiency: number,
  statorVoltage: Measurement,
): Measurement {
  if ([spoolDiameter.scalar].includes(0)) {
    return new Measurement(0, 'lb');
  }

  return new MotorRules(motor, currentLimit, {
    current: currentLimit,
    voltage: statorVoltage,
  })
    .solve()
    .torque.mul(motor.quantity)
    .mul(ratio.asNumber())
    .mul(efficiency / 100)
    .div(spoolDiameter.div(2))
    .div(Measurement.GRAVITY)
    .negate();
}

export function calculateGuessedLimits(
  motor: Motor,
  ratio: Ratio,
  load: Measurement,
  spoolDiameter: Measurement,
  statorLimit: Measurement,
  supplyLimit: Measurement,
  supplyVoltage: Measurement,
  angle: Measurement,
  efficiency: number,
  cascade: boolean,
  rVolts: Measurement = new Measurement(12, 'V'),
  travelDistance: Measurement | null = null,
) {
  if (
    Measurement.anyAreZero(
      spoolDiameter,
      ratio.asNumber(),
      load,
      efficiency,
      motor.quantity,
    )
  ) {
    return {
      v_max_guessed: new Measurement(0, 'm/s'),
      a_max_guessed: new Measurement(0, 'm/s^2'),
    };
  }

  const G = ratio.asNumber();
  const r = spoolDiameter.div(2).to('m');
  let m = load;
  const eta = efficiency / 100;
  const angleRad = angle.to('rad').scalar;

  if (cascade) {
    m = m.mul(CASCADE_LOAD_FACTOR);
  }

  const stallCurrent = motor.stallCurrent;
  const voltage = motor.voltage;

  const R_motor = voltage.div(stallCurrent);
  const R_equivalent = R_motor.div(motor.quantity);
  const Kt = motor.kT;
  const Kv = motor.kV;

  // 1. Max Accel (Stator, Supply, or Voltage Limited)
  // At stall: Pin = Pout => V_batt * I_supply = I_stator^2 * R
  const I_supply_limit = supplyLimit.mul(motor.quantity);
  const powerLimit = supplyVoltage.mul(I_supply_limit);
  const I_stator_max_from_supply_sq = powerLimit.div(R_equivalent);
  const I_stator_max_from_supply = new Measurement(
    Math.sqrt(Math.max(0, I_stator_max_from_supply_sq.to('A^2').scalar)),
    'A',
  );
  const I_stator_limit = statorLimit.mul(motor.quantity);
  // At stall with max voltage rVolts: I_per_motor = rVolts / R_motor
  const I_stator_max_from_voltage = rVolts.div(R_motor).mul(motor.quantity);
  const I_eff_accel = Measurement.min(
    Measurement.min(I_stator_limit, I_stator_max_from_supply),
    I_stator_max_from_voltage,
  );

  const F_gravity = m.mul(Measurement.GRAVITY.abs()).mul(Math.sin(angleRad));
  const F_max = I_eff_accel.mul(Kt).mul(G).mul(eta).div(r);
  const a_max_theoretical = F_max.sub(F_gravity).div(m);
  const a_max_guessed = Measurement.max(
    new Measurement(0.1, 'm/s^2'),
    a_max_theoretical.mul(ACCEL_GUESS_FACTOR),
  );

  // 2. Max Velocity (Voltage, Supply, or Control Effort Limited)
  // Holding current needed to fight gravity at steady state (a=0)
  const I_gravity = F_gravity.div(Kt.mul(G).mul(eta).div(r));
  const V_resistance_drop = I_gravity.mul(R_equivalent);

  // Velocity is limited by Back-EMF (V_emf).
  const V_emf_voltage_limited = supplyVoltage.sub(V_resistance_drop);
  const V_emf_supply_limited = powerLimit
    .div(Measurement.max(new Measurement(0.01, 'A'), I_gravity))
    .sub(V_resistance_drop);
  const V_emf_rVolts_limited = rVolts.sub(V_resistance_drop);

  const V_emf_max = Measurement.min(
    Measurement.min(
      V_emf_voltage_limited.forcePositive(),
      V_emf_supply_limited.forcePositive(),
    ),
    V_emf_rVolts_limited.forcePositive(),
  );
  const v_max_theoretical = V_emf_max.mul(Kv).mul(r).div(G).removeRad();
  const v_max_guessed = Measurement.max(
    new Measurement(0.1, 'm/s'),
    v_max_theoretical.mul(VELO_GUESS_FACTOR),
  );

  if (travelDistance === null) {
    return { v_max_guessed, a_max_guessed };
  }

  const feasible = powerFeasibleProfile({
    distanceMeters:
      travelDistance.to('m').scalar * (cascade ? CASCADE_TRAVEL_FACTOR : 1),
    velocityCapMPS: v_max_theoretical.to('m/s').scalar,
    accelCapMPS2: a_max_theoretical.to('m/s^2').scalar,
    guessVelocityMPS: v_max_guessed.to('m/s').scalar,
    guessAccelMPS2: a_max_guessed.to('m/s^2').scalar,
    massKg: m.to('kg').scalar,
    gravityForceN: F_gravity.to('N').scalar,
    equivalentResistanceOhms: R_equivalent.to('Ohm').scalar,
    statorLimitAmps: I_stator_limit.to('A').scalar,
    supplyPowerWatts: powerLimit.to('W').scalar,
    controlVolts: rVolts.to('V').scalar,
    forcePerAmp: Kt.mul(G).mul(eta).div(r).baseScalar,
    mpsPerBackEmfVolt: new Measurement(1, 'V').mul(Kv).mul(r).div(G).removeRad()
      .baseScalar,
  });

  if (feasible === null) {
    return { v_max_guessed, a_max_guessed };
  }

  return {
    v_max_guessed: Measurement.max(
      new Measurement(0.1, 'm/s'),
      new Measurement(feasible.velocityMPS * VELO_GUESS_FACTOR, 'm/s'),
    ),
    a_max_guessed: Measurement.max(
      new Measurement(0.1, 'm/s^2'),
      new Measurement(feasible.accelMPS2 * ACCEL_GUESS_FACTOR, 'm/s^2'),
    ),
  };
}

interface PowerFeasibleInput {
  distanceMeters: number;
  velocityCapMPS: number;
  accelCapMPS2: number;
  guessVelocityMPS: number;
  guessAccelMPS2: number;
  massKg: number;
  gravityForceN: number;
  equivalentResistanceOhms: number;
  statorLimitAmps: number;
  supplyPowerWatts: number;
  controlVolts: number;
  forcePerAmp: number;
  mpsPerBackEmfVolt: number;
}

function powerFeasibleProfile(
  i: PowerFeasibleInput,
): { velocityMPS: number; accelMPS2: number } | null {
  if (
    !Number.isFinite(i.distanceMeters) ||
    i.distanceMeters <= 0 ||
    i.velocityCapMPS <= 0 ||
    i.accelCapMPS2 <= 0
  ) {
    return null;
  }

  const achievableAccelAt = (velocityMPS: number): number => {
    const backEmfVolts = velocityMPS / i.mpsPerBackEmfVolt;
    const supplyLimitedAmps =
      (-backEmfVolts +
        Math.sqrt(
          backEmfVolts * backEmfVolts +
            4 * i.equivalentResistanceOhms * i.supplyPowerWatts,
        )) /
      (2 * i.equivalentResistanceOhms);
    const voltageLimitedAmps =
      Math.max(0, i.controlVolts - backEmfVolts) / i.equivalentResistanceOhms;
    const effectiveAmps = Math.min(
      i.statorLimitAmps,
      supplyLimitedAmps,
      voltageLimitedAmps,
    );
    return (effectiveAmps * i.forcePerAmp - i.gravityForceN) / i.massKg;
  };

  const peakVelocity = (cruiseMPS: number, accel: number): number =>
    Math.min(cruiseMPS, Math.sqrt(accel * i.distanceMeters));

  const guessPeak = peakVelocity(i.guessVelocityMPS, i.guessAccelMPS2);
  if (
    i.guessAccelMPS2 <=
    PROFILE_TRACKING_MARGIN * achievableAccelAt(guessPeak)
  ) {
    return null;
  }

  let best: {
    velocityMPS: number;
    accelMPS2: number;
    timeSeconds: number;
  } | null = null;

  const steps = 400;
  for (let step = 1; step <= steps; step++) {
    const cruiseMPS = (step / steps) * i.velocityCapMPS;
    const accel = Math.min(
      i.accelCapMPS2,
      PROFILE_TRACKING_MARGIN *
        achievableAccelAt(peakVelocity(cruiseMPS, i.accelCapMPS2)),
    );
    if (accel <= 0.1) {
      continue;
    }

    let velocityMPS: number;
    let timeSeconds: number;
    if ((cruiseMPS * cruiseMPS) / accel >= i.distanceMeters) {
      velocityMPS = Math.sqrt(accel * i.distanceMeters);
      timeSeconds = 2 * Math.sqrt(i.distanceMeters / accel);
    } else {
      velocityMPS = cruiseMPS;
      timeSeconds = cruiseMPS / accel + i.distanceMeters / cruiseMPS;
    }

    if (best === null || timeSeconds < best.timeSeconds) {
      best = { velocityMPS, accelMPS2: accel, timeSeconds };
    }
  }

  return best;
}

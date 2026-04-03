import Measurement from '~/lib/models/Measurement';
import Motor from '~/lib/models/Motor';
import type Ratio from '~/lib/models/Ratio';
import { MotorRules } from '~/lib/rules';

const CASCADE_LOAD_FACTOR = 2.0;
const ACCEL_GUESS_FACTOR = 0.8;
const VELO_GUESS_FACTOR = 0.9;

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
) {
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
  const Kt = motor.kT;
  const Kv = motor.kV;

  // 1. Max Accel (Stator OR Supply Limited)
  // At stall: Pin = Pout => V_batt * I_supply = I_stator^2 * R
  const I_supply_limit = supplyLimit.mul(motor.quantity);
  const powerLimit = supplyVoltage.mul(I_supply_limit);
  const I_stator_max_from_supply_sq = powerLimit.div(R_motor);
  const I_stator_max_from_supply = new Measurement(
    Math.sqrt(Math.max(0, I_stator_max_from_supply_sq.to('A^2').scalar)),
    'A',
  );
  const I_stator_limit = statorLimit.mul(motor.quantity);
  const I_eff_accel = Measurement.min(I_stator_limit, I_stator_max_from_supply);

  const F_gravity = m.mul(Measurement.GRAVITY.abs()).mul(Math.sin(angleRad));
  const F_max = I_eff_accel.mul(Kt).mul(G).mul(eta).div(r);
  const a_max_theoretical = F_max.sub(F_gravity).div(m);
  const a_max_guessed = Measurement.max(
    new Measurement(0.1, 'm/s^2'),
    a_max_theoretical.mul(ACCEL_GUESS_FACTOR),
  );

  // 2. Max Velocity (Voltage OR Supply Limited)
  // Holding current needed to fight gravity at steady state (a=0)
  const I_gravity = F_gravity.div(Kt.mul(G).mul(eta).div(r));

  // Velocity is limited by Back-EMF (V_emf).
  const V_emf_voltage_limited = supplyVoltage.sub(I_gravity.mul(R_motor));
  const V_emf_supply_limited = powerLimit
    .div(Measurement.max(new Measurement(0.01, 'A'), I_gravity))
    .sub(I_gravity.mul(R_motor));

  const V_emf_max = Measurement.min(
    V_emf_voltage_limited.forcePositive(),
    V_emf_supply_limited.forcePositive(),
  );
  const v_max_theoretical = V_emf_max.mul(Kv).mul(r).div(G).removeRad();
  const v_max_guessed = Measurement.max(
    new Measurement(0.1, 'm/s'),
    v_max_theoretical.mul(VELO_GUESS_FACTOR),
  );

  return { v_max_guessed, a_max_guessed };
}

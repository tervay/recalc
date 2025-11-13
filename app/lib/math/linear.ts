import Measurement from '~/lib/models/Measurement';
import Motor from '~/lib/models/Motor';
import type Ratio from '~/lib/models/Ratio';
import { MotorRules } from '~/lib/rules';

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

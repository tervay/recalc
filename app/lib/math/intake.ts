import Measurement from '~/lib/models/Measurement';
import Motor, { ALL_MOTORS } from '~/lib/models/Motor';
import Ratio, { RatioType } from '~/lib/models/Ratio';

export function calculateRecommendedRatio(
  motor: Motor,
  drivetrainSpeed: Measurement,
  rollerDiameter: Measurement,
): Ratio {
  const targetSpeed = drivetrainSpeed.mul(2);
  if (targetSpeed.scalar === 0) {
    return new Ratio(1);
  }

  return new Ratio(
    rollerDiameter.div(2).mul(motor.freeSpeed).removeRad().div(targetSpeed)
      .scalar,
    RatioType.REDUCTION,
  );
}

export function calculateAllRecommendedRatiosAndStallTorques(
  drivetrainSpeed: Measurement,
  rollerDiameter: Measurement,
  motorQuantity: number,
  statorCurrentLimit: Measurement,
): {
  ratio: Ratio;
  stallTorque: Measurement;
  motor: Motor;
}[] {
  return ALL_MOTORS.map((ms) => Motor.fromSpecs(ms, motorQuantity)).map((m) => {
    const ratio = calculateRecommendedRatio(m, drivetrainSpeed, rollerDiameter);
    const stallTorque = m.kT
      .mul(statorCurrentLimit)
      .mul(motorQuantity)
      .mul(ratio.asNumber())
      .to('N*m');

    return {
      ratio,
      stallTorque,
      motor: m,
    };
  });
}

export function calculateLinearSurfaceSpeed(
  motor: Motor,
  ratio: Ratio,
  rollerDiameter: Measurement,
): Measurement {
  if (ratio.asNumber() === 0) {
    return new Measurement(0, 'ft/s');
  }

  return motor.freeSpeed
    .div(ratio.asNumber())
    .mul(rollerDiameter.div(2))
    .removeRad();
}

import Measurement from '~/lib/models/Measurement';
import type Motor from '~/lib/models/Motor';
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
    rollerDiameter
      .div(2)
      .mul(motor.freeSpeed)
      .removeRad()
      .div(targetSpeed).scalar,
    RatioType.REDUCTION,
  );
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

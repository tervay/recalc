import Measurement from "common/models/Measurement";
import Motor from "common/models/Motor";
import Ratio, { RatioType } from "common/models/Ratio";

export function calculateRecommendedRatio(
  motor: Motor,
  drivetrainSpeed: Measurement,
  rollerDiameter: Measurement
): Ratio {
  const targetSpeed = drivetrainSpeed.mul(2);
  if (Measurement.anyAreZero(targetSpeed)) {
    return new Ratio(1);
  }

  return new Ratio(
    rollerDiameter
      .div(2)
      .mul(motor.freeSpeed)
      .removeRad()
      .div(targetSpeed).scalar,
    RatioType.REDUCTION
  );
}

export function calculateLinearSurfaceSpeed(
  motor: Motor,
  ratio: Ratio,
  rollerDiameter: Measurement
): Measurement {
  return motor.freeSpeed
    .div(ratio.asNumber())
    .mul(rollerDiameter.div(2))
    .removeRad();
}

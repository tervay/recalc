import Measurement from "common/models/Measurement";

/**
 *
 * @param {Motor} motor
 * @param {Ratio} ratio
 * @param {Measurement} armLength
 * @param {Measurement} armLoad
 * @param {Measurement} angleChange
 */
export function calculateTimeToGoalJVN(
  motor,
  ratio,
  armLength,
  armLoad,
  angleChange
) {
  if (
    armLength.scalar === 0 ||
    motor.quantity === 0 ||
    ratio.asNumber() === 0 ||
    armLoad.scalar === 0
  ) {
    return new Measurement(0, "s");
  }

  const stallLoad = motor.stallTorque
    .mul(motor.quantity)
    .mul(ratio.asNumber())
    .div(armLength);

  const unloadedSpeed = motor.freeSpeed.div(ratio.asNumber());
  const loadedSpeed = unloadedSpeed
    .mul(-1)
    .div(stallLoad)
    .mul(armLoad)
    .add(unloadedSpeed);

  return angleChange.div(loadedSpeed);
}

/**
 *
 * @param {Measurement} armLength
 * @param {Measurement} startingAngle
 * @param {Measurement} endingAngle
 */
export function calculateTravelDistance(armLength, startingAngle, endingAngle) {
  return endingAngle.sub(startingAngle).mul(armLength);
}

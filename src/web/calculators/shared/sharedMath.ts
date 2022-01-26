import Measurement from "common/models/Measurement";

export function calculateKv(
  maxSpeed: Measurement,
  radius: Measurement,
  maxVoltage: Measurement
): Measurement {
  return maxVoltage.div(maxSpeed.mul(radius).div(new Measurement(1, "radian")));
}

export function calculateKa(
  stallTorque: Measurement,
  radius: Measurement,
  mass: Measurement,
  maxVoltage: Measurement
): Measurement {
  return maxVoltage.mul(mass).mul(radius).div(stallTorque);
}

export function calculateKg(
  stallTorque: Measurement,
  radius: Measurement,
  mass: Measurement,
  maxVoltage: Measurement
): Measurement {
  return maxVoltage
    .mul(mass.mul(new Measurement(1, "gee")))
    .mul(radius)
    .div(stallTorque);
}

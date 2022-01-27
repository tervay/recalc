import Measurement from "common/models/Measurement";
import { nominalVoltage } from "common/models/Motor";

export function calculateKv(
  maxSpeed: Measurement,
  radius: Measurement
): Measurement {
  return nominalVoltage.div(
    maxSpeed.mul(radius).div(new Measurement(1, "radian"))
  );
}

export function calculateKa(
  stallTorque: Measurement,
  radius: Measurement,
  mass: Measurement
): Measurement {
  return nominalVoltage.mul(mass).mul(radius).div(stallTorque);
}

export function calculateKg(
  stallTorque: Measurement,
  radius: Measurement,
  mass: Measurement
): Measurement {
  return nominalVoltage
    .mul(mass.mul(new Measurement(1, "gee")))
    .mul(radius)
    .div(stallTorque);
}

import Measurement from "common/models/Measurement";
import { nominalVoltage } from "common/models/Motor";

export function calculateKv(
  maxSpeed: Measurement,
  radius: Measurement,
): Measurement {
  if ([maxSpeed.scalar, radius.scalar].includes(0)) {
    const denominatorUnits = radius.units().includes("rad") ? "rad" : "m";
    return new Measurement(0, `V*s/${denominatorUnits}`);
  }

  return nominalVoltage.div(
    maxSpeed.mul(radius).div(new Measurement(1, "radian")),
  );
}

export function calculateKa(
  stallTorque: Measurement,
  radius: Measurement,
  mass: Measurement,
): Measurement {
  if (stallTorque.scalar == 0) {
    const denominatorUnits = radius.units().includes("rad") ? "rad" : "m";
    return new Measurement(0, `V*s^2/${denominatorUnits}`);
  }

  return nominalVoltage.mul(mass).mul(radius).div(stallTorque);
}

export function calculateKg(
  stallTorque: Measurement,
  radius: Measurement,
  mass: Measurement,
): Measurement {
  if (stallTorque.scalar == 0) {
    return new Measurement(0, "V");
  }

  return nominalVoltage
    .mul(mass.mul(new Measurement(1, "gee")))
    .mul(radius)
    .div(stallTorque);
}

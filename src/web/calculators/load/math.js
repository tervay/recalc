import Measurement from "common/models/Measurement";
import { motorRules, MotorState, nominalVoltage } from "common/models/Motor";

function guessLewisYFactor(teeth, pressureAngle) {
  // https://keisan.casio.com/exec/system/14059932105271
  // Inverse regression for y = A + B/x
  return {
    14.5: 0.3897948785 - 2.154375 / teeth,
    20: 0.463031954 - 2.71502659 / teeth,
  }[pressureAngle.scalar];
}

function calculateSafeToothLoad(
  teeth,
  material,
  width,
  diametralPitch,
  pressureAngle
) {
  return material
    .getSafeMaterialStrength()
    .mul(width)
    .mul(guessLewisYFactor(teeth, pressureAngle))
    .div(diametralPitch);
}

export function calculateState(
  motor,
  planetaryRatio,
  currentLimit,
  diametralPitch,
  pressureAngle,
  pinionTeeth,
  pinionMaterial,
  gearTeeth,
  gearMaterial,
  pinionWidth,
  gearWidth
) {
  const ms = new MotorState(motor, currentLimit, {
    current: Measurement.min(currentLimit, motor.stallCurrent),
    voltage: nominalVoltage,
  });
  motorRules.solve(ms);

  if (
    motor.quantity === 0 ||
    pinionTeeth.toString() === "0" ||
    pinionTeeth.toString() === "-" ||
    pinionTeeth.toString().length === 0 ||
    gearTeeth.toString() === "0" ||
    gearTeeth.toString() === "-" ||
    gearTeeth.toString().length === 0 ||
    diametralPitch.scalar === 0 ||
    currentLimit.scalar === 0 ||
    pinionWidth.scalar === 0 ||
    gearWidth.scalar === 0 ||
    ms.torque.scalar === 0 ||
    planetaryRatio.magnitude === 0
  ) {
    return {
      pinion: {
        stallForce: new Measurement(0, "lbf"),
        safeLoad: new Measurement(0, "lbf"),
      },
      gear: {
        stallForce: new Measurement(0, "lbf"),
        safeLoad: new Measurement(0, "lbf"),
      },
    };
  }

  const pinionSafeToothLoad = calculateSafeToothLoad(
    pinionTeeth,
    pinionMaterial,
    pinionWidth,
    diametralPitch,
    pressureAngle
  );

  const pinionAxleTorque = ms.torque.mul(planetaryRatio.asNumber());
  const pinionPitchRadius = diametralPitch.div(pinionTeeth).inverse().div(2);
  const pinionOutputForce = pinionAxleTorque.div(pinionPitchRadius);

  const stallForceOnPinion = pinionOutputForce;

  const gearInputForce = pinionOutputForce;
  const gearPitchRadius = diametralPitch.div(gearTeeth).inverse().div(2);
  const gearAxleTorque = gearInputForce
    .mul(motor.quantity)
    .mul(gearPitchRadius);
  const gearOutputForce = gearAxleTorque.div(gearPitchRadius);
  const stallForceOnGear = Measurement.max(gearInputForce, gearOutputForce);
  const gearSafeToothLoad = calculateSafeToothLoad(
    gearTeeth,
    gearMaterial,
    gearWidth,
    diametralPitch,
    pressureAngle
  );

  return {
    pinion: {
      stallForce: stallForceOnPinion,
      safeLoad: pinionSafeToothLoad,
    },
    gear: {
      stallForce: stallForceOnGear,
      safeLoad: gearSafeToothLoad,
    },
  };
}

export const testables = { guessLewisYFactor, calculateSafeToothLoad };

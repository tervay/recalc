import Measurement from "common/models/Measurement";
import { MotorState, nominalVoltage } from "common/models/Motor";
import { objectify, unobjectify } from "common/tooling/util";

/**
 *
 * @param {Motor} motor
 * @param {Ratio} ratio
 * @param {Measurement} armLength
 * @param {Measurement} armMass
 * @param {Measurement} angleChange
 */
export function calculateTimeToGoalJVN(
  motor,
  ratio,
  armLength,
  armMass,
  angleChange
) {
  if (
    armLength.scalar === 0 ||
    motor.quantity === 0 ||
    ratio.asNumber() === 0 ||
    armMass.scalar === 0
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
    .mul(armMass)
    .mul(Measurement.GRAVITY)
    .add(unloadedSpeed);

  return angleChange.div(loadedSpeed);
}

/**
 *
 * @param {Measurement} comLength
 * @param {Measurement} armMass
 * @param {Measurement} currentAngle
 * @return {Measurement}
 */
export function calculateArmTorque(comLength, armMass, currentAngle) {
  return comLength
    .mul(armMass)
    .mul(Measurement.GRAVITY)
    .mul(Math.cos(currentAngle.to("rad").scalar));
}

/**
 *
 * @param {Measurement} comLength
 * @param {Measurement} armMass
 */
export function calculateArmInertia(comLength, armMass) {
  return armMass.mul(comLength).mul(comLength);
}

export function calculateState({
  motor,
  ratio,
  comLength,
  armMass,
  currentLimit,
  startAngle,
  endAngle,
  iterationLimit,
}) {
  ({
    motor,
    ratio,
    comLength,
    armMass,
    currentLimit,
    startAngle,
    endAngle,
    iterationLimit,
  } = unobjectify(...arguments));

  if (
    motor.quantity === 0 ||
    ratio.asNumber() === 0 ||
    comLength.scalar === 0 ||
    armMass.scalar === 0 ||
    currentLimit.scalar === 0
  ) {
    return [];
  }

  let states = [];
  let currentArmAngle = startAngle;
  let currentArmRpm = new Measurement(0, "rpm");
  let currentTime = new Measurement(0, "s");
  let currentMotorRpm = new Measurement(0, "rpm");
  let n = 0;
  const timeDelta = new Measurement(0.0005, "s");

  while (currentArmAngle.baseScalar < endAngle.baseScalar) {
    n++;

    currentTime = currentTime.add(timeDelta);
    const inertia = calculateArmInertia(comLength, armMass);
    const gravitationalTorque = calculateArmTorque(
      comLength,
      armMass,
      currentArmAngle
    );

    const ms = new MotorState(motor, currentLimit, {
      rpm: currentMotorRpm,
      voltage: nominalVoltage,
    }).solve();

    const outputTorque = ms.torque.mul(motor.quantity).mul(ratio.asNumber());

    const netArmTorque = outputTorque
      .add(gravitationalTorque)
      .mul(new Measurement(1, "rad"));

    if (netArmTorque.removeRad().lt(new Measurement(0, "J"))) {
      if (currentMotorRpm.eq(motor.freeSpeed)) {
        console.log("system too fast");
      }
      return [];
    }

    const armAngularAccel = netArmTorque.div(inertia);
    currentArmRpm = currentArmRpm.add(armAngularAccel.mul(timeDelta));
    currentArmAngle = currentArmAngle.add(currentArmRpm.mul(timeDelta));

    currentMotorRpm = currentArmRpm
      .mul(ratio.asNumber())
      .clamp(motor.freeSpeed.negate(), motor.freeSpeed);

    states.push({
      time: currentTime,
      current: ms.current,
      position: currentArmAngle,
    });

    if (n > iterationLimit) {
      return [];
    }
  }

  return states.map((s) => objectify(s));
}

export function buildDataForAccessorVsTime(states, accessor, includeZeros) {
  return states.map((s) => {
    if (accessor(s) !== 0 || includeZeros) {
      return {
        y: accessor(s),
        x: s.time.scalar,
      };
    }
  });
}

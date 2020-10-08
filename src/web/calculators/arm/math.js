import Measurement from "common/models/Measurement";
import { receiveFromMain } from "common/tooling/util";

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
 * @param {Measurement} armLength
 * @param {Measurement} startingAngle
 * @param {Measurement} endingAngle
 */
export function calculateTravelDistance(armLength, startingAngle, endingAngle) {
  return endingAngle.sub(startingAngle).mul(armLength);
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

/**
 *
 * @param {Motor} motor
 * @param {Ratio} ratio
 * @param {Measurement} comLength
 * @param {Measurement} armMass
 * @param {Measurement} startAngle
 * @param {Measurement} endAngle
 * @param {Number} iterationLimit
 */
export function calculateState({
  motor,
  ratio,
  comLength,
  armMass,
  startAngle,
  endAngle,
  iterationLimit,
}) {
  ({
    motor,
    ratio,
    comLength,
    armMass,
    startAngle,
    endAngle,
    iterationLimit,
  } = receiveFromMain(...arguments));

  let states = [];
  let currentAngle = startAngle;
  let currentVelocity = new Measurement(0, "rad/s");
  let currentTime = new Measurement(0, "s");

  states.push({
    a: new Measurement(0, "rad/s^2").toDict(),
    v: new Measurement(0, "rad/s").toDict(),
    p: startAngle.toDict(),
    t: new Measurement(0, "s").toDict(),
    gt: new Measurement(0, "N m").toDict(),
    gb: new Measurement(0, "N m").toDict(),
    c: new Measurement(0, "A").toDict(),
  });

  if (
    motor.quantity === 0 ||
    ratio.asNumber() === 0 ||
    comLength.scalar === 0 ||
    armMass.scalar === 0
  ) {
    return states;
  }

  const timeDelta = new Measurement(0.0005, "s");
  const gearboxMaxSpeed = motor.freeSpeed.div(ratio.asNumber());

  let n = 0;

  const sign = endAngle.sub(startAngle).sign();
  while (currentAngle.baseScalar * sign < endAngle.baseScalar * sign) {
    // gearbox torque - gravity torque = inertia * angular accel
    // angular accel = (gearbox - gravity) / inertia
    const inertia = calculateArmInertia(comLength, armMass);
    const gravitationalTorque = calculateArmTorque(
      comLength,
      armMass,
      currentAngle
    );

    const gearboxTorque = motor
      .getTorque(Measurement.fromDict(states[states.length - 1].v))
      .mul(motor.quantity)
      .mul(ratio.asNumber())
      .mul(sign);

    const currentAccel = gearboxTorque
      .add(gravitationalTorque)
      .div(inertia)
      .mul(new Measurement(1, "rad"));

    currentTime = currentTime.add(timeDelta);
    currentAngle = currentAngle.add(currentVelocity.mul(timeDelta));
    currentVelocity = currentVelocity
      .add(currentAccel.mul(timeDelta))
      .clamp(gearboxMaxSpeed.negate(), gearboxMaxSpeed);

    const currentDraw = motor.kT
      .inverse()
      .mul(motor.getTorque(currentVelocity.div(ratio.asNumber())));

    states.push({
      a: currentAccel.toDict(),
      v: currentVelocity.toDict(),
      t: currentTime.toDict(),
      p: currentAngle.toDict(),
      gt: gravitationalTorque.toDict(),
      gb: gearboxTorque.toDict(),
      c: currentDraw.toDict(),
    });

    n++;
    if (n > iterationLimit) {
      states = [
        {
          a: new Measurement(0, "rad/s^2").toDict(),
          v: new Measurement(0, "rad/s").toDict(),
          p: startAngle.toDict(),
          t: new Measurement(0, "s").toDict(),
          gt: new Measurement(0, "N m").toDict(),
          gb: new Measurement(0, "N m").toDict(),
          c: new Measurement(0, "A").toDict(),
        },
      ];
      break;
    }
  }

  return states;
}

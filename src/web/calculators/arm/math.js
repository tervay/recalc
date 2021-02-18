import Measurement from "common/models/Measurement";
import { receiveFromMain, sendToWorker } from "common/tooling/util";
import Motor, { MotorState, nominalVoltage } from "common/models/Motor";

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

// eslint-disable-next-line no-unused-vars
function gbToMotor(torque, velocity, acceleration, ratio) {
  return {
    t: torque.div(ratio),
    v: velocity.mul(ratio),
    a: acceleration.mul(ratio),
  };
}

/**
 *
 * @param {Motor} motor
 * @param {Ratio} ratio
 * @param {Measurement} comLength
 * @param {Measurement} armMass
 * @param {Measurement} currentLimit
 * @param {Measurement} startAngle
 * @param {Measurement} endAngle
 * @param {Number} iterationLimit
 */
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
  } = receiveFromMain(...arguments));

  let states = [];
  let currentArmAngle = startAngle;
  let currentTime = new Measurement(0, "s");

  if (
    motor.quantity === 0 ||
    ratio.asNumber() === 0 ||
    comLength.scalar === 0 ||
    armMass.scalar === 0 ||
    currentLimit.scalar === 0
  ) {
    return states.map((s) => sendToWorker(s));
  }

  const timeDelta = new Measurement(0.0005, "s");

  let n = 0;

  const sign = endAngle.sub(startAngle).sign();

  const baseState = {
    t: new Measurement(0, "s"),
    p: new Measurement(0, "rad"),
    gt: new Measurement(0, "N m"),
    c: new Measurement(0, "A"),
    gb: {
      a: new Measurement(0, "rad/s^2"),
      v: new Measurement(0, "rad/s"),
      t: motor.stallTorque.mul(motor.quantity).mul(ratio.asNumber()),
    },
    m: {
      a: new Measurement(0, "rad/s^2"),
      v: new Measurement(0, "rad/s"),
      t: motor.stallTorque.mul(motor.quantity),
    },
  };

  let prevState = baseState;

  let currentState;

  while (currentArmAngle.baseScalar * sign < endAngle.baseScalar * sign) {
    currentState = {
      gb: {},
      m: {},
    };

    currentTime = currentTime.add(timeDelta);
    const inertia = calculateArmInertia(comLength, armMass);
    const gravitationalTorque = calculateArmTorque(
      comLength,
      armMass,
      currentArmAngle
    );

    currentState.t = currentTime;
    currentState.gt = gravitationalTorque;

    // Calc m changes
    currentState.m.v = prevState.m.v
      .add(prevState.gb.a.mul(timeDelta).mul(ratio.asNumber()))
      .clamp(motor.freeSpeed.negate(), motor.freeSpeed);

    // currentState.m.t = motor.getTorque(currentState.m.v);
    currentState.m.t = new MotorState(motor, currentLimit, {
      voltage: nominalVoltage,
      rpm: currentState.m.v,
    }).solve().torque;

    // Calc gb changes
    currentState.gb.t = currentState.m.t.mul(ratio.asNumber());
    currentState.gb.v = currentState.m.v.div(ratio.asNumber());
    currentState.gb.a = currentState.gb.t
      .add(gravitationalTorque)
      .div(inertia)
      .mul("rad");

    // Current
    // currentState.c = motor.getCurrent(currentState.m.v);
    currentState.c = new MotorState(motor, currentLimit, {
      voltage: nominalVoltage,
      rpm: currentState.m.v,
    }).solve().current;
    currentState.p = prevState.p.add(currentState.gb.v.mul(timeDelta));
    currentArmAngle = currentState.p;

    states.push(currentState);
    prevState = currentState;

    n++;
    if (n > iterationLimit) {
      states = [baseState];
      break;
    }
  }

  return states.map((s) => sendToWorker(s));
}

export function buildDataForAccessorVsTime(states, accessor, includeZeros) {
  return states.map((s) => {
    if (accessor(s) !== 0 || includeZeros) {
      return {
        y: accessor(s),
        x: s.t.scalar,
      };
    }
  });
}

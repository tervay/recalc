import { GraphDataPoint } from "common/components/graphing/graphConfig";
import Measurement, { MeasurementDict } from "common/models/Measurement";
import Motor, { MotorDict } from "common/models/Motor";
import Ratio, { RatioDict } from "common/models/Ratio";
import { expose } from "common/tooling/promise-worker";
import { fixFloatingPoint } from "common/tooling/util";

export function calculateUnloadedSpeed(
  motor: Motor,
  spoolDiameter: Measurement,
  ratio: Ratio,
): Measurement {
  if ([ratio.asNumber(), motor.quantity].includes(0)) {
    return new Measurement(0, "ft/s");
  }

  return motor.freeSpeed
    .div(ratio.asNumber())
    .mul(spoolDiameter)
    .mul(Math.PI)
    .div(new Measurement(360, "deg"))
    .to("ft/s");
}

interface MotionProfile {
  accelerationPhaseDuration: Measurement;
  constantVelocityPhaseDuration: Measurement;
  decelerationPhaseDuration: Measurement;
  topSpeed: Measurement;
}

function planTrapezoidalMotionProfile(
  distance: Measurement,
  motorTorque: Measurement,
  maxVelocity: Measurement,
  systemMass: Measurement,
  spoolDiameter: Measurement,
  angle: Measurement,
): MotionProfile {
  if (Measurement.anyAreZero(spoolDiameter, systemMass)) {
    return {
      accelerationPhaseDuration: new Measurement(0, "s"),
      constantVelocityPhaseDuration: new Measurement(0, "s"),
      decelerationPhaseDuration: new Measurement(0, "s"),
      topSpeed: new Measurement(0, "m/s"),
    };
  }

  const observedMotorForce = motorTorque.div(spoolDiameter.div(2));
  const gravityForce = Measurement.GRAVITY.mul(systemMass).mul(
    Math.sin(angle.to("rad").scalar),
  );
  const carriageMaxVelocity = maxVelocity
    .mul(spoolDiameter.mul(Math.PI))
    .div(new Measurement(360, "deg"));

  // Calculate the distance
  // Calculate time to reach maximum velocity (half of the total distance)
  const effectiveAcceleration = observedMotorForce
    .add(gravityForce)
    .div(systemMass);

  // Calculate time to reach maximum velocity (half of the total distance)
  const timeToMaxVelocity = carriageMaxVelocity.div(effectiveAcceleration);

  // Calculate the distance covered during the acceleration phase
  const distanceDuringAcceleration = effectiveAcceleration
    .mul(0.5)
    .mul(timeToMaxVelocity)
    .mul(timeToMaxVelocity);

  if (distanceDuringAcceleration.gte(distance.div(2))) {
    const x = distance.mul(2).div(effectiveAcceleration);
    const t = new Measurement(Math.sqrt(x.to("s2").scalar), "s");

    return {
      accelerationPhaseDuration: t,
      constantVelocityPhaseDuration: new Measurement(0, "s"),
      decelerationPhaseDuration: t,
      topSpeed: new Measurement(0, "m/s"),
    };
  }

  // Calculate the distance covered during the deceleration phase
  const distanceDuringDeceleration = distanceDuringAcceleration;

  // Calculate the distance covered during the constant velocity phase
  const distanceDuringConstantVelocity = distance
    .sub(distanceDuringAcceleration)
    .sub(distanceDuringDeceleration);

  // Calculate the time for the constant velocity phase
  const timeForConstantVelocity =
    distanceDuringConstantVelocity.div(carriageMaxVelocity);

  // Calculate the durations of each phase
  const accelerationPhaseDuration = timeToMaxVelocity;
  const constantVelocityPhaseDuration = timeForConstantVelocity;
  const decelerationPhaseDuration = timeToMaxVelocity;

  return {
    accelerationPhaseDuration: accelerationPhaseDuration.to("s"),
    constantVelocityPhaseDuration: constantVelocityPhaseDuration.to("s"),
    decelerationPhaseDuration: decelerationPhaseDuration.to("s"),
    topSpeed: new Measurement(0, "m/s"),
  };
}

export function calculateProfiledTimeToGoal(
  motor: Motor,
  currentLimit: Measurement,
  ratio: Ratio,
  spoolDiameter: Measurement,
  load: Measurement,
  travelDistance: Measurement,
  angle: Measurement,
  efficiency: number,
): MotionProfile & {
  smartTimeToGoal: Measurement;
} {
  const profile = planTrapezoidalMotionProfile(
    travelDistance,
    motor.kT
      .mul(Measurement.min(currentLimit, motor.stallCurrent))
      .mul(motor.quantity)
      .mul(ratio.asNumber())
      .mul(efficiency / 100),
    motor.freeSpeed.div(ratio.asNumber()),
    load,
    spoolDiameter,
    angle,
  );

  let smartTTG;

  if (
    profile.accelerationPhaseDuration.lte(new Measurement(0, "s")) ||
    profile.decelerationPhaseDuration.lte(new Measurement(0, "s"))
  ) {
    smartTTG = new Measurement(0, "s");
    profile.accelerationPhaseDuration = new Measurement(0, "s");
    profile.decelerationPhaseDuration = new Measurement(0, "s");
    profile.constantVelocityPhaseDuration = new Measurement(0, "s");
  } else if (
    profile.constantVelocityPhaseDuration.lte(new Measurement(0, "s"))
  ) {
    profile.constantVelocityPhaseDuration = new Measurement(0, "s");
    smartTTG = profile.accelerationPhaseDuration.add(
      profile.decelerationPhaseDuration,
    );
  } else {
    smartTTG = profile.accelerationPhaseDuration
      .add(profile.constantVelocityPhaseDuration)
      .add(profile.decelerationPhaseDuration);
  }

  return { ...profile, smartTimeToGoal: smartTTG };
}

export function calculateDragLoad(
  motor: Motor,
  spoolDiameter: Measurement,
  ratio: Ratio,
  efficiency: number,
): Measurement {
  if ([spoolDiameter.scalar].includes(0)) {
    return new Measurement(0, "lb");
  }

  return motor.stallTorque
    .mul(motor.quantity)
    .mul(ratio.asNumber())
    .mul(efficiency / 100)
    .div(spoolDiameter.div(2))
    .div(Measurement.GRAVITY);
}

export function calculateLoadedSpeed(
  motor: Motor,
  spoolDiameter: Measurement,
  ratio: Ratio,
  efficiency: number,
  load: Measurement,
): Measurement {
  const dragLoad = calculateDragLoad(motor, spoolDiameter, ratio, efficiency);

  if ([ratio.asNumber(), dragLoad.scalar].includes(0)) {
    return new Measurement(0, "ft/s");
  }

  const topSpeed = motor.freeSpeed.div(ratio.asNumber());
  const term1 = topSpeed.div(dragLoad).mul(load);
  const wraparoundDistance = spoolDiameter.mul(Math.PI);

  return term1
    .add(topSpeed)
    .mul(wraparoundDistance)
    .div(new Measurement(360, "deg"))
    .to("ft/s");
}

export function calculateTimeToGoal(
  speed: Measurement,
  distance: Measurement,
): Measurement {
  if (speed.lte(new Measurement(0, "ft/s"))) {
    return new Measurement(0, "s");
  }

  return distance.div(speed).to("s");
}

export function calculateCurrentDraw(
  motor: Motor,
  spoolDiameter: Measurement,
  load: Measurement,
  ratio: Ratio,
): Measurement {
  if ([ratio.asNumber(), motor.quantity].includes(0)) {
    return new Measurement(0, "A");
  }
  const torqueAtMotor = load.div(ratio.asNumber()).mul(spoolDiameter).div(2);
  const currentDraw = motor.kT
    .inverse()
    .mul(torqueAtMotor)
    .mul(new Measurement(9.81, "m/s^2"));
  const totalCurrentDraw = currentDraw.add(
    motor.freeCurrent.mul(motor.quantity),
  );
  return totalCurrentDraw.div(motor.quantity);
}

export function generateTimeToGoalChartData(
  motor_: MotorDict,
  travelDistance_: MeasurementDict,
  spoolDiameter_: MeasurementDict,
  load_: MeasurementDict,
  ratio_: RatioDict,
  efficiency: number,
): GraphDataPoint[] {
  const motor = Motor.fromDict(motor_);
  const travelDistance = Measurement.fromDict(travelDistance_);
  const spoolDiameter = Measurement.fromDict(spoolDiameter_);
  const load = Measurement.fromDict(load_);
  const ratio = Ratio.fromDict(ratio_);

  const start = 0.25 * ratio.magnitude;
  const end = 2.0 * ratio.magnitude;
  const n = 100;
  const step = (end - start) / n;

  const getTimeForRatio = (r: Ratio) =>
    calculateTimeToGoal(
      calculateLoadedSpeed(motor, spoolDiameter, r, efficiency, load),
      travelDistance,
    );

  const data: GraphDataPoint[] = [];
  for (let i = start; i < end; i = fixFloatingPoint(step + i)) {
    const t = getTimeForRatio(new Ratio(i, ratio.ratioType));

    if (t.scalar >= 0) {
      data.push({
        x: i,
        y: Number(t.to("s").scalar.toFixed(4)),
      });
    }
  }

  return data;
}

export function generateCurrentDrawChartData(
  motor_: MotorDict,
  spoolDiameter_: MeasurementDict,
  load_: MeasurementDict,
  ratio_: RatioDict,
): GraphDataPoint[] {
  const motor = Motor.fromDict(motor_);
  const spoolDiameter = Measurement.fromDict(spoolDiameter_);
  const load = Measurement.fromDict(load_);
  const ratio = Ratio.fromDict(ratio_);

  const start = 0.25 * ratio.magnitude;
  const end = 2.0 * ratio.magnitude;
  const n = 100;
  const step = (end - start) / n;

  const getCurrentDrawForRatio = (r: Ratio) =>
    calculateCurrentDraw(motor, spoolDiameter, load, r);

  const data: GraphDataPoint[] = [];
  for (let i = start; i < end; i = fixFloatingPoint(step + i)) {
    const t = getCurrentDrawForRatio(new Ratio(i, ratio.ratioType)).to("A");

    if (t.scalar >= 0) {
      data.push({
        x: i,
        y: Number(t.scalar.toFixed(4)),
      });
    }
  }

  return data;
}

const workerFunctions = {
  calculateCurrentDraw,
  calculateDragLoad,
  calculateLoadedSpeed,
  calculateTimeToGoal,
  calculateUnloadedSpeed,
  generateCurrentDrawChartData,
  generateTimeToGoalChartData,
};

expose(workerFunctions);
type LinearWorkerFunctions = typeof workerFunctions;
export type { LinearWorkerFunctions };

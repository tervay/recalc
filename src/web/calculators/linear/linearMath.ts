import { GraphDataPoint } from "common/components/graphing/graphConfig";
import Measurement, { MeasurementDict } from "common/models/Measurement";
import Motor, { MotorDict } from "common/models/Motor";
import Ratio, { RatioDict } from "common/models/Ratio";
import { expose } from "common/tooling/promise-worker";

interface MotionProfile {
  accelerationPhaseDuration: Measurement;
  constantVelocityPhaseDuration: Measurement;
  decelerationPhaseDuration: Measurement;
  maxVelocity: Measurement;
  acceleration: Measurement;
  deceleration: Measurement;
}

interface TrapezoidalProfileParams {
  distance: Measurement;
  motorTorque: Measurement;
  maxVelocity: Measurement;
  systemMass: Measurement;
  spoolDiameter: Measurement;
  angle: Measurement;
}

export function planTrapezoidalMotionProfile(
  params: TrapezoidalProfileParams,
): MotionProfile {
  const {
    spoolDiameter,
    systemMass,
    angle,
    distance,
    maxVelocity,
    motorTorque,
  } = params;

  if (Measurement.anyAreZero(spoolDiameter, systemMass)) {
    return {
      accelerationPhaseDuration: new Measurement(0, "s"),
      constantVelocityPhaseDuration: new Measurement(0, "s"),
      decelerationPhaseDuration: new Measurement(0, "s"),
      maxVelocity: new Measurement(0, "m/s"),
      acceleration: new Measurement(0, "m/s2"),
      deceleration: new Measurement(0, "m/s2"),
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

  const effectiveDeceleration = observedMotorForce
    .negate()
    .add(gravityForce)
    .div(systemMass)
    .negate();

  // Calculate time to reach maximum velocity (half of the total distance)
  const timeToMaxVelocity = carriageMaxVelocity.div(effectiveAcceleration);

  // Calculate the distance covered during the acceleration phase
  const distanceDuringAcceleration = effectiveAcceleration
    .mul(0.5)
    .mul(timeToMaxVelocity)
    .mul(timeToMaxVelocity);

  const timeToSlowFromMaxVelocity = carriageMaxVelocity.div(
    effectiveDeceleration,
  );

  // Calculate the distance covered during the deceleration phase
  const distanceDuringDeceleration = effectiveDeceleration
    .mul(0.5)
    .mul(timeToSlowFromMaxVelocity)
    .mul(timeToSlowFromMaxVelocity);

  if (
    distanceDuringAcceleration.add(distanceDuringDeceleration).gte(distance)
  ) {
    const accelTimeSq = distanceDuringAcceleration
      .mul(2)
      .div(effectiveAcceleration);
    const accelTime = new Measurement(
      Math.sqrt(accelTimeSq.to("s2").scalar),
      "s",
    );

    const decelTimeSq = distanceDuringDeceleration
      .mul(2)
      .div(effectiveDeceleration);
    const decelTime = new Measurement(
      Math.sqrt(decelTimeSq.to("s2").scalar),
      "s",
    );

    return {
      accelerationPhaseDuration: accelTime,
      constantVelocityPhaseDuration: new Measurement(0, "s"),
      decelerationPhaseDuration: decelTime,
      maxVelocity: accelTime.mul(effectiveAcceleration),
      acceleration: effectiveAcceleration,
      deceleration: effectiveDeceleration,
    };
  }

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
  const decelerationPhaseDuration = timeToSlowFromMaxVelocity;

  console.log(decelerationPhaseDuration.to("s").format());
  console.log(distanceDuringDeceleration.to("in").format());

  return {
    accelerationPhaseDuration: accelerationPhaseDuration.to("s"),
    constantVelocityPhaseDuration: constantVelocityPhaseDuration.to("s"),
    decelerationPhaseDuration: decelerationPhaseDuration.to("s"),
    maxVelocity: accelerationPhaseDuration.mul(effectiveAcceleration),
    acceleration: effectiveAcceleration,
    deceleration: effectiveDeceleration,
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
  maxVelocity: Measurement;
} {
  const profile = planTrapezoidalMotionProfile({
    distance: travelDistance,
    motorTorque: motor.kT
      .mul(Measurement.min(currentLimit, motor.stallCurrent))
      .mul(motor.quantity)
      .mul(ratio.asNumber())
      .mul(efficiency / 100),
    maxVelocity: motor.freeSpeed.div(ratio.asNumber()),
    systemMass: load,
    spoolDiameter,
    angle,
  });

  let smartTimeToGoal;
  if (
    profile.accelerationPhaseDuration.lte(new Measurement(0, "s")) ||
    profile.decelerationPhaseDuration.lte(new Measurement(0, "s"))
  ) {
    smartTimeToGoal = new Measurement(0, "s");
    profile.accelerationPhaseDuration = new Measurement(0, "s");
    profile.decelerationPhaseDuration = new Measurement(0, "s");
    profile.constantVelocityPhaseDuration = new Measurement(0, "s");
  } else if (
    profile.constantVelocityPhaseDuration.lte(new Measurement(0, "s"))
  ) {
    profile.constantVelocityPhaseDuration = new Measurement(0, "s");
    smartTimeToGoal = profile.accelerationPhaseDuration.add(
      profile.decelerationPhaseDuration,
    );
  } else {
    smartTimeToGoal = profile.accelerationPhaseDuration
      .add(profile.constantVelocityPhaseDuration)
      .add(profile.decelerationPhaseDuration);
  }

  return { ...profile, smartTimeToGoal };
}

export function generateTimeToGoalChartData(
  motor_: MotorDict,
  currentLimit_: MeasurementDict,
  ratio_: RatioDict,
  spoolDiameter_: MeasurementDict,
  load_: MeasurementDict,
  travelDistance_: MeasurementDict,
  angle_: MeasurementDict,
  efficiency: number,
): {
  position: GraphDataPoint[];
  velocity: GraphDataPoint[];
} {
  const motor = Motor.fromDict(motor_);
  const currentLimit = Measurement.fromDict(currentLimit_);
  const load = Measurement.fromDict(load_);
  const travelDistance = Measurement.fromDict(travelDistance_);
  const spoolDiameter = Measurement.fromDict(spoolDiameter_);
  const angle = Measurement.fromDict(angle_);
  const ratio = Ratio.fromDict(ratio_);

  const profile = calculateProfiledTimeToGoal(
    motor,
    currentLimit,
    ratio,
    spoolDiameter,
    load,
    travelDistance,
    angle,
    efficiency,
  );

  const timestep = new Measurement(0.005, "s");
  let t = new Measurement(0, "s");
  let velocity = new Measurement(0, "m/s");
  let position = new Measurement(0, "m");

  let timestamps: Measurement[] = [t];
  let positions: Measurement[] = [position];
  let velocities: Measurement[] = [velocity];

  while (t.lte(profile.accelerationPhaseDuration)) {
    t = t.add(timestep);
    position = position.add(
      velocity.mul(timestep).add(
        profile.acceleration
          .mul(timestep)
          .mul(timestep)
          .mul(1 / 2),
      ),
    );
    velocity = velocity.add(profile.acceleration.mul(timestep));

    positions.push(position);
    velocities.push(velocity);
    timestamps.push(t);
  }

  while (
    t.lte(
      profile.accelerationPhaseDuration.add(
        profile.constantVelocityPhaseDuration,
      ),
    )
  ) {
    t = t.add(timestep);
    position = position.add(velocity.mul(timestep));
    velocity = velocity;

    positions.push(position);
    velocities.push(velocity);
    timestamps.push(t);
  }

  while (
    t.lte(
      profile.accelerationPhaseDuration
        .add(profile.constantVelocityPhaseDuration)
        .add(profile.decelerationPhaseDuration),
    )
  ) {
    t = t.add(timestep);
    position = position.add(
      velocity.mul(timestep).add(
        profile.deceleration
          .negate()
          .mul(timestep)
          .mul(timestep)
          .mul(1 / 2),
      ),
    );
    velocity = velocity.add(profile.deceleration.negate().mul(timestep));

    positions.push(position);
    velocities.push(velocity);
    timestamps.push(t);
  }

  return {
    position: positions.map((p, i) => ({
      y: p.to("in").scalar,
      x: timestamps[i].to("s").scalar,
    })),
    velocity: velocities.map((p, i) => ({
      y: p.to("in/s").scalar,
      x: timestamps[i].to("s").scalar,
    })),
  };
}

const workerFunctions = {
  generateTimeToGoalChartData,
};

expose(workerFunctions);
type LinearWorkerFunctions = typeof workerFunctions;
export type { LinearWorkerFunctions };

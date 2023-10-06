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
  systemAcceleration: Measurement;
  accelDistance: Measurement;
  decelDistance: Measurement;
  cruiseDistance: Measurement;
}

interface TrapezoidalProfileParams {
  distance: Measurement;
  motorTorque: Measurement;
  maxVelocity: Measurement;
  systemMass: Measurement;
  spoolDiameter: Measurement;
  angle: Measurement;

  limitedAcceleration?: Measurement;
  limitedDeceleration?: Measurement;
  limitedVelocity?: Measurement;
}

function canDecelerateInGivenDistance(
  currentSpeed: Measurement,
  distance: Measurement,
  deceleration: Measurement,
): boolean {
  const finalSpeed = new Measurement(0, "m/s");
  const stoppingDistance = finalSpeed
    .mul(finalSpeed)
    .sub(currentSpeed.mul(currentSpeed))
    .div(deceleration.mul(2));

  return stoppingDistance.lte(distance);
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
    limitedAcceleration,
    limitedDeceleration,
    limitedVelocity,
  } = params;

  if (Measurement.anyAreZero(spoolDiameter, systemMass)) {
    return {
      accelerationPhaseDuration: new Measurement(0, "s"),
      constantVelocityPhaseDuration: new Measurement(0, "s"),
      decelerationPhaseDuration: new Measurement(0, "s"),
      maxVelocity: new Measurement(0, "m/s"),
      acceleration: new Measurement(0, "m/s2"),
      deceleration: new Measurement(0, "m/s2"),
      systemAcceleration: new Measurement(0, "m/s2"),
      accelDistance: new Measurement(0, "m"),
      decelDistance: new Measurement(0, "m"),
      cruiseDistance: new Measurement(0, "m"),
    };
  }

  const observedMotorForce = motorTorque.div(spoolDiameter.div(2));
  const gravityForce = Measurement.GRAVITY.mul(systemMass).mul(
    Math.sin(angle.to("rad").scalar),
  );

  let carriageMaxVelocity = maxVelocity
    .mul(spoolDiameter.mul(Math.PI))
    .div(new Measurement(360, "deg"));
  if (limitedVelocity !== undefined) {
    carriageMaxVelocity = Measurement.min(limitedVelocity, carriageMaxVelocity);
  }

  let observedMotorAcceleration = observedMotorForce.div(systemMass);
  if (limitedAcceleration !== undefined) {
    observedMotorAcceleration = Measurement.min(
      observedMotorAcceleration,
      limitedAcceleration,
    );
  }

  const observedGravityAcceleration = gravityForce.div(systemMass);

  const effectiveAcceleration = observedMotorAcceleration.add(
    observedGravityAcceleration,
  );

  let observedMotorDeceleration = observedMotorForce.div(systemMass);
  if (limitedDeceleration !== undefined) {
    observedMotorDeceleration = Measurement.min(
      observedMotorDeceleration,
      limitedDeceleration,
    );
  }

  const effectiveDeceleration = observedMotorDeceleration
    .negate()
    .add(observedGravityAcceleration)
    .negate();

  const timeToMaxVelocity = carriageMaxVelocity.div(effectiveAcceleration);

  let distanceDuringAcceleration = effectiveAcceleration
    .mul(0.5)
    .mul(timeToMaxVelocity)
    .mul(timeToMaxVelocity);

  if (
    !canDecelerateInGivenDistance(
      effectiveAcceleration.mul(timeToMaxVelocity),
      distance.sub(distanceDuringAcceleration),
      effectiveDeceleration,
    )
  ) {
    const t_1_numerator = new Measurement(
      Math.sqrt(
        distance.mul(effectiveDeceleration.abs()).mul(2).to("m2/s2").scalar,
      ),
      "m/s",
    );
    const t1_denominator = new Measurement(
      Math.sqrt(
        effectiveAcceleration
          .mul(effectiveAcceleration.add(effectiveDeceleration.abs()))
          .to("m2/s4").scalar,
      ),
      "m/s2",
    );

    const t_1 = t_1_numerator.div(t1_denominator);
    const maxVelo = t_1.mul(effectiveAcceleration);
    const t_2 = maxVelo.div(effectiveDeceleration);

    return {
      acceleration: effectiveAcceleration,
      accelerationPhaseDuration: t_1,
      constantVelocityPhaseDuration: new Measurement(0, "s"),
      cruiseDistance: new Measurement(0, "m"),
      deceleration: effectiveDeceleration,
      decelerationPhaseDuration: t_2,
      maxVelocity: maxVelo,
      systemAcceleration: observedGravityAcceleration,
      accelDistance: effectiveAcceleration.mul(t_1).mul(t_1).div(2),
      decelDistance: effectiveDeceleration.mul(t_2).mul(t_2).div(2),
    };
  }

  distanceDuringAcceleration = effectiveAcceleration
    .mul(0.5)
    .mul(timeToMaxVelocity)
    .mul(timeToMaxVelocity);

  const timeToSlowFromMaxVelocity = carriageMaxVelocity.div(
    effectiveDeceleration,
  );

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
      systemAcceleration: observedGravityAcceleration,
      accelDistance: distanceDuringAcceleration,
      decelDistance: distanceDuringDeceleration,
      cruiseDistance: new Measurement(0, "m"),
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

  return {
    accelerationPhaseDuration: accelerationPhaseDuration.to("s"),
    constantVelocityPhaseDuration: constantVelocityPhaseDuration.to("s"),
    decelerationPhaseDuration: decelerationPhaseDuration.to("s"),
    maxVelocity: carriageMaxVelocity,
    acceleration: effectiveAcceleration,
    deceleration: effectiveDeceleration,
    systemAcceleration: observedGravityAcceleration,
    accelDistance: distanceDuringAcceleration,
    decelDistance: distanceDuringDeceleration,
    cruiseDistance: distanceDuringConstantVelocity,
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
  limitedAcceleration?: Measurement,
  limitedDeceleration?: Measurement,
  limitedVelocity?: Measurement,
): MotionProfile & {
  smartTimeToGoal: Measurement;
  maxVelocity: Measurement;
} {
  if (ratio.asNumber() == 0) {
    return {
      accelerationPhaseDuration: new Measurement(0, "s"),
      constantVelocityPhaseDuration: new Measurement(0, "s"),
      decelerationPhaseDuration: new Measurement(0, "s"),
      maxVelocity: new Measurement(0, "m/s"),
      acceleration: new Measurement(0, "m/s2"),
      deceleration: new Measurement(0, "m/s2"),
      smartTimeToGoal: new Measurement(0, "s"),
      systemAcceleration: new Measurement(0, "m/s2"),
      accelDistance: new Measurement(0, "m"),
      decelDistance: new Measurement(0, "m"),
      cruiseDistance: new Measurement(0, "m"),
    };
  }

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
    limitedAcceleration,
    limitedDeceleration,
    limitedVelocity,
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
  limitedAcceleration_?: MeasurementDict,
  limitedDeceleration_?: MeasurementDict,
  limitedVelocity_?: MeasurementDict,
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
  const limitedAcceleration =
    limitedAcceleration_ === undefined
      ? undefined
      : Measurement.fromDict(limitedAcceleration_);
  const limitedDeceleration =
    limitedDeceleration_ === undefined
      ? undefined
      : Measurement.fromDict(limitedDeceleration_);
  const limitedVelocity =
    limitedVelocity_ === undefined
      ? undefined
      : Measurement.fromDict(limitedVelocity_);

  const profile = calculateProfiledTimeToGoal(
    motor,
    currentLimit,
    ratio,
    spoolDiameter,
    load,
    travelDistance,
    angle,
    efficiency,
    limitedAcceleration,
    limitedDeceleration,
    limitedVelocity,
  );

  const timestep = new Measurement(0.005, "s");
  let t = new Measurement(0, "s");
  let velocity = new Measurement(0, "m/s");
  let position = new Measurement(0, "m");

  const timestamps: Measurement[] = [t];
  const positions: Measurement[] = [position];
  const velocities: Measurement[] = [velocity];

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
    velocity = Measurement.min(
      velocity.add(profile.acceleration.mul(timestep)),
      profile.maxVelocity,
    );

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

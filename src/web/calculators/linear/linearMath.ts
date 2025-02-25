import { GraphDataPoint } from "common/components/graphing/graphConfig";
import Measurement, { MeasurementDict } from "common/models/Measurement";
import Motor, {
  MotorDict,
  nominalVoltage,
  solveMotorODE,
} from "common/models/Motor";
import Ratio, { RatioDict } from "common/models/Ratio";
import { MotorRules } from "common/models/Rules";
import { expose } from "common/tooling/promise-worker";

function generateODEData(
  motor_: MotorDict,
  currentLimit_: MeasurementDict,
  travelDistance_: MeasurementDict,
  ratio_: RatioDict,
  spoolDiameter_: MeasurementDict,
  load_: MeasurementDict,
  J_: MeasurementDict,
  efficiency: number,
  angle_: MeasurementDict,
): {
  position: GraphDataPoint[];
  velocity: GraphDataPoint[];
  currentDraw: GraphDataPoint[];
  maxAcceleration: MeasurementDict;
} {
  const motor = Motor.fromDict(motor_);
  const currentLimit = Measurement.fromDict(currentLimit_);
  const travelDistance = Measurement.fromDict(travelDistance_);
  const spoolDiameter = Measurement.fromDict(spoolDiameter_);
  const ratio = Ratio.fromDict(ratio_);
  const load = Measurement.fromDict(load_);
  const J = Measurement.fromDict(J_);
  const angle = Measurement.fromDict(angle_);

  if (
    [
      motor.quantity,
      ratio.magnitude,
      spoolDiameter.baseScalar,
      currentLimit.baseScalar,
    ].includes(0)
  ) {
    return { position: [], velocity: [], currentDraw: [], maxAcceleration: new Measurement(0, "in/s2").toDict() };
  }

  const gravitationalForce = load.mul(Measurement.GRAVITY.negate());
  const gravitationalTorque = gravitationalForce
    .mul(spoolDiameter.div(2))
    .div(ratio.asNumber())
    .mul(Math.sin(angle.to("rad").scalar));


  const data = solveMotorODE(
    motor,
    currentLimit,
    (info) =>
      info.position
        .linearizeRadialPosition(
          spoolDiameter.mul(Math.PI).div(ratio.asNumber()),
        )
        .gte(travelDistance) ||
      (info.velocity.lte(new Measurement(2, "rad/s")) &&
        info.stepNumber >= 1000),
    J,
    gravitationalTorque,
    efficiency,
  );

  return {
    position: data.ys.map((y, i) => ({
      x: data.ts[i],
      y: new Measurement(y[3], "rad")
        .linearizeRadialPosition(
          spoolDiameter.mul(Math.PI).div(ratio.asNumber()),
        )
        .to("in").scalar,
    })),
    velocity: data.ys.map((y, i) => ({
      x: data.ts[i],
      y: new Measurement(y[0], "rad/s")
        .linearizeRadialPosition(
          spoolDiameter.mul(Math.PI).div(ratio.asNumber()),
        )
        .to("in/s").scalar,
    })),
    currentDraw: data.ys.map((y, i) => ({
      x: data.ts[i],
      y: y[2],
    })),
    maxAcceleration: calculateMaxAcceleration(
      data.ys.map((y) => new Measurement(y[0], "rad/s")
        .linearizeRadialPosition(
          spoolDiameter.mul(Math.PI).div(ratio.asNumber()),
        )
        .to("in/s")),
      data.ts
    ).toDict()
  };
}

export function calculateStallLoad(
  motor: Motor,
  currentLimit: Measurement,
  spoolDiameter: Measurement,
  ratio: Ratio,
  efficiency: number,
): Measurement {
  if ([spoolDiameter.scalar].includes(0)) {
    return new Measurement(0, "lb");
  }

  return new MotorRules(motor, currentLimit, {
    current: currentLimit,
    voltage: nominalVoltage,
  })
    .solve()
    .torque.mul(motor.quantity)
    .mul(ratio.asNumber())
    .mul(efficiency / 100)
    .div(spoolDiameter.div(2))
    .div(Measurement.GRAVITY);
}



export function calculateMaxAcceleration(velocities: Measurement[], times: number[]) {
  const timeMeasurements = times.map(t => new Measurement(t, "s"))
  const velocityMeasurements = velocities;
  const accelerationMeasurements: Measurement[] = []
  for (let i = 1; i < velocityMeasurements.length; i++) {
    const prevVel = velocityMeasurements[i - 1]
    const prevTime = timeMeasurements[i - 1]
    const time = timeMeasurements[i]
    const vel = velocityMeasurements[i]

    const acc = vel.sub(prevVel).div(time.sub(prevTime))
    accelerationMeasurements.push(acc)
  }

  return accelerationMeasurements.reduce((max, acc) => {
    return acc.gt(max) ? acc : max
  }, new Measurement(0, "in/s2"));
}

const workerFunctions = {
  generateODEData,
};

expose(workerFunctions);
type LinearWorkerFunctions = typeof workerFunctions;
export type { LinearWorkerFunctions };


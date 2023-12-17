import { GraphDataPoint } from "common/components/graphing/graphConfig";
import Measurement, { MeasurementDict } from "common/models/Measurement";
import Motor, { MotorDict, solveMotorODE, nominalVoltage } from "common/models/Motor";
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
): {
  position: GraphDataPoint[];
  velocity: GraphDataPoint[];
  currentDraw: GraphDataPoint[];
} {
  const motor = Motor.fromDict(motor_);
  const currentLimit = Measurement.fromDict(currentLimit_);
  const travelDistance = Measurement.fromDict(travelDistance_);
  const spoolDiameter = Measurement.fromDict(spoolDiameter_);
  const ratio = Ratio.fromDict(ratio_);
  const load = Measurement.fromDict(load_);
  const J = Measurement.fromDict(J_);

  if (
    [
      motor.quantity,
      ratio.magnitude,
      spoolDiameter.baseScalar,
      currentLimit.baseScalar,
    ].includes(0)
  ) {
    return { position: [], velocity: [], currentDraw: [] };
  }

  const gravitationalForce = load.mul(Measurement.GRAVITY.negate());
  const gravitationalTorque = gravitationalForce.mul(spoolDiameter.div(2));

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

const workerFunctions = {
  generateODEData,
};

expose(workerFunctions);
type LinearWorkerFunctions = typeof workerFunctions;
export type { LinearWorkerFunctions };

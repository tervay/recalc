import { GraphDataPoint } from "common/components/graphing/graphConfig";
import Measurement, { MeasurementDict } from "common/models/Measurement";
import Motor, { MotorDict } from "common/models/Motor";
import Ratio, { RatioDict } from "common/models/Ratio";
import { expose } from "common/tooling/promise-worker";
import { fixFloatingPoint } from "common/tooling/util";

export function calculateUnloadedSpeed(
  motor: Motor,
  spoolDiameter: Measurement,
  ratio: Ratio
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

export function calculateDragLoad(
  motor: Motor,
  spoolDiameter: Measurement,
  ratio: Ratio,
  efficiency: number
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
  load: Measurement
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
  distance: Measurement
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
  ratio: Ratio
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
    motor.freeCurrent.mul(motor.quantity)
  );
  return totalCurrentDraw.div(motor.quantity);
}

export function generateTimeToGoalChartData(
  motor_: MotorDict,
  travelDistance_: MeasurementDict,
  spoolDiameter_: MeasurementDict,
  load_: MeasurementDict,
  ratio_: RatioDict,
  efficiency: number
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
      travelDistance
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
  ratio_: RatioDict
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

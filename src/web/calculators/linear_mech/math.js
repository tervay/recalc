import Measurement from "common/models/Measurement";
import Ratio from "common/models/Ratio";
import { fixFloatingPoint } from "common/tooling/util";

export function generateTimeToGoalChartData(
  motor,
  travelDistance,
  spoolDiameter,
  load,
  ratio,
  efficiency
) {
  const start = 0.25 * ratio.asNumber();
  const end = 4.0 * ratio.asNumber();
  const n = 100;
  const step = (end - start) / n;

  const getTimeForRatio = (r) =>
    CalculateTimeToGoal(
      travelDistance,
      CalculateLoadedSpeed(motor, spoolDiameter, load, r, efficiency)
    );

  let data = [];
  for (let i = start; i < end; i = fixFloatingPoint(step + i)) {
    const t = getTimeForRatio(new Ratio(i, ratio.ratioType));

    if (t.scalar >= 0) {
      data.push({
        x: i,
        y: t.to("s").scalar.toFixed(4),
      });
    }
  }

  return data;
}

export function generateCurrentDrawChartData(
  motor,
  spoolDiameter,
  load,
  ratio
) {
  const start = 0.25 * ratio.asNumber();
  const end = 4.0 * ratio.asNumber();
  const n = 100;
  const step = (end - start) / n;

  const getCurrentDrawForRatio = (r) =>
    calculateCurrentDraw(motor, spoolDiameter, load, r);

  let data = [];
  for (let i = start; i < end; i = fixFloatingPoint(step + i)) {
    const t = getCurrentDrawForRatio(new Ratio(i, ratio.ratioType)).to("A");

    if (t.scalar >= 0 && t.scalar <= 100) {
      data.push({
        x: i,
        y: t.scalar.toFixed(4),
      });
    }
  }

  return data;
}

export function CalculateUnloadedSpeed(motor, spoolDiameter, ratio) {
  if (ratio.asNumber() === 0 || motor.quantity === 0) {
    return new Measurement(0, "ft/s");
  }

  return motor.freeSpeed
    .div(ratio.asNumber())
    .mul(spoolDiameter.div(2))
    .mul(new Measurement(1, "rad^-1"));
}

export function CalculateLoadedSpeed(
  motor,
  spoolDiameter,
  load,
  ratio,
  efficiency
) {
  const stallDragLoad = CalculateStallDragLoad(
    motor,
    spoolDiameter,
    ratio,
    efficiency
  );

  if (ratio.asNumber() === 0 || stallDragLoad.scalar === 0) {
    return new Measurement(0, "ft/s");
  }

  const t1 = motor.freeSpeed
    .div(ratio.asNumber())
    .mul(new Measurement(360, "degree"))
    .div(new Measurement(60, "s"))
    .div(stallDragLoad)
    .mul(load)
    .mul(-1);

  const t2 = motor.freeSpeed
    .div(ratio.asNumber())
    .mul(new Measurement(360, "degree"))
    .div(new Measurement(60, "s"));

  const t3 = spoolDiameter.mul(Math.PI);

  const t4 = t1
    .add(t2)
    .mul(t3)
    .div(new Measurement(360, "degree"))
    .mul(new Measurement(1, "rpm^-1"));
  return t4;
}

export function CalculateStallDragLoad(
  motor,
  spoolDiameter,
  ratio,
  efficiency
) {
  if (spoolDiameter.scalar === 0) {
    return new Measurement(0, "lb");
  }
  return motor.stallTorque
    .mul(motor.quantity)
    .mul(ratio.asNumber())
    .mul(efficiency / 100)
    .div(spoolDiameter.div(2))
    .div(new Measurement(9.81, "m*s^-2"));
}

export function CalculateTimeToGoal(travelDistance, loadedSpeed) {
  if (loadedSpeed.baseScalar === 0) {
    return new Measurement(0, "s");
  }
  return travelDistance.div(loadedSpeed);
}

export function calculateCurrentDraw(motor, spoolDiameter, load, ratio) {
  if (ratio.asNumber() === 0 || motor.quantity === 0) {
    return new Measurement(0, "A");
  }
  const stallCurrent = motor.stallCurrent.mul(motor.quantity);
  const freeCurrent = motor.freeCurrent.mul(motor.quantity);
  const stallTorque = motor.stallTorque.mul(motor.quantity);

  const t4 = stallCurrent.sub(freeCurrent).div(stallTorque);

  const t5 = load.div(ratio.asNumber()).mul(spoolDiameter).div(2);
  const t6 = t4.mul(t5).mul(new Measurement(9.81, "m/s^2"));

  const totalCurrentDraw = t6.add(freeCurrent);
  return totalCurrentDraw.div(motor.quantity);
}

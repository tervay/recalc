import { RatioDictToNumber } from "common/tooling/io";
import Qty from "js-quantities";

export function CalculateUnloadedSpeed(motor, spoolDiameter, ratio) {
  if (RatioDictToNumber(ratio) === 0 || motor.quantity === 0) {
    return Qty(0, "ft/s");
  }

  return motor.data.freeSpeed
    .div(RatioDictToNumber(ratio))
    .mul(spoolDiameter.div(2))
    .mul(Qty(1, "rad^-1"));
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

  if (RatioDictToNumber(ratio) === 0 || stallDragLoad.scalar === 0) {
    return Qty(0, "ft/s");
  }

  const t1 = motor.data.freeSpeed
    .div(RatioDictToNumber(ratio))
    .mul(Qty(360, "degree"))
    .div(Qty(60, "s"))
    .div(stallDragLoad)
    .mul(load)
    .mul(-1);

  const t2 = motor.data.freeSpeed
    .div(RatioDictToNumber(ratio))
    .mul(Qty(360, "degree"))
    .div(Qty(60, "s"));

  const t3 = spoolDiameter.mul(Math.PI);

  const t4 = t1.add(t2).mul(t3).div(Qty(360, "degree")).mul(Qty(1, "rpm^-1"));
  return t4;
}

export function CalculateStallDragLoad(
  motor,
  spoolDiameter,
  ratio,
  efficiency
) {
  if (spoolDiameter.scalar === 0) {
    return Qty(0, "lb");
  }
  return motor.data.stallTorque
    .mul(motor.quantity)
    .mul(RatioDictToNumber(ratio))
    .mul(efficiency / 100)
    .div(spoolDiameter.div(2))
    .div(Qty(9.81, "m*s^-2"));
}

export function CalculateTimeToGoal(travelDistance, loadedSpeed) {
  if (loadedSpeed.baseScalar === 0) {
    return Qty(0, "s");
  }
  return travelDistance.div(loadedSpeed);
}

export function calculateCurrentDraw(motor, spoolDiameter, load, ratio) {
  if (RatioDictToNumber(ratio) === 0 || motor.quantity === 0) {
    return Qty(0, "A");
  }
  const stallCurrent = motor.data.stallCurrent.mul(motor.quantity);
  const freeCurrent = motor.data.freeCurrent.mul(motor.quantity);
  const stallTorque = motor.data.stallTorque.mul(motor.quantity);

  const t4 = stallCurrent.sub(freeCurrent).div(stallTorque);

  const t5 = load.div(RatioDictToNumber(ratio)).mul(spoolDiameter).div(2);
  const t6 = t4.mul(t5).mul(Qty(9.81, "m/s^2"));

  const totalCurrentDraw = t6.add(freeCurrent);
  return totalCurrentDraw.div(motor.quantity);
}

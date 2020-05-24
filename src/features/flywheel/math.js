import Qty from "js-quantities";
import { motorMap } from "../common/motors";
import { DictToQty } from "../common/params";

/*
Credit to JuliaCalc
https://www.chiefdelphi.com/t/flywheel-calculator/372836
formula:
t = (-J * R) / (K_t * K_e * G^2)  * ln((V_a - K_e * w) / V_a)
*/
export function CalculateWindupTime(state, action) {
  const weight = DictToQty(action.payload.weight);
  const radius = DictToQty(action.payload.radius);
  const motor = motorMap[action.payload.motor.motor.name];
  const J = Qty(0.5)
    .mul(weight)
    .mul(radius)
    .mul(radius)
    .div(action.payload.ratio)
    .div(action.payload.ratio);
  const R = motor.resistance;
  const kT = motor.stallTorque
    .div(motor.stallCurrent)
    .mul(action.payload.motor.quantity);
  const kE = Qty(kT.scalar, "V*s/rad"); // valid for DC + BLDC motors
  const w = DictToQty(action.payload.targetSpeed);

  const t1 = Qty(-1).mul(J).mul(R);
  const t2 = kT.mul(kE);
  const t3 = t1.div(t2);
  const t4 = Qty(1).sub(w.div(motor.freeSpeed.div(action.payload.ratio)));
  if (t4.scalar <= 0) {
    return Qty(0, "s");
  } else {
    return t3.mul(Math.log(t4.scalar)).mul(Qty(1, "rad^-1")).to("s");
  }
}

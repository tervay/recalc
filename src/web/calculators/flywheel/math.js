import Ratio from "common/models/Ratio";
import Qty from "js-quantities";

/**
 *
 * @param {Qty} weight
 * @param {Qty} radius
 * @param {Qty} motorFreeSpeed
 * @param {Qty} motorStallTorque
 * @param {Qty} motorStallCurrent
 * @param {Qty} motorResistance
 * @param {number} motorQuantity
 * @param {Ratio} ratio
 * @param {Qty} targetSpeed
 */
export function calculateWindupTime(
  weight,
  radius,
  motorFreeSpeed,
  motorStallTorque,
  motorStallCurrent,
  motorResistance,
  motorQuantity,
  ratio,
  targetSpeed
) {
  if (motorQuantity === 0 || ratio.asNumber() === 0) {
    return Qty(0, "s");
  }

  const J = Qty(0.5)
    .mul(weight)
    .mul(radius)
    .mul(radius)
    .div(ratio.asNumber())
    .div(ratio.asNumber());
  const R = motorResistance;
  const kT = motorStallTorque.div(motorStallCurrent).mul(motorQuantity);
  const kE = Qty(kT.scalar, "V*s/rad"); // valid for DC + BLDC motors
  const w = targetSpeed;

  const t1 = Qty(-1).mul(J).mul(R);
  const t2 = kT.mul(kE);
  const t3 = t1.div(t2);
  const t4 = Qty(1).sub(w.div(motorFreeSpeed.div(ratio.asNumber())));
  if (t4.scalar <= 0) {
    return Qty(0, "s");
  } else {
    return t3.mul(Math.log(t4.scalar)).mul(Qty(1, "rad^-1")).to("s");
  }
}

/**
 *
 * @param {Qty} weight
 * @param {Qty} radius
 * @param {Qty} motorFreeSpeed
 * @param {Qty} motorStallTorque
 * @param {Qty} motorStallCurrent
 * @param {Qty} motorResistance
 * @param {number} motorQuantity
 * @param {Ratio} currentRatio
 * @param {Qty} targetSpeed
 */
export function generateChartData(
  weight,
  radius,
  motorFreeSpeed,
  motorStallTorque,
  motorStallCurrent,
  motorResistance,
  motorQuantity,
  currentRatio,
  targetSpeed
) {
  const start = 0.25 * currentRatio.asNumber();
  const end = 4.0 * currentRatio.asNumber();
  const n = 100;
  const step = (end - start) / n;

  const getTimeForRatio = (ratio) =>
    calculateWindupTime(
      weight,
      radius,
      motorFreeSpeed,
      motorStallTorque,
      motorStallCurrent,
      motorResistance,
      motorQuantity,
      ratio,
      targetSpeed
    );

  let data = [];
  for (let i = start; i < end; i += step) {
    const t = getTimeForRatio(new Ratio(i, currentRatio.ratioType));
    if (t.scalar !== 0) {
      data.push({
        x: i,
        y: t.scalar.toFixed(4),
      });
    }
  }

  return data;
}

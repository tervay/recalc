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
 * @param {number} ratio
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
  const J = Qty(0.5).mul(weight).mul(radius).mul(radius).div(ratio).div(ratio);
  const R = motorResistance;
  const kT = motorStallTorque.div(motorStallCurrent).mul(motorQuantity);
  const kE = Qty(kT.scalar, "V*s/rad"); // valid for DC + BLDC motors
  const w = targetSpeed;

  const t1 = Qty(-1).mul(J).mul(R);
  const t2 = kT.mul(kE);
  const t3 = t1.div(t2);
  const t4 = Qty(1).sub(w.div(motorFreeSpeed.div(ratio)));
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
 * @param {number} ratio
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
  const start = 0.25 * currentRatio;
  const end = 4.0 * currentRatio;
  const n = 100;
  const step = (end - start) / n;

  function getTimeForRatio(ratio) {
    return calculateWindupTime(
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
  }

  let data = [];
  for (let i = start; i < end; i += step) {
    const t = getTimeForRatio(i);
    if (t.scalar !== 0) {
      data.push({
        x: i,
        y: t.scalar.toFixed(4),
      });
    }
  }

  return data;
}

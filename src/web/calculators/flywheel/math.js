import Measurement from "common/models/Measurement";
import Ratio from "common/models/Ratio";

/**
 * 
 *
 * @param {Measurement} weight
 * @param {Measurement} radius
 * @param {Measurement} motorFreeSpeed
 * @param {Measurement} motorStallTorque
 * @param {Measurement} motorStallCurrent
 * @param {Measurement} motorResistance
 * @param {number} motorQuantity
 * @param {Ratio} ratio
 * @param {Measurement} targetSpeed
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
    return new Measurement(0, "s");
  }

  const moi = weight.mul(radius).mul(radius).mul(-0.5);
  const c24 = moi;
  const c23 = motorFreeSpeed.div(ratio.asNumber());
  const d23 = c23;

  const f12 = targetSpeed;

  const toBeLogged = c23.sub(f12).div(c23);
  const logged = Math.log(toBeLogged.baseScalar);
  if (isNaN(logged)) {
    return new Measurement(0, "s")
  }

  const endDiv = motorStallTorque.mul(motorQuantity);

  return c24.mul(d23).div(endDiv).mul(logged).div(new Measurement(1, "rad"));
}


/**
 * 
 *
 * @param {Measurement} weight
 * @param {Measurement} radius
 * @param {Measurement} motorFreeSpeed
 * @param {Measurement} motorStallTorque
 * @param {Measurement} motorStallCurrent
 * @param {Measurement} motorResistance
 * @param {number} motorQuantity
 * @param {Ratio} ratio
 * @param {Measurement} targetSpeed
 */
export function calculateWindupTime2(
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
    return new Measurement(0, "s");
  }

  const J = new Measurement(0.5)
    .mul(weight)
    .mul(radius)
    .mul(radius)
    .div(ratio.asNumber())
    .div(ratio.asNumber());
  const R = motorResistance;
  const kT = motorStallTorque.div(motorStallCurrent).mul(motorQuantity);
  const kE = new Measurement(kT.scalar, "V*s/rad"); // valid for DC + BLDC motors
  const w = targetSpeed;

  const t1 = new Measurement(-1).mul(J).mul(R);
  const t2 = kT.mul(kE);
  const t3 = t1.div(t2);
  const t4 = new Measurement(1).sub(
    w.div(motorFreeSpeed.div(ratio.asNumber()))
  );

  if (t4.scalar <= 0) {
    return new Measurement(0, "s");
  } else {
    return t3
      .mul(Math.log(t4.scalar))
      .mul(new Measurement(1, "rad^-1"))
      .to("s");
  }
}

/**
 *
 * @param {Measurement} weight
 * @param {Measurement} radius
 * @param {Measurement} motorFreeSpeed
 * @param {Measurement} motorStallTorque
 * @param {Measurement} motorStallCurrent
 * @param {Measurement} motorResistance
 * @param {number} motorQuantity
 * @param {Ratio} currentRatio
 * @param {Measurement} targetSpeed
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
  const end = Math.max(
    4.0 * currentRatio.asNumber(),
    currentRatio.magnitude * 2
  );
  const n = 200;
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
    const t = getTimeForRatio(new Ratio(i, Ratio.REDUCTION));
    if (t.scalar !== 0) {
      data.push({
        x: i,
        y: t.scalar.toFixed(4),
      });
    }
  }

  return data;
}

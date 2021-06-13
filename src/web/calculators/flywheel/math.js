import Measurement from "common/models/Measurement";
import Ratio from "common/models/Ratio";

/**
 *
 *
 * @param {Measurement} momentOfInertia
 * @param {Measurement} motorFreeSpeed
 * @param {Measurement} motorStallTorque
 * @param {number} motorQuantity
 * @param {Ratio} ratio
 * @param {Measurement} targetSpeed
 */
export function calculateWindupTime(
  momentOfInertia,
  motorFreeSpeed,
  motorStallTorque,
  motorQuantity,
  ratio,
  targetSpeed
) {
  if (motorQuantity === 0 || ratio.asNumber() === 0) {
    return new Measurement(0, "s");
  }

  const maxRpm = motorFreeSpeed.div(ratio.asNumber());
  const toBeLogged = maxRpm.sub(targetSpeed).div(maxRpm);
  const logged = Math.log(toBeLogged.baseScalar);
  if (isNaN(logged)) {
    return new Measurement(0, "s");
  }

  return momentOfInertia
    .mul(-1)
    .mul(maxRpm)
    .div(motorStallTorque.mul(motorQuantity))
    .mul(logged)
    .div(new Measurement(1, "rad"));
}

/**
 *
 * @param {Measurement} momentOfInertia
 * @param {Measurement} motorFreeSpeed
 * @param {Measurement} motorStallTorque
 * @param {number} motorQuantity
 * @param {Ratio} currentRatio
 * @param {Measurement} targetSpeed
 */
export function generateChartData(
  momentOfInertia,
  motorFreeSpeed,
  motorStallTorque,
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
      momentOfInertia,
      motorFreeSpeed,
      motorStallTorque,
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
        y: Number(t.scalar.toFixed(4)),
      });
    }
  }

  return data;
}

import Qty from "js-quantities";

/**
 *
 * @param {number} teeth
 * @param {Qty} pitch
 * @param {string} unit
 */
export function teethToPD(teeth, pitch, unit = undefined) {
  return pitch
    .mul(teeth)
    .div(Math.PI)
    .to(unit || pitch.units());
}

/**
 *
 * @param {Qty} pitch
 * @param {Qty} p1PitchDiameter
 * @param {Qty} p2PitchDiameter
 * @param {Qty} desiredCenter
 * @param {Qty} extraCenter
 * @param {number} minBeltToothCount
 * @param {number} maxBeltToothCount
 * @param {number} beltToothIncrement
 */
export function calculateClosestCenters(
  pitch,
  p1PitchDiameter,
  p2PitchDiameter,
  desiredCenter,
  extraCenter,
  minBeltToothCount,
  maxBeltToothCount,
  beltToothIncrement
) {
  let results = {};
  for (
    let i = minBeltToothCount;
    i <= maxBeltToothCount + beltToothIncrement;
    i += beltToothIncrement
  ) {
    const NB = i;
    const L = pitch.mul(NB);

    const t1 = L.sub(Qty(1.57).mul(p1PitchDiameter.add(p2PitchDiameter))).div(
      4
    );
    const t2 = t1.mul(t1);
    const t3 = p1PitchDiameter
      .sub(p2PitchDiameter)
      .mul(p1PitchDiameter.sub(p2PitchDiameter))
      .div(8);

    const inSqrt = t2.sub(t3).to("in^2").scalar;
    if (inSqrt < 0) {
      continue;
    }
    const sqrt = Qty(Math.sqrt(inSqrt), "in");
    const C = t1.add(sqrt).to("in");
    results[i] = {
      centerDistance: C,
      toothCount: i,
      beltLength: L,
    };
  }

  let closestSmallerSize = 0,
    closestLargerSize = 0;
  Object.keys(results).forEach((i) => {
    i = Number(i);
    const centerDistance = results[i].centerDistance;
    if (centerDistance.baseScalar <= desiredCenter.baseScalar) {
      if (closestSmallerSize === 0) {
        closestSmallerSize = i;
      } else {
        const currError = centerDistance.sub(desiredCenter);
        const prevError = results[closestSmallerSize].centerDistance.sub(
          desiredCenter
        );
        if (-currError.baseScalar < -prevError.baseScalar) {
          closestSmallerSize = i;
        }
      }
    }
  });

  if (closestSmallerSize > maxBeltToothCount) {
    closestSmallerSize = 0;
  }
  closestLargerSize =
    closestSmallerSize === 0 ||
    !(closestSmallerSize + beltToothIncrement in results)
      ? 0
      : closestSmallerSize + beltToothIncrement;

  return {
    smaller:
      closestSmallerSize !== 0
        ? {
            teeth: closestSmallerSize,
            distance: results[closestSmallerSize].centerDistance.add(
              extraCenter
            ),
          }
        : {
            teeth: 0,
            distance: Qty(0, "in"),
          },
    larger:
      closestLargerSize !== 0
        ? {
            teeth: closestLargerSize,
            distance: results[closestLargerSize].centerDistance.add(
              extraCenter
            ),
          }
        : {
            teeth: 0,
            distance: Qty(0, "in"),
          },
  };
}

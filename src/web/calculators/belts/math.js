import Measurement from "common/models/Measurement";

/**
 *
 * @param {number} teeth
 * @param {Measurement} pitch
 * @param {string} unit
 */
export function teethToPD(teeth, pitch, unit = undefined) {
  return pitch
    .mul(teeth)
    .div(Math.PI)
    .to(unit || pitch.units());
}

function calculateDistance(pitch, p1PitchDiameter, p2PitchDiameter, beltTeeth) {
  const NB = beltTeeth;
  const L = pitch.mul(NB);

  const t1 = L.sub(
    new Measurement(1.57).mul(p1PitchDiameter.add(p2PitchDiameter))
  ).div(4);
  const t2 = t1.mul(t1);
  const t3 = p1PitchDiameter
    .sub(p2PitchDiameter)
    .mul(p1PitchDiameter.sub(p2PitchDiameter))
    .div(8);

  const inSqrt = t2.sub(t3).to("in^2").scalar;
  if (inSqrt < 0) {
    return new Measurement(0, "in");
  }
  const sqrt = new Measurement(Math.sqrt(inSqrt), "in");
  const C = t1.add(sqrt).to("in");
  return C;
}

/**
 *
 * @param {Measurement} pitch
 * @param {Measurement} p1PitchDiameter
 * @param {Measurement} p2PitchDiameter
 * @param {Measurement} desiredCenter
 * @param {Measurement} extraCenter
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
  if (
    minBeltToothCount <= 0 ||
    maxBeltToothCount <= 0 ||
    beltToothIncrement <= 0
  ) {
    return {
      smaller: {
        teeth: 0,
        distance: new Measurement(0, "in"),
      },
      larger: {
        teeth: 0,
        distance: new Measurement(0, "in"),
      },
    };
  }

  let results = {};
  for (
    let i = minBeltToothCount;
    i <= maxBeltToothCount + beltToothIncrement;
    i += beltToothIncrement
  ) {
    const NB = i;
    const L = pitch.mul(NB);

    const t1 = L.sub(
      new Measurement(1.57).mul(p1PitchDiameter.add(p2PitchDiameter))
    ).div(4);
    const t2 = t1.mul(t1);
    const t3 = p1PitchDiameter
      .sub(p2PitchDiameter)
      .mul(p1PitchDiameter.sub(p2PitchDiameter))
      .div(8);

    const inSqrt = t2.sub(t3).to("in^2").scalar;
    if (inSqrt < 0) {
      continue;
    }
    const sqrt = new Measurement(Math.sqrt(inSqrt), "in");
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
            distance: new Measurement(0, "in"),
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
            distance: new Measurement(0, "in"),
          },
  };
}

export function calculateCenterGivenSpecificBelt(
  pitch,
  p1PitchDiameter,
  p2PitchDiameter,
  beltTeeth
) {
  return {
    smaller: {
      teeth: beltTeeth,
      distance: calculateDistance(
        pitch,
        p1PitchDiameter,
        p2PitchDiameter,
        beltTeeth
      ),
    },
    larger: {
      teeth: 0,
      distance: new Measurement(0, "in"),
    },
  };
}

export function calculateTeethInMesh(
  p1PitchDiameter,
  p2PitchDiameter,
  p1Teeth,
  p2Teeth,
  realDistance
) {
  if (realDistance.scalar <= 0) {
    return 0;
  }

  const D = Measurement.max(p1PitchDiameter, p2PitchDiameter);
  const d = Measurement.min(p1PitchDiameter, p2PitchDiameter);
  const C = realDistance;
  const Ng = Math.min(p1Teeth, p2Teeth);
  return new Measurement(0.5).sub(D.sub(d).div(C.mul(6))).mul(Ng).scalar;
}

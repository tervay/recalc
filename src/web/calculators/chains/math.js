import Measurement from "common/models/Measurement";

/**
 *
 * @param {number} teeth
 * @param {Measurement} chain
 * @param {string} unit
 */
export function teethToPD(teeth, chain, unit = undefined) {
  if (
    teeth === 0 ||
    teeth === "0" ||
    teeth === undefined ||
    teeth === null ||
    teeth.toString().length === 0
  ) {
    return new Measurement(0, "in");
  }

  const chainPitch = chainTypeToPitch(chain);
  return chainPitch
    .div(Math.sin(Math.PI / teeth))
    .to(unit || chainPitch.units());
}

export function chainTypeToPitch(t) {
  return new Measurement(
    {
      "#25": 0.25,
      "#35": 0.375,
      "#50 / Bike": 0.5,
    }[t],
    "in"
  );
}

function calculateCenterDistance(chainPitch, p1Teeth, p2Teeth, numLinks) {
  const P = chainPitch;
  const N = Math.max(p1Teeth, p2Teeth);
  const n = Math.min(p1Teeth, p2Teeth);
  const t1_ = 2 * numLinks - N - n;
  const t2_ = t1_ * t1_ - 0.81 * (N - n) * (N - n);
  const c = (P.to("in").scalar / 8) * (t1_ + Math.sqrt(t2_));
  return new Measurement(c, "in");
}

/**
 *
 * @param {string} chain
 * @param {number} p1Teeth
 * @param {number} p2Teeth
 * @param {Measurement} desiredCenter
 * @param {Measurement} extraCenter
 */
export function calculateClosestCenters(
  chain,
  p1Teeth,
  p2Teeth,
  desiredCenter,
  extraCenter
) {
  const z1 = Number(p1Teeth);
  const z2 = Number(p2Teeth);

  if (
    [desiredCenter.scalar, z1, z2].includes(0) ||
    teethToPD(z1, chain)
      .div(2)
      .add(teethToPD(z2, chain).div(2))
      .gt(desiredCenter)
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

  const c0 = desiredCenter;
  const p = chainTypeToPitch(chain);

  const t1 = c0.mul(2).div(p);
  const t2 = (z1 + z2) / 2;
  const t3 = p.mul(Math.pow(Math.abs(z2 - z1) / (2 * Math.PI), 2)).div(c0);
  const x0 = t1.scalar + t2 + t3.scalar;

  const roundLinksUp = (n) => Math.ceil(n / 2) * 2;
  const roundLinksDown = (n) => Math.floor(n / 2) * 2;

  return {
    smaller: {
      teeth: roundLinksDown(x0),
      distance: calculateCenterDistance(p, z1, z2, roundLinksDown(x0)).add(
        extraCenter
      ),
    },
    larger: {
      teeth: roundLinksUp(x0),
      distance: calculateCenterDistance(p, z1, z2, roundLinksUp(x0)).add(
        extraCenter
      ),
    },
  };
}

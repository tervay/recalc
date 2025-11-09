import Chain from "common/models/Chain";
import Measurement from "common/models/Measurement";
import { SimpleSprocket } from "common/models/Sprocket";

export function calculateCenterDistance(
  chain: Chain,
  p1Teeth: number,
  p2Teeth: number,
  links: number,
): Measurement {
  const P = chain.pitch;
  const N = Math.max(p1Teeth, p2Teeth);
  const n = Math.min(p1Teeth, p2Teeth);
  const t1_ = 2 * links - N - n;
  const t2_ = t1_ * t1_ - 0.81 * (N - n) * (N - n);
  const c = P.div(8).mul(t1_ + Math.sqrt(t2_));
  return c.to("in");
}

type Result = {
  links: number;
  distance: Measurement;
};
export type ChainClosestCentersResult = {
  smaller: Result;
  larger: Result;
};
export function calculateCenters(
  chain: Chain,
  p1Teeth: number,
  p2Teeth: number,
  desiredCenter: Measurement,
  allowHalfLinks: boolean,
): ChainClosestCentersResult {
  const chainType = chain.pitch.eq(new Measurement(0.25, 'in')) ? '#25' : 
                     chain.pitch.eq(new Measurement(0.375, 'in')) ? '#35' : '#40';
  if (
    [desiredCenter.scalar, p1Teeth, p2Teeth].includes(0) ||
    new SimpleSprocket(p1Teeth, chainType).pitchDiameter
      .div(2)
      .add(new SimpleSprocket(p2Teeth, chainType).pitchDiameter.div(2))
      .gt(desiredCenter)
  ) {
    return {
      smaller: {
        links: 0,
        distance: new Measurement(0, "in"),
      },
      larger: {
        links: 0,
        distance: new Measurement(0, "in"),
      },
    };
  }

  const z1 = p1Teeth;
  const z2 = p2Teeth;
  const c0 = desiredCenter;
  const p = chain.pitch;
  const t1 = c0.mul(2).div(p);
  const t2 = (z1 + z2) / 2;
  const t3 = p.mul(Math.pow(Math.abs(z2 - z1) / (2 * Math.PI), 2)).div(c0);
  const x0 = t1.scalar + t2 + t3.scalar;

  const roundLinksUp = (n: number) =>
    allowHalfLinks ? Math.ceil(n) : Math.ceil(n / 2) * 2;
  const roundLinksDown = (n: number) =>
    allowHalfLinks ? Math.floor(n) : Math.floor(n / 2) * 2;

  return {
    smaller: {
      links: roundLinksDown(x0),
      distance: calculateCenterDistance(chain, z1, z2, roundLinksDown(x0)),
    },
    larger: {
      links: roundLinksUp(x0),
      distance: calculateCenterDistance(chain, z1, z2, roundLinksUp(x0)),
    },
  };
}

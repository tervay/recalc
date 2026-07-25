import Measurement from '~/lib/models/Measurement';

export function calculateCenterDistance(
  pitch: Measurement,
  p1Teeth: number,
  p2Teeth: number,
  links: number,
): Measurement {
  const P = pitch;
  const N = Math.max(p1Teeth, p2Teeth);
  const n = Math.min(p1Teeth, p2Teeth);
  const t1_ = 2 * links - N - n;
  const t2_ = t1_ * t1_ - 0.81 * (N - n) * (N - n);
  const c = P.div(8).mul(t1_ + Math.sqrt(t2_));
  return c.to('in');
}

type Result = {
  links: number;
  distance: Measurement;
  differenceFromTarget: Measurement;
};
export type ChainClosestCentersResult = {
  smaller: Result;
  larger: Result;
};
export function calculateCenters(
  pitch: Measurement,
  p1Teeth: number,
  p2Teeth: number,
  desiredCenter: Measurement,
  allowHalfLinks: boolean,
): ChainClosestCentersResult {
  if (
    [desiredCenter.scalar, p1Teeth, p2Teeth, pitch.scalar].includes(0) ||
    pitch
      .mul(p1Teeth)
      .div(Math.PI)
      .div(2)
      .add(pitch.mul(p2Teeth).div(Math.PI).div(2))
      .gt(desiredCenter)
  ) {
    return {
      smaller: {
        links: 0,
        distance: new Measurement(0, 'in'),
        differenceFromTarget: new Measurement(0, 'in'),
      },
      larger: {
        links: 0,
        distance: new Measurement(0, 'in'),
        differenceFromTarget: new Measurement(0, 'in'),
      },
    };
  }

  const z1 = p1Teeth;
  const z2 = p2Teeth;
  const c0 = desiredCenter;
  const p = pitch;
  const t1 = c0.mul(2).div(p);
  const t2 = (z1 + z2) / 2;
  const t3 = p.mul(Math.pow(Math.abs(z2 - z1) / (2 * Math.PI), 2)).div(c0);
  const x0 = t1.scalar + t2 + t3.scalar;

  const roundLinksUp = (n: number) =>
    allowHalfLinks ? Math.ceil(n) : Math.ceil(n / 2) * 2;
  const roundLinksDown = (n: number) =>
    allowHalfLinks ? Math.floor(n) : Math.floor(n / 2) * 2;

  const smallerDistance = calculateCenterDistance(
    pitch,
    z1,
    z2,
    roundLinksDown(x0),
  );
  const largerDistance = calculateCenterDistance(
    pitch,
    z1,
    z2,
    roundLinksUp(x0),
  );

  return {
    smaller: {
      links: roundLinksDown(x0),
      distance: smallerDistance,
      differenceFromTarget: smallerDistance.sub(desiredCenter),
    },
    larger: {
      links: roundLinksUp(x0),
      distance: largerDistance,
      differenceFromTarget: largerDistance.sub(desiredCenter),
    },
  };
}

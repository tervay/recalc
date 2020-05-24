import Qty from "js-quantities";
import { DictToQty } from "../common/params";

export function teethToPitchDiameter(state, action) {
  state.p1PitchDiameter = Qty((action.payload.p1Teeth * 3) / Math.PI, "mm");
  state.p2PitchDiameter = Qty((action.payload.p2Teeth * 3) / Math.PI, "mm");
  return state;
}

export function calculateClosestSizes(state, action) {
  state = teethToPitchDiameter(state, action);

  const p = DictToQty(action.payload.pitch);
  const D = state.p1PitchDiameter;
  const d = state.p2PitchDiameter;
  const desiredCenter = DictToQty(action.payload.desiredCenter);
  const centerAdd = DictToQty(action.payload.centerAdd);

  const start = 20;
  const end = 210;
  const step = 5;
  const maxAllowed = 200;

  let results = {};
  for (let i = start; i <= end; i += step) {
    const NB = i;
    const L = p.mul(NB);

    const t1 = L.sub(Qty(1.57).mul(D.add(d))).div(4);
    const t2 = t1.mul(t1);
    const t3 = D.sub(d).mul(D.sub(d)).div(8);

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

  if (closestSmallerSize > maxAllowed) {
    closestSmallerSize = 0;
  }

  closestLargerSize = closestSmallerSize === 0 ? 0 : closestSmallerSize + step;

  state.closestSmaller =
    closestSmallerSize !== 0
      ? {
          teeth: closestSmallerSize,
          distance: results[closestSmallerSize].centerDistance.add(centerAdd),
        }
      : {
          teeth: 0,
          distance: Qty(0, "in"),
        };

  state.closestLarger =
    closestLargerSize !== 0
      ? {
          teeth: closestLargerSize,
          distance: results[closestLargerSize].centerDistance.add(centerAdd),
        }
      : {
          teeth: 0,
          distance: Qty(0, "in"),
        };
}

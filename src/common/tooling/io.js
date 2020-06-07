import { RATIO_STEPUP } from "./query-strings";

export function cleanNumberInput(value) {
  let val = NaN;
  switch (value) {
    case ".":
      val = 0;
      break;
    case "-":
      val = 0;
      break;
    default:
      val = Number(value);
      break;
  }

  return val;
}

export function RatioDictToNumber(ratio) {
  if (ratio.type === RATIO_STEPUP && ratio.amount !== 0) {
    return 1 / ratio.amount;
  } else {
    return ratio.amount;
  }
}

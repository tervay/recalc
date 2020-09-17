import Measurement from "common/models/Measurement";

export function clampQty(qty, min, max, minMaxAreQtys) {
  if (!minMaxAreQtys) {
    min = new Measurement(min, qty.units());
    max = new Measurement(max, qty.units());
  }

  if (qty.lt(min)) return min;
  if (qty.gt(max)) return max;
  return qty;
}

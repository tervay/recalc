import Qty from "common/models/Qty";

export function clampQty(qty, min, max, minMaxAreQtys) {
  if (!minMaxAreQtys) {
    min = new Qty(min, qty.units());
    max = new Qty(max, qty.units());
  }

  if (qty.lt(min)) return min;
  if (qty.gt(max)) return max;
  return qty;
}

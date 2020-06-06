import Qty from "js-quantities";

export function clampQty(qty, min, max, minMaxAreQtys) {
  if (!minMaxAreQtys) {
    min = Qty(min, qty.units());
    max = Qty(max, qty.units());
  }

  if (qty.lt(min)) return min;
  if (qty.gt(max)) return max;
  return qty;
}

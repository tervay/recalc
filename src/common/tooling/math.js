import maxBy from "lodash/maxBy";
import minBy from "lodash/minBy";

export function fit([x1, y1], [x2, y2]) {
  const slope = (y2 - y1) / (x2 - x1);
  return (x) => slope * (x - x2) + y2;
}

export function qtyMin() {
  return minBy(arguments, (q) => q.scalar);
}

export function qtyMax() {
  return maxBy(arguments, (q) => q.scalar);
}

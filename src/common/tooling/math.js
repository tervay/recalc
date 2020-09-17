import maxBy from "lodash/maxBy";
import minBy from "lodash/minBy";

/**
 *
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @returns {function(*): *}
 */
export function fit([x1, y1], [x2, y2]) {
  const slope = (y2 - y1) / (x2 - x1);
  return (x) => slope * (x - x2) + y2;
}

/**
 * @param {...Measurement}
 * @returns {Measurement}
 */
export function measurementMin() {
  return minBy(arguments, (q) => q.scalar);
}

/**
 * @param {...Measurement}
 * @returns {Measurement}
 */
export function measurementMax() {
  return maxBy(arguments, (q) => q.scalar);
}

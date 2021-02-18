import Measurement from "common/models/Measurement";
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

export const CIRCLE_RIGHT = new Measurement(0, "deg");
export const CIRCLE_UP = new Measurement(90, "deg");
export const CIRCLE_LEFT = new Measurement(180, "deg");
export const CIRCLE_DOWN = new Measurement(270, "deg");

export const CIRCLE_UP_RIGHT = new Measurement(45, "deg");
export const CIRCLE_UP_LEFT = new Measurement(135, "deg");
export const CIRCLE_DOWN_RIGHT = new Measurement(225, "deg");
export const CIRCLE_DOWN_LEFT = new Measurement(315, "deg");

/**
 * @param {Measurement} angle
 */
export function cleanAngleInput(angle) {
  const prevUnits = angle.units();

  if (angle.to("rad").scalar >= 90) {
    angle = angle.sub(new Measurement(90, "rad"));
  }

  return angle.to(prevUnits);
}

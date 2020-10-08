import Measurement from "common/models/Measurement";
import {
  CIRCLE_LEFT,
  CIRCLE_RIGHT,
  CIRCLE_UP,
  CIRCLE_UP_LEFT,
  CIRCLE_UP_RIGHT,
} from "common/tooling/math";
import each from "jest-each";

import { calculateArmTorque } from "../math";

const m = (n) => new Measurement(n, "m");
const kg = (n) => new Measurement(n, "kg");
const Nm = (n) => new Measurement(n, "N m");

each([
  [m(0.1524), kg(4.53592), CIRCLE_LEFT, Nm(6.781399980480002)],
  [m(0.1524), kg(4.53592), CIRCLE_RIGHT, Nm(-6.781399980480002)],
  [m(0.5), kg(10), CIRCLE_RIGHT, Nm(-49.05)],
  [m(0.5), kg(10), CIRCLE_UP, Nm(0)],
  [m(0.5), kg(10), CIRCLE_UP_RIGHT, Nm(-34.68358)],
  [m(0.5), kg(10), CIRCLE_UP_LEFT, Nm(34.68358)],
]).test(
  "calculateArmTorque returns correct values",
  (comLength, armMass, angle, expectedValue) => {
    const result = calculateArmTorque(comLength, armMass, angle);
    expect(result).toBeInstanceOf(Measurement);
    expect(result.baseScalar).toBeCloseTo(expectedValue.baseScalar);
  }
);

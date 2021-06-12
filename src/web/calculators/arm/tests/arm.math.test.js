import Measurement from "common/models/Measurement";
import Motor from "common/models/Motor";
import Ratio from "common/models/Ratio";
import {
  CIRCLE_LEFT,
  CIRCLE_RIGHT,
  CIRCLE_UP,
  CIRCLE_UP_LEFT,
  CIRCLE_UP_RIGHT,
} from "common/tooling/math";
import { objectify, unobjectify } from "common/tooling/util";

import {
  calculateArmInertia,
  calculateArmTorque,
  calculateState,
} from "../math";

const m = (n) => new Measurement(n, "m");
const kg = (n) => new Measurement(n, "kg");
const Nm = (n) => new Measurement(n, "N m");
const kgm2 = (n) => new Measurement(n, "kg m2");

describe("arm math", () => {
  test.each([
    [m(0.1524), kg(4.53592), CIRCLE_LEFT, Nm(6.781399980480002)],
    [m(0.1524), kg(4.53592), CIRCLE_RIGHT, Nm(-6.781399980480002)],
    [m(0.5), kg(10), CIRCLE_RIGHT, Nm(-49.05)],
    [m(0.5), kg(10), CIRCLE_UP, Nm(0)],
    [m(0.5), kg(10), CIRCLE_UP_RIGHT, Nm(-34.68358)],
    [m(0.5), kg(10), CIRCLE_UP_LEFT, Nm(34.68358)],
  ])(
    "%p calculateArmTorque returns correct values",
    (comLength, armMass, angle, expectedValue) => {
      expect(
        calculateArmTorque(comLength, armMass, angle)
      ).toBeCloseToMeasurement(expectedValue);
    }
  );

  test.each([
    [m(1), kg(1), kgm2(1)],
    [m(5), kg(2), kgm2(50)],
    [m(3), kg(12), kgm2(108)],
  ])("%p calculateArmInertia", (comLength, armMass, expected) => {
    expect(calculateArmInertia(comLength, armMass)).toBeCloseToMeasurement(
      expected
    );
  });

  test("calculateState", () => {
    const params = {
      motor: Motor.Falcon500s(2),
      ratio: new Ratio(100),
      comLength: new Measurement(20, "in"),
      armMass: new Measurement(15, "lb"),
      currentLimit: new Measurement(40, "A"),
      startAngle: CIRCLE_RIGHT,
      endAngle: CIRCLE_UP,
      iterationLimit: 10000,
    };

    const result = unobjectify(calculateState(objectify(params)));
    expect(result).toHaveLength(591);

    expect(Object.keys(result[0])).toHaveLength(3);
    expect(Object.keys(result[0])).toEqual(["time", "current", "position"]);

    expect(result[0]).toMatchObject({
      current: expect.toEqualMeasurement(new Measurement(40, "A")),
      position: expect.toBeCloseToMeasurement(CIRCLE_RIGHT),
      time: expect.toEqualMeasurement(new Measurement(0.0005, "s")),
    });

    expect(result[100]).toMatchObject({
      current: expect.toEqualMeasurement(new Measurement(40, "A")),
      position: expect.toBeCloseToMeasurement(new Measurement(4.51487, "deg")),
      time: expect.toBeCloseToMeasurement(new Measurement(0.0505, "s")),
    });

    expect(result[500]).toMatchObject({
      current: expect.toBeCloseToMeasurement(new Measurement(4.9078, "A")),
      position: expect.toBeCloseToMeasurement(new Measurement(73.1114, "deg")),
      time: expect.toBeCloseToMeasurement(new Measurement(0.2505, "s")),
    });
  });
});

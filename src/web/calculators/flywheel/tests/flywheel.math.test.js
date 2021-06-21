import Measurement from "common/models/Measurement";
import Motor from "common/models/Motor";
import Ratio from "common/models/Ratio";

import { calculateWindupTime, generateChartData } from "../math";

describe("Flywheel math", () => {
  test.each([
    {
      momentOfInertia: new Measurement(10, "lb in^2"),
      motorFreeSpeed: Motor.Falcon500s(1).freeSpeed,
      motorStallTorque: Motor.Falcon500s(1).stallTorque,
      motorQuantity: 1,
      ratio: new Ratio(1, Ratio.REDUCTION),
      targetSpeed: new Measurement(2000, "rpm"),
      expected: new Measurement(0.1567, "s"),
    },
    {
      momentOfInertia: new Measurement(22.5, "lb in^2"),
      motorFreeSpeed: Motor.NEO550s(4).freeSpeed,
      motorStallTorque: Motor.NEO550s(4).stallTorque,
      motorQuantity: 4,
      ratio: new Ratio(2, Ratio.REDUCTION),
      targetSpeed: new Measurement(5000, "rpm"),
      expected: new Measurement(1.7974, "s"),
    },
    {
      momentOfInertia: new Measurement(20, "lb in^2"),
      motorFreeSpeed: Motor._775RedLines(2).freeSpeed,
      motorStallTorque: Motor._775RedLines(2).stallTorque,
      motorQuantity: 2,
      ratio: new Ratio(2, Ratio.STEP_UP),
      targetSpeed: new Measurement(19500 * 2 - 100, "rpm"),
      expected: new Measurement(111.414, "s"),
    },
  ])(
    "%p Calculate windup time",
    ({
      momentOfInertia,
      motorFreeSpeed,
      motorStallTorque,
      motorQuantity,
      ratio,
      targetSpeed,
      expected,
    }) => {
      expect(
        calculateWindupTime(
          momentOfInertia,
          motorFreeSpeed,
          motorStallTorque,
          motorQuantity,
          ratio,
          targetSpeed
        ).toBase()
      ).toBeCloseToMeasurement(expected);
    }
  );

  test.each([
    {
      momentOfInertia: new Measurement(20, "lb in^2"),
      motorFreeSpeed: Motor._775RedLines(2).freeSpeed,
      motorStallTorque: Motor._775RedLines(2).stallTorque,
      motorQuantity: 2,
      currentRatio: new Ratio(2, Ratio.STEP_UP),
      targetSpeed: new Measurement(19500 * 2 - 100, "rpm"),
      length: 20,
      first: {
        x: 0.125,
        y: 21.4253,
      },
      last: {
        x: 0.4931249999999997,
        y: 77.9712,
      },
    },
    {
      momentOfInertia: new Measurement(10, "lb in^2"),
      motorFreeSpeed: Motor.Falcon500s(1).freeSpeed,
      motorStallTorque: Motor.Falcon500s(1).stallTorque,
      motorQuantity: 1,
      currentRatio: new Ratio(1, Ratio.REDUCTION),
      targetSpeed: new Measurement(2000, "rpm"),
      length: 157,
      first: {
        x: 0.25,
        y: 0.1361,
      },
      last: {
        x: 3.1749999999999923,
        y: 0.7037,
      },
    },
  ])(
    "%p Generate Chart data",
    ({
      momentOfInertia,
      motorFreeSpeed,
      motorStallTorque,
      motorQuantity,
      currentRatio,
      targetSpeed,
      length,
      first,
      last,
    }) => {
      const data = generateChartData(
        momentOfInertia,
        motorFreeSpeed,
        motorStallTorque,
        motorQuantity,
        currentRatio,
        targetSpeed
      );
      expect(data).toHaveLength(length);
      expect(data[0]).toMatchObject(first);
      expect(data[length - 1]).toMatchObject(last);
    }
  );
});

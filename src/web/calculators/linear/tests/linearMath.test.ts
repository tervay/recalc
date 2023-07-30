import { A, fps, inch, lb, s } from "common/models/ExtraTypes";
import Motor from "common/models/Motor";
import Ratio, { RatioType } from "common/models/Ratio";
import { describe, expect, test } from "vitest";
import {
  calculateCurrentDraw,
  calculateDragLoad,
  calculateLoadedSpeed,
  calculateTimeToGoal,
  calculateUnloadedSpeed,
  generateCurrentDrawChartData,
  generateTimeToGoalChartData,
} from "web/calculators/linear/linearMath";

describe("linearMath", () => {
  test.each([
    {
      motor: Motor.CIMs(2),
      spoolDiameter: inch(1),
      ratio: new Ratio(8, RatioType.REDUCTION),
      expected: fps(34.9 / 12),
    },
    {
      motor: Motor.CIMs(2),
      spoolDiameter: inch(0.5),
      ratio: new Ratio(8, RatioType.REDUCTION),
      expected: fps(17.4 / 12),
    },
    {
      motor: Motor._775pros(1),
      spoolDiameter: inch(2),
      ratio: new Ratio(10, RatioType.REDUCTION),
      expected: fps(196.1 / 12),
    },
  ])(
    "%p calculateUnloadedSpeed",
    ({ motor, spoolDiameter, ratio, expected }) => {
      expect(
        calculateUnloadedSpeed(motor, spoolDiameter, ratio),
      ).toBeCloseToMeasurement(expected);
    },
  );
  test.each([
    {
      motor: Motor.Falcon500s(2),
      spoolDiameter: inch(1),
      ratio: new Ratio(2, RatioType.REDUCTION),
      efficiency: 100,
      expected: lb(-331.966),
    },
    {
      motor: Motor.NEOs(2),
      spoolDiameter: inch(1),
      ratio: new Ratio(4, RatioType.REDUCTION),
      efficiency: 100,
      expected: lb(-464.328),
    },
    {
      motor: Motor.NEOs(2),
      spoolDiameter: inch(2),
      ratio: new Ratio(4, RatioType.REDUCTION),
      efficiency: 75,
      expected: lb(-174.123),
    },
  ])(
    "%p calculateDragLoad",
    ({ motor, spoolDiameter, ratio, efficiency, expected }) => {
      expect(
        calculateDragLoad(motor, spoolDiameter, ratio, efficiency),
      ).toBeCloseToMeasurement(expected);
    },
  );
  test.each([
    {
      motor: Motor.Falcon500s(2),
      spoolDiameter: inch(1),
      ratio: new Ratio(2, RatioType.REDUCTION),
      efficiency: 90,
      load: lb(120),
      expected: fps(99.9 / 12),
    },
    {
      motor: Motor.Falcon500s(2),
      spoolDiameter: inch(1),
      ratio: new Ratio(4, RatioType.REDUCTION),
      efficiency: 100,
      load: lb(120),
      expected: fps(68.4 / 12),
    },
    {
      motor: Motor.Falcon500s(2),
      spoolDiameter: inch(0.5),
      ratio: new Ratio(4, RatioType.REDUCTION),
      efficiency: 75,
      load: lb(240),
      expected: fps(31.7 / 12),
    },
  ])(
    "%p calculateLoadedSpeed",
    ({ motor, spoolDiameter, ratio, efficiency, load, expected }) => {
      expect(
        calculateLoadedSpeed(motor, spoolDiameter, ratio, efficiency, load),
      ).toBeCloseToMeasurement(expected);
    },
  );
  test.each([
    { speed: fps(10 / 12), distance: inch(10), expected: s(1) },
    { speed: fps(20 / 12), distance: inch(40), expected: s(2) },
    { speed: fps(30 / 12), distance: inch(90), expected: s(3) },
  ])("%p calculateTimeToGoal", ({ speed, distance, expected }) => {
    expect(calculateTimeToGoal(speed, distance)).toBeCloseToMeasurement(
      expected,
    );
  });
  test.each([
    {
      motor: Motor.Falcon500s(2),
      spoolDiameter: inch(1),
      ratio: new Ratio(2, RatioType.REDUCTION),
      load: lb(120),
      expected: A(94.401),
    },
    {
      motor: Motor.Falcon500s(2),
      spoolDiameter: inch(1),
      ratio: new Ratio(4, RatioType.REDUCTION),
      load: lb(120),
      expected: A(47.95),
    },
    {
      motor: Motor.Falcon500s(4),
      spoolDiameter: inch(0.5),
      ratio: new Ratio(4, RatioType.REDUCTION),
      load: lb(240),
      expected: A(24.725),
    },
  ])(
    "%p calculateCurrentDraw",
    ({ motor, spoolDiameter, load, ratio, expected }) => {
      expect(
        calculateCurrentDraw(motor, spoolDiameter, load, ratio),
      ).toBeCloseToMeasurement(expected);
    },
  );
  test.skip.each([
    {
      motor_: Motor.Falcon500s(2).toDict(),
      travelDistance_: inch(1).toDict(),
      spoolDiameter_: inch(1).toDict(),
      load_: inch(1).toDict(),
      ratio_: new Ratio(2, RatioType.REDUCTION).toDict(),
      efficiency: 100,
      expected: [{ x: 0, y: 0 }],
    },
    {
      motor_: Motor.Falcon500s(2).toDict(),
      travelDistance_: inch(1).toDict(),
      spoolDiameter_: inch(1).toDict(),
      load_: inch(1).toDict(),
      ratio_: new Ratio(2, RatioType.REDUCTION).toDict(),
      efficiency: 100,
      expected: [{ x: 0, y: 0 }],
    },
    {
      motor_: Motor.Falcon500s(2).toDict(),
      travelDistance_: inch(1).toDict(),
      spoolDiameter_: inch(1).toDict(),
      load_: inch(1).toDict(),
      ratio_: new Ratio(2, RatioType.REDUCTION).toDict(),
      efficiency: 100,
      expected: [{ x: 0, y: 0 }],
    },
  ])(
    "%p generateTimeToGoalChartData",
    ({
      motor_,
      travelDistance_,
      spoolDiameter_,
      load_,
      ratio_,
      efficiency,
      expected,
    }) => {
      expect(
        generateTimeToGoalChartData(
          motor_,
          travelDistance_,
          spoolDiameter_,
          load_,
          ratio_,
          efficiency,
        ),
      ).toBe(expected);
    },
  );
  test.skip.each([
    {
      motor_: Motor.Falcon500s(2).toDict(),
      spoolDiameter_: inch(1).toDict(),
      load_: inch(1).toDict(),
      ratio_: new Ratio(2, RatioType.REDUCTION).toDict(),
      expected: { x: 0, y: 0 },
    },
    {
      motor_: Motor.Falcon500s(2).toDict(),
      spoolDiameter_: inch(1).toDict(),
      load_: inch(1).toDict(),
      ratio_: new Ratio(2, RatioType.REDUCTION).toDict(),
      expected: { x: 0, y: 0 },
    },
    {
      motor_: Motor.Falcon500s(2).toDict(),
      spoolDiameter_: inch(1).toDict(),
      load_: inch(1).toDict(),
      ratio_: new Ratio(2, RatioType.REDUCTION).toDict(),
      expected: { x: 0, y: 0 },
    },
  ])(
    "%p generateCurrentDrawChartData",
    ({ motor_, spoolDiameter_, load_, ratio_, expected }) => {
      expect(
        generateCurrentDrawChartData(motor_, spoolDiameter_, load_, ratio_),
      ).toBe(expected);
    },
  );
});

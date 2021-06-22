import Measurement from "common/models/Measurement";
import Motor from "common/models/Motor";
import Ratio from "common/models/Ratio";

import {
  calculateCurrentDraw,
  CalculateLoadedSpeed,
  CalculateTimeToGoal,
  CalculateUnloadedSpeed,
} from "../math";

const inch = (n) => new Measurement(n, "in");
const ips = (n) => new Measurement(n, "in/sec");
const lbs = (n) => new Measurement(n, "lb");
const s = (n) => new Measurement(n, "s");
const A = (n) => new Measurement(n, "A");

describe("Linear mech math", () => {
  test.each([
    {
      motor: Motor.Falcon500s(1),
      spoolDiameter: inch(1),
      ratio: new Ratio(2),
      expected: ips(167.028),
    },
    {
      motor: Motor._775pros(3),
      spoolDiameter: inch(1),
      ratio: new Ratio(15),
      expected: ips(65.38),
    },
    {
      motor: Motor.CIMs(3),
      spoolDiameter: inch(2),
      ratio: new Ratio(8),
      expected: ips(69.7695),
    },
  ])(
    "%p CalculateUnloadedSpeed",
    ({ motor, spoolDiameter, ratio, expected }) => {
      expect(
        CalculateUnloadedSpeed(motor, spoolDiameter, ratio)
      ).toBeCloseToMeasurement(expected);
    }
  );

  test.each([
    {
      motor: Motor.Falcon500s(1),
      spoolDiameter: inch(1),
      ratio: new Ratio(2),
      load: lbs(15),
      efficiency: 97,
      expected: ips(151.4667),
    },
    {
      motor: Motor._775pros(3),
      spoolDiameter: inch(1),
      ratio: new Ratio(15),
      load: lbs(100),
      efficiency: 83,
      expected: ips(51.44735),
    },
    {
      motor: Motor.CIMs(3),
      spoolDiameter: inch(2),
      ratio: new Ratio(8),
      load: lbs(300),
      efficiency: 90,
      expected: ips(24.326),
    },
  ])(
    "%p CalculateLoadedSpeed",
    ({ motor, spoolDiameter, ratio, load, efficiency, expected }) => {
      expect(
        CalculateLoadedSpeed(motor, spoolDiameter, load, ratio, efficiency)
      ).toBeCloseToMeasurement(expected);
    }
  );

  test.each([
    {
      travelDistance: inch(48),
      loadedSpeed: ips(24.326),
      expected: s(1.9732),
    },
    {
      travelDistance: inch(300),
      loadedSpeed: ips(10),
      expected: s(30),
    },
  ])("%p CalculateTimeToGoal", ({ travelDistance, loadedSpeed, expected }) => {
    expect(
      CalculateTimeToGoal(travelDistance, loadedSpeed)
    ).toBeCloseToMeasurement(expected);
  });

  test.each([
    {
      motor: Motor.Falcon500s(1),
      spoolDiameter: inch(1),
      load: lbs(10),
      ratio: new Ratio(3),
      expected: A(11.762),
    },
    {
      motor: Motor._775pros(3),
      spoolDiameter: inch(1),
      load: lbs(100),
      ratio: new Ratio(15),
      expected: A(24.2775),
    },
    {
      motor: Motor.NEOs(5),
      spoolDiameter: inch(1),
      load: lbs(500),
      ratio: new Ratio(30),
      expected: A(10.5336),
    },
  ])(
    "%p calculateCurrentDraw",
    ({ motor, spoolDiameter, load, ratio, expected }) => {
      expect(
        calculateCurrentDraw(motor, spoolDiameter, load, ratio)
      ).toBeCloseToMeasurement(expected);
    }
  );
});

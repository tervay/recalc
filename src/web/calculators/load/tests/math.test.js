import Material from "common/models/Material";
import Measurement from "common/models/Measurement";
import Motor from "common/models/Motor";
import Ratio from "common/models/Ratio";

import { calculateState, testables } from "../math";

const deg = (n) => new Measurement(n, "deg");
const inch = (n) => new Measurement(n, "inch");
const dp = (n) => new Measurement(n, "1/in");
const N = (n) => new Measurement(n, "N");
const A = (n) => new Measurement(n, "A");

describe("Load math tests", () => {
  test.each([
    {
      teeth: 20,
      pressureAngle: deg(14.5),
      expected: 0.28207,
    },
    {
      teeth: 60,
      pressureAngle: deg(14.5),
      expected: 0.3538,
    },
    {
      teeth: 20,
      pressureAngle: deg(20),
      expected: 0.3272,
    },
    {
      teeth: 60,
      pressureAngle: deg(20),
      expected: 0.41778,
    },
  ])("%p guessLewisYFactor", ({ teeth, pressureAngle, expected }) => {
    expect(testables.guessLewisYFactor(teeth, pressureAngle)).toBeCloseTo(
      expected
    );
  });

  test.each([
    {
      teeth: 20,
      material: Material.Aluminum7075_T6(),
      width: inch(0.5),
      diametralPitch: dp(20),
      pressureAngle: deg(14.5),
      expected: N(727.93694),
    },
    {
      teeth: 20,
      material: Material.Steel4140(),
      width: inch(0.5),
      diametralPitch: dp(20),
      pressureAngle: deg(14.5),
      expected: N(1501.3699),
    },
    {
      teeth: 80,
      material: Material.Aluminum7075_T6(),
      width: inch(0.75),
      diametralPitch: dp(32),
      pressureAngle: deg(20),
      expected: N(1038.1288),
    },
  ])(
    "%p calculateSafeToothLoad",
    ({ teeth, material, width, diametralPitch, pressureAngle, expected }) => {
      expect(
        testables.calculateSafeToothLoad(
          teeth,
          material,
          width,
          diametralPitch,
          pressureAngle
        )
      ).toBeCloseToMeasurement(expected);
    }
  );

  test.each([
    {
      motor: Motor.Falcon500s(3),
      planetaryRatio: new Ratio(2),
      currentLimit: A(50),
      diametralPitch: dp(20),
      pressureAngle: deg(14.5),
      pinionTeeth: 8,
      pinionMaterial: Material.Steel4140(),
      gearTeeth: 64,
      gearMaterial: Material.Aluminum7075_T6(),
      pinionWidth: inch(1),
      gearWidth: inch(0.5),
      expected: {
        pinion: {
          stallForce: N(350.5015),
          safeLoad: N(1282.7181),
        },
        gear: {
          stallForce: N(1051.504),
          safeLoad: N(919.0504),
        },
      },
    },
    {
      motor: Motor.NEOs(1),
      planetaryRatio: new Ratio(1),
      currentLimit: A(1000),
      diametralPitch: dp(32),
      pressureAngle: deg(14.5),
      pinionTeeth: 6,
      pinionMaterial: Material.Steel4140(),
      gearTeeth: 80,
      gearMaterial: Material.Aluminum7075_T6(),
      pinionWidth: inch(0.5),
      gearWidth: inch(0.75),
      expected: {
        pinion: {
          stallForce: N(1411.0236),
          safeLoad: N(102.2345),
        },
        gear: {
          stallForce: N(1411.0236),
          safeLoad: N(877.897),
        },
      },
    },
  ])(
    "%p calculateState",
    ({
      motor,
      planetaryRatio,
      currentLimit,
      diametralPitch,
      pressureAngle,
      pinionTeeth,
      pinionMaterial,
      gearTeeth,
      gearMaterial,
      pinionWidth,
      gearWidth,
      expected,
    }) => {
      const state = calculateState(
        motor,
        planetaryRatio,
        currentLimit,
        diametralPitch,
        pressureAngle,
        pinionTeeth,
        pinionMaterial,
        gearTeeth,
        gearMaterial,
        pinionWidth,
        gearWidth
      );

      expect(state.pinion.stallForce).toBeCloseToMeasurement(
        expected.pinion.stallForce
      );
      expect(state.pinion.safeLoad).toBeCloseToMeasurement(
        expected.pinion.safeLoad
      );
      expect(state.gear.stallForce).toBeCloseToMeasurement(
        expected.gear.stallForce
      );
      expect(state.gear.safeLoad).toBeCloseToMeasurement(
        expected.gear.safeLoad
      );
    }
  );
});

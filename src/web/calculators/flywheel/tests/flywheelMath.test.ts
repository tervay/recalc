import {
  A,
  fps,
  in2lb,
  inch,
  J,
  lb,
  rpm,
  s,
  ul,
} from "common/models/ExtraTypes";
import Motor from "common/models/Motor";
import Ratio, { RatioType } from "common/models/Ratio";
import { describe, expect, test } from "vitest";
import {
  calculateFlywheelEnergy,
  calculateProjectileEnergy,
  calculateProjectileExitVelocity,
  calculateRecoveryTime,
  calculateShooterWheelSurfaceSpeed,
  calculateSpeedAfterShot,
  calculateWindupTime,
  projectileSpeedTransferPercentage,
} from "web/calculators/flywheel/flywheelMath";

describe("flywheelMath", () => {
  test.each([
    {
      momentOfInertia: in2lb(7.5),
      motor: Motor.Falcon500s(2),
      currentLimit: A(50),
      ratio: new Ratio(2, RatioType.STEP_UP),
      targetSpeed: rpm(11000),
      expected: s(3.282),
    },
    {
      momentOfInertia: in2lb(5),
      motor: Motor._775pros(4),
      currentLimit: A(60),
      ratio: new Ratio(2, RatioType.REDUCTION),
      targetSpeed: rpm(9000),
      expected: s(3.7047),
    },
    {
      momentOfInertia: in2lb(13.1),
      motor: Motor.NEOs(1),
      currentLimit: A(80),
      ratio: new Ratio(1),
      targetSpeed: rpm(5000),
      expected: s(2.819),
    },
  ])(
    "%p calculateWindupTime",
    ({
      momentOfInertia,
      motor,
      currentLimit,
      ratio,
      targetSpeed,
      expected,
    }) => {
      expect(
        calculateWindupTime(
          momentOfInertia,
          motor,
          currentLimit,
          ratio,
          targetSpeed,
        ),
      ).toBeCloseToMeasurement(expected);
    },
  );
  test.each([
    { speed: rpm(5000), radius: inch(4), expected: fps(174.5329) },
    { speed: rpm(2000), radius: inch(2), expected: fps(34.906) },
    { speed: rpm(100), radius: inch(1), expected: fps(0.873) },
  ])("%p calculateShooterWheelSurfaceSpeed", ({ speed, radius, expected }) => {
    expect(
      calculateShooterWheelSurfaceSpeed(speed, radius),
    ).toBeCloseToMeasurement(expected);
  });
  test.each([
    {
      projectileWeight: lb(5),
      shooterWheelRadius: inch(1),
      totalMOI: in2lb(3.5),
      expected: ul(0.25),
    },
    {
      projectileWeight: lb(10),
      shooterWheelRadius: inch(2),
      totalMOI: in2lb(5),
      expected: ul(0.07575),
    },
    {
      projectileWeight: lb(10),
      shooterWheelRadius: inch(4),
      totalMOI: in2lb(11),
      expected: ul(0.0447),
    },
  ])(
    "%p projectileSpeedTransferPercentage",
    ({ projectileWeight, shooterWheelRadius, totalMOI, expected }) => {
      expect(
        projectileSpeedTransferPercentage(
          projectileWeight,
          shooterWheelRadius,
          totalMOI,
        ),
      ).toBeCloseToMeasurement(expected);
    },
  );
  test.each([
    {
      projectileWeight: lb(5),
      shooterWheelRadius: inch(1),
      totalMOI: in2lb(3.5),
      shooterWheelSurfaceSpeed: fps(17.45),
      expected: fps(4.3625),
    },
    {
      projectileWeight: lb(10),
      shooterWheelRadius: inch(2),
      totalMOI: in2lb(5),
      shooterWheelSurfaceSpeed: fps(52.35),
      expected: fps(3.966),
    },
    {
      projectileWeight: lb(10),
      shooterWheelRadius: inch(4),
      totalMOI: in2lb(11),
      shooterWheelSurfaceSpeed: fps(205.212),
      expected: fps(9.176),
    },
  ])(
    "%p calculateProjectileExitVelocity",
    ({
      projectileWeight,
      shooterWheelRadius,
      totalMOI,
      shooterWheelSurfaceSpeed,
      expected,
    }) => {
      expect(
        calculateProjectileExitVelocity(
          projectileWeight,
          shooterWheelRadius,
          totalMOI,
          shooterWheelSurfaceSpeed,
        ),
      ).toBeCloseToMeasurement(expected);
    },
  );
  test.each([
    {
      projectileVelocity: fps(9.176),
      projectileWeight: lb(10),
      expected: J(24.84),
    },
    {
      projectileVelocity: fps(16.846),
      projectileWeight: lb(5),
      expected: J(41.85595),
    },
    {
      projectileVelocity: fps(33.792),
      projectileWeight: lb(2),
      expected: J(67.37),
    },
  ])(
    "%p calculateProjectileEnergy",
    ({ projectileVelocity, projectileWeight, expected }) => {
      expect(
        calculateProjectileEnergy(projectileVelocity, projectileWeight),
      ).toBeCloseToMeasurement(expected);
    },
  );
  test.each([
    {
      totalMomentOfInertia: in2lb(5),
      targetSpeed: rpm(11000),
      expected: J(970.76875),
    },
    {
      totalMomentOfInertia: in2lb(10),
      targetSpeed: rpm(1000),
      expected: J(16.04576),
    },
    {
      totalMomentOfInertia: in2lb(25),
      targetSpeed: rpm(25000),
      expected: J(25071.507),
    },
  ])(
    "%p calculateFlywheelEnergy",
    ({ totalMomentOfInertia, targetSpeed, expected }) => {
      expect(
        calculateFlywheelEnergy(totalMomentOfInertia, targetSpeed),
      ).toBeCloseToMeasurement(expected);
    },
  );
  test.each([
    {
      totalMomentOfInertia: in2lb(11),
      flywheelEnergy: J(609.94),
      projectileEnergy: J(67.37),
      expected: rpm(5544.36),
    },
    {
      totalMomentOfInertia: in2lb(7.5),
      flywheelEnergy: J(415.87),
      projectileEnergy: J(36.76),
      expected: rpm(5612.699),
    },
    {
      totalMomentOfInertia: in2lb(5),
      flywheelEnergy: J(128.3),
      projectileEnergy: J(8.25),
      expected: rpm(3868.262),
    },
  ])(
    "%p calculateSpeedAfterShot",
    ({ totalMomentOfInertia, flywheelEnergy, projectileEnergy, expected }) => {
      expect(
        calculateSpeedAfterShot(
          totalMomentOfInertia,
          flywheelEnergy,
          projectileEnergy,
        ),
      ).toBeCloseToMeasurement(expected);
    },
  );
  test.each([
    {
      totalMomentOfInertia: in2lb(5),
      motor: Motor.Falcon500s(2),
      ratio: new Ratio(1, RatioType.REDUCTION),
      variation: 0.01,
      targetSpeed: rpm(5000),
      speedAfterShot: rpm(4836.61),
      currentLimit: A(40),
      expected: s(0.05304),
    },
    {
      totalMomentOfInertia: in2lb(10),
      motor: Motor.Falcon500s(2),
      ratio: new Ratio(2, RatioType.STEP_UP),
      variation: 0.01,
      targetSpeed: rpm(10000),
      speedAfterShot: rpm(9837.97),
      currentLimit: A(50),
      expected: s(0.04739),
    },
    {
      totalMomentOfInertia: in2lb(15),
      motor: Motor.Falcon500s(2),
      ratio: new Ratio(2, RatioType.REDUCTION),
      variation: 0.01,
      targetSpeed: rpm(3000),
      speedAfterShot: rpm(2967.68),
      currentLimit: A(60),
      expected: s(0.00719),
    },
  ])(
    "%p calculateRecoveryTime",
    ({
      totalMomentOfInertia,
      motor,
      ratio,
      variation,
      targetSpeed,
      speedAfterShot,
      currentLimit,
      expected,
    }) => {
      expect(
        calculateRecoveryTime(
          totalMomentOfInertia,
          motor,
          ratio,
          variation,
          targetSpeed,
          speedAfterShot,
          currentLimit,
        ),
      ).toBeCloseToMeasurement(expected);
    },
  );
});

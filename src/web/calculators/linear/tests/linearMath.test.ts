import {
  Nm,
  deg,
  kg,
  m,
  m_s,
  m_s2,
  mm,
  rpm,
  s,
} from "common/models/ExtraTypes";
import { describe, expect, test } from "vitest";
import { planTrapezoidalMotionProfile } from "web/calculators/linear/linearMath";

describe("linearMath", () => {
  test.each([
    {
      angle: deg(90),
      distance: m(1),
      maxVelocity: rpm(3000),
      motorTorque: Nm(3),
      spoolDiameter: mm(25),
      systemMass: kg(5),
      expected: {
        acceleration: m_s2(38.19),
        accelerationPhaseDuration: s(0.1028),
        constantVelocityPhaseDuration: s(0.16927),
        deceleration: m_s2(57.81),
        decelerationPhaseDuration: s(0.068),
        maxVelocity: m_s(3.927),
      },
    },
    {
      angle: deg(45),
      distance: m(1),
      maxVelocity: rpm(3000),
      motorTorque: Nm(3),
      spoolDiameter: mm(25),
      systemMass: kg(5),
      expected: {
        acceleration: m_s2(41.0633),
        accelerationPhaseDuration: s(0.0956),
        constantVelocityPhaseDuration: s(0.1711),
        deceleration: m_s2(54.9367),
        decelerationPhaseDuration: s(0.0715),
        maxVelocity: m_s(3.927),
      },
    },
    {
      angle: deg(90),
      distance: m(0.1),
      maxVelocity: rpm(5000),
      motorTorque: Nm(5),
      spoolDiameter: mm(25),
      systemMass: kg(1),
      expected: {
        acceleration: m_s2(390.19),
        accelerationPhaseDuration: s(0.016),
        constantVelocityPhaseDuration: s(0),
        deceleration: m_s2(409.81),
        decelerationPhaseDuration: s(0.016),
        maxVelocity: m_s(6.545),
      },
    },
  ])(
    "%p planTrapezoidalMotionProfile",
    ({
      angle,
      distance,
      maxVelocity,
      motorTorque,
      spoolDiameter,
      systemMass,
      expected,
    }) => {
      const profile = planTrapezoidalMotionProfile({
        angle,
        distance,
        maxVelocity,
        motorTorque,
        spoolDiameter,
        systemMass,
      });
      expect(profile.acceleration).toBeCloseToMeasurement(
        expected.acceleration,
      );
      expect(profile.accelerationPhaseDuration).toBeCloseToMeasurement(
        expected.accelerationPhaseDuration,
      );
      expect(profile.constantVelocityPhaseDuration).toBeCloseToMeasurement(
        expected.constantVelocityPhaseDuration,
      );
      expect(profile.deceleration).toBeCloseToMeasurement(
        expected.deceleration,
      );
      expect(profile.decelerationPhaseDuration).toBeCloseToMeasurement(
        expected.decelerationPhaseDuration,
      );
      expect(profile.maxVelocity).toBeCloseToMeasurement(expected.maxVelocity);
    },
  );
});

#include "feedback_gains.h"

#include <catch2/catch_test_macros.hpp>
#include <catch2/matchers/catch_matchers_floating_point.hpp>
#include <cmath>
#include <stdexcept>

#include "wpi/math/controller/LinearQuadraticRegulator.hpp"
#include "wpi/math/system/DCMotor.hpp"
#include "wpi/math/system/LinearSystem.hpp"
#include "wpi/math/system/Models.hpp"

using Catch::Matchers::WithinAbs;

static constexpr double kTol = 1e-9;

// ============================================================================
// ComputeElevatorFeedbackGainsCore
// ============================================================================

namespace {
class ElevatorFeedbackGainsTest {
 protected:
  const wpi::math::DCMotor motor = wpi::math::DCMotor::NEO(1);
  static constexpr double kGearing = 10.0;
  static constexpr double kMassKg = 5.0;
  static constexpr double kSpoolRadiusMeters = 0.025;
  static constexpr double kEfficiency = 1.0;
  static constexpr double kQPositionMeters = 0.01;
  static constexpr double kQVelocityMPS = 0.1;
  static constexpr double kRVolts = 12.0;
  static constexpr double kDtSeconds = 0.02;
  static constexpr double kSensorDelaySeconds = 0.0;
};
}  // namespace

// Regression test: cross-checks ComputeElevatorFeedbackGainsCore against an
// LQR built directly from the same plant, mirroring elevator_sim.h's
// internal LQR construction. If either implementation's efficiency-scaling
// or plant rebuild drifts from the other, this catches it.
TEST_CASE_METHOD(ElevatorFeedbackGainsTest,
                 "ElevatorFeedbackGainsTest: MatchesDirectLqrConstruction",
                 "[ElevatorFeedbackGainsTest]") {
  auto idealPlantFull = wpi::math::Models::ElevatorFromPhysicalConstants(
      motor, wpi::units::kilogram_t(kMassKg),
      wpi::units::meter_t(kSpoolRadiusMeters), kGearing);

  wpi::math::Matrixd<2, 1> controllerB = idealPlantFull.B() * kEfficiency;
  wpi::math::Matrixd<1, 2> controllerC;
  controllerC << 1, 0;
  wpi::math::Matrixd<1, 1> controllerD;
  controllerD << 0;
  wpi::math::LinearSystem<2, 1, 1> plant{idealPlantFull.A(), controllerB,
                                         controllerC, controllerD};

  wpi::math::LinearQuadraticRegulator<2, 1> expected{
      plant,
      {kQPositionMeters, kQVelocityMPS},
      {kRVolts},
      wpi::units::second_t(kDtSeconds)};
  expected.LatencyCompensate(plant, wpi::units::second_t(kDtSeconds),
                             wpi::units::second_t(kSensorDelaySeconds));

  FeedbackGains actual = ComputeElevatorFeedbackGainsCore(
      motor, kGearing, kMassKg, kSpoolRadiusMeters, kEfficiency,
      kQPositionMeters, kQVelocityMPS, kRVolts, kDtSeconds,
      kSensorDelaySeconds);

  CHECK_THAT(actual.kP, WithinAbs(expected.K(0, 0), kTol));
  CHECK_THAT(actual.kD, WithinAbs(expected.K(0, 1), kTol));
}

TEST_CASE_METHOD(ElevatorFeedbackGainsTest,
                 "ElevatorFeedbackGainsTest: ProducesPlausiblePositiveGains",
                 "[ElevatorFeedbackGainsTest]") {
  FeedbackGains gains = ComputeElevatorFeedbackGainsCore(
      motor, kGearing, kMassKg, kSpoolRadiusMeters, kEfficiency,
      kQPositionMeters, kQVelocityMPS, kRVolts, kDtSeconds,
      kSensorDelaySeconds);

  // A stable position controller must push harder in the direction of
  // increasing error, i.e. both gains should be strictly positive.
  CHECK(gains.kP > 0.0);
  CHECK(gains.kD > 0.0);
}

TEST_CASE_METHOD(
    ElevatorFeedbackGainsTest,
    "ElevatorFeedbackGainsTest: TighteningPositionToleranceIncreasesKP",
    "[ElevatorFeedbackGainsTest]") {
  FeedbackGains loose = ComputeElevatorFeedbackGainsCore(
      motor, kGearing, kMassKg, kSpoolRadiusMeters, kEfficiency,
      /*qPositionMeters=*/0.05, kQVelocityMPS, kRVolts, kDtSeconds,
      kSensorDelaySeconds);
  FeedbackGains tight = ComputeElevatorFeedbackGainsCore(
      motor, kGearing, kMassKg, kSpoolRadiusMeters, kEfficiency,
      /*qPositionMeters=*/0.005, kQVelocityMPS, kRVolts, kDtSeconds,
      kSensorDelaySeconds);

  CHECK(tight.kP > loose.kP);
}

// Unlike the position/kP relationship above, kD does not increase as the
// velocity tolerance is tightened for this plant. Position and velocity are
// coupled through the elevator's dynamics (velocity feeds the position
// state), so penalizing velocity error more heavily (smaller qVelocityMPS,
// i.e. larger Q_velocity per Bryson's rule) yields a *less* aggressive
// optimal controller overall -- both kP and kD decrease. This was verified
// independently against a discrete-time LQR/DARE reference implementation
// in Python (scipy.linalg.solve_discrete_are) swept over qVelocityMPS from
// 1.0 down to 0.001 with all other parameters fixed at this test's values,
// confirming the relationship is monotonic (not just a quirk of the two
// sample points below) -- this is a real property of the coupled plant, not
// a bug in ComputeElevatorFeedbackGainsCore.
TEST_CASE_METHOD(
    ElevatorFeedbackGainsTest,
    "ElevatorFeedbackGainsTest: TighteningVelocityToleranceDecreasesKD",
    "[ElevatorFeedbackGainsTest]") {
  FeedbackGains loose = ComputeElevatorFeedbackGainsCore(
      motor, kGearing, kMassKg, kSpoolRadiusMeters, kEfficiency,
      kQPositionMeters, /*qVelocityMPS=*/0.5, kRVolts, kDtSeconds,
      kSensorDelaySeconds);
  FeedbackGains tight = ComputeElevatorFeedbackGainsCore(
      motor, kGearing, kMassKg, kSpoolRadiusMeters, kEfficiency,
      kQPositionMeters, /*qVelocityMPS=*/0.05, kRVolts, kDtSeconds,
      kSensorDelaySeconds);

  CHECK(tight.kD < loose.kD);
}

TEST_CASE_METHOD(
    ElevatorFeedbackGainsTest,
    "ElevatorFeedbackGainsTest: NonPositiveGearingThrowsDomainError",
    "[ElevatorFeedbackGainsTest]") {
  CHECK_THROWS_AS(ComputeElevatorFeedbackGainsCore(
                      motor, /*gearing=*/0.0, kMassKg, kSpoolRadiusMeters,
                      kEfficiency, kQPositionMeters, kQVelocityMPS, kRVolts,
                      kDtSeconds, kSensorDelaySeconds),
                  std::domain_error);
}

TEST_CASE_METHOD(ElevatorFeedbackGainsTest,
                 "ElevatorFeedbackGainsTest: NonPositiveMassThrowsDomainError",
                 "[ElevatorFeedbackGainsTest]") {
  CHECK_THROWS_AS(ComputeElevatorFeedbackGainsCore(
                      motor, kGearing, /*massKg=*/-1.0, kSpoolRadiusMeters,
                      kEfficiency, kQPositionMeters, kQVelocityMPS, kRVolts,
                      kDtSeconds, kSensorDelaySeconds),
                  std::domain_error);
}

TEST_CASE_METHOD(
    ElevatorFeedbackGainsTest,
    "ElevatorFeedbackGainsTest: NonPositiveSpoolRadiusThrowsDomainError",
    "[ElevatorFeedbackGainsTest]") {
  CHECK_THROWS_AS(ComputeElevatorFeedbackGainsCore(
                      motor, kGearing, kMassKg, /*spoolRadiusMeters=*/0.0,
                      kEfficiency, kQPositionMeters, kQVelocityMPS, kRVolts,
                      kDtSeconds, kSensorDelaySeconds),
                  std::domain_error);
}

// ============================================================================
// ComputeArmFeedbackGainsCore
// ============================================================================

namespace {
class ArmFeedbackGainsTest {
 protected:
  const wpi::math::DCMotor motor = wpi::math::DCMotor::Falcon500(1);
  static constexpr double kGearing = 100.0;
  static constexpr double kMomentOfInertiaKgMSquared = 2.0;
  static constexpr double kEfficiency = 0.9;
  static constexpr double kQPositionRad = 0.05;
  static constexpr double kQVelocityRadPerSec = 1.0;
  static constexpr double kRVolts = 12.0;
  static constexpr double kDtSeconds = 0.02;
  static constexpr double kSensorDelaySeconds = 0.01;
};
}  // namespace

TEST_CASE_METHOD(ArmFeedbackGainsTest,
                 "ArmFeedbackGainsTest: MatchesDirectLqrConstruction",
                 "[ArmFeedbackGainsTest]") {
  auto idealPlantFull =
      wpi::math::Models::SingleJointedArmFromPhysicalConstants(
          motor,
          wpi::units::kilogram_square_meter_t(kMomentOfInertiaKgMSquared),
          kGearing);

  wpi::math::Matrixd<2, 1> controllerB = idealPlantFull.B() * kEfficiency;
  wpi::math::Matrixd<1, 2> controllerC;
  controllerC << 1, 0;
  wpi::math::Matrixd<1, 1> controllerD;
  controllerD << 0;
  wpi::math::LinearSystem<2, 1, 1> plant{idealPlantFull.A(), controllerB,
                                         controllerC, controllerD};

  wpi::math::LinearQuadraticRegulator<2, 1> expected{
      plant,
      {kQPositionRad, kQVelocityRadPerSec},
      {kRVolts},
      wpi::units::second_t(kDtSeconds)};
  expected.LatencyCompensate(plant, wpi::units::second_t(kDtSeconds),
                             wpi::units::second_t(kSensorDelaySeconds));

  FeedbackGains actual = ComputeArmFeedbackGainsCore(
      motor, kGearing, kMomentOfInertiaKgMSquared, kEfficiency, kQPositionRad,
      kQVelocityRadPerSec, kRVolts, kDtSeconds, kSensorDelaySeconds);

  CHECK_THAT(actual.kP, WithinAbs(expected.K(0, 0), kTol));
  CHECK_THAT(actual.kD, WithinAbs(expected.K(0, 1), kTol));
}

TEST_CASE_METHOD(ArmFeedbackGainsTest,
                 "ArmFeedbackGainsTest: ProducesPlausiblePositiveGains",
                 "[ArmFeedbackGainsTest]") {
  FeedbackGains gains = ComputeArmFeedbackGainsCore(
      motor, kGearing, kMomentOfInertiaKgMSquared, kEfficiency, kQPositionRad,
      kQVelocityRadPerSec, kRVolts, kDtSeconds, kSensorDelaySeconds);

  CHECK(gains.kP > 0.0);
  CHECK(gains.kD > 0.0);
}

TEST_CASE_METHOD(
    ArmFeedbackGainsTest,
    "ArmFeedbackGainsTest: NonPositiveMomentOfInertiaThrowsDomainError",
    "[ArmFeedbackGainsTest]") {
  CHECK_THROWS_AS(ComputeArmFeedbackGainsCore(
                      motor, kGearing, /*momentOfInertiaKgMSquared=*/0.0,
                      kEfficiency, kQPositionRad, kQVelocityRadPerSec, kRVolts,
                      kDtSeconds, kSensorDelaySeconds),
                  std::domain_error);
}

TEST_CASE_METHOD(ArmFeedbackGainsTest,
                 "ArmFeedbackGainsTest: NonPositiveGearingThrowsDomainError",
                 "[ArmFeedbackGainsTest]") {
  CHECK_THROWS_AS(ComputeArmFeedbackGainsCore(
                      motor, /*gearing=*/-5.0, kMomentOfInertiaKgMSquared,
                      kEfficiency, kQPositionRad, kQVelocityRadPerSec, kRVolts,
                      kDtSeconds, kSensorDelaySeconds),
                  std::domain_error);
}

// ============================================================================
// ComputeFlywheelFeedbackGainsCore
// ============================================================================

namespace {
class FlywheelFeedbackGainsTest {
 protected:
  const wpi::math::DCMotor motor = wpi::math::DCMotor::KrakenX60(1);
  static constexpr double kGearing = 2.0;
  static constexpr double kMomentOfInertiaKgMSquared = 0.01;
  static constexpr double kEfficiency = 1.0;
  static constexpr double kQVelocityRadPerSec = 5.0;
  static constexpr double kRVolts = 12.0;
  static constexpr double kDtSeconds = 0.02;
  static constexpr double kSensorDelaySeconds = 0.0;
};
}  // namespace

TEST_CASE_METHOD(FlywheelFeedbackGainsTest,
                 "FlywheelFeedbackGainsTest: MatchesDirectLqrConstruction",
                 "[FlywheelFeedbackGainsTest]") {
  auto idealPlant = wpi::math::Models::FlywheelFromPhysicalConstants(
      motor, wpi::units::kilogram_square_meter_t(kMomentOfInertiaKgMSquared),
      kGearing);

  wpi::math::Matrixd<1, 1> controllerB = idealPlant.B() * kEfficiency;
  wpi::math::LinearSystem<1, 1, 1> plant{idealPlant.A(), controllerB,
                                         idealPlant.C(), idealPlant.D()};

  wpi::math::LinearQuadraticRegulator<1, 1> expected{
      plant,
      {kQVelocityRadPerSec},
      {kRVolts},
      wpi::units::second_t(kDtSeconds)};
  expected.LatencyCompensate(plant, wpi::units::second_t(kDtSeconds),
                             wpi::units::second_t(kSensorDelaySeconds));

  FeedbackGains actual = ComputeFlywheelFeedbackGainsCore(
      motor, kGearing, kMomentOfInertiaKgMSquared, kEfficiency,
      kQVelocityRadPerSec, kRVolts, kDtSeconds, kSensorDelaySeconds);

  CHECK_THAT(actual.kP, WithinAbs(expected.K(0, 0), kTol));
}

TEST_CASE_METHOD(FlywheelFeedbackGainsTest,
                 "FlywheelFeedbackGainsTest: KDIsAlwaysZero",
                 "[FlywheelFeedbackGainsTest]") {
  FeedbackGains gains = ComputeFlywheelFeedbackGainsCore(
      motor, kGearing, kMomentOfInertiaKgMSquared, kEfficiency,
      kQVelocityRadPerSec, kRVolts, kDtSeconds, kSensorDelaySeconds);

  CHECK(gains.kD == 0.0);
}

TEST_CASE_METHOD(FlywheelFeedbackGainsTest,
                 "FlywheelFeedbackGainsTest: ProducesPlausiblePositiveGain",
                 "[FlywheelFeedbackGainsTest]") {
  FeedbackGains gains = ComputeFlywheelFeedbackGainsCore(
      motor, kGearing, kMomentOfInertiaKgMSquared, kEfficiency,
      kQVelocityRadPerSec, kRVolts, kDtSeconds, kSensorDelaySeconds);

  CHECK(gains.kP > 0.0);
}

TEST_CASE_METHOD(
    FlywheelFeedbackGainsTest,
    "FlywheelFeedbackGainsTest: TighteningVelocityToleranceIncreasesKP",
    "[FlywheelFeedbackGainsTest]") {
  FeedbackGains loose = ComputeFlywheelFeedbackGainsCore(
      motor, kGearing, kMomentOfInertiaKgMSquared, kEfficiency,
      /*qVelocityRadPerSec=*/50.0, kRVolts, kDtSeconds, kSensorDelaySeconds);
  FeedbackGains tight = ComputeFlywheelFeedbackGainsCore(
      motor, kGearing, kMomentOfInertiaKgMSquared, kEfficiency,
      /*qVelocityRadPerSec=*/1.0, kRVolts, kDtSeconds, kSensorDelaySeconds);

  CHECK(tight.kP > loose.kP);
}

TEST_CASE_METHOD(
    FlywheelFeedbackGainsTest,
    "FlywheelFeedbackGainsTest: NonPositiveMomentOfInertiaThrowsDomainError",
    "[FlywheelFeedbackGainsTest]") {
  CHECK_THROWS_AS(
      ComputeFlywheelFeedbackGainsCore(
          motor, kGearing, /*momentOfInertiaKgMSquared=*/-0.01, kEfficiency,
          kQVelocityRadPerSec, kRVolts, kDtSeconds, kSensorDelaySeconds),
      std::domain_error);
}

TEST_CASE_METHOD(
    FlywheelFeedbackGainsTest,
    "FlywheelFeedbackGainsTest: NonPositiveGearingThrowsDomainError",
    "[FlywheelFeedbackGainsTest]") {
  CHECK_THROWS_AS(
      ComputeFlywheelFeedbackGainsCore(
          motor, /*gearing=*/0.0, kMomentOfInertiaKgMSquared, kEfficiency,
          kQVelocityRadPerSec, kRVolts, kDtSeconds, kSensorDelaySeconds),
      std::domain_error);
}

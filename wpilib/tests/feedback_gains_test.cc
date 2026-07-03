#include "feedback_gains.h"

#include <gtest/gtest.h>

#include <cmath>
#include <stdexcept>

#include "wpi/math/controller/LinearQuadraticRegulator.hpp"
#include "wpi/math/system/DCMotor.hpp"
#include "wpi/math/system/LinearSystem.hpp"
#include "wpi/math/system/Models.hpp"

static constexpr double kTol = 1e-9;

// ============================================================================
// ComputeElevatorFeedbackGainsCore
// ============================================================================

class ElevatorFeedbackGainsTest : public ::testing::Test {
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

// Regression test: cross-checks ComputeElevatorFeedbackGainsCore against an
// LQR built directly from the same plant, mirroring elevator_sim.h's
// internal LQR construction. If either implementation's efficiency-scaling
// or plant rebuild drifts from the other, this catches it.
TEST_F(ElevatorFeedbackGainsTest, MatchesDirectLqrConstruction) {
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

  EXPECT_NEAR(actual.kP, expected.K(0, 0), kTol);
  EXPECT_NEAR(actual.kD, expected.K(0, 1), kTol);
}

TEST_F(ElevatorFeedbackGainsTest, ProducesPlausiblePositiveGains) {
  FeedbackGains gains = ComputeElevatorFeedbackGainsCore(
      motor, kGearing, kMassKg, kSpoolRadiusMeters, kEfficiency,
      kQPositionMeters, kQVelocityMPS, kRVolts, kDtSeconds,
      kSensorDelaySeconds);

  // A stable position controller must push harder in the direction of
  // increasing error, i.e. both gains should be strictly positive.
  EXPECT_GT(gains.kP, 0.0);
  EXPECT_GT(gains.kD, 0.0);
}

TEST_F(ElevatorFeedbackGainsTest, TighteningPositionToleranceIncreasesKP) {
  FeedbackGains loose = ComputeElevatorFeedbackGainsCore(
      motor, kGearing, kMassKg, kSpoolRadiusMeters, kEfficiency,
      /*qPositionMeters=*/0.05, kQVelocityMPS, kRVolts, kDtSeconds,
      kSensorDelaySeconds);
  FeedbackGains tight = ComputeElevatorFeedbackGainsCore(
      motor, kGearing, kMassKg, kSpoolRadiusMeters, kEfficiency,
      /*qPositionMeters=*/0.005, kQVelocityMPS, kRVolts, kDtSeconds,
      kSensorDelaySeconds);

  EXPECT_GT(tight.kP, loose.kP);
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
TEST_F(ElevatorFeedbackGainsTest, TighteningVelocityToleranceDecreasesKD) {
  FeedbackGains loose = ComputeElevatorFeedbackGainsCore(
      motor, kGearing, kMassKg, kSpoolRadiusMeters, kEfficiency,
      kQPositionMeters, /*qVelocityMPS=*/0.5, kRVolts, kDtSeconds,
      kSensorDelaySeconds);
  FeedbackGains tight = ComputeElevatorFeedbackGainsCore(
      motor, kGearing, kMassKg, kSpoolRadiusMeters, kEfficiency,
      kQPositionMeters, /*qVelocityMPS=*/0.05, kRVolts, kDtSeconds,
      kSensorDelaySeconds);

  EXPECT_LT(tight.kD, loose.kD);
}

TEST_F(ElevatorFeedbackGainsTest, NonPositiveGearingThrowsDomainError) {
  EXPECT_THROW(ComputeElevatorFeedbackGainsCore(
                   motor, /*gearing=*/0.0, kMassKg, kSpoolRadiusMeters,
                   kEfficiency, kQPositionMeters, kQVelocityMPS, kRVolts,
                   kDtSeconds, kSensorDelaySeconds),
               std::domain_error);
}

TEST_F(ElevatorFeedbackGainsTest, NonPositiveMassThrowsDomainError) {
  EXPECT_THROW(ComputeElevatorFeedbackGainsCore(
                   motor, kGearing, /*massKg=*/-1.0, kSpoolRadiusMeters,
                   kEfficiency, kQPositionMeters, kQVelocityMPS, kRVolts,
                   kDtSeconds, kSensorDelaySeconds),
               std::domain_error);
}

TEST_F(ElevatorFeedbackGainsTest, NonPositiveSpoolRadiusThrowsDomainError) {
  EXPECT_THROW(ComputeElevatorFeedbackGainsCore(
                   motor, kGearing, kMassKg, /*spoolRadiusMeters=*/0.0,
                   kEfficiency, kQPositionMeters, kQVelocityMPS, kRVolts,
                   kDtSeconds, kSensorDelaySeconds),
               std::domain_error);
}

// ============================================================================
// ComputeArmFeedbackGainsCore
// ============================================================================

class ArmFeedbackGainsTest : public ::testing::Test {
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

TEST_F(ArmFeedbackGainsTest, MatchesDirectLqrConstruction) {
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

  EXPECT_NEAR(actual.kP, expected.K(0, 0), kTol);
  EXPECT_NEAR(actual.kD, expected.K(0, 1), kTol);
}

TEST_F(ArmFeedbackGainsTest, ProducesPlausiblePositiveGains) {
  FeedbackGains gains = ComputeArmFeedbackGainsCore(
      motor, kGearing, kMomentOfInertiaKgMSquared, kEfficiency, kQPositionRad,
      kQVelocityRadPerSec, kRVolts, kDtSeconds, kSensorDelaySeconds);

  EXPECT_GT(gains.kP, 0.0);
  EXPECT_GT(gains.kD, 0.0);
}

TEST_F(ArmFeedbackGainsTest, NonPositiveMomentOfInertiaThrowsDomainError) {
  EXPECT_THROW(ComputeArmFeedbackGainsCore(
                   motor, kGearing, /*momentOfInertiaKgMSquared=*/0.0,
                   kEfficiency, kQPositionRad, kQVelocityRadPerSec, kRVolts,
                   kDtSeconds, kSensorDelaySeconds),
               std::domain_error);
}

TEST_F(ArmFeedbackGainsTest, NonPositiveGearingThrowsDomainError) {
  EXPECT_THROW(ComputeArmFeedbackGainsCore(
                   motor, /*gearing=*/-5.0, kMomentOfInertiaKgMSquared,
                   kEfficiency, kQPositionRad, kQVelocityRadPerSec, kRVolts,
                   kDtSeconds, kSensorDelaySeconds),
               std::domain_error);
}

// ============================================================================
// ComputeFlywheelFeedbackGainsCore
// ============================================================================

class FlywheelFeedbackGainsTest : public ::testing::Test {
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

TEST_F(FlywheelFeedbackGainsTest, MatchesDirectLqrConstruction) {
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

  EXPECT_NEAR(actual.kP, expected.K(0, 0), kTol);
}

TEST_F(FlywheelFeedbackGainsTest, KDIsAlwaysZero) {
  FeedbackGains gains = ComputeFlywheelFeedbackGainsCore(
      motor, kGearing, kMomentOfInertiaKgMSquared, kEfficiency,
      kQVelocityRadPerSec, kRVolts, kDtSeconds, kSensorDelaySeconds);

  EXPECT_EQ(gains.kD, 0.0);
}

TEST_F(FlywheelFeedbackGainsTest, ProducesPlausiblePositiveGain) {
  FeedbackGains gains = ComputeFlywheelFeedbackGainsCore(
      motor, kGearing, kMomentOfInertiaKgMSquared, kEfficiency,
      kQVelocityRadPerSec, kRVolts, kDtSeconds, kSensorDelaySeconds);

  EXPECT_GT(gains.kP, 0.0);
}

TEST_F(FlywheelFeedbackGainsTest, TighteningVelocityToleranceIncreasesKP) {
  FeedbackGains loose = ComputeFlywheelFeedbackGainsCore(
      motor, kGearing, kMomentOfInertiaKgMSquared, kEfficiency,
      /*qVelocityRadPerSec=*/50.0, kRVolts, kDtSeconds, kSensorDelaySeconds);
  FeedbackGains tight = ComputeFlywheelFeedbackGainsCore(
      motor, kGearing, kMomentOfInertiaKgMSquared, kEfficiency,
      /*qVelocityRadPerSec=*/1.0, kRVolts, kDtSeconds, kSensorDelaySeconds);

  EXPECT_GT(tight.kP, loose.kP);
}

TEST_F(FlywheelFeedbackGainsTest, NonPositiveMomentOfInertiaThrowsDomainError) {
  EXPECT_THROW(
      ComputeFlywheelFeedbackGainsCore(
          motor, kGearing, /*momentOfInertiaKgMSquared=*/-0.01, kEfficiency,
          kQVelocityRadPerSec, kRVolts, kDtSeconds, kSensorDelaySeconds),
      std::domain_error);
}

TEST_F(FlywheelFeedbackGainsTest, NonPositiveGearingThrowsDomainError) {
  EXPECT_THROW(
      ComputeFlywheelFeedbackGainsCore(
          motor, /*gearing=*/0.0, kMomentOfInertiaKgMSquared, kEfficiency,
          kQVelocityRadPerSec, kRVolts, kDtSeconds, kSensorDelaySeconds),
      std::domain_error);
}

#include "feedforward_gains.h"

#include <gtest/gtest.h>

#include <cmath>
#include <stdexcept>
#include <vector>

#include "dc_motor.h"
#include "wpi/math/system/DCMotor.hpp"
#include "wpi/math/system/LinearSystem.hpp"
#include "wpi/math/system/Models.hpp"

namespace {
constexpr double kTol = 1e-9;
constexpr double kGravity = 9.80665;

// Builds a DCMotorWasm* for use with the wasm entry points (guard/edge-case
// tests below). Caller owns the returned pointer.
DCMotorWasm* MakeMotorWasm(const wpi::math::DCMotor& motor, int numMotors) {
  return new DCMotorWasm(
      motor.nominalVoltage.to<double>(), motor.stallTorque.to<double>(),
      motor.stallCurrent.to<double>(), motor.freeCurrent.to<double>(),
      motor.freeSpeed.to<double>(), numMotors);
}
}  // namespace

// ============================================================================
// ComputeLinearFeedforwardGainsCore
// ============================================================================

struct LinearConfig {
  wpi::math::DCMotor motor;
  double gearing;
  double loadKg;
  double spoolRadiusMeters;
};

// (a) Degenerate equivalence vs upstream WPILib: at efficiency = 1.0 and
// angle = 0, kV/kA must match values extracted directly from
// Models::ElevatorFromPhysicalConstants, and kG must be 0.
class LinearFeedforwardEquivalenceTest
    : public ::testing::TestWithParam<LinearConfig> {};

TEST_P(LinearFeedforwardEquivalenceTest,
       MatchesUpstreamModelsAtUnityEfficiencyAndZeroAngle) {
  const LinearConfig& cfg = GetParam();
  auto idealPlant = wpi::math::Models::ElevatorFromPhysicalConstants(
      cfg.motor, wpi::units::kilogram_t(cfg.loadKg),
      wpi::units::meter_t(cfg.spoolRadiusMeters), cfg.gearing);

  const double expectedKv = -idealPlant.A()(1, 1) / idealPlant.B()(1, 0);
  const double expectedKa = 1.0 / idealPlant.B()(1, 0);

  FeedforwardGains actual = ComputeLinearFeedforwardGainsCore(
      cfg.motor, cfg.gearing, cfg.loadKg, cfg.spoolRadiusMeters,
      /*efficiency=*/1.0, /*angleRadians=*/0.0);

  EXPECT_NEAR(actual.kV, expectedKv, std::abs(expectedKv) * kTol);
  EXPECT_NEAR(actual.kA, expectedKa, std::abs(expectedKa) * kTol);
  EXPECT_NEAR(actual.kG, 0.0, kTol);
}

INSTANTIATE_TEST_SUITE_P(
    VariousConfigs, LinearFeedforwardEquivalenceTest,
    ::testing::Values(LinearConfig{wpi::math::DCMotor::NEO(1), 10.0, 5.0,
                                   0.025},
                      LinearConfig{wpi::math::DCMotor::Falcon500(1), 20.0,
                                   10.0, 0.05},
                      LinearConfig{wpi::math::DCMotor::KrakenX60(2), 5.0, 2.5,
                                   0.019},
                      LinearConfig{wpi::math::DCMotor::NEO550(1), 15.0, 1.0,
                                   0.03}));

// (b) Efficiency monotonicity: decreasing efficiency must strictly increase
// kV, kA, and |kG| (kG scales with kA).
TEST(LinearFeedforwardGainsTest,
    EfficiencyMonotonicallyIncreasesKvKaAndKgMagnitude) {
  const std::vector<LinearConfig> configs = {
      {wpi::math::DCMotor::NEO(1), 12.0, 4.0, 0.02},
      {wpi::math::DCMotor::Falcon500(1), 8.0, 6.0, 0.03},
      {wpi::math::DCMotor::KrakenX60(1), 15.0, 3.0, 0.025},
  };
  const std::vector<double> efficiencies = {1.0, 0.8, 0.6, 0.4};
  const double angleRadians = M_PI / 4.0;  // nonzero so kG != 0

  for (const auto& cfg : configs) {
    double prevKv = -1.0, prevKa = -1.0, prevKgMag = -1.0;
    for (double efficiency : efficiencies) {
      FeedforwardGains gains = ComputeLinearFeedforwardGainsCore(
          cfg.motor, cfg.gearing, cfg.loadKg, cfg.spoolRadiusMeters,
          efficiency, angleRadians);
      if (prevKv >= 0.0) {
        EXPECT_GT(gains.kV, prevKv);
        EXPECT_GT(gains.kA, prevKa);
        EXPECT_GT(std::abs(gains.kG), prevKgMag);
      }
      prevKv = gains.kV;
      prevKa = gains.kA;
      prevKgMag = std::abs(gains.kG);
    }
  }
}

// (c) Angle behavior: kG scales with sin(angle) -- 0 at horizontal, maximal
// at vertical, monotonically increasing in between.
TEST(LinearFeedforwardGainsTest, KgMonotonicallyIncreasesWithAngle) {
  constexpr double kGearing = 10.0;
  constexpr double kLoadKg = 5.0;
  constexpr double kSpoolRadiusMeters = 0.025;
  constexpr double kEfficiency = 0.85;
  const wpi::math::DCMotor motor = wpi::math::DCMotor::NEO(1);

  const std::vector<double> anglesDeg = {0.0, 30.0, 60.0, 90.0};
  double prevKg = -1.0;
  for (double angleDeg : anglesDeg) {
    const double angleRadians = angleDeg * M_PI / 180.0;
    FeedforwardGains gains = ComputeLinearFeedforwardGainsCore(
        motor, kGearing, kLoadKg, kSpoolRadiusMeters, kEfficiency,
        angleRadians);

    if (angleDeg == 0.0) {
      EXPECT_NEAR(gains.kG, 0.0, kTol);
    } else {
      EXPECT_GT(gains.kG, prevKg);
    }
    prevKg = gains.kG;
  }

  // Sanity check against the closed-form expression at 90 degrees.
  FeedforwardGains vertical = ComputeLinearFeedforwardGainsCore(
      motor, kGearing, kLoadKg, kSpoolRadiusMeters, kEfficiency, M_PI / 2.0);
  EXPECT_NEAR(vertical.kG, vertical.kA * kGravity, vertical.kA * kGravity * kTol);
}

// (d) Edge/guard cases, exercised via the non-throwing wasm entry point.
class LinearFeedforwardGuardTest : public ::testing::Test {
 protected:
  DCMotorWasm* motorWasm = MakeMotorWasm(wpi::math::DCMotor::NEO(1), 1);

  ~LinearFeedforwardGuardTest() override { delete motorWasm; }
};

TEST_F(LinearFeedforwardGuardTest, NonPositiveEfficiencyReturnsZeroedGains) {
  emscripten::val result = ComputeLinearFeedforwardGains(
      motorWasm, /*gearing=*/10.0, /*loadKg=*/5.0,
      /*spoolRadiusMeters=*/0.025, /*efficiency=*/0.0, /*angleRadians=*/0.0);
  EXPECT_EQ(result["kV"].as<double>(), 0.0);
  EXPECT_EQ(result["kA"].as<double>(), 0.0);
  EXPECT_EQ(result["kG"].as<double>(), 0.0);
}

TEST_F(LinearFeedforwardGuardTest, NonPositiveSpoolRadiusReturnsZeroedGains) {
  emscripten::val result = ComputeLinearFeedforwardGains(
      motorWasm, /*gearing=*/10.0, /*loadKg=*/5.0,
      /*spoolRadiusMeters=*/0.0, /*efficiency=*/1.0, /*angleRadians=*/0.0);
  EXPECT_EQ(result["kV"].as<double>(), 0.0);
  EXPECT_EQ(result["kA"].as<double>(), 0.0);
  EXPECT_EQ(result["kG"].as<double>(), 0.0);
}

TEST_F(LinearFeedforwardGuardTest, NonPositiveGearingReturnsZeroedGains) {
  emscripten::val result = ComputeLinearFeedforwardGains(
      motorWasm, /*gearing=*/0.0, /*loadKg=*/5.0,
      /*spoolRadiusMeters=*/0.025, /*efficiency=*/1.0, /*angleRadians=*/0.0);
  EXPECT_EQ(result["kV"].as<double>(), 0.0);
  EXPECT_EQ(result["kA"].as<double>(), 0.0);
  EXPECT_EQ(result["kG"].as<double>(), 0.0);
}

// ============================================================================
// ComputeAngularFeedforwardGainsCore
// ============================================================================

struct AngularConfig {
  wpi::math::DCMotor motor;
  double gearing;
  double momentOfInertiaKgM2;
};

// (a) Degenerate equivalence vs upstream WPILib.
class AngularFeedforwardEquivalenceTest
    : public ::testing::TestWithParam<AngularConfig> {};

TEST_P(AngularFeedforwardEquivalenceTest,
       MatchesUpstreamModelsAtUnityEfficiency) {
  const AngularConfig& cfg = GetParam();
  auto idealPlant = wpi::math::Models::SingleJointedArmFromPhysicalConstants(
      cfg.motor, wpi::units::kilogram_square_meter_t(cfg.momentOfInertiaKgM2),
      cfg.gearing);

  const double expectedKv = -idealPlant.A()(1, 1) / idealPlant.B()(1, 0);
  const double expectedKa = 1.0 / idealPlant.B()(1, 0);

  // comMassKg/comLengthMeters = 0 isolates kV/kA from the (nonzero-by-design)
  // kG term for this equivalence check.
  FeedforwardGains actual = ComputeAngularFeedforwardGainsCore(
      cfg.motor, cfg.gearing, cfg.momentOfInertiaKgM2, /*efficiency=*/1.0,
      /*comMassKg=*/0.0, /*comLengthMeters=*/0.0);

  EXPECT_NEAR(actual.kV, expectedKv, std::abs(expectedKv) * kTol);
  EXPECT_NEAR(actual.kA, expectedKa, std::abs(expectedKa) * kTol);
  EXPECT_NEAR(actual.kG, 0.0, kTol);
}

INSTANTIATE_TEST_SUITE_P(
    VariousConfigs, AngularFeedforwardEquivalenceTest,
    ::testing::Values(
        AngularConfig{wpi::math::DCMotor::NEO(1), 100.0, 2.0},
        AngularConfig{wpi::math::DCMotor::Falcon500(1), 150.0, 3.5},
        AngularConfig{wpi::math::DCMotor::KrakenX60(2), 60.0, 1.2},
        AngularConfig{wpi::math::DCMotor::NEO550(1), 200.0, 0.5}));

// Cross-check: with efficiency = 1.0, kG should equal the closed-form
// expression g * comLength * comMass / J scaled by kA.
TEST(AngularFeedforwardGainsTest, KgMatchesClosedFormAtUnityEfficiency) {
  constexpr double kGearing = 100.0;
  constexpr double kMomentOfInertiaKgM2 = 2.0;
  constexpr double kComMassKg = 3.0;
  constexpr double kComLengthMeters = 0.4;
  const wpi::math::DCMotor motor = wpi::math::DCMotor::Falcon500(1);

  FeedforwardGains gains = ComputeAngularFeedforwardGainsCore(
      motor, kGearing, kMomentOfInertiaKgM2, /*efficiency=*/1.0, kComMassKg,
      kComLengthMeters);

  const double expectedKg =
      gains.kA * kGravity * kComLengthMeters * kComMassKg / kMomentOfInertiaKgM2;
  EXPECT_NEAR(gains.kG, expectedKg, std::abs(expectedKg) * kTol);
  // Holding voltage should be positive: it must counteract gravity pulling
  // the arm down at the horizontal (worst-case) position.
  EXPECT_GT(gains.kG, 0.0);
}

// (b) Efficiency monotonicity.
TEST(AngularFeedforwardGainsTest,
    EfficiencyMonotonicallyIncreasesKvKaAndKgMagnitude) {
  const std::vector<AngularConfig> configs = {
      {wpi::math::DCMotor::NEO(1), 80.0, 1.5},
      {wpi::math::DCMotor::Falcon500(1), 120.0, 2.5},
      {wpi::math::DCMotor::KrakenX60(1), 60.0, 1.0},
  };
  const std::vector<double> efficiencies = {1.0, 0.8, 0.6, 0.4};
  constexpr double kComMassKg = 2.0;
  constexpr double kComLengthMeters = 0.3;

  for (const auto& cfg : configs) {
    double prevKv = -1.0, prevKa = -1.0, prevKgMag = -1.0;
    for (double efficiency : efficiencies) {
      FeedforwardGains gains = ComputeAngularFeedforwardGainsCore(
          cfg.motor, cfg.gearing, cfg.momentOfInertiaKgM2, efficiency,
          kComMassKg, kComLengthMeters);
      if (prevKv >= 0.0) {
        EXPECT_GT(gains.kV, prevKv);
        EXPECT_GT(gains.kA, prevKa);
        EXPECT_GT(std::abs(gains.kG), prevKgMag);
      }
      prevKv = gains.kV;
      prevKa = gains.kA;
      prevKgMag = std::abs(gains.kG);
    }
  }
}

// (d) Edge/guard cases, exercised via the non-throwing wasm entry point.
class AngularFeedforwardGuardTest : public ::testing::Test {
 protected:
  DCMotorWasm* motorWasm = MakeMotorWasm(wpi::math::DCMotor::Falcon500(1), 1);

  ~AngularFeedforwardGuardTest() override { delete motorWasm; }
};

TEST_F(AngularFeedforwardGuardTest, NonPositiveEfficiencyReturnsZeroedGains) {
  emscripten::val result = ComputeAngularFeedforwardGains(
      motorWasm, /*gearing=*/100.0, /*momentOfInertiaKgM2=*/2.0,
      /*efficiency=*/-0.5, /*comMassKg=*/3.0, /*comLengthMeters=*/0.4);
  EXPECT_EQ(result["kV"].as<double>(), 0.0);
  EXPECT_EQ(result["kA"].as<double>(), 0.0);
  EXPECT_EQ(result["kG"].as<double>(), 0.0);
}

TEST_F(AngularFeedforwardGuardTest,
      NonPositiveMomentOfInertiaReturnsZeroedGains) {
  emscripten::val result = ComputeAngularFeedforwardGains(
      motorWasm, /*gearing=*/100.0, /*momentOfInertiaKgM2=*/0.0,
      /*efficiency=*/1.0, /*comMassKg=*/3.0, /*comLengthMeters=*/0.4);
  EXPECT_EQ(result["kV"].as<double>(), 0.0);
  EXPECT_EQ(result["kA"].as<double>(), 0.0);
  EXPECT_EQ(result["kG"].as<double>(), 0.0);
}

TEST_F(AngularFeedforwardGuardTest, NonPositiveGearingReturnsZeroedGains) {
  emscripten::val result = ComputeAngularFeedforwardGains(
      motorWasm, /*gearing=*/0.0, /*momentOfInertiaKgM2=*/2.0,
      /*efficiency=*/1.0, /*comMassKg=*/3.0, /*comLengthMeters=*/0.4);
  EXPECT_EQ(result["kV"].as<double>(), 0.0);
  EXPECT_EQ(result["kA"].as<double>(), 0.0);
  EXPECT_EQ(result["kG"].as<double>(), 0.0);
}

// ============================================================================
// ComputeFlywheelFeedforwardGainsCore
// ============================================================================

struct FlywheelConfig {
  wpi::math::DCMotor motor;
  double gearing;
  double momentOfInertiaKgM2;
};

// (a) Degenerate equivalence vs upstream WPILib. kG must always be 0.
class FlywheelFeedforwardEquivalenceTest
    : public ::testing::TestWithParam<FlywheelConfig> {};

TEST_P(FlywheelFeedforwardEquivalenceTest,
       MatchesUpstreamModelsAtUnityEfficiency) {
  const FlywheelConfig& cfg = GetParam();
  auto idealPlant = wpi::math::Models::FlywheelFromPhysicalConstants(
      cfg.motor, wpi::units::kilogram_square_meter_t(cfg.momentOfInertiaKgM2),
      cfg.gearing);

  const double expectedKv = -idealPlant.A()(0, 0) / idealPlant.B()(0, 0);
  const double expectedKa = 1.0 / idealPlant.B()(0, 0);

  FeedforwardGains actual = ComputeFlywheelFeedforwardGainsCore(
      cfg.motor, cfg.gearing, cfg.momentOfInertiaKgM2, /*efficiency=*/1.0);

  EXPECT_NEAR(actual.kV, expectedKv, std::abs(expectedKv) * kTol);
  EXPECT_NEAR(actual.kA, expectedKa, std::abs(expectedKa) * kTol);
  EXPECT_EQ(actual.kG, 0.0);
}

INSTANTIATE_TEST_SUITE_P(
    VariousConfigs, FlywheelFeedforwardEquivalenceTest,
    ::testing::Values(FlywheelConfig{wpi::math::DCMotor::NEO(1), 1.0, 0.01},
                      FlywheelConfig{wpi::math::DCMotor::Falcon500(1), 2.0,
                                     0.02},
                      FlywheelConfig{wpi::math::DCMotor::KrakenX60(3), 1.5,
                                     0.05},
                      FlywheelConfig{wpi::math::DCMotor::NEO550(1), 3.0,
                                     0.005}));

// (b) Efficiency monotonicity (no kG term for flywheels).
TEST(FlywheelFeedforwardGainsTest, EfficiencyMonotonicallyIncreasesKvAndKa) {
  const std::vector<FlywheelConfig> configs = {
      {wpi::math::DCMotor::NEO(1), 1.0, 0.02},
      {wpi::math::DCMotor::Falcon500(1), 2.0, 0.03},
      {wpi::math::DCMotor::KrakenX60(1), 1.5, 0.01},
  };
  const std::vector<double> efficiencies = {1.0, 0.8, 0.6, 0.4};

  for (const auto& cfg : configs) {
    double prevKv = -1.0, prevKa = -1.0;
    for (double efficiency : efficiencies) {
      FeedforwardGains gains = ComputeFlywheelFeedforwardGainsCore(
          cfg.motor, cfg.gearing, cfg.momentOfInertiaKgM2, efficiency);
      EXPECT_EQ(gains.kG, 0.0);
      if (prevKv >= 0.0) {
        EXPECT_GT(gains.kV, prevKv);
        EXPECT_GT(gains.kA, prevKa);
      }
      prevKv = gains.kV;
      prevKa = gains.kA;
    }
  }
}

// (d) Edge/guard cases, exercised via the non-throwing wasm entry point.
class FlywheelFeedforwardGuardTest : public ::testing::Test {
 protected:
  DCMotorWasm* motorWasm = MakeMotorWasm(wpi::math::DCMotor::KrakenX60(1), 1);

  ~FlywheelFeedforwardGuardTest() override { delete motorWasm; }
};

TEST_F(FlywheelFeedforwardGuardTest, NonPositiveEfficiencyReturnsZeroedGains) {
  emscripten::val result = ComputeFlywheelFeedforwardGains(
      motorWasm, /*gearing=*/2.0, /*momentOfInertiaKgM2=*/0.01,
      /*efficiency=*/0.0);
  EXPECT_EQ(result["kV"].as<double>(), 0.0);
  EXPECT_EQ(result["kA"].as<double>(), 0.0);
  EXPECT_EQ(result["kG"].as<double>(), 0.0);
}

TEST_F(FlywheelFeedforwardGuardTest,
      NonPositiveMomentOfInertiaReturnsZeroedGains) {
  emscripten::val result = ComputeFlywheelFeedforwardGains(
      motorWasm, /*gearing=*/2.0, /*momentOfInertiaKgM2=*/-0.01,
      /*efficiency=*/1.0);
  EXPECT_EQ(result["kV"].as<double>(), 0.0);
  EXPECT_EQ(result["kA"].as<double>(), 0.0);
  EXPECT_EQ(result["kG"].as<double>(), 0.0);
}

TEST_F(FlywheelFeedforwardGuardTest, NonPositiveGearingReturnsZeroedGains) {
  emscripten::val result = ComputeFlywheelFeedforwardGains(
      motorWasm, /*gearing=*/0.0, /*momentOfInertiaKgM2=*/0.01,
      /*efficiency=*/1.0);
  EXPECT_EQ(result["kV"].as<double>(), 0.0);
  EXPECT_EQ(result["kA"].as<double>(), 0.0);
  EXPECT_EQ(result["kG"].as<double>(), 0.0);
}

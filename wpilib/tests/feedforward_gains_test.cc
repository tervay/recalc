#include "feedforward_gains.h"

#include <catch2/catch_test_macros.hpp>
#include <catch2/generators/catch_generators.hpp>
#include <catch2/matchers/catch_matchers_floating_point.hpp>
#include <cmath>
#include <stdexcept>
#include <vector>

#include "dc_motor.h"
#include "wpi/math/system/DCMotor.hpp"
#include "wpi/math/system/LinearSystem.hpp"
#include "wpi/math/system/Models.hpp"

using Catch::Matchers::WithinAbs;

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

namespace {
struct LinearConfig {
  wpi::math::DCMotor motor;
  double gearing;
  double loadKg;
  double spoolRadiusMeters;
};
}  // namespace

// (a) Degenerate equivalence vs upstream WPILib: at efficiency = 1.0 and
// angle = 0, kV/kA must match values extracted directly from
// Models::ElevatorFromPhysicalConstants, and kG must be 0.
TEST_CASE(
    "LinearFeedforwardEquivalenceTest: "
    "MatchesUpstreamModelsAtUnityEfficiencyAndZeroAngle",
    "[LinearFeedforwardEquivalenceTest]") {
  const LinearConfig cfg =
      GENERATE(LinearConfig{wpi::math::DCMotor::NEO(1), 10.0, 5.0, 0.025},
               LinearConfig{wpi::math::DCMotor::Falcon500(1), 20.0, 10.0, 0.05},
               LinearConfig{wpi::math::DCMotor::KrakenX60(2), 5.0, 2.5, 0.019},
               LinearConfig{wpi::math::DCMotor::NEO550(1), 15.0, 1.0, 0.03});
  CAPTURE(cfg.gearing, cfg.loadKg, cfg.spoolRadiusMeters);
  auto idealPlant = wpi::math::Models::ElevatorFromPhysicalConstants(
      cfg.motor, wpi::units::kilogram_t(cfg.loadKg),
      wpi::units::meter_t(cfg.spoolRadiusMeters), cfg.gearing);

  const double expectedKv = -idealPlant.A()(1, 1) / idealPlant.B()(1, 0);
  const double expectedKa = 1.0 / idealPlant.B()(1, 0);

  FeedforwardGains actual = ComputeLinearFeedforwardGainsCore(
      cfg.motor, cfg.gearing, cfg.loadKg, cfg.spoolRadiusMeters,
      /*efficiency=*/1.0, /*angleRadians=*/0.0);

  CHECK_THAT(actual.kV, WithinAbs(expectedKv, std::abs(expectedKv) * kTol));
  CHECK_THAT(actual.kA, WithinAbs(expectedKa, std::abs(expectedKa) * kTol));
  CHECK_THAT(actual.kG, WithinAbs(0.0, kTol));
}

// (b) Efficiency monotonicity: decreasing efficiency must strictly increase
// kA and |kG| (kG scales with kA), and must leave kV alone. Holding a steady
// velocity demands no net output torque, so the gearbox losses have nothing to
// act on -- see ComputeLinearFeedforwardGainsCore.
TEST_CASE(
    "LinearFeedforwardMonotonicityTest: "
    "EfficiencyIncreasesKaAndKgMagnitudeButNotKv",
    "[LinearFeedforwardMonotonicityTest]") {
  const LinearConfig cfg = GENERATE(
      LinearConfig{wpi::math::DCMotor::NEO(1), 12.0, 4.0, 0.02},
      LinearConfig{wpi::math::DCMotor::Falcon500(1), 8.0, 6.0, 0.03},
      LinearConfig{wpi::math::DCMotor::KrakenX60(1), 15.0, 3.0, 0.025});
  CAPTURE(cfg.gearing, cfg.loadKg, cfg.spoolRadiusMeters);
  const std::vector<double> efficiencies = {1.0, 0.8, 0.6, 0.4};
  const double angleRadians = M_PI / 4.0;  // nonzero so kG != 0

  double prevKv = -1.0, prevKa = -1.0, prevKgMag = -1.0;
  for (double efficiency : efficiencies) {
    FeedforwardGains gains = ComputeLinearFeedforwardGainsCore(
        cfg.motor, cfg.gearing, cfg.loadKg, cfg.spoolRadiusMeters, efficiency,
        angleRadians);
    if (prevKv >= 0.0) {
      CHECK_THAT(gains.kV, WithinAbs(prevKv, std::abs(prevKv) * kTol));
      CHECK(gains.kA > prevKa);
      CHECK(std::abs(gains.kG) > prevKgMag);
    }
    prevKv = gains.kV;
    prevKa = gains.kA;
    prevKgMag = std::abs(gains.kG);
  }
}

// (c) Angle behavior: kG scales with sin(angle) -- 0 at horizontal, maximal
// at vertical, monotonically increasing in between.
TEST_CASE("LinearFeedforwardGainsTest: KgMonotonicallyIncreasesWithAngle",
          "[LinearFeedforwardGainsTest]") {
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

    if (prevKg >= 0.0) {
      CHECK(gains.kG > prevKg);
    }
    prevKg = gains.kG;
  }
}

// kG must be ~0 at horizontal (angle = 0), where gravity contributes no
// torque along the direction of motion.
TEST_CASE("LinearFeedforwardGainsTest: KgIsZeroAtHorizontalAngle",
          "[LinearFeedforwardGainsTest]") {
  FeedforwardGains gains = ComputeLinearFeedforwardGainsCore(
      wpi::math::DCMotor::NEO(1), /*gearing=*/10.0, /*loadKg=*/5.0,
      /*spoolRadiusMeters=*/0.025, /*efficiency=*/0.85, /*angleRadians=*/0.0);
  CHECK_THAT(gains.kG, WithinAbs(0.0, kTol));
}

// Sanity check against the closed-form expression at 90 degrees: at vertical,
// the holding voltage must equal kA * g.
TEST_CASE("LinearFeedforwardGainsTest: KgAtVerticalAngleMatchesClosedForm",
          "[LinearFeedforwardGainsTest]") {
  constexpr double kGearing = 10.0;
  constexpr double kLoadKg = 5.0;
  constexpr double kSpoolRadiusMeters = 0.025;
  constexpr double kEfficiency = 0.85;
  const wpi::math::DCMotor motor = wpi::math::DCMotor::NEO(1);

  FeedforwardGains vertical = ComputeLinearFeedforwardGainsCore(
      motor, kGearing, kLoadKg, kSpoolRadiusMeters, kEfficiency, M_PI / 2.0);
  CHECK_THAT(vertical.kG,
             WithinAbs(vertical.kA * kGravity, vertical.kA * kGravity * kTol));
}

// (d) Edge/guard cases, exercised via the non-throwing wasm entry point.
namespace {
class LinearFeedforwardGuardTest {
 protected:
  DCMotorWasm* motorWasm = MakeMotorWasm(wpi::math::DCMotor::NEO(1), 1);

  ~LinearFeedforwardGuardTest() { delete motorWasm; }
};
}  // namespace

TEST_CASE_METHOD(
    LinearFeedforwardGuardTest,
    "LinearFeedforwardGuardTest: NonPositiveEfficiencyReturnsZeroedGains",
    "[LinearFeedforwardGuardTest]") {
  emscripten::val result = ComputeLinearFeedforwardGains(
      motorWasm, /*gearing=*/10.0, /*loadKg=*/5.0,
      /*spoolRadiusMeters=*/0.025, /*efficiency=*/0.0, /*angleRadians=*/0.0);
  CHECK(result["kV"].as<double>() == 0.0);
  CHECK(result["kA"].as<double>() == 0.0);
  CHECK(result["kG"].as<double>() == 0.0);
}

TEST_CASE_METHOD(
    LinearFeedforwardGuardTest,
    "LinearFeedforwardGuardTest: NonPositiveSpoolRadiusReturnsZeroedGains",
    "[LinearFeedforwardGuardTest]") {
  emscripten::val result = ComputeLinearFeedforwardGains(
      motorWasm, /*gearing=*/10.0, /*loadKg=*/5.0,
      /*spoolRadiusMeters=*/0.0, /*efficiency=*/1.0, /*angleRadians=*/0.0);
  CHECK(result["kV"].as<double>() == 0.0);
  CHECK(result["kA"].as<double>() == 0.0);
  CHECK(result["kG"].as<double>() == 0.0);
}

TEST_CASE_METHOD(
    LinearFeedforwardGuardTest,
    "LinearFeedforwardGuardTest: NonPositiveGearingReturnsZeroedGains",
    "[LinearFeedforwardGuardTest]") {
  emscripten::val result = ComputeLinearFeedforwardGains(
      motorWasm, /*gearing=*/0.0, /*loadKg=*/5.0,
      /*spoolRadiusMeters=*/0.025, /*efficiency=*/1.0, /*angleRadians=*/0.0);
  CHECK(result["kV"].as<double>() == 0.0);
  CHECK(result["kA"].as<double>() == 0.0);
  CHECK(result["kG"].as<double>() == 0.0);
}

// ============================================================================
// ComputeAngularFeedforwardGainsCore
// ============================================================================

namespace {
struct AngularConfig {
  wpi::math::DCMotor motor;
  double gearing;
  double momentOfInertiaKgM2;
};
}  // namespace

// (a) Degenerate equivalence vs upstream WPILib.
TEST_CASE(
    "AngularFeedforwardEquivalenceTest: MatchesUpstreamModelsAtUnityEfficiency",
    "[AngularFeedforwardEquivalenceTest]") {
  const AngularConfig cfg =
      GENERATE(AngularConfig{wpi::math::DCMotor::NEO(1), 100.0, 2.0},
               AngularConfig{wpi::math::DCMotor::Falcon500(1), 150.0, 3.5},
               AngularConfig{wpi::math::DCMotor::KrakenX60(2), 60.0, 1.2},
               AngularConfig{wpi::math::DCMotor::NEO550(1), 200.0, 0.5});
  CAPTURE(cfg.gearing, cfg.momentOfInertiaKgM2);
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

  CHECK_THAT(actual.kV, WithinAbs(expectedKv, std::abs(expectedKv) * kTol));
  CHECK_THAT(actual.kA, WithinAbs(expectedKa, std::abs(expectedKa) * kTol));
  CHECK_THAT(actual.kG, WithinAbs(0.0, kTol));
}

// Cross-check: with efficiency = 1.0, kG should equal the closed-form
// expression g * comLength * comMass / J scaled by kA.
TEST_CASE("AngularFeedforwardGainsTest: KgMatchesClosedFormAtUnityEfficiency",
          "[AngularFeedforwardGainsTest]") {
  constexpr double kGearing = 100.0;
  constexpr double kMomentOfInertiaKgM2 = 2.0;
  constexpr double kComMassKg = 3.0;
  constexpr double kComLengthMeters = 0.4;
  const wpi::math::DCMotor motor = wpi::math::DCMotor::Falcon500(1);

  FeedforwardGains gains = ComputeAngularFeedforwardGainsCore(
      motor, kGearing, kMomentOfInertiaKgM2, /*efficiency=*/1.0, kComMassKg,
      kComLengthMeters);

  const double expectedKg = gains.kA * kGravity * kComLengthMeters *
                            kComMassKg / kMomentOfInertiaKgM2;
  CHECK_THAT(gains.kG, WithinAbs(expectedKg, std::abs(expectedKg) * kTol));
  // Holding voltage should be positive: it must counteract gravity pulling
  // the arm down at the horizontal (worst-case) position.
  CHECK(gains.kG > 0.0);
}

// (b) Efficiency monotonicity: kA and |kG| rise as efficiency falls, kV does
// not move. See the linear case above for why.
TEST_CASE(
    "AngularFeedforwardMonotonicityTest: "
    "EfficiencyIncreasesKaAndKgMagnitudeButNotKv",
    "[AngularFeedforwardMonotonicityTest]") {
  const AngularConfig cfg =
      GENERATE(AngularConfig{wpi::math::DCMotor::NEO(1), 80.0, 1.5},
               AngularConfig{wpi::math::DCMotor::Falcon500(1), 120.0, 2.5},
               AngularConfig{wpi::math::DCMotor::KrakenX60(1), 60.0, 1.0});
  CAPTURE(cfg.gearing, cfg.momentOfInertiaKgM2);
  const std::vector<double> efficiencies = {1.0, 0.8, 0.6, 0.4};
  constexpr double kComMassKg = 2.0;
  constexpr double kComLengthMeters = 0.3;

  double prevKv = -1.0, prevKa = -1.0, prevKgMag = -1.0;
  for (double efficiency : efficiencies) {
    FeedforwardGains gains = ComputeAngularFeedforwardGainsCore(
        cfg.motor, cfg.gearing, cfg.momentOfInertiaKgM2, efficiency, kComMassKg,
        kComLengthMeters);
    if (prevKv >= 0.0) {
      CHECK_THAT(gains.kV, WithinAbs(prevKv, std::abs(prevKv) * kTol));
      CHECK(gains.kA > prevKa);
      CHECK(std::abs(gains.kG) > prevKgMag);
    }
    prevKv = gains.kV;
    prevKa = gains.kA;
    prevKgMag = std::abs(gains.kG);
  }
}

// (d) Edge/guard cases, exercised via the non-throwing wasm entry point.
namespace {
class AngularFeedforwardGuardTest {
 protected:
  DCMotorWasm* motorWasm = MakeMotorWasm(wpi::math::DCMotor::Falcon500(1), 1);

  ~AngularFeedforwardGuardTest() { delete motorWasm; }
};
}  // namespace

TEST_CASE_METHOD(
    AngularFeedforwardGuardTest,
    "AngularFeedforwardGuardTest: NonPositiveEfficiencyReturnsZeroedGains",
    "[AngularFeedforwardGuardTest]") {
  emscripten::val result = ComputeAngularFeedforwardGains(
      motorWasm, /*gearing=*/100.0, /*momentOfInertiaKgM2=*/2.0,
      /*efficiency=*/-0.5, /*comMassKg=*/3.0, /*comLengthMeters=*/0.4);
  CHECK(result["kV"].as<double>() == 0.0);
  CHECK(result["kA"].as<double>() == 0.0);
  CHECK(result["kG"].as<double>() == 0.0);
}

TEST_CASE_METHOD(
    AngularFeedforwardGuardTest,
    "AngularFeedforwardGuardTest: NonPositiveMomentOfInertiaReturnsZeroedGains",
    "[AngularFeedforwardGuardTest]") {
  emscripten::val result = ComputeAngularFeedforwardGains(
      motorWasm, /*gearing=*/100.0, /*momentOfInertiaKgM2=*/0.0,
      /*efficiency=*/1.0, /*comMassKg=*/3.0, /*comLengthMeters=*/0.4);
  CHECK(result["kV"].as<double>() == 0.0);
  CHECK(result["kA"].as<double>() == 0.0);
  CHECK(result["kG"].as<double>() == 0.0);
}

TEST_CASE_METHOD(
    AngularFeedforwardGuardTest,
    "AngularFeedforwardGuardTest: NonPositiveGearingReturnsZeroedGains",
    "[AngularFeedforwardGuardTest]") {
  emscripten::val result = ComputeAngularFeedforwardGains(
      motorWasm, /*gearing=*/0.0, /*momentOfInertiaKgM2=*/2.0,
      /*efficiency=*/1.0, /*comMassKg=*/3.0, /*comLengthMeters=*/0.4);
  CHECK(result["kV"].as<double>() == 0.0);
  CHECK(result["kA"].as<double>() == 0.0);
  CHECK(result["kG"].as<double>() == 0.0);
}

// ============================================================================
// ComputeFlywheelFeedforwardGainsCore
// ============================================================================

namespace {
struct FlywheelConfig {
  wpi::math::DCMotor motor;
  double gearing;
  double momentOfInertiaKgM2;
};
}  // namespace

// (a) Degenerate equivalence vs upstream WPILib. kG must always be 0.
TEST_CASE(
    "FlywheelFeedforwardEquivalenceTest: "
    "MatchesUpstreamModelsAtUnityEfficiency",
    "[FlywheelFeedforwardEquivalenceTest]") {
  const FlywheelConfig cfg =
      GENERATE(FlywheelConfig{wpi::math::DCMotor::NEO(1), 1.0, 0.01},
               FlywheelConfig{wpi::math::DCMotor::Falcon500(1), 2.0, 0.02},
               FlywheelConfig{wpi::math::DCMotor::KrakenX60(3), 1.5, 0.05},
               FlywheelConfig{wpi::math::DCMotor::NEO550(1), 3.0, 0.005});
  CAPTURE(cfg.gearing, cfg.momentOfInertiaKgM2);
  auto idealPlant = wpi::math::Models::FlywheelFromPhysicalConstants(
      cfg.motor, wpi::units::kilogram_square_meter_t(cfg.momentOfInertiaKgM2),
      cfg.gearing);

  const double expectedKv = -idealPlant.A()(0, 0) / idealPlant.B()(0, 0);
  const double expectedKa = 1.0 / idealPlant.B()(0, 0);

  FeedforwardGains actual = ComputeFlywheelFeedforwardGainsCore(
      cfg.motor, cfg.gearing, cfg.momentOfInertiaKgM2, /*efficiency=*/1.0);

  CHECK_THAT(actual.kV, WithinAbs(expectedKv, std::abs(expectedKv) * kTol));
  CHECK_THAT(actual.kA, WithinAbs(expectedKa, std::abs(expectedKa) * kTol));
  CHECK(actual.kG == 0.0);
}

// (b) Efficiency monotonicity (no kG term for flywheels): kA rises as
// efficiency falls, kV does not move. See the linear case above for why.
TEST_CASE(
    "FlywheelFeedforwardMonotonicityTest: "
    "EfficiencyIncreasesKaButNotKv",
    "[FlywheelFeedforwardMonotonicityTest]") {
  const FlywheelConfig cfg =
      GENERATE(FlywheelConfig{wpi::math::DCMotor::NEO(1), 1.0, 0.02},
               FlywheelConfig{wpi::math::DCMotor::Falcon500(1), 2.0, 0.03},
               FlywheelConfig{wpi::math::DCMotor::KrakenX60(1), 1.5, 0.01});
  CAPTURE(cfg.gearing, cfg.momentOfInertiaKgM2);
  const std::vector<double> efficiencies = {1.0, 0.8, 0.6, 0.4};

  double prevKv = -1.0, prevKa = -1.0;
  for (double efficiency : efficiencies) {
    FeedforwardGains gains = ComputeFlywheelFeedforwardGainsCore(
        cfg.motor, cfg.gearing, cfg.momentOfInertiaKgM2, efficiency);
    CHECK(gains.kG == 0.0);
    if (prevKv >= 0.0) {
      CHECK_THAT(gains.kV, WithinAbs(prevKv, std::abs(prevKv) * kTol));
      CHECK(gains.kA > prevKa);
    }
    prevKv = gains.kV;
    prevKa = gains.kA;
  }
}

// (d) Edge/guard cases, exercised via the non-throwing wasm entry point.
namespace {
class FlywheelFeedforwardGuardTest {
 protected:
  DCMotorWasm* motorWasm = MakeMotorWasm(wpi::math::DCMotor::KrakenX60(1), 1);

  ~FlywheelFeedforwardGuardTest() { delete motorWasm; }
};
}  // namespace

TEST_CASE_METHOD(
    FlywheelFeedforwardGuardTest,
    "FlywheelFeedforwardGuardTest: NonPositiveEfficiencyReturnsZeroedGains",
    "[FlywheelFeedforwardGuardTest]") {
  emscripten::val result = ComputeFlywheelFeedforwardGains(
      motorWasm, /*gearing=*/2.0, /*momentOfInertiaKgM2=*/0.01,
      /*efficiency=*/0.0);
  CHECK(result["kV"].as<double>() == 0.0);
  CHECK(result["kA"].as<double>() == 0.0);
  CHECK(result["kG"].as<double>() == 0.0);
}

TEST_CASE_METHOD(FlywheelFeedforwardGuardTest,
                 "FlywheelFeedforwardGuardTest: "
                 "NonPositiveMomentOfInertiaReturnsZeroedGains",
                 "[FlywheelFeedforwardGuardTest]") {
  emscripten::val result = ComputeFlywheelFeedforwardGains(
      motorWasm, /*gearing=*/2.0, /*momentOfInertiaKgM2=*/-0.01,
      /*efficiency=*/1.0);
  CHECK(result["kV"].as<double>() == 0.0);
  CHECK(result["kA"].as<double>() == 0.0);
  CHECK(result["kG"].as<double>() == 0.0);
}

TEST_CASE_METHOD(
    FlywheelFeedforwardGuardTest,
    "FlywheelFeedforwardGuardTest: NonPositiveGearingReturnsZeroedGains",
    "[FlywheelFeedforwardGuardTest]") {
  emscripten::val result = ComputeFlywheelFeedforwardGains(
      motorWasm, /*gearing=*/0.0, /*momentOfInertiaKgM2=*/0.01,
      /*efficiency=*/1.0);
  CHECK(result["kV"].as<double>() == 0.0);
  CHECK(result["kA"].as<double>() == 0.0);
  CHECK(result["kG"].as<double>() == 0.0);
}

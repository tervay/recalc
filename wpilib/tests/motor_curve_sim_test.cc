#include "motor_curve_sim.h"

#include <catch2/catch_test_macros.hpp>
#include <catch2/matchers/catch_matchers_floating_point.hpp>
#include <cmath>
#include <vector>

#include "dc_motor.h"
#include "wpi/math/system/DCMotor.hpp"

using Catch::Matchers::WithinAbs;
using Catch::Matchers::WithinULP;

namespace {

// Matches the inertia the /motors page uses.
constexpr double kMoi = 0.1 * (0.95 * 0.0254) * (0.95 * 0.0254);
constexpr double kTimestep = 1e-4;
constexpr int kMaxIterations = 50000;

// Far above any FRC motor's stall current, so it never binds.
constexpr double kUnlimitedAmps = 1000.0;

wpi::math::DCMotor TestMotor() { return wpi::math::DCMotor::KrakenX60(1); }

// Caller owns the returned pointer. Mirrors the helper in flywheel_sim_test.cc.
DCMotorWasm* MakeMotorWasm(const wpi::math::DCMotor& motor, int numMotors) {
  return new DCMotorWasm(
      motor.nominalVoltage.to<double>(), motor.stallTorque.to<double>(),
      motor.stallCurrent.to<double>(), motor.freeCurrent.to<double>(),
      motor.freeSpeed.to<double>(), numMotors);
}

struct Params {
  double moiKgMSquared = kMoi;
  double statorLimitAmps = kUnlimitedAmps;
  double supplyLimitAmps = kUnlimitedAmps;
  double statorVoltageVolts = 12.0;
  double supplyVoltageVolts = 12.0;
  double simTimestep = kTimestep;
  int decimation = 1;
  int maxIterations = kMaxIterations;
};

int Length(const emscripten::val& v) { return v["length"].as<int>(); }

std::vector<MotorCurveSimStateInternal> ToRows(const emscripten::val& v) {
  std::vector<MotorCurveSimStateInternal> rows;
  const int n = Length(v);
  rows.reserve(n);
  for (int i = 0; i < n; ++i) {
    const emscripten::val s = v[i];
    rows.push_back({s["angularVelocityRadPerSec"].as<double>(),
                    s["statorCurrentDrawAmps"].as<double>(),
                    s["supplyCurrentDrawAmps"].as<double>(),
                    s["torqueNewtonMeters"].as<double>(),
                    s["motorAppliedVoltageVolts"].as<double>(),
                    s["efficiency"].as<double>()});
  }
  return rows;
}

std::vector<MotorCurveSimStateInternal> Simulate(const Params& p) {
  DCMotorWasm* motor = MakeMotorWasm(TestMotor(), 1);
  emscripten::val result = SimulateMotorCurve(
      motor, p.moiKgMSquared, p.statorLimitAmps, p.supplyLimitAmps,
      p.statorVoltageVolts, p.supplyVoltageVolts, p.simTimestep, p.decimation,
      p.maxIterations);
  delete motor;
  return ToRows(result);
}

}  // namespace

// ============================================================================
// Linearity — regression coverage for the non-linear /motors curve. With no
// limit binding the motor follows I(w) = (V - w / Kv) / R, a straight line.
// ============================================================================

TEST_CASE(
    "MotorCurveSimLinearity: StatorCurrentIsLinearInSpeedWhenNoLimitBinds",
    "[MotorCurveSimLinearity]") {
  const auto motor = TestMotor();
  const auto rows = Simulate({});
  REQUIRE(rows.size() > 100u);

  const double v = 12.0;
  const double r = motor.R.to<double>();
  const double kv = motor.Kv.to<double>();

  for (const auto& row : rows) {
    INFO("at " << row.angularVelocityRadPerSec << " rad/s");
    const double expected = (v - row.angularVelocityRadPerSec / kv) / r;
    CHECK_THAT(row.statorCurrentDrawAmps, WithinAbs(expected, 1e-6));
  }
}

TEST_CASE(
    "MotorCurveSimLinearity: "
    "AppliedVoltageStaysAtStatorVoltageWhenNoLimitBinds",
    "[MotorCurveSimLinearity]") {
  for (const auto& row : Simulate({})) {
    CHECK_THAT(row.motorAppliedVoltageVolts, WithinAbs(12.0, 1e-9));
  }
}

TEST_CASE("MotorCurveSimLinearity: TorqueTracksKtTimesStatorCurrent",
          "[MotorCurveSimLinearity]") {
  const double kt = TestMotor().Kt.to<double>();
  for (const auto& row : Simulate({})) {
    INFO("at " << row.angularVelocityRadPerSec << " rad/s");
    CHECK_THAT(row.torqueNewtonMeters,
               WithinAbs(kt * row.statorCurrentDrawAmps, 1e-9));
  }
}

// ============================================================================
// Sweep endpoints
// ============================================================================

TEST_CASE("MotorCurveSimEndpoints: FirstRowIsTheStallPoint",
          "[MotorCurveSimEndpoints]") {
  const auto rows = Simulate({});
  REQUIRE_FALSE(rows.empty());

  CHECK_THAT(rows.front().angularVelocityRadPerSec, WithinULP(0.0, 4));
  CHECK_THAT(rows.front().statorCurrentDrawAmps,
             WithinAbs(TestMotor().stallCurrent.to<double>(), 1e-6));
  CHECK_THAT(rows.front().torqueNewtonMeters,
             WithinAbs(TestMotor().stallTorque.to<double>(), 1e-6));
}

TEST_CASE("MotorCurveSimEndpoints: SweepEndsAtFreeSpeedDrawingFreeCurrent",
          "[MotorCurveSimEndpoints]") {
  const auto rows = Simulate({});
  REQUIRE_FALSE(rows.empty());
  const auto& last = rows.back();

  const double freeSpeed = TestMotor().freeSpeed.to<double>();
  CHECK(last.angularVelocityRadPerSec <= freeSpeed);
  CHECK(last.angularVelocityRadPerSec > 0.99 * freeSpeed);
  CHECK_THAT(last.statorCurrentDrawAmps,
             WithinAbs(TestMotor().freeCurrent.to<double>(), 1.0));
}

TEST_CASE("MotorCurveSimEndpoints: SpeedIncreasesMonotonically",
          "[MotorCurveSimEndpoints]") {
  const auto rows = Simulate({});
  REQUIRE(rows.size() > 2u);
  for (size_t i = 1; i < rows.size(); ++i) {
    CHECK(rows[i].angularVelocityRadPerSec >
          rows[i - 1].angularVelocityRadPerSec);
  }
}

// ============================================================================
// Binding current limits
// ============================================================================

TEST_CASE("MotorCurveSimLimits: StatorLimitCapsCurrentAcrossTheLowSpeedRegion",
          "[MotorCurveSimLimits]") {
  const double statorLimit = 90.0;
  const auto rows =
      Simulate({.statorLimitAmps = statorLimit, .supplyLimitAmps = 1000.0});
  REQUIRE_FALSE(rows.empty());

  for (const auto& row : rows) {
    INFO("at " << row.angularVelocityRadPerSec << " rad/s");
    CHECK(row.statorCurrentDrawAmps <= statorLimit + 1e-6);
  }

  // At stall the limit is what sets the current, not the winding resistance.
  CHECK_THAT(rows.front().statorCurrentDrawAmps, WithinAbs(statorLimit, 1e-6));
}

TEST_CASE(
    "MotorCurveSimLimits: SupplyLimitUsesTheQuadraticClampNotALinearScaling",
    "[MotorCurveSimLimits]") {
  // At stall the clamp reduces to vApplied = sqrt(I_supply*R*V), so the stator
  // current is sqrt(I_supply*V/R) -- not the linear power-balance
  // approximation I_supply * V_supply / V_stator the TypeScript version used.
  const double supplyLimit = 60.0;
  const auto rows =
      Simulate({.statorLimitAmps = 1000.0, .supplyLimitAmps = supplyLimit});
  REQUIRE_FALSE(rows.empty());

  const double r = TestMotor().R.to<double>();
  const double expectedStall = std::sqrt(supplyLimit * 12.0 / r);
  CHECK_THAT(rows.front().statorCurrentDrawAmps,
             WithinAbs(expectedStall, 1e-6));

  // The linear approximation would have landed exactly on the supply limit.
  CHECK(rows.front().statorCurrentDrawAmps > supplyLimit * 2.0);
}

TEST_CASE("MotorCurveSimLimits: SupplyCurrentStaysWithinItsLimit",
          "[MotorCurveSimLimits]") {
  const double supplyLimit = 60.0;
  for (const auto& row : Simulate({.supplyLimitAmps = supplyLimit})) {
    INFO("at " << row.angularVelocityRadPerSec << " rad/s");
    CHECK(row.supplyCurrentDrawAmps <= supplyLimit + 1e-6);
  }
}

TEST_CASE("MotorCurveSimLimits: TheTighterOfTheTwoLimitsBinds",
          "[MotorCurveSimLimits]") {
  const auto statorBound =
      Simulate({.statorLimitAmps = 40.0, .supplyLimitAmps = 1000.0});
  REQUIRE_FALSE(statorBound.empty());
  CHECK_THAT(statorBound.front().statorCurrentDrawAmps, WithinAbs(40.0, 1e-6));
}

// ============================================================================
// Voltages
// ============================================================================

TEST_CASE(
    "MotorCurveSimVoltages: StatorVoltageSetsTheSpeedAtWhichCurrentReachesZero",
    "[MotorCurveSimVoltages]") {
  // At half voltage the sweep asymptotes below free speed, so it ends on the
  // iteration cap.
  const auto rows =
      Simulate({.statorVoltageVolts = 6.0, .maxIterations = 5000});
  REQUIRE_FALSE(rows.empty());

  const double r = TestMotor().R.to<double>();
  CHECK_THAT(rows.front().statorCurrentDrawAmps, WithinAbs(6.0 / r, 1e-6));
}

TEST_CASE("MotorCurveSimVoltages: SupplyVoltageClampsAStatorVoltageAboveIt",
          "[MotorCurveSimVoltages]") {
  const auto rows = Simulate({.statorVoltageVolts = 12.0,
                              .supplyVoltageVolts = 6.0,
                              .maxIterations = 5000});
  REQUIRE_FALSE(rows.empty());

  for (const auto& row : rows) {
    CHECK(row.motorAppliedVoltageVolts <= 6.0 + 1e-9);
  }
}

TEST_CASE(
    "MotorCurveSimVoltages: SwappingStatorAndSupplyVoltageChangesTheCurve",
    "[MotorCurveSimVoltages]") {
  // The supply limit has to bind for the two to differ: the bus voltage enters
  // the clamp only through the supply-current constraint.
  const double supplyLimit = 60.0;
  const double r = TestMotor().R.to<double>();

  const auto sixOnTwelve = Simulate({.supplyLimitAmps = supplyLimit,
                                     .statorVoltageVolts = 6.0,
                                     .supplyVoltageVolts = 12.0,
                                     .maxIterations = 5000});
  const auto twelveOnSix = Simulate({.supplyLimitAmps = supplyLimit,
                                     .statorVoltageVolts = 12.0,
                                     .supplyVoltageVolts = 6.0,
                                     .maxIterations = 5000});

  REQUIRE_FALSE(sixOnTwelve.empty());
  REQUIRE_FALSE(twelveOnSix.empty());

  // Stall current is sqrt(I_supply * R * V_supply) / R in each case.
  CHECK_THAT(sixOnTwelve.front().statorCurrentDrawAmps,
             WithinAbs(std::sqrt(supplyLimit * r * 12.0) / r, 1e-6));
  CHECK_THAT(twelveOnSix.front().statorCurrentDrawAmps,
             WithinAbs(std::sqrt(supplyLimit * r * 6.0) / r, 1e-6));
}

// ============================================================================
// Efficiency
// ============================================================================

TEST_CASE("MotorCurveSimEfficiency: StaysWithinZeroToOneAcrossTheSweep",
          "[MotorCurveSimEfficiency]") {
  for (const auto& row : Simulate({})) {
    INFO("at " << row.angularVelocityRadPerSec);
    CHECK(row.efficiency >= 0.0);
    CHECK(row.efficiency < 1.0);
  }
}

TEST_CASE("MotorCurveSimEfficiency: IsZeroAtStallAndPeaksInTheMiddle",
          "[MotorCurveSimEfficiency]") {
  const auto rows = Simulate({});
  REQUIRE(rows.size() > 2u);

  CHECK_THAT(rows.front().efficiency, WithinULP(0.0, 4));

  double peak = 0.0;
  for (const auto& row : rows) {
    peak = std::max(peak, row.efficiency);
  }
  CHECK(peak > 0.5);
  CHECK(peak < 1.0);
}

// ============================================================================
// Degenerate inputs
// ============================================================================

TEST_CASE("MotorCurveSimGuards: ZeroStatorLimitTerminatesAtTheIterationCap",
          "[MotorCurveSimGuards]") {
  // vApplied is pinned at vBackEmf, which is 0 V at rest.
  const auto rows = Simulate({.statorLimitAmps = 0.0, .maxIterations = 100});
  CHECK(rows.size() == 100u);
  for (const auto& row : rows) {
    CHECK_THAT(row.angularVelocityRadPerSec, WithinULP(0.0, 4));
    CHECK_THAT(row.statorCurrentDrawAmps, WithinAbs(0.0, 1e-9));
  }
}

TEST_CASE("MotorCurveSimGuards: NonPositiveInputsReturnAnEmptyArray",
          "[MotorCurveSimGuards]") {
  CHECK(Simulate({.decimation = 0}).empty());
  CHECK(Simulate({.maxIterations = 0}).empty());
  CHECK(Simulate({.simTimestep = 0.0}).empty());
  CHECK(Simulate({.moiKgMSquared = 0.0}).empty());
  CHECK(Simulate({.supplyVoltageVolts = 0.0}).empty());
  CHECK(Simulate({.supplyVoltageVolts = -12.0}).empty());
}

TEST_CASE("MotorCurveSimGuards: DecimationThinsTheOutputAndKeepsTheLastRow",
          "[MotorCurveSimGuards]") {
  const auto full = Simulate({});
  const auto thinned = Simulate({.decimation = 10});

  REQUIRE(full.size() > 10u);
  CHECK(thinned.size() < full.size());
  CHECK_THAT(thinned.front().angularVelocityRadPerSec,
             WithinULP(full.front().angularVelocityRadPerSec, 4));
  CHECK_THAT(thinned.back().angularVelocityRadPerSec,
             WithinULP(full.back().angularVelocityRadPerSec, 4));
}

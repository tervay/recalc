#include "motor_curve_sim.h"

#include <gtest/gtest.h>

#include <cmath>
#include <vector>

#include "dc_motor.h"
#include "hal_init.h"
#include "wpi/math/system/DCMotor.hpp"

namespace {

// DCMotorSim::SetInputVoltage and RoboRioSim both touch SimRoboRioData without
// lazy-init. Initialize once for the whole suite (see hal_init.h).
struct HalInitEnvironment : ::testing::Environment {
  void SetUp() override { EnsureHalInitialized(); }
};

const ::testing::Environment* const kHalInitEnvironment =
    ::testing::AddGlobalTestEnvironment(new HalInitEnvironment);

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

TEST(MotorCurveSimLinearity, StatorCurrentIsLinearInSpeedWhenNoLimitBinds) {
  const auto motor = TestMotor();
  const auto rows = Simulate({});
  ASSERT_GT(rows.size(), 100u);

  const double v = 12.0;
  const double r = motor.R.to<double>();
  const double kv = motor.Kv.to<double>();

  for (const auto& row : rows) {
    const double expected = (v - row.angularVelocityRadPerSec / kv) / r;
    EXPECT_NEAR(row.statorCurrentDrawAmps, expected, 1e-6)
        << "at " << row.angularVelocityRadPerSec << " rad/s";
  }
}

TEST(MotorCurveSimLinearity,
     AppliedVoltageStaysAtStatorVoltageWhenNoLimitBinds) {
  for (const auto& row : Simulate({})) {
    EXPECT_NEAR(row.motorAppliedVoltageVolts, 12.0, 1e-9);
  }
}

TEST(MotorCurveSimLinearity, TorqueTracksKtTimesStatorCurrent) {
  const double kt = TestMotor().Kt.to<double>();
  for (const auto& row : Simulate({})) {
    EXPECT_NEAR(row.torqueNewtonMeters, kt * row.statorCurrentDrawAmps, 1e-9)
        << "at " << row.angularVelocityRadPerSec << " rad/s";
  }
}

// ============================================================================
// Sweep endpoints
// ============================================================================

TEST(MotorCurveSimEndpoints, FirstRowIsTheStallPoint) {
  const auto rows = Simulate({});
  ASSERT_FALSE(rows.empty());

  EXPECT_DOUBLE_EQ(rows.front().angularVelocityRadPerSec, 0.0);
  EXPECT_NEAR(rows.front().statorCurrentDrawAmps,
              TestMotor().stallCurrent.to<double>(), 1e-6);
  EXPECT_NEAR(rows.front().torqueNewtonMeters,
              TestMotor().stallTorque.to<double>(), 1e-6);
}

TEST(MotorCurveSimEndpoints, SweepEndsAtFreeSpeedDrawingFreeCurrent) {
  const auto rows = Simulate({});
  ASSERT_FALSE(rows.empty());
  const auto& last = rows.back();

  const double freeSpeed = TestMotor().freeSpeed.to<double>();
  EXPECT_LE(last.angularVelocityRadPerSec, freeSpeed);
  EXPECT_GT(last.angularVelocityRadPerSec, 0.99 * freeSpeed);
  EXPECT_NEAR(last.statorCurrentDrawAmps, TestMotor().freeCurrent.to<double>(),
              1.0);
}

TEST(MotorCurveSimEndpoints, SpeedIncreasesMonotonically) {
  const auto rows = Simulate({});
  ASSERT_GT(rows.size(), 2u);
  for (size_t i = 1; i < rows.size(); ++i) {
    EXPECT_GT(rows[i].angularVelocityRadPerSec,
              rows[i - 1].angularVelocityRadPerSec);
  }
}

// ============================================================================
// Binding current limits
// ============================================================================

TEST(MotorCurveSimLimits, StatorLimitCapsCurrentAcrossTheLowSpeedRegion) {
  const double statorLimit = 90.0;
  const auto rows =
      Simulate({.statorLimitAmps = statorLimit, .supplyLimitAmps = 1000.0});
  ASSERT_FALSE(rows.empty());

  for (const auto& row : rows) {
    EXPECT_LE(row.statorCurrentDrawAmps, statorLimit + 1e-6)
        << "at " << row.angularVelocityRadPerSec << " rad/s";
  }

  // At stall the limit is what sets the current, not the winding resistance.
  EXPECT_NEAR(rows.front().statorCurrentDrawAmps, statorLimit, 1e-6);
}

TEST(MotorCurveSimLimits, SupplyLimitUsesTheQuadraticClampNotALinearScaling) {
  // At stall the clamp reduces to vApplied = sqrt(I_supply*R*V), so the stator
  // current is sqrt(I_supply*V/R) -- not the linear power-balance
  // approximation I_supply * V_supply / V_stator the TypeScript version used.
  const double supplyLimit = 60.0;
  const auto rows =
      Simulate({.statorLimitAmps = 1000.0, .supplyLimitAmps = supplyLimit});
  ASSERT_FALSE(rows.empty());

  const double r = TestMotor().R.to<double>();
  const double expectedStall = std::sqrt(supplyLimit * 12.0 / r);
  EXPECT_NEAR(rows.front().statorCurrentDrawAmps, expectedStall, 1e-6);

  // The linear approximation would have landed exactly on the supply limit.
  EXPECT_GT(rows.front().statorCurrentDrawAmps, supplyLimit * 2.0);
}

TEST(MotorCurveSimLimits, SupplyCurrentStaysWithinItsLimit) {
  const double supplyLimit = 60.0;
  for (const auto& row : Simulate({.supplyLimitAmps = supplyLimit})) {
    EXPECT_LE(row.supplyCurrentDrawAmps, supplyLimit + 1e-6)
        << "at " << row.angularVelocityRadPerSec << " rad/s";
  }
}

TEST(MotorCurveSimLimits, TheTighterOfTheTwoLimitsBinds) {
  const auto statorBound =
      Simulate({.statorLimitAmps = 40.0, .supplyLimitAmps = 1000.0});
  ASSERT_FALSE(statorBound.empty());
  EXPECT_NEAR(statorBound.front().statorCurrentDrawAmps, 40.0, 1e-6);
}

// ============================================================================
// Voltages
// ============================================================================

TEST(MotorCurveSimVoltages,
     StatorVoltageSetsTheSpeedAtWhichCurrentReachesZero) {
  // At half voltage the sweep asymptotes below free speed, so it ends on the
  // iteration cap.
  const auto rows =
      Simulate({.statorVoltageVolts = 6.0, .maxIterations = 5000});
  ASSERT_FALSE(rows.empty());

  const double r = TestMotor().R.to<double>();
  EXPECT_NEAR(rows.front().statorCurrentDrawAmps, 6.0 / r, 1e-6);
}

TEST(MotorCurveSimVoltages, SupplyVoltageClampsAStatorVoltageAboveIt) {
  const auto rows = Simulate({.statorVoltageVolts = 12.0,
                              .supplyVoltageVolts = 6.0,
                              .maxIterations = 5000});
  ASSERT_FALSE(rows.empty());

  for (const auto& row : rows) {
    EXPECT_LE(row.motorAppliedVoltageVolts, 6.0 + 1e-9);
  }
}

TEST(MotorCurveSimVoltages, SwappingStatorAndSupplyVoltageChangesTheCurve) {
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

  ASSERT_FALSE(sixOnTwelve.empty());
  ASSERT_FALSE(twelveOnSix.empty());

  // Stall current is sqrt(I_supply * R * V_supply) / R in each case.
  EXPECT_NEAR(sixOnTwelve.front().statorCurrentDrawAmps,
              std::sqrt(supplyLimit * r * 12.0) / r, 1e-6);
  EXPECT_NEAR(twelveOnSix.front().statorCurrentDrawAmps,
              std::sqrt(supplyLimit * r * 6.0) / r, 1e-6);
}

// ============================================================================
// Efficiency
// ============================================================================

TEST(MotorCurveSimEfficiency, StaysWithinZeroToOneAcrossTheSweep) {
  for (const auto& row : Simulate({})) {
    EXPECT_GE(row.efficiency, 0.0);
    EXPECT_LT(row.efficiency, 1.0) << "at " << row.angularVelocityRadPerSec;
  }
}

TEST(MotorCurveSimEfficiency, IsZeroAtStallAndPeaksInTheMiddle) {
  const auto rows = Simulate({});
  ASSERT_GT(rows.size(), 2u);

  EXPECT_DOUBLE_EQ(rows.front().efficiency, 0.0);

  double peak = 0.0;
  for (const auto& row : rows) {
    peak = std::max(peak, row.efficiency);
  }
  EXPECT_GT(peak, 0.5);
  EXPECT_LT(peak, 1.0);
}

// ============================================================================
// Degenerate inputs
// ============================================================================

TEST(MotorCurveSimGuards, ZeroStatorLimitTerminatesAtTheIterationCap) {
  // vApplied is pinned at vBackEmf, which is 0 V at rest.
  const auto rows = Simulate({.statorLimitAmps = 0.0, .maxIterations = 100});
  EXPECT_EQ(rows.size(), 100u);
  for (const auto& row : rows) {
    EXPECT_DOUBLE_EQ(row.angularVelocityRadPerSec, 0.0);
    EXPECT_NEAR(row.statorCurrentDrawAmps, 0.0, 1e-9);
  }
}

TEST(MotorCurveSimGuards, NonPositiveInputsReturnAnEmptyArray) {
  EXPECT_TRUE(Simulate({.decimation = 0}).empty());
  EXPECT_TRUE(Simulate({.maxIterations = 0}).empty());
  EXPECT_TRUE(Simulate({.simTimestep = 0.0}).empty());
  EXPECT_TRUE(Simulate({.moiKgMSquared = 0.0}).empty());
  EXPECT_TRUE(Simulate({.supplyVoltageVolts = 0.0}).empty());
  EXPECT_TRUE(Simulate({.supplyVoltageVolts = -12.0}).empty());
}

TEST(MotorCurveSimGuards, DecimationThinsTheOutputAndKeepsTheLastRow) {
  const auto full = Simulate({});
  const auto thinned = Simulate({.decimation = 10});

  ASSERT_GT(full.size(), 10u);
  EXPECT_LT(thinned.size(), full.size());
  EXPECT_DOUBLE_EQ(thinned.front().angularVelocityRadPerSec,
                   full.front().angularVelocityRadPerSec);
  EXPECT_DOUBLE_EQ(thinned.back().angularVelocityRadPerSec,
                   full.back().angularVelocityRadPerSec);
}

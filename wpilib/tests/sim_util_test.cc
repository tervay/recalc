#include "sim_util.h"

#include <gtest/gtest.h>

#include <cmath>
#include <functional>
#include <vector>

static constexpr double kTol = 1e-9;

// ============================================================================
// ClampVoltageForCurrentLimits
// ============================================================================

class ClampVoltageTest : public ::testing::Test {};

TEST_F(ClampVoltageTest, LooseLimits_PassThrough) {
  EXPECT_NEAR(ClampVoltageForCurrentLimits(6.0, 0.0, 0.1, 1000.0, 1000.0, 12.0),
              6.0, kTol);
}

TEST_F(ClampVoltageTest, StatorLimitBinding_ClampsHigh) {
  // maxA = 0 + 40*0.1 = 4
  EXPECT_NEAR(ClampVoltageForCurrentLimits(12.0, 0.0, 0.1, 40.0, 1000.0, 12.0),
              4.0, kTol);
}

TEST_F(ClampVoltageTest, SupplyLimitBinding_ClampsHigh) {
  // toSqrt = 0 + 40*0.1*12 = 48  →  maxB = sqrt(48)
  EXPECT_NEAR(ClampVoltageForCurrentLimits(12.0, 0.0, 0.1, 1000.0, 40.0, 12.0),
              std::sqrt(48.0), kTol);
}

TEST_F(ClampVoltageTest, VAppliedInsideBounds_NoChange) {
  EXPECT_NEAR(ClampVoltageForCurrentLimits(2.0, 0.0, 0.1, 40.0, 1000.0, 12.0),
              2.0, kTol);
}

TEST_F(ClampVoltageTest, VSupplyHardCap) {
  EXPECT_NEAR(
      ClampVoltageForCurrentLimits(100.0, 0.0, 0.1, 10000.0, 10000.0, 6.0), 6.0,
      kTol);
}

TEST_F(ClampVoltageTest, StatorLimitBinding_ClampsLow) {
  EXPECT_NEAR(ClampVoltageForCurrentLimits(-12.0, 0.0, 0.1, 40.0, 1000.0, 12.0),
              -4.0, kTol);
}

TEST_F(ClampVoltageTest, BackEmfShiftsStatorWindow) {
  // window = [6-4, 6+4] = [2, 10]
  EXPECT_NEAR(ClampVoltageForCurrentLimits(12.0, 6.0, 0.1, 40.0, 1000.0, 12.0),
              10.0, kTol);
}

TEST_F(ClampVoltageTest, BothLimitsActive_StatorTighter) {
  // maxA=4 (stator) < maxB=sqrt(48)≈6.93 (supply)
  EXPECT_NEAR(ClampVoltageForCurrentLimits(12.0, 0.0, 0.1, 40.0, 40.0, 12.0),
              4.0, kTol);
}

TEST_F(ClampVoltageTest, ZeroStatorLimit_ClampsToBackEmf) {
  EXPECT_NEAR(ClampVoltageForCurrentLimits(12.0, 3.0, 0.1, 0.0, 1000.0, 12.0),
              3.0, kTol);
}

TEST_F(ClampVoltageTest, VAppliedEqualsBackEmf_NoChange) {
  EXPECT_NEAR(ClampVoltageForCurrentLimits(5.0, 5.0, 0.1, 40.0, 40.0, 12.0),
              5.0, kTol);
}

TEST_F(ClampVoltageTest, NegativeVAppliedWithNegativeBackEmf) {
  // minA = -2 - 4 = -6
  EXPECT_NEAR(
      ClampVoltageForCurrentLimits(-12.0, -2.0, 0.1, 40.0, 1000.0, 12.0), -6.0,
      kTol);
}

// ============================================================================
// SupplyCurrentFromStator
// ============================================================================

class SupplyCurrentTest : public ::testing::Test {};

TEST_F(SupplyCurrentTest, Motoring_DrawsPositiveFromBattery) {
  // Positive stator current with positive applied voltage => power flows from
  // the battery into the motor, so supply current is positive.
  EXPECT_NEAR(SupplyCurrentFromStator(8.0, 6.0, 12.0), 4.0, kTol);
}

TEST_F(SupplyCurrentTest, PowerBalanceScaling) {
  // I_supply = I_stator * |V_applied| / V_supply = 10 * 6 / 12 = 5
  EXPECT_NEAR(SupplyCurrentFromStator(10.0, 6.0, 12.0), 5.0, kTol);
}

TEST_F(SupplyCurrentTest, StepUpWhenAppliedBelowSupply) {
  // Applying less than the supply voltage steps the current up on the battery
  // side (a boost-converter-like relationship): 10 * 3 / 12 = 2.5
  EXPECT_NEAR(SupplyCurrentFromStator(10.0, 3.0, 12.0), 2.5, kTol);
}

// Regression for the elevator supply-current sign bug: during regenerative
// braking the stator current is negative while the applied voltage is still
// positive, so the supply current MUST come out negative (energy returned to
// the battery). A stray abs() on the stator term (as elevator_sim.h once had)
// would wrongly report this as positive.
TEST_F(SupplyCurrentTest, Regen_NegativeStator_YieldsNegativeSupply) {
  EXPECT_NEAR(SupplyCurrentFromStator(-8.0, 6.0, 12.0), -4.0, kTol);
}

TEST_F(SupplyCurrentTest, NegativeAppliedVoltage_UsesMagnitude) {
  // GetCurrentDraw() already folds sgn(V_applied) into the stator current, so
  // only the magnitude of V_applied is used here. 5 * |-6| / 12 = 2.5
  EXPECT_NEAR(SupplyCurrentFromStator(5.0, -6.0, 12.0), 2.5, kTol);
}

TEST_F(SupplyCurrentTest, ZeroSupplyVoltage_ReturnsZero) {
  // Divide-by-zero guard: BatterySim clamps the battery to >= 0V under extreme
  // load, so a 0V supply must not produce inf/nan.
  EXPECT_EQ(SupplyCurrentFromStator(8.0, 6.0, 0.0), 0.0);
}

TEST_F(SupplyCurrentTest, NegativeSupplyVoltage_ReturnsZero) {
  EXPECT_EQ(SupplyCurrentFromStator(8.0, 6.0, -1.0), 0.0);
}

TEST_F(SupplyCurrentTest, EnergyIsCreditedDuringRegen) {
  // Integrating instantaneous supply power (I_supply * V_supply * dt) over a
  // regen sample must decrease accumulated energy, proving recovered energy is
  // credited rather than ignored.
  const double dt = 0.001;
  const double vSupply = 12.0;
  const double regenSupply = SupplyCurrentFromStator(-8.0, 6.0, vSupply);
  const double deltaJoules = regenSupply * vSupply * dt;
  EXPECT_LT(deltaJoules, 0.0);
}

// ============================================================================
// DecimateToJsArray
// ============================================================================

class DecimateTest : public ::testing::Test {};

static std::vector<int> RunDecimate(const std::vector<int>& states,
                                    int decimation) {
  std::vector<int> seen;
  auto serialize = [&](const int& s) -> emscripten::val {
    seen.push_back(s);
    return emscripten::val{};
  };
  DecimateToJsArray<int>(states, decimation, serialize);
  return seen;
}

TEST_F(DecimateTest, EmptyVector) { EXPECT_TRUE(RunDecimate({}, 1).empty()); }

TEST_F(DecimateTest, SingleElement_DecimationOne) {
  EXPECT_EQ(RunDecimate({42}, 1), (std::vector<int>{42}));
}

TEST_F(DecimateTest, SingleElement_LargeDecimation) {
  EXPECT_EQ(RunDecimate({42}, 10), (std::vector<int>{42}));
}

TEST_F(DecimateTest, DecimationOne_AllEmitted) {
  EXPECT_EQ(RunDecimate({10, 20, 30}, 1), (std::vector<int>{10, 20, 30}));
}

TEST_F(DecimateTest, DecimationTwo_EvenSize_LastForced) {
  EXPECT_EQ(RunDecimate({0, 1, 2, 3, 4, 5}, 2), (std::vector<int>{0, 2, 4, 5}));
}

TEST_F(DecimateTest, DecimationTwo_OddSize_LastOnBoundary) {
  EXPECT_EQ(RunDecimate({0, 1, 2, 3, 4}, 2), (std::vector<int>{0, 2, 4}));
}

TEST_F(DecimateTest, DecimationThree_ForcedLast) {
  EXPECT_EQ(RunDecimate({10, 11, 12, 13, 14}, 3),
            (std::vector<int>{10, 13, 14}));
}

TEST_F(DecimateTest, DecimationThree_LastOnBoundary_NotDoubled) {
  EXPECT_EQ(RunDecimate({0, 1, 2, 3, 4, 5, 6}, 3), (std::vector<int>{0, 3, 6}));
}

TEST_F(DecimateTest, DecimationLargerThanSize) {
  EXPECT_EQ(RunDecimate({100, 200}, 5), (std::vector<int>{100, 200}));
}

TEST_F(DecimateTest, SerializerReceivesCorrectStateValues) {
  struct Point {
    double x;
    double y;
  };
  std::vector<Point> pts = {{1.0, 2.0}, {3.0, 4.0}, {5.0, 6.0}, {7.0, 8.0}};
  std::vector<double> xs_seen;

  auto serialize = [&](const Point& p) -> emscripten::val {
    xs_seen.push_back(p.x);
    return emscripten::val{};
  };

  DecimateToJsArray<Point>(pts, 2, serialize);
  EXPECT_EQ(xs_seen, (std::vector<double>{1.0, 5.0, 7.0}));
}

#include "sim_util.h"

#include <catch2/catch_test_macros.hpp>
#include <catch2/matchers/catch_matchers_floating_point.hpp>
#include <cmath>
#include <functional>
#include <vector>

using Catch::Matchers::WithinAbs;

static constexpr double kTol = 1e-9;

// ============================================================================
// ClampVoltageForCurrentLimits
// ============================================================================

TEST_CASE("ClampVoltage: LooseLimits_PassThrough", "[ClampVoltage]") {
  CHECK_THAT(ClampVoltageForCurrentLimits(6.0, 0.0, 0.1, 1000.0, 1000.0, 12.0),
             WithinAbs(6.0, kTol));
}

TEST_CASE("ClampVoltage: StatorLimitBinding_ClampsHigh", "[ClampVoltage]") {
  // maxA = 0 + 40*0.1 = 4
  CHECK_THAT(ClampVoltageForCurrentLimits(12.0, 0.0, 0.1, 40.0, 1000.0, 12.0),
             WithinAbs(4.0, kTol));
}

TEST_CASE("ClampVoltage: SupplyLimitBinding_ClampsHigh", "[ClampVoltage]") {
  // toSqrt = 0 + 40*0.1*12 = 48  →  maxB = sqrt(48)
  CHECK_THAT(ClampVoltageForCurrentLimits(12.0, 0.0, 0.1, 1000.0, 40.0, 12.0),
             WithinAbs(std::sqrt(48.0), kTol));
}

TEST_CASE("ClampVoltage: VAppliedInsideBounds_NoChange", "[ClampVoltage]") {
  CHECK_THAT(ClampVoltageForCurrentLimits(2.0, 0.0, 0.1, 40.0, 1000.0, 12.0),
             WithinAbs(2.0, kTol));
}

TEST_CASE("ClampVoltage: VSupplyHardCap", "[ClampVoltage]") {
  CHECK_THAT(
      ClampVoltageForCurrentLimits(100.0, 0.0, 0.1, 10000.0, 10000.0, 6.0),
      WithinAbs(6.0, kTol));
}

TEST_CASE("ClampVoltage: StatorLimitBinding_ClampsLow", "[ClampVoltage]") {
  CHECK_THAT(ClampVoltageForCurrentLimits(-12.0, 0.0, 0.1, 40.0, 1000.0, 12.0),
             WithinAbs(-4.0, kTol));
}

TEST_CASE("ClampVoltage: BackEmfShiftsStatorWindow", "[ClampVoltage]") {
  // window = [6-4, 6+4] = [2, 10]
  CHECK_THAT(ClampVoltageForCurrentLimits(12.0, 6.0, 0.1, 40.0, 1000.0, 12.0),
             WithinAbs(10.0, kTol));
}

TEST_CASE("ClampVoltage: BothLimitsActive_StatorTighter", "[ClampVoltage]") {
  // maxA=4 (stator) < maxB=sqrt(48)≈6.93 (supply)
  CHECK_THAT(ClampVoltageForCurrentLimits(12.0, 0.0, 0.1, 40.0, 40.0, 12.0),
             WithinAbs(4.0, kTol));
}

TEST_CASE("ClampVoltage: ZeroStatorLimit_ClampsToBackEmf", "[ClampVoltage]") {
  CHECK_THAT(ClampVoltageForCurrentLimits(12.0, 3.0, 0.1, 0.0, 1000.0, 12.0),
             WithinAbs(3.0, kTol));
}

TEST_CASE("ClampVoltage: VAppliedEqualsBackEmf_NoChange", "[ClampVoltage]") {
  CHECK_THAT(ClampVoltageForCurrentLimits(5.0, 5.0, 0.1, 40.0, 40.0, 12.0),
             WithinAbs(5.0, kTol));
}

TEST_CASE("ClampVoltage: NegativeVAppliedWithNegativeBackEmf",
          "[ClampVoltage]") {
  // minA = -2 - 4 = -6
  CHECK_THAT(ClampVoltageForCurrentLimits(-12.0, -2.0, 0.1, 40.0, 1000.0, 12.0),
             WithinAbs(-6.0, kTol));
}

// ============================================================================
// SupplyCurrentFromStator
// ============================================================================

TEST_CASE("SupplyCurrent: Motoring_DrawsPositiveFromBattery",
          "[SupplyCurrent]") {
  // Positive stator current with positive applied voltage => power flows from
  // the battery into the motor, so supply current is positive.
  CHECK_THAT(SupplyCurrentFromStator(8.0, 6.0, 12.0), WithinAbs(4.0, kTol));
}

TEST_CASE("SupplyCurrent: PowerBalanceScaling", "[SupplyCurrent]") {
  // I_supply = I_stator * |V_applied| / V_supply = 10 * 6 / 12 = 5
  CHECK_THAT(SupplyCurrentFromStator(10.0, 6.0, 12.0), WithinAbs(5.0, kTol));
}

TEST_CASE("SupplyCurrent: StepUpWhenAppliedBelowSupply", "[SupplyCurrent]") {
  // Applying less than the supply voltage steps the current up on the battery
  // side (a boost-converter-like relationship): 10 * 3 / 12 = 2.5
  CHECK_THAT(SupplyCurrentFromStator(10.0, 3.0, 12.0), WithinAbs(2.5, kTol));
}

// Regression for the elevator supply-current sign bug: during regenerative
// braking the stator current is negative while the applied voltage is still
// positive, so the supply current MUST come out negative (energy returned to
// the battery). A stray abs() on the stator term (as elevator_sim.h once had)
// would wrongly report this as positive.
TEST_CASE("SupplyCurrent: Regen_NegativeStator_YieldsNegativeSupply",
          "[SupplyCurrent]") {
  CHECK_THAT(SupplyCurrentFromStator(-8.0, 6.0, 12.0), WithinAbs(-4.0, kTol));
}

TEST_CASE("SupplyCurrent: NegativeAppliedVoltage_UsesMagnitude",
          "[SupplyCurrent]") {
  // GetCurrentDraw() already folds sgn(V_applied) into the stator current, so
  // only the magnitude of V_applied is used here. 5 * |-6| / 12 = 2.5
  CHECK_THAT(SupplyCurrentFromStator(5.0, -6.0, 12.0), WithinAbs(2.5, kTol));
}

TEST_CASE("SupplyCurrent: ZeroSupplyVoltage_ReturnsZero", "[SupplyCurrent]") {
  // Divide-by-zero guard: BatterySim clamps the battery to >= 0V under extreme
  // load, so a 0V supply must not produce inf/nan.
  CHECK(SupplyCurrentFromStator(8.0, 6.0, 0.0) == 0.0);
}

TEST_CASE("SupplyCurrent: NegativeSupplyVoltage_ReturnsZero",
          "[SupplyCurrent]") {
  CHECK(SupplyCurrentFromStator(8.0, 6.0, -1.0) == 0.0);
}

TEST_CASE("SupplyCurrent: EnergyIsCreditedDuringRegen", "[SupplyCurrent]") {
  // Integrating instantaneous supply power (I_supply * V_supply * dt) over a
  // regen sample must decrease accumulated energy, proving recovered energy is
  // credited rather than ignored.
  const double dt = 0.001;
  const double vSupply = 12.0;
  const double regenSupply = SupplyCurrentFromStator(-8.0, 6.0, vSupply);
  const double deltaJoules = regenSupply * vSupply * dt;
  CHECK(deltaJoules < 0.0);
}

// ============================================================================
// DecimateToJsArray
// ============================================================================

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

TEST_CASE("Decimate: EmptyVector", "[Decimate]") {
  CHECK(RunDecimate({}, 1).empty());
}

TEST_CASE("Decimate: SingleElement_DecimationOne", "[Decimate]") {
  CHECK(RunDecimate({42}, 1) == (std::vector<int>{42}));
}

TEST_CASE("Decimate: SingleElement_LargeDecimation", "[Decimate]") {
  CHECK(RunDecimate({42}, 10) == (std::vector<int>{42}));
}

TEST_CASE("Decimate: DecimationOne_AllEmitted", "[Decimate]") {
  CHECK(RunDecimate({10, 20, 30}, 1) == (std::vector<int>{10, 20, 30}));
}

TEST_CASE("Decimate: DecimationTwo_EvenSize_LastForced", "[Decimate]") {
  CHECK(RunDecimate({0, 1, 2, 3, 4, 5}, 2) == (std::vector<int>{0, 2, 4, 5}));
}

TEST_CASE("Decimate: DecimationTwo_OddSize_LastOnBoundary", "[Decimate]") {
  CHECK(RunDecimate({0, 1, 2, 3, 4}, 2) == (std::vector<int>{0, 2, 4}));
}

TEST_CASE("Decimate: DecimationThree_ForcedLast", "[Decimate]") {
  CHECK(RunDecimate({10, 11, 12, 13, 14}, 3) == (std::vector<int>{10, 13, 14}));
}

TEST_CASE("Decimate: DecimationThree_LastOnBoundary_NotDoubled", "[Decimate]") {
  CHECK(RunDecimate({0, 1, 2, 3, 4, 5, 6}, 3) == (std::vector<int>{0, 3, 6}));
}

TEST_CASE("Decimate: DecimationLargerThanSize", "[Decimate]") {
  CHECK(RunDecimate({100, 200}, 5) == (std::vector<int>{100, 200}));
}

TEST_CASE("Decimate: SerializerReceivesCorrectStateValues", "[Decimate]") {
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
  CHECK(xs_seen == (std::vector<double>{1.0, 5.0, 7.0}));
}

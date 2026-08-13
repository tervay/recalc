#include "battery_sim.h"

#include <gtest/gtest.h>

#include <vector>

#include "hal_init.h"

namespace {

// RoboRioSim_SetVInVoltage / RobotController_GetInputVoltage touch
// SimRoboRioData, which has no lazy-init. Initialize once for the whole suite
// (see hal_init.h). Both wrappers call EnsureHalInitialized themselves, so this
// environment is belt-and-braces against declaration order.
struct HalInitEnvironment : ::testing::Environment {
  void SetUp() override { EnsureHalInitialized(); }
};

const ::testing::Environment* const kHalInitEnvironment =
    ::testing::AddGlobalTestEnvironment(new HalInitEnvironment);

// Upstream wpi::sim::BatterySim::Calculate's 2-argument overload delegates to
// Calculate(12_V, 0.02_Ohm, currents). These mirror that so the expected values
// below read as closed forms rather than magic numbers.
constexpr double kNominalVolts = 12.0;
constexpr double kInternalResistanceOhms = 0.02;

double ExpectedVoltage(double nominalVolts, double resistanceOhms,
                       double totalCurrentAmps) {
  const double loaded = nominalVolts - totalCurrentAmps * resistanceOhms;
  return loaded > 0.0 ? loaded : 0.0;
}

}  // namespace

// ============================================================================
// RoboRio supply voltage round-trip
//
// The simulation loops in arm_sim.h / flywheel_sim.h / elevator_sim.h write the
// filtered battery voltage back through RoboRioSim_SetVInVoltage and read it
// again through RobotController_GetInputVoltage on the next iteration. These
// pin that the pair is a faithful round-trip rather than a constant.
// ============================================================================

TEST(RoboRioVoltage, SetThenGetRoundTripsNominal) {
  RoboRioSim_SetVInVoltage(12.0);
  EXPECT_NEAR(RobotController_GetInputVoltage(), 12.0, 1e-9);
}

// A distinct, non-nominal value: a getter hardcoded to 12 would pass the test
// above but fail this one.
TEST(RoboRioVoltage, RoundTripsANonNominalValue) {
  RoboRioSim_SetVInVoltage(7.25);
  EXPECT_NEAR(RobotController_GetInputVoltage(), 7.25, 1e-9);
}

// Zero is the boundary SupplyCurrentFromStator (sim_util.h:61) branches on, so
// the sim loops depend on it surviving the round-trip exactly.
TEST(RoboRioVoltage, RoundTripsZero) {
  RoboRioSim_SetVInVoltage(0.0);
  EXPECT_NEAR(RobotController_GetInputVoltage(), 0.0, 1e-9);

  // Restore, so a later test in this binary is not left with a dead battery.
  RoboRioSim_SetVInVoltage(12.0);
}

// ============================================================================
// BatterySim_CalculateDefaultBatteryLoadedVoltage
//
// Uses upstream's 12 V / 20 mOhm defaults. The model is
//   max(0, nominal - sum(currents) * R)
// -- clamped below at zero, deliberately NOT clamped above, so a regenerating
// mechanism raises the bus voltage.
// ============================================================================

TEST(BatterySimDefault, EmptyVectorReturnsNominal) {
  EXPECT_DOUBLE_EQ(BatterySim_CalculateDefaultBatteryLoadedVoltage({}),
                   kNominalVolts);
}

TEST(BatterySimDefault, SingleCurrentSagsByIR) {
  // 12 - 0.02 * 10 = 11.8
  EXPECT_NEAR(BatterySim_CalculateDefaultBatteryLoadedVoltage({10.0}), 11.8,
              1e-12);
}

// Pins that every element is summed, not just the first. A model that read only
// currents[0] would return 11.9 here.
TEST(BatterySimDefault, MultipleCurrentsSumBeforeSagging) {
  // 12 - 0.02 * (5 + 10 + 15) = 11.4
  EXPECT_NEAR(
      BatterySim_CalculateDefaultBatteryLoadedVoltage({5.0, 10.0, 15.0}), 11.4,
      1e-12);
}

// Regeneration. There is no upper clamp, so a negative current must push the
// bus above nominal. The sim loops rely on this: their supply current goes
// negative while decelerating.
TEST(BatterySimDefault, NegativeCurrentRaisesVoltageAboveNominal) {
  // 12 - 0.02 * -50 = 13.0
  EXPECT_NEAR(BatterySim_CalculateDefaultBatteryLoadedVoltage({-50.0}), 13.0,
              1e-12);
}

// Sign-preserving summation: the two currents must cancel rather than being
// accumulated by magnitude.
TEST(BatterySimDefault, MixedSignCurrentsNetOut) {
  EXPECT_DOUBLE_EQ(
      BatterySim_CalculateDefaultBatteryLoadedVoltage({100.0, -100.0}),
      kNominalVolts);
}

// The lower clamp. Without it this would return -8 V, and the sim loops would
// divide by a negative supply voltage in SupplyCurrentFromStator.
TEST(BatterySimDefault, ClampsAtZeroUnderExtremeLoad) {
  EXPECT_DOUBLE_EQ(BatterySim_CalculateDefaultBatteryLoadedVoltage({1000.0}),
                   0.0);
}

// Exactly at the clamp boundary: 12 - 0.02 * 600 == 0.
TEST(BatterySimDefault, ExactlyZeroAtTheClampBoundary) {
  EXPECT_DOUBLE_EQ(BatterySim_CalculateDefaultBatteryLoadedVoltage({600.0}),
                   0.0);
}

class BatterySimDefaultClosedFormTest
    : public ::testing::TestWithParam<double> {};

TEST_P(BatterySimDefaultClosedFormTest, MatchesNominalMinusIR) {
  const double current = GetParam();
  EXPECT_NEAR(BatterySim_CalculateDefaultBatteryLoadedVoltage({current}),
              ExpectedVoltage(kNominalVolts, kInternalResistanceOhms, current),
              1e-12);
}

INSTANTIATE_TEST_SUITE_P(VariousCurrents, BatterySimDefaultClosedFormTest,
                         ::testing::Values(0.0, 1.0, 12.5, 100.0, 300.0));

// ============================================================================
// BatterySim_CalculateLoadedBatteryVoltage (explicit nominal / resistance)
// ============================================================================

// Resistance, not current, drives the sag. A 500 A load on an ideal battery
// must not move the bus at all -- this is the configuration the C++ sim tests
// use to make their energy assertions exact identities.
TEST(BatterySimLoaded, ZeroResistanceReturnsNominalRegardlessOfCurrent) {
  EXPECT_DOUBLE_EQ(BatterySim_CalculateLoadedBatteryVoltage(12.0, 0.0, {500.0}),
                   12.0);
}

// Pins the 12 V / 20 mOhm defaults documented in battery_sim.h's comment: the
// explicit overload with those values must agree with the default one.
TEST(BatterySimLoaded, ExplicitDefaultsMatchTheDefaultOverload) {
  const std::vector<double> currents = {5.0, 10.0, 15.0};
  EXPECT_DOUBLE_EQ(BatterySim_CalculateLoadedBatteryVoltage(
                       kNominalVolts, kInternalResistanceOhms, currents),
                   BatterySim_CalculateDefaultBatteryLoadedVoltage(currents));
}

TEST(BatterySimLoaded, CustomNominalVoltage) {
  // 24 - 0.02 * 10 = 23.8
  EXPECT_NEAR(BatterySim_CalculateLoadedBatteryVoltage(24.0, 0.02, {10.0}),
              23.8, 1e-12);
}

TEST(BatterySimLoaded, CustomResistanceScalesTheSag) {
  EXPECT_NEAR(BatterySim_CalculateLoadedBatteryVoltage(12.0, 0.01, {10.0}),
              11.9, 1e-12);
  EXPECT_NEAR(BatterySim_CalculateLoadedBatteryVoltage(12.0, 0.03, {10.0}),
              11.7, 1e-12);
}

TEST(BatterySimLoaded, ClampsAtZeroWithCustomParameters) {
  // Unclamped this would be 12 - 0.1 * 1000 = -88.
  EXPECT_DOUBLE_EQ(
      BatterySim_CalculateLoadedBatteryVoltage(12.0, 0.1, {1000.0}), 0.0);
}

// A dead battery still rises under regeneration: the clamp is a floor on the
// result, not a floor on the nominal voltage.
TEST(BatterySimLoaded, ZeroNominalWithRegenStillRises) {
  EXPECT_NEAR(BatterySim_CalculateLoadedBatteryVoltage(0.0, 0.02, {-100.0}),
              2.0, 1e-12);
}

TEST(BatterySimLoaded, EmptyCurrentsReturnsNominal) {
  EXPECT_DOUBLE_EQ(BatterySim_CalculateLoadedBatteryVoltage(9.5, 0.02, {}),
                   9.5);
}

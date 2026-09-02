#include "battery_sim.h"

#include <catch2/catch_test_macros.hpp>
#include <catch2/generators/catch_generators.hpp>
#include <catch2/matchers/catch_matchers_floating_point.hpp>
#include <vector>

using Catch::Matchers::WithinAbs;
using Catch::Matchers::WithinULP;

namespace {

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

TEST_CASE("RoboRioVoltage: SetThenGetRoundTripsNominal", "[RoboRioVoltage]") {
  RoboRioSim_SetVInVoltage(12.0);
  CHECK_THAT(RobotController_GetInputVoltage(), WithinAbs(12.0, 1e-9));
}

// A distinct, non-nominal value: a getter hardcoded to 12 would pass the test
// above but fail this one.
TEST_CASE("RoboRioVoltage: RoundTripsANonNominalValue", "[RoboRioVoltage]") {
  RoboRioSim_SetVInVoltage(7.25);
  CHECK_THAT(RobotController_GetInputVoltage(), WithinAbs(7.25, 1e-9));
}

// Zero is the boundary SupplyCurrentFromStator (sim_util.h:61) branches on, so
// the sim loops depend on it surviving the round-trip exactly.
TEST_CASE("RoboRioVoltage: RoundTripsZero", "[RoboRioVoltage]") {
  RoboRioSim_SetVInVoltage(0.0);
  CHECK_THAT(RobotController_GetInputVoltage(), WithinAbs(0.0, 1e-9));

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

TEST_CASE("BatterySimDefault: EmptyVectorReturnsNominal",
          "[BatterySimDefault]") {
  CHECK_THAT(BatterySim_CalculateDefaultBatteryLoadedVoltage({}),
             WithinULP(kNominalVolts, 4));
}

TEST_CASE("BatterySimDefault: SingleCurrentSagsByIR", "[BatterySimDefault]") {
  // 12 - 0.02 * 10 = 11.8
  CHECK_THAT(BatterySim_CalculateDefaultBatteryLoadedVoltage({10.0}),
             WithinAbs(11.8, 1e-12));
}

// Pins that every element is summed, not just the first. A model that read only
// currents[0] would return 11.9 here.
TEST_CASE("BatterySimDefault: MultipleCurrentsSumBeforeSagging",
          "[BatterySimDefault]") {
  // 12 - 0.02 * (5 + 10 + 15) = 11.4
  CHECK_THAT(BatterySim_CalculateDefaultBatteryLoadedVoltage({5.0, 10.0, 15.0}),
             WithinAbs(11.4, 1e-12));
}

// Regeneration. There is no upper clamp, so a negative current must push the
// bus above nominal. The sim loops rely on this: their supply current goes
// negative while decelerating.
TEST_CASE("BatterySimDefault: NegativeCurrentRaisesVoltageAboveNominal",
          "[BatterySimDefault]") {
  // 12 - 0.02 * -50 = 13.0
  CHECK_THAT(BatterySim_CalculateDefaultBatteryLoadedVoltage({-50.0}),
             WithinAbs(13.0, 1e-12));
}

// Sign-preserving summation: the two currents must cancel rather than being
// accumulated by magnitude.
TEST_CASE("BatterySimDefault: MixedSignCurrentsNetOut", "[BatterySimDefault]") {
  CHECK_THAT(BatterySim_CalculateDefaultBatteryLoadedVoltage({100.0, -100.0}),
             WithinULP(kNominalVolts, 4));
}

// The lower clamp. Without it this would return -8 V, and the sim loops would
// divide by a negative supply voltage in SupplyCurrentFromStator.
TEST_CASE("BatterySimDefault: ClampsAtZeroUnderExtremeLoad",
          "[BatterySimDefault]") {
  CHECK_THAT(BatterySim_CalculateDefaultBatteryLoadedVoltage({1000.0}),
             WithinULP(0.0, 4));
}

// Exactly at the clamp boundary: 12 - 0.02 * 600 == 0.
TEST_CASE("BatterySimDefault: ExactlyZeroAtTheClampBoundary",
          "[BatterySimDefault]") {
  CHECK_THAT(BatterySim_CalculateDefaultBatteryLoadedVoltage({600.0}),
             WithinULP(0.0, 4));
}

TEST_CASE("BatterySimDefaultClosedFormTest: MatchesNominalMinusIR",
          "[BatterySimDefaultClosedFormTest]") {
  const double current = GENERATE(0.0, 1.0, 12.5, 100.0, 300.0);
  CAPTURE(current);
  CHECK_THAT(BatterySim_CalculateDefaultBatteryLoadedVoltage({current}),
             WithinAbs(ExpectedVoltage(kNominalVolts, kInternalResistanceOhms,
                                       current),
                       1e-12));
}

// ============================================================================
// BatterySim_CalculateLoadedBatteryVoltage (explicit nominal / resistance)
// ============================================================================

// Resistance, not current, drives the sag. A 500 A load on an ideal battery
// must not move the bus at all -- this is the configuration the C++ sim tests
// use to make their energy assertions exact identities.
TEST_CASE("BatterySimLoaded: ZeroResistanceReturnsNominalRegardlessOfCurrent",
          "[BatterySimLoaded]") {
  CHECK_THAT(BatterySim_CalculateLoadedBatteryVoltage(12.0, 0.0, {500.0}),
             WithinULP(12.0, 4));
}

// Pins the 12 V / 20 mOhm defaults documented in battery_sim.h's comment: the
// explicit overload with those values must agree with the default one.
TEST_CASE("BatterySimLoaded: ExplicitDefaultsMatchTheDefaultOverload",
          "[BatterySimLoaded]") {
  const std::vector<double> currents = {5.0, 10.0, 15.0};
  CHECK_THAT(
      BatterySim_CalculateLoadedBatteryVoltage(
          kNominalVolts, kInternalResistanceOhms, currents),
      WithinULP(BatterySim_CalculateDefaultBatteryLoadedVoltage(currents), 4));
}

TEST_CASE("BatterySimLoaded: CustomNominalVoltage", "[BatterySimLoaded]") {
  // 24 - 0.02 * 10 = 23.8
  CHECK_THAT(BatterySim_CalculateLoadedBatteryVoltage(24.0, 0.02, {10.0}),
             WithinAbs(23.8, 1e-12));
}

TEST_CASE("BatterySimLoaded: CustomResistanceScalesTheSag",
          "[BatterySimLoaded]") {
  CHECK_THAT(BatterySim_CalculateLoadedBatteryVoltage(12.0, 0.01, {10.0}),
             WithinAbs(11.9, 1e-12));
  CHECK_THAT(BatterySim_CalculateLoadedBatteryVoltage(12.0, 0.03, {10.0}),
             WithinAbs(11.7, 1e-12));
}

TEST_CASE("BatterySimLoaded: ClampsAtZeroWithCustomParameters",
          "[BatterySimLoaded]") {
  // Unclamped this would be 12 - 0.1 * 1000 = -88.
  CHECK_THAT(BatterySim_CalculateLoadedBatteryVoltage(12.0, 0.1, {1000.0}),
             WithinULP(0.0, 4));
}

// A dead battery still rises under regeneration: the clamp is a floor on the
// result, not a floor on the nominal voltage.
TEST_CASE("BatterySimLoaded: ZeroNominalWithRegenStillRises",
          "[BatterySimLoaded]") {
  CHECK_THAT(BatterySim_CalculateLoadedBatteryVoltage(0.0, 0.02, {-100.0}),
             WithinAbs(2.0, 1e-12));
}

TEST_CASE("BatterySimLoaded: EmptyCurrentsReturnsNominal",
          "[BatterySimLoaded]") {
  CHECK_THAT(BatterySim_CalculateLoadedBatteryVoltage(9.5, 0.02, {}),
             WithinULP(9.5, 4));
}

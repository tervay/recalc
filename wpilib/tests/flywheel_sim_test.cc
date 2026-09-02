#include "flywheel_sim.h"

#include <catch2/catch_test_macros.hpp>
#include <catch2/matchers/catch_matchers_floating_point.hpp>
#include <cmath>
#include <vector>

#include "dc_motor.h"
#include "wpi/math/system/DCMotor.hpp"
#include "wpi/math/system/Models.hpp"

using Catch::Matchers::WithinAbs;

namespace {

// A 1x KrakenX60 on a 1.5:1 reduction spinning a 0.003 kg-m^2 wheel. The
// reduction is deliberately not 1.0 so the gearing factor in the reported
// motorRpm cannot pass by accident.
constexpr double kGearing = 1.5;
constexpr double kMoi = 0.003;
constexpr double kTargetRadPerSec = 300.0;

wpi::math::DCMotor TestMotor() { return wpi::math::DCMotor::KrakenX60(1); }

// Caller owns the returned pointer. Mirrors the helper in
// elevator_sim_test.cc.
DCMotorWasm* MakeMotorWasm(const wpi::math::DCMotor& motor, int numMotors) {
  return new DCMotorWasm(
      motor.nominalVoltage.to<double>(), motor.stallTorque.to<double>(),
      motor.stallCurrent.to<double>(), motor.freeCurrent.to<double>(),
      motor.freeSpeed.to<double>(), numMotors);
}

// The ideal (efficiency-free) plant, rebuilt in the test so expected values can
// be derived analytically instead of hardcoded.
auto IdealPlant(double moi = kMoi, double gearing = kGearing) {
  return wpi::math::Models::FlywheelFromPhysicalConstants(
      TestMotor(), wpi::units::kilogram_square_meter_t(moi), gearing);
}

// SimulateFlywheel leaves RoboRioSim's VIn wherever the battery model ended up,
// and FlywheelSim::SetInputVoltage clamps its argument to it. Reset before any
// test that drives a sim directly, so results never depend on the order the
// tests happen to run in.
void ResetSupplyVoltage() {
  wpi::sim::RoboRioSim::SetVInVoltage(wpi::units::volt_t{12.0});
}

// ---------------------------------------------------------------------------
// Parameters for SimulateFlywheel. Defaults describe a run that comfortably
// reaches its target: unconstrained current limits and a 0-ohm battery, so the
// closed-form assertions below are exact identities rather than approximations.
// ---------------------------------------------------------------------------
struct Params {
  double gearing = kGearing;
  double moiKgMSquared = kMoi;
  double targetAngularVelocityRadPerSec = kTargetRadPerSec;
  double statorLimitAmps = 1000.0;
  double supplyLimitAmps = 1000.0;
  double statorVoltageVolts = 12.0;
  double batteryResistanceOhms = 0.0;
  double batteryVoltageVolts = 12.0;
  double efficiency = 1.0;
  double simTimestep = 0.0005;
  int decimation = 1;
  double maxSimSeconds = 3.0;
  double batteryVoltageFilterTimeConstantSeconds = 0.1;
  double initialAngularVelocityRadPerSec = 0.0;
};

emscripten::val RunRaw(const Params& p) {
  DCMotorWasm* motor = MakeMotorWasm(TestMotor(), 1);
  emscripten::val result = SimulateFlywheel(
      motor, p.gearing, p.moiKgMSquared, p.targetAngularVelocityRadPerSec,
      p.statorLimitAmps, p.supplyLimitAmps, p.statorVoltageVolts,
      p.batteryResistanceOhms, p.batteryVoltageVolts, p.efficiency,
      p.simTimestep, p.decimation, p.maxSimSeconds,
      p.batteryVoltageFilterTimeConstantSeconds,
      p.initialAngularVelocityRadPerSec);
  delete motor;
  return result;
}

int Length(const emscripten::val& v) { return v["length"].as<int>(); }

std::vector<FlywheelSimStateInternal> ToRows(const emscripten::val& v) {
  std::vector<FlywheelSimStateInternal> rows;
  const int n = Length(v);
  rows.reserve(n);
  for (int i = 0; i < n; ++i) {
    const emscripten::val s = v[i];
    rows.push_back(
        {s["angularVelocityRadPerSec"].as<double>(),
         s["statorCurrentDrawAmps"].as<double>(),
         s["supplyCurrentDrawAmps"].as<double>(), s["timeSeconds"].as<double>(),
         s["batteryVoltageVolts"].as<double>(),
         s["motorAppliedVoltageVolts"].as<double>(), s["motorRpm"].as<double>(),
         s["energyJoules"].as<double>(), s["success"].as<bool>()});
  }
  return rows;
}

std::vector<FlywheelSimStateInternal> Simulate(const Params& p) {
  return ToRows(RunRaw(p));
}

// Converts a flywheel angular velocity to the reported motor shaft RPM.
double ToMotorRpm(double flywheelRadPerSec, double gearing = kGearing) {
  return flywheelRadPerSec * gearing * 60.0 / (2.0 * M_PI);
}

// Runs a flywheel at a fixed voltage long enough to reach steady state, and
// returns the terminal angular velocity. The plant's time constant is
// -1/A(0,0) ~ 0.12 s, so 10 s is ~84 time constants: the residual transient is
// far below the 1e-6 relative tolerance used below.
double SteadyStateVelocity(double efficiency, double voltage) {
  ResetSupplyVoltage();
  EfficiencyFlywheelSim sim(TestMotor(), kGearing,
                            wpi::units::kilogram_square_meter_t(kMoi),
                            efficiency);
  sim.SetInputVoltage(wpi::units::volt_t(voltage));
  for (int i = 0; i < 10000; ++i) {
    sim.Update(wpi::units::second_t(1e-3));
  }
  return sim.GetAngularVelocity().to<double>();
}

}  // namespace

// ============================================================================
// Harness
// ============================================================================

// RoboRio sim data is usable after EnsureHalInitialized (see hal_init.h).
// Production SimulateFlywheel calls the same helper. Without it, SetVInVoltage
// writes through a null SimRoboRioData into the Wasm null page.
TEST_CASE("FlywheelSimHarness: RoboRioVoltageIsReadableAfterHalInit",
          "[FlywheelSimHarness]") {
  wpi::sim::RoboRioSim::SetVInVoltage(wpi::units::volt_t{12.0});
  CHECK_THAT(wpi::RobotController::GetInputVoltage(), WithinAbs(12.0, 1e-9));
}

// ============================================================================
// EfficiencyFlywheelSim: efficiency
//
// Driven through the public FlywheelSim API rather than the protected UpdateX,
// so these test behavior rather than implementation.
// ============================================================================

// At steady state vdot = 0, so A00*v + efficiency*B00*u = 0, giving
// v_ss = -efficiency*B00*u/A00. Asserting the absolute value (not just a ratio)
// pins BOTH halves of the contract: efficiency multiplies B, and A is left
// alone. If efficiency were also applied to A it would cancel out here and the
// measured steady state would be the full-efficiency value.
TEST_CASE("EfficiencyFlywheel: SteadyStateMatchesEfficiencyScaledBOverA",
          "[EfficiencyFlywheel]") {
  const double efficiency = 0.5;
  const double voltage = 6.0;
  const auto plant = IdealPlant();
  const double expected =
      -efficiency * plant.B()(0, 0) * voltage / plant.A()(0, 0);

  CHECK_THAT(SteadyStateVelocity(efficiency, voltage),
             WithinAbs(expected, std::abs(expected) * 1e-6));
}

TEST_CASE("EfficiencyFlywheel: HalvingEfficiencyHalvesSteadyStateVelocity",
          "[EfficiencyFlywheel]") {
  const double full = SteadyStateVelocity(1.0, 6.0);
  REQUIRE(full > 0.0);
  CHECK_THAT(SteadyStateVelocity(0.5, 6.0) / full, WithinAbs(0.5, 1e-6));
}

TEST_CASE("EfficiencyFlywheel: LowerEfficiencyReducesInitialAcceleration",
          "[EfficiencyFlywheel]") {
  // From rest the back-EMF term is zero, so the first step isolates the motor
  // torque: v(dt) is proportional to efficiency.
  const double dt = 1e-4;
  ResetSupplyVoltage();
  EfficiencyFlywheelSim full(TestMotor(), kGearing,
                             wpi::units::kilogram_square_meter_t(kMoi), 1.0);
  EfficiencyFlywheelSim half(TestMotor(), kGearing,
                             wpi::units::kilogram_square_meter_t(kMoi), 0.5);
  full.SetInputVoltage(wpi::units::volt_t(6.0));
  half.SetInputVoltage(wpi::units::volt_t(6.0));
  full.Update(wpi::units::second_t(dt));
  half.Update(wpi::units::second_t(dt));

  CHECK_THAT(half.GetAngularVelocity().to<double>() /
                 full.GetAngularVelocity().to<double>(),
             WithinAbs(0.5, 1e-6));
}

// The direct statement that the A matrix is untouched. Coasting at zero input
// removes the B term entirely, so the decay over one step must be exp(A00*dt)
// regardless of the efficiency the sim was built with.
TEST_CASE("EfficiencyFlywheel: EfficiencyDoesNotChangeTheBackEmfDecay",
          "[EfficiencyFlywheel]") {
  const double dt = 1e-3;
  ResetSupplyVoltage();
  EfficiencyFlywheelSim sim(TestMotor(), kGearing,
                            wpi::units::kilogram_square_meter_t(kMoi), 0.5);
  sim.SetInputVoltage(wpi::units::volt_t(6.0));
  for (int i = 0; i < 2000; ++i) {
    sim.Update(wpi::units::second_t(1e-3));
  }
  const double before = sim.GetAngularVelocity().to<double>();
  REQUIRE(before > 0.0);

  sim.SetInputVoltage(wpi::units::volt_t(0.0));
  sim.Update(wpi::units::second_t(dt));

  CHECK_THAT(sim.GetAngularVelocity().to<double>() / before,
             WithinAbs(std::exp(IdealPlant().A()(0, 0) * dt), 1e-9));
}

// ============================================================================
// SimulateFlywheel: degenerate inputs
//
// Every degenerate input returns an empty array rather than throwing, hanging,
// or trapping, matching the contract already established by elevator_sim.h.
// ============================================================================

// DecimateToJsArray computes `i % decimation`. Integer modulo by zero is a wasm
// trap, not a C++ exception, so the try/catch in SimulateFlywheel cannot
// intercept it -- an unguarded 0 would abort the whole worker.
TEST_CASE("SimulateFlywheelGuards: ZeroDecimationReturnsEmpty",
          "[SimulateFlywheelGuards]") {
  Params p;
  p.decimation = 0;
  CHECK(Length(RunRaw(p)) == 0);
}

TEST_CASE("SimulateFlywheelGuards: NegativeDecimationReturnsEmpty",
          "[SimulateFlywheelGuards]") {
  Params p;
  p.decimation = -1;
  CHECK(Length(RunRaw(p)) == 0);
}

// A non-positive timestep never advances `timestamp`, so the maxSimSeconds
// break is unreachable, and Update(0s) never moves the state, so the target is
// never reached. That is an infinite loop, which no try/catch can recover from.
TEST_CASE("SimulateFlywheelGuards: ZeroSimTimestepReturnsEmpty",
          "[SimulateFlywheelGuards]") {
  Params p;
  p.simTimestep = 0.0;
  CHECK(Length(RunRaw(p)) == 0);
}

TEST_CASE("SimulateFlywheelGuards: NegativeSimTimestepReturnsEmpty",
          "[SimulateFlywheelGuards]") {
  Params p;
  p.simTimestep = -0.001;
  CHECK(Length(RunRaw(p)) == 0);
}

TEST_CASE("SimulateFlywheelGuards: ZeroMaxSimSecondsReturnsEmpty",
          "[SimulateFlywheelGuards]") {
  Params p;
  p.maxSimSeconds = 0.0;
  CHECK(Length(RunRaw(p)) == 0);
}

TEST_CASE("SimulateFlywheelGuards: NegativeMaxSimSecondsReturnsEmpty",
          "[SimulateFlywheelGuards]") {
  Params p;
  p.maxSimSeconds = -1.0;
  CHECK(Length(RunRaw(p)) == 0);
}

// Models::FlywheelFromPhysicalConstants throws std::domain_error for a
// non-positive gearing. Guarding avoids console spam from the optimizer grid.
TEST_CASE("SimulateFlywheelGuards: ZeroGearingReturnsEmpty",
          "[SimulateFlywheelGuards]") {
  Params p;
  p.gearing = 0.0;
  CHECK(Length(RunRaw(p)) == 0);
}

TEST_CASE("SimulateFlywheelGuards: NegativeGearingReturnsEmpty",
          "[SimulateFlywheelGuards]") {
  Params p;
  p.gearing = -2.0;
  CHECK(Length(RunRaw(p)) == 0);
}

// Same factory throws "J must be greater than zero."
TEST_CASE("SimulateFlywheelGuards: ZeroMomentOfInertiaReturnsEmpty",
          "[SimulateFlywheelGuards]") {
  Params p;
  p.moiKgMSquared = 0.0;
  CHECK(Length(RunRaw(p)) == 0);
}

TEST_CASE("SimulateFlywheelGuards: NegativeMomentOfInertiaReturnsEmpty",
          "[SimulateFlywheelGuards]") {
  Params p;
  p.moiKgMSquared = -0.001;
  CHECK(Length(RunRaw(p)) == 0);
}

// A zero-efficiency mechanism is physically inert: the (efficiency - 1) * B * u
// correction exactly cancels the motor torque, so the flywheel would otherwise
// spin for the full maxSimSeconds producing a flat, useless trace.
TEST_CASE("SimulateFlywheelGuards: ZeroEfficiencyReturnsEmpty",
          "[SimulateFlywheelGuards]") {
  Params p;
  p.efficiency = 0.0;
  CHECK(Length(RunRaw(p)) == 0);
}

TEST_CASE("SimulateFlywheelGuards: NegativeEfficiencyReturnsEmpty",
          "[SimulateFlywheelGuards]") {
  Params p;
  p.efficiency = -0.5;
  CHECK(Length(RunRaw(p)) == 0);
}

// ClampVoltageForCurrentLimits ends with std::clamp(x, -vSupply, vSupply).
// A negative supply voltage makes that lo > hi, which is undefined behavior.
TEST_CASE("SimulateFlywheelGuards: ZeroBatteryVoltageReturnsEmpty",
          "[SimulateFlywheelGuards]") {
  Params p;
  p.batteryVoltageVolts = 0.0;
  CHECK(Length(RunRaw(p)) == 0);
}

TEST_CASE("SimulateFlywheelGuards: NegativeBatteryVoltageReturnsEmpty",
          "[SimulateFlywheelGuards]") {
  Params p;
  p.batteryVoltageVolts = -12.0;
  CHECK(Length(RunRaw(p)) == 0);
}

// A non-positive target needs no guard: the `while (velocity < target)` loop
// exits before the first iteration. Pinned so nobody adds a redundant check.
TEST_CASE("SimulateFlywheelGuards: ZeroTargetReturnsEmptyWithoutAGuard",
          "[SimulateFlywheelGuards]") {
  Params p;
  p.targetAngularVelocityRadPerSec = 0.0;
  CHECK(Length(RunRaw(p)) == 0);
}

TEST_CASE("SimulateFlywheelGuards: NegativeTargetReturnsEmptyWithoutAGuard",
          "[SimulateFlywheelGuards]") {
  Params p;
  p.targetAngularVelocityRadPerSec = -50.0;
  CHECK(Length(RunRaw(p)) == 0);
}

// The public entry point must convert numerical failures into an empty array
// rather than letting an exception escape and abort the worker. This config
// passes every guard, keeping the try/catch path reachable.
TEST_CASE("SimulateFlywheelGuards: HostileButValidInputDoesNotThrow",
          "[SimulateFlywheelGuards]") {
  Params p;
  p.efficiency = 1e-12;
  p.maxSimSeconds = 0.05;
  emscripten::val result = emscripten::val::undefined();
  CHECK_NOTHROW(result = RunRaw(p));
  CHECK(Length(result) > 0);
}

// ============================================================================
// SimulateFlywheel: nominal trajectory
// ============================================================================

TEST_CASE("SimulateFlywheelTrajectory: ReachesTargetAndReportsSuccess",
          "[SimulateFlywheelTrajectory]") {
  const auto rows = Simulate(Params{});
  REQUIRE_FALSE(rows.empty());

  CHECK(rows.back().angularVelocityRadPerSec >= kTargetRadPerSec);
  CHECK(rows.back().success);
}

TEST_CASE("SimulateFlywheelTrajectory: SpinUpIsMonotonic",
          "[SimulateFlywheelTrajectory]") {
  const auto rows = Simulate(Params{});
  REQUIRE(rows.size() > 2u);

  for (size_t i = 1; i < rows.size(); ++i) {
    INFO("at row " << i);
    CHECK(rows[i].angularVelocityRadPerSec >
          rows[i - 1].angularVelocityRadPerSec);
  }
}

// The loop condition is evaluated BEFORE the first step, and SetState updates
// the output vector GetAngularVelocity reads. A flywheel already at or above
// its target therefore produces no rows at all.
TEST_CASE("SimulateFlywheelTrajectory: InitialVelocityAtTargetYieldsEmptyArray",
          "[SimulateFlywheelTrajectory]") {
  Params p;
  p.initialAngularVelocityRadPerSec = kTargetRadPerSec;
  CHECK(Length(RunRaw(p)) == 0);
}

TEST_CASE(
    "SimulateFlywheelTrajectory: InitialVelocityAboveTargetYieldsEmptyArray",
    "[SimulateFlywheelTrajectory]") {
  Params p;
  p.initialAngularVelocityRadPerSec = kTargetRadPerSec * 1.1;
  CHECK(Length(RunRaw(p)) == 0);
}

// A non-zero initial velocity seeds the plant state, so the very first recorded
// row is already spinning faster than the seed rather than starting from rest.
TEST_CASE("SimulateFlywheelTrajectory: InitialVelocitySeedsTheState",
          "[SimulateFlywheelTrajectory]") {
  Params p;
  p.initialAngularVelocityRadPerSec = kTargetRadPerSec / 2.0;
  const auto rows = Simulate(p);
  REQUIRE_FALSE(rows.empty());

  CHECK(rows.front().angularVelocityRadPerSec >
        p.initialAngularVelocityRadPerSec);
  // A single 0.5 ms step cannot move the wheel far, so the first row must still
  // sit next to the seed rather than near zero (unseeded) or near the target.
  CHECK(rows.front().angularVelocityRadPerSec <
        p.initialAngularVelocityRadPerSec * 1.05);
}

// success is only meaningful on the final element -- it is the one the
// simulation overwrites after the loop. Every earlier row keeps the `true` it
// was constructed with.
TEST_CASE(
    "SimulateFlywheelTrajectory: TruncatedRunReportsFailureOnTheLastRowOnly",
    "[SimulateFlywheelTrajectory]") {
  Params p;
  p.maxSimSeconds = 0.01;
  const auto rows = Simulate(p);
  REQUIRE(rows.size() > 1u);

  CHECK(rows.back().angularVelocityRadPerSec < kTargetRadPerSec);
  CHECK_FALSE(rows.back().success);
  for (size_t i = 0; i + 1 < rows.size(); ++i) {
    INFO("at row " << i);
    CHECK(rows[i].success);
  }
}

TEST_CASE("SimulateFlywheelTrajectory: StopsAtMaxSimSeconds",
          "[SimulateFlywheelTrajectory]") {
  Params p;
  p.maxSimSeconds = 0.01;
  const auto rows = Simulate(p);
  REQUIRE_FALSE(rows.empty());

  CHECK(rows.back().timeSeconds <= p.maxSimSeconds + p.simTimestep);
}

TEST_CASE("SimulateFlywheelTrajectory: TimeAdvancesByOneTimestepPerRow",
          "[SimulateFlywheelTrajectory]") {
  Params p;
  p.decimation = 1;
  const auto rows = Simulate(p);
  REQUIRE(rows.size() > 2u);

  CHECK_THAT(rows[0].timeSeconds, WithinAbs(p.simTimestep, 1e-12));
  for (size_t i = 1; i < rows.size(); ++i) {
    INFO("at row " << i);
    CHECK_THAT(rows[i].timeSeconds - rows[i - 1].timeSeconds,
               WithinAbs(p.simTimestep, 1e-9));
  }
}

TEST_CASE("SimulateFlywheelTrajectory: AppliedVoltageIsPositiveThroughout",
          "[SimulateFlywheelTrajectory]") {
  const auto rows = Simulate(Params{});
  REQUIRE_FALSE(rows.empty());

  for (size_t i = 0; i < rows.size(); ++i) {
    INFO("at row " << i);
    CHECK(rows[i].motorAppliedVoltageVolts > 0.0);
  }
}

// ============================================================================
// SimulateFlywheel: post-step row coherence
//
// A row is pushed after `timestamp += simTimestep`, so every field in it must
// describe the mechanism at that timestamp. motorRpm is therefore derived from
// the velocity AFTER the step, not the one read before it. (The pre-step shaft
// speed is still used for the back-EMF term feeding the voltage clamp, which is
// correct -- that clamp must act on the state at the start of the step.)
// ============================================================================

TEST_CASE("SimulateFlywheelCoherence: MotorRpmMatchesVelocityInTheSameRow",
          "[SimulateFlywheelCoherence]") {
  Params p;
  p.decimation = 1;
  const auto rows = Simulate(p);
  REQUIRE(rows.size() > 2u);

  for (size_t i = 0; i < rows.size(); ++i) {
    INFO("at row " << i);
    CHECK_THAT(
        rows[i].motorRpm,
        WithinAbs(ToMotorRpm(rows[i].angularVelocityRadPerSec, p.gearing),
                  1e-9));
  }
}

// The first row is recorded after a step has already been integrated, so the
// flywheel is turning and the reported RPM must be non-zero.
TEST_CASE("SimulateFlywheelCoherence: FirstRowReportsNonZeroRpm",
          "[SimulateFlywheelCoherence]") {
  Params p;
  p.decimation = 1;
  const auto rows = Simulate(p);
  REQUIRE_FALSE(rows.empty());

  CHECK(rows.front().angularVelocityRadPerSec > 0.0);
  CHECK(rows.front().motorRpm > 0.0);
}

// Decimation must not break the identity: it selects whole rows, so each
// surviving row stays internally consistent.
TEST_CASE("SimulateFlywheelCoherence: MotorRpmStaysConsistentUnderDecimation",
          "[SimulateFlywheelCoherence]") {
  Params p;
  p.decimation = 10;
  const auto rows = Simulate(p);
  REQUIRE(rows.size() > 2u);

  for (size_t i = 0; i < rows.size(); ++i) {
    INFO("at row " << i);
    CHECK_THAT(
        rows[i].motorRpm,
        WithinAbs(ToMotorRpm(rows[i].angularVelocityRadPerSec, p.gearing),
                  1e-9));
  }
}

// ============================================================================
// SimulateFlywheel: decimation
// ============================================================================

TEST_CASE("SimulateFlywheelDecimation: EmitsEveryNthRowPlusTheLast",
          "[SimulateFlywheelDecimation]") {
  Params full;
  full.decimation = 1;
  Params decimated;
  decimated.decimation = 10;

  const auto fullRows = Simulate(full);
  const auto decimatedRows = Simulate(decimated);
  REQUIRE(fullRows.size() > 10u);

  const size_t n = fullRows.size();
  const size_t expected = (n - 1) / 10 + 1 + ((n - 1) % 10 == 0 ? 0 : 1);
  CHECK(decimatedRows.size() == expected);

  // The final raw sample is always included, even off a decimation boundary.
  CHECK_THAT(decimatedRows.back().timeSeconds,
             WithinAbs(fullRows.back().timeSeconds, 1e-12));
  CHECK_THAT(decimatedRows.front().timeSeconds,
             WithinAbs(fullRows.front().timeSeconds, 1e-12));
}

// ============================================================================
// SimulateFlywheel: current limiting
// ============================================================================

namespace {
// The voltage clamp is computed from the velocity at the START of a timestep,
// but GetCurrentDraw() reports current from the velocity AFTER the step. That
// one-step lag lets the reported current overshoot the limit slightly, so these
// assertions allow a small margin rather than demanding an exact bound.
constexpr double kCurrentLimitMargin = 1.05;
}  // namespace

TEST_CASE("SimulateFlywheelCurrentLimits: StatorCurrentStaysWithinLimit",
          "[SimulateFlywheelCurrentLimits]") {
  Params p;
  p.statorLimitAmps = 40.0;
  p.supplyLimitAmps = 1000.0;
  const auto rows = Simulate(p);
  REQUIRE_FALSE(rows.empty());

  for (size_t i = 0; i < rows.size(); ++i) {
    INFO("at row " << i);
    CHECK(std::abs(rows[i].statorCurrentDrawAmps) <=
          p.statorLimitAmps * kCurrentLimitMargin);
  }
}

TEST_CASE("SimulateFlywheelCurrentLimits: SupplyCurrentStaysWithinLimit",
          "[SimulateFlywheelCurrentLimits]") {
  Params p;
  p.statorLimitAmps = 1000.0;
  p.supplyLimitAmps = 30.0;
  const auto rows = Simulate(p);
  REQUIRE_FALSE(rows.empty());

  for (size_t i = 0; i < rows.size(); ++i) {
    INFO("at row " << i);
    CHECK(std::abs(rows[i].supplyCurrentDrawAmps) <=
          p.supplyLimitAmps * kCurrentLimitMargin);
  }
}

TEST_CASE("SimulateFlywheelCurrentLimits: AppliedVoltageNeverExceedsSupply",
          "[SimulateFlywheelCurrentLimits]") {
  Params p;
  const auto rows = Simulate(p);
  REQUIRE_FALSE(rows.empty());

  for (size_t i = 0; i < rows.size(); ++i) {
    INFO("at row " << i);
    CHECK(std::abs(rows[i].motorAppliedVoltageVolts) <=
          p.batteryVoltageVolts + 1e-9);
  }
}

// A tighter stator limit caps the available torque, so the same flywheel must
// take strictly longer to reach the same target.
TEST_CASE("SimulateFlywheelCurrentLimits: TighterStatorLimitSlowsSpinUp",
          "[SimulateFlywheelCurrentLimits]") {
  Params loose;
  Params tight;
  tight.statorLimitAmps = 20.0;

  const auto looseRows = Simulate(loose);
  const auto tightRows = Simulate(tight);
  REQUIRE_FALSE(looseRows.empty());
  REQUIRE_FALSE(tightRows.empty());
  REQUIRE(tightRows.back().success);

  CHECK(tightRows.back().timeSeconds > looseRows.back().timeSeconds);
}

// ============================================================================
// SimulateFlywheel: battery model
// ============================================================================

TEST_CASE("SimulateFlywheelBattery: StiffBatteryHoldsNominalVoltage",
          "[SimulateFlywheelBattery]") {
  Params p;
  p.batteryResistanceOhms = 0.0;
  const auto rows = Simulate(p);
  REQUIRE_FALSE(rows.empty());

  for (size_t i = 0; i < rows.size(); ++i) {
    INFO("at row " << i);
    CHECK_THAT(rows[i].batteryVoltageVolts,
               WithinAbs(p.batteryVoltageVolts, 1e-9));
  }
}

TEST_CASE("SimulateFlywheelBattery: RealBatterySagsUnderLoadButStaysPositive",
          "[SimulateFlywheelBattery]") {
  Params p;
  p.batteryResistanceOhms = 0.015;
  p.statorLimitAmps = 60.0;
  const auto rows = Simulate(p);
  REQUIRE(rows.size() > 1u);

  double minVoltage = p.batteryVoltageVolts;
  for (const auto& row : rows) {
    minVoltage = std::min(minVoltage, row.batteryVoltageVolts);
    CHECK(row.batteryVoltageVolts > 0.0);
    CHECK(row.batteryVoltageVolts <= p.batteryVoltageVolts + 1e-9);
  }
  CHECK(minVoltage < p.batteryVoltageVolts);
}

// The single-pole IIR filter is seeded at the nominal voltage, so the first
// sample must still be close to nominal even though the load is already
// applied. Without the filter reset the first sample would jump straight to the
// loaded voltage.
TEST_CASE("SimulateFlywheelBattery: FilterIsSeededAtNominalVoltage",
          "[SimulateFlywheelBattery]") {
  Params p;
  p.batteryResistanceOhms = 0.015;
  p.statorLimitAmps = 60.0;
  p.batteryVoltageFilterTimeConstantSeconds = 0.1;
  const auto rows = Simulate(p);
  REQUIRE(rows.size() > 1u);

  CHECK_THAT(rows.front().batteryVoltageVolts,
             WithinAbs(p.batteryVoltageVolts, 0.5));
  CHECK(rows.back().batteryVoltageVolts < rows.front().batteryVoltageVolts);
}

// ============================================================================
// SimulateFlywheel: energy accounting
// ============================================================================

// energyJoules is the running integral of supply power. With a 0-ohm battery
// the supply voltage is pinned at nominal for every step, so the per-step
// increment is an exact identity rather than an approximation. This pins the
// accumulator to the supply side (not the stator side) and to the correct
// timestep.
TEST_CASE("SimulateFlywheelEnergy: IsTheCumulativeIntegralOfSupplyPower",
          "[SimulateFlywheelEnergy]") {
  Params p;
  p.batteryResistanceOhms = 0.0;
  p.decimation = 1;
  const auto rows = Simulate(p);
  REQUIRE(rows.size() > 1u);

  const double firstExpected = rows.front().supplyCurrentDrawAmps *
                               p.batteryVoltageVolts * p.simTimestep;
  CHECK_THAT(rows.front().energyJoules,
             WithinAbs(firstExpected, std::abs(firstExpected) * 1e-9));

  for (size_t i = 1; i < rows.size(); ++i) {
    INFO("at row " << i);
    const double expected =
        rows[i].supplyCurrentDrawAmps * p.batteryVoltageVolts * p.simTimestep;
    CHECK_THAT(rows[i].energyJoules - rows[i - 1].energyJoules,
               WithinAbs(expected, std::abs(expected) * 1e-9 + 1e-12));
  }
}

TEST_CASE("SimulateFlywheelEnergy: NetEnergyIsPositiveDuringSpinUp",
          "[SimulateFlywheelEnergy]") {
  const auto rows = Simulate(Params{});
  REQUIRE_FALSE(rows.empty());

  CHECK(rows.back().energyJoules > 0.0);
}

// A flywheel spin-up never decelerates, so it never regenerates. Energy must
// increase on every step -- the counterpoint to the elevator suite's
// RegenerationCreditsEnergyBack case.
TEST_CASE("SimulateFlywheelEnergy: EnergyIsMonotonicWhenNeverRegenerating",
          "[SimulateFlywheelEnergy]") {
  Params p;
  p.decimation = 1;
  const auto rows = Simulate(p);
  REQUIRE(rows.size() > 1u);

  for (size_t i = 1; i < rows.size(); ++i) {
    INFO("at row " << i);
    CHECK(rows[i].energyJoules >= rows[i - 1].energyJoules);
    CHECK(rows[i].supplyCurrentDrawAmps > 0.0);
  }
}

#include "elevator_sim.h"

#include <catch2/catch_test_macros.hpp>
#include <catch2/generators/catch_generators.hpp>
#include <catch2/matchers/catch_matchers_floating_point.hpp>
#include <cmath>
#include <vector>

#include "dc_motor.h"
#include "wpi/math/system/DCMotor.hpp"
#include "wpi/math/system/Models.hpp"

using Catch::Matchers::WithinAbs;
using Catch::Matchers::WithinULP;

namespace {

constexpr double kGravity = kGravityMetersPerSecondSquared;

// Physical configuration shared by most tests: a 1x KrakenX60 on a 2:1
// reduction driving a 2in spool, lifting 10lb over 40in. These mirror the
// values used by the TypeScript integration test in
// app/lib/math/linear.worker.test.ts so the two layers stay comparable.
constexpr double kGearing = 2.0;
constexpr double kLoadKg = 4.5359237;          // 10 lb
constexpr double kSpoolRadiusMeters = 0.0254;  // 1 in
constexpr double kTravelMeters = 1.016;        // 40 in

// SimulateElevatorImpl marks a run successful when the final position lands
// within 3 inches of the goal. Converting through meter_t is required: calling
// .to<double>() on an inch_t returns inches.
const double kSuccessThresholdMeters =
    wpi::units::meter_t{wpi::units::inch_t{3.0}}.to<double>();

wpi::math::DCMotor TestMotor() { return wpi::math::DCMotor::KrakenX60(1); }

// Caller owns the returned pointer. Mirrors the helper in
// feedforward_gains_test.cc.
DCMotorWasm* MakeMotorWasm(const wpi::math::DCMotor& motor, int numMotors) {
  return new DCMotorWasm(
      motor.nominalVoltage.to<double>(), motor.stallTorque.to<double>(),
      motor.stallCurrent.to<double>(), motor.freeCurrent.to<double>(),
      motor.freeSpeed.to<double>(), numMotors);
}

// The ideal (efficiency-free) plant, rebuilt in the test so expected values can
// be derived analytically instead of hardcoded.
auto IdealPlant(double loadKg = kLoadKg,
                double spoolRadiusMeters = kSpoolRadiusMeters,
                double gearing = kGearing) {
  return wpi::math::Models::ElevatorFromPhysicalConstants(
      TestMotor(), wpi::units::kilogram_t(loadKg),
      wpi::units::meter_t(spoolRadiusMeters), gearing);
}

// ---------------------------------------------------------------------------
// Parameters for SimulateElevator. Defaults describe a run that comfortably
// reaches its goal: unconstrained current limits and a 0-ohm battery, so the
// feedforward-derived profile is followable without voltage sag (same reasoning
// as the TypeScript test).
// ---------------------------------------------------------------------------
struct Params {
  double gearing = kGearing;
  double loadKg = kLoadKg;
  double spoolRadiusMeters = kSpoolRadiusMeters;
  double travelDistanceMeters = kTravelMeters;
  double statorLimitAmps = 1000.0;
  double supplyLimitAmps = 1000.0;
  double batteryResistanceOhms = 0.0;
  double batteryVoltageVolts = 12.0;
  double simTimestep = 0.001;
  int decimation = 1;
  double maxSimSeconds = 3.0;
  double angleRadians = M_PI / 2.0;
  double efficiency = 1.0;
  bool cascade = false;
  double batteryVoltageFilterTimeConstantSeconds = 0.1;
  double maxVelocityMPS = 0.0;       // 0 => derive from feedforward
  double maxAccelerationMPS2 = 0.0;  // 0 => derive from feedforward
  double qPositionMeters = 0.1;
  double qVelocityMPS = 0.1;
  double rVolts = 12.0;
  double sensorDelaySeconds = 0.001;
  double kalmanFilterPositionStdDev = 0.0508;          // 2 in
  double kalmanFilterVelocityStdDev = 1.016;           // 40 in/s
  double kalmanFilterEncoderPositionStdDev = 2.54e-5;  // 0.001 in
};

// Splits the available voltage budget evenly between the velocity and
// acceleration terms, so feedforward at (vMax, aMax) equals exactly the battery
// voltage. Without this the profile would demand more voltage than the battery
// can supply and the elevator would fall behind. Mirrors makeFeedforward() in
// app/lib/math/linear.worker.test.ts.
void DeriveConstraints(Params& p) {
  const auto plant = IdealPlant(p.loadKg, p.spoolRadiusMeters, p.gearing);
  const double kVGain = -plant.A()(1, 1) / plant.B()(1, 0) / p.efficiency;
  const double kAGain = 1.0 / plant.B()(1, 0) / p.efficiency;
  const double kGGain = kAGain * kGravity * std::sin(p.angleRadians);
  const double vAvailable = std::max(0.0, p.batteryVoltageVolts - kGGain);
  if (p.maxVelocityMPS == 0.0) {
    p.maxVelocityMPS = vAvailable / (2.0 * kVGain);
  }
  if (p.maxAccelerationMPS2 == 0.0) {
    p.maxAccelerationMPS2 = vAvailable / (2.0 * kAGain);
  }
}

emscripten::val RunRaw(const Params& p) {
  DCMotorWasm* motor = MakeMotorWasm(TestMotor(), 1);
  emscripten::val result = SimulateElevator(
      motor, p.gearing, p.loadKg, p.spoolRadiusMeters, p.travelDistanceMeters,
      p.statorLimitAmps, p.supplyLimitAmps, p.batteryResistanceOhms,
      p.batteryVoltageVolts, p.simTimestep, p.decimation, p.maxSimSeconds,
      p.angleRadians, p.efficiency, p.cascade,
      p.batteryVoltageFilterTimeConstantSeconds, p.maxVelocityMPS,
      p.maxAccelerationMPS2, p.qPositionMeters, p.qVelocityMPS, p.rVolts,
      p.sensorDelaySeconds, p.kalmanFilterPositionStdDev,
      p.kalmanFilterVelocityStdDev, p.kalmanFilterEncoderPositionStdDev);
  delete motor;
  return result;
}

int Length(const emscripten::val& v) { return v["length"].as<int>(); }

std::vector<ElevatorSimStateInternal> ToRows(const emscripten::val& v) {
  std::vector<ElevatorSimStateInternal> rows;
  const int n = Length(v);
  rows.reserve(n);
  for (int i = 0; i < n; ++i) {
    const emscripten::val s = v[i];
    rows.push_back(
        {s["positionMeters"].as<double>(),
         s["velocityMetersPerSecond"].as<double>(),
         s["statorCurrentDrawAmps"].as<double>(),
         s["supplyCurrentDrawAmps"].as<double>(), s["timeSeconds"].as<double>(),
         s["batteryVoltageVolts"].as<double>(),
         s["motorAppliedVoltageVolts"].as<double>(), s["motorRpm"].as<double>(),
         s["energyJoules"].as<double>(), s["success"].as<bool>()});
  }
  return rows;
}

// Convenience: derive constraints, run, and decode in one step.
std::vector<ElevatorSimStateInternal> Simulate(Params p) {
  DeriveConstraints(p);
  return ToRows(RunRaw(p));
}

}  // namespace

// ============================================================================
// Harness
// ============================================================================

// RoboRio sim data is usable after EnsureHalInitialized (see
// hal_init_listener.cc). Production SimulateElevator calls the same helper.
// Without it,
// SetVInVoltage writes through a null SimRoboRioData into the Wasm null page.
TEST_CASE("ElevatorSimHarness: RoboRioVoltageIsReadableAfterHalInit",
          "[ElevatorSimHarness]") {
  wpi::sim::RoboRioSim::SetVInVoltage(wpi::units::volt_t{12.0});
  CHECK_THAT(wpi::RobotController::GetInputVoltage(), WithinAbs(12.0, 1e-9));
}

// ============================================================================
// AngledElevatorSim: gravity
//
// Driven through the public ElevatorSim API (SetInputVoltage / Update /
// GetVelocity) rather than the protected UpdateX, so these test behavior
// rather than implementation.
// ============================================================================

namespace {
// Free-falls an unpowered elevator for one timestep starting from rest at
// mid-travel (so neither height limit clamps the result) and returns the
// resulting velocity.
double UnpoweredVelocityAfterOneStep(double angleRadians, double dt) {
  AngledElevatorSim sim(TestMotor(), kGearing, wpi::units::kilogram_t(kLoadKg),
                        wpi::units::meter_t(kSpoolRadiusMeters), 0.0, 2.0, 1.0,
                        angleRadians, 1.0);
  sim.SetInputVoltage(wpi::units::volt_t(0.0));
  sim.Update(wpi::units::second_t(dt));
  return sim.GetVelocity().to<double>();
}
}  // namespace

TEST_CASE("AngledElevatorGravity: HorizontalHasNoGravityComponent",
          "[AngledElevatorGravity]") {
  // sin(0) = 0, so an unpowered horizontal elevator must not accelerate at all.
  CHECK_THAT(UnpoweredVelocityAfterOneStep(0.0, 1e-3), WithinULP(0.0, 4));
}

TEST_CASE("AngledElevatorGravity: VerticalFallsAtFullGravity",
          "[AngledElevatorGravity]") {
  // Closed-form solution of vdot = A11*v - g with v(0) = 0:
  //   v(t) = (-g / A11) * (exp(A11*t) - 1)
  const double dt = 1e-3;
  const double a11 = IdealPlant().A()(1, 1);
  const double expected = (-kGravity / a11) * (std::exp(a11 * dt) - 1.0);

  CHECK_THAT(UnpoweredVelocityAfterOneStep(M_PI / 2.0, dt),
             WithinAbs(expected, std::abs(expected) * 1e-6));
}

// Gravity must scale with sin(angle), not cos(angle) and not a constant. The
// ODE is linear and the angle enters only through the constant gravity term, so
// v(theta)/v(pi/2) is exactly sin(theta) regardless of the timestep. This ratio
// form makes the test independent of the integrator's local truncation error.
TEST_CASE("GravityAngleScalingTest: VelocityRatioTracksSineOfAngle",
          "[GravityAngleScalingTest]") {
  const double angle =
      GENERATE(0.0, M_PI / 6.0, M_PI / 4.0, M_PI / 3.0, M_PI / 2.0);
  CAPTURE(angle);
  const double dt = 1e-3;
  const double vertical = UnpoweredVelocityAfterOneStep(M_PI / 2.0, dt);
  INFO("vertical elevator must fall");
  REQUIRE(vertical < 0.0);

  CHECK_THAT(UnpoweredVelocityAfterOneStep(angle, dt) / vertical,
             WithinAbs(std::sin(angle), 1e-9));
}

// ============================================================================
// AngledElevatorSim: efficiency
// ============================================================================

namespace {
// Runs a horizontal (gravity-free) elevator at a fixed voltage long enough to
// reach steady state, and returns the terminal velocity. Height limits are set
// far away so the carriage never clamps.
double SteadyStateVelocity(double efficiency, double voltage) {
  AngledElevatorSim sim(TestMotor(), kGearing, wpi::units::kilogram_t(kLoadKg),
                        wpi::units::meter_t(kSpoolRadiusMeters), -1000.0,
                        1000.0, 0.0, 0.0, efficiency);
  sim.SetInputVoltage(wpi::units::volt_t(voltage));
  for (int i = 0; i < 2000; ++i) {
    sim.Update(wpi::units::second_t(1e-3));
  }
  return sim.GetVelocity().to<double>();
}
}  // namespace

// Efficiency models a lossy gearbox: the delivered output torque is
// efficiency * Kt * I, with I = (u - backEmf) / R. Scaling the whole
// motor-side row by efficiency therefore scales A and B alike, and the two
// cancel at steady state -- top speed is a property of the back-EMF balance,
// not of the gearbox losses. This test and
// LowerEfficiencyReducesInitialAcceleration below are a pair: this one pins
// that efficiency cancels at steady state, that one pins that efficiency is
// applied at all.
TEST_CASE("AngledElevatorEfficiency: SteadyStateIsIndependentOfEfficiency",
          "[AngledElevatorEfficiency]") {
  const double voltage = 6.0;
  const auto plant = IdealPlant();
  const double expected = -plant.B()(1, 0) * voltage / plant.A()(1, 1);

  CHECK_THAT(SteadyStateVelocity(0.5, voltage),
             WithinAbs(expected, std::abs(expected) * 1e-6));
}

TEST_CASE(
    "AngledElevatorEfficiency: HalvingEfficiencyLeavesSteadyStateVelocity",
    "[AngledElevatorEfficiency]") {
  const double full = SteadyStateVelocity(1.0, 6.0);
  REQUIRE(full > 0.0);
  CHECK_THAT(SteadyStateVelocity(0.5, 6.0) / full, WithinAbs(1.0, 1e-6));
}

TEST_CASE("AngledElevatorEfficiency: LowerEfficiencyReducesInitialAcceleration",
          "[AngledElevatorEfficiency]") {
  // From rest the back-EMF term is zero, so the first step isolates the motor
  // force: v(dt) is proportional to efficiency. The integrator's intermediate
  // stages do see a nonzero velocity, and that back-EMF is itself scaled by
  // efficiency, leaving an O(dt * |A11|) residual on the ratio -- hence the
  // small dt and the relative rather than exact tolerance.
  const double dt = 1e-6;
  AngledElevatorSim full(TestMotor(), kGearing, wpi::units::kilogram_t(kLoadKg),
                         wpi::units::meter_t(kSpoolRadiusMeters), -10.0, 10.0,
                         0.0, 0.0, 1.0);
  AngledElevatorSim half(TestMotor(), kGearing, wpi::units::kilogram_t(kLoadKg),
                         wpi::units::meter_t(kSpoolRadiusMeters), -10.0, 10.0,
                         0.0, 0.0, 0.5);
  full.SetInputVoltage(wpi::units::volt_t(6.0));
  half.SetInputVoltage(wpi::units::volt_t(6.0));
  full.Update(wpi::units::second_t(dt));
  half.Update(wpi::units::second_t(dt));

  CHECK_THAT(half.GetVelocity().to<double>() / full.GetVelocity().to<double>(),
             WithinAbs(0.5, 1e-3));
}

// The other half of the contract: efficiency multiplies A as well as B, so
// coasting to a stop at u = 0 is slowed by exactly the same factor. Without
// the A scaling the decay would be efficiency-invariant and the steady-state
// test above would pass for the wrong reason. Coasting removes the B term
// entirely, leaving the exact solution v(dt) = v0 * exp(efficiency*A11*dt).
TEST_CASE("AngledElevatorEfficiency: EfficiencyScalesTheBackEmfDecay",
          "[AngledElevatorEfficiency]") {
  const double dt = 1e-3;
  const double v0 = 1.0;
  const double a11 = IdealPlant().A()(1, 1);

  auto decayRatio = [&](double efficiency) {
    AngledElevatorSim sim(TestMotor(), kGearing,
                          wpi::units::kilogram_t(kLoadKg),
                          wpi::units::meter_t(kSpoolRadiusMeters), -10.0, 10.0,
                          0.0, 0.0, efficiency);
    sim.SetState(wpi::math::Vectord<2>{0.0, v0});
    sim.SetInputVoltage(wpi::units::volt_t(0.0));
    sim.Update(wpi::units::second_t(dt));
    return sim.GetVelocity().to<double>() / v0;
  };

  CHECK_THAT(decayRatio(1.0), WithinAbs(std::exp(a11 * dt), 1e-9));
  CHECK_THAT(decayRatio(0.5), WithinAbs(std::exp(0.5 * a11 * dt), 1e-9));
}

// ============================================================================
// AngledElevatorSim: travel limits
// ============================================================================

TEST_CASE("AngledElevatorLimits: LowerLimitPinsPositionAndZeroesVelocity",
          "[AngledElevatorLimits]") {
  // Start just above the floor and let gravity pull the carriage through it.
  AngledElevatorSim sim(TestMotor(), kGearing, wpi::units::kilogram_t(kLoadKg),
                        wpi::units::meter_t(kSpoolRadiusMeters), 0.0, 2.0, 5e-4,
                        M_PI / 2.0, 1.0);
  sim.SetInputVoltage(wpi::units::volt_t(0.0));
  for (int i = 0; i < 50; ++i) {
    sim.Update(wpi::units::second_t(1e-3));
  }

  CHECK_THAT(sim.GetPosition().to<double>(), WithinULP(0.0, 4));
  CHECK_THAT(sim.GetVelocity().to<double>(), WithinULP(0.0, 4));
}

TEST_CASE("AngledElevatorLimits: UpperLimitPinsPositionAndZeroesVelocity",
          "[AngledElevatorLimits]") {
  // Start just below the ceiling and drive hard into it.
  AngledElevatorSim sim(TestMotor(), kGearing, wpi::units::kilogram_t(kLoadKg),
                        wpi::units::meter_t(kSpoolRadiusMeters), 0.0, 2.0,
                        1.9995, M_PI / 2.0, 1.0);
  sim.SetInputVoltage(wpi::units::volt_t(12.0));
  for (int i = 0; i < 50; ++i) {
    sim.Update(wpi::units::second_t(1e-3));
  }

  CHECK_THAT(sim.GetPosition().to<double>(), WithinULP(2.0, 4));
  CHECK_THAT(sim.GetVelocity().to<double>(), WithinULP(0.0, 4));
}

// ============================================================================
// SimulateElevator: degenerate inputs
//
// Every degenerate input returns an empty array rather than throwing or
// emitting inf/NaN rows, matching the contract already established by
// feedforward_gains.h.
// ============================================================================

TEST_CASE("SimulateElevatorGuards: ZeroMaxVelocityReturnsEmpty",
          "[SimulateElevatorGuards]") {
  Params p;
  DeriveConstraints(p);
  p.maxVelocityMPS = 0.0;
  CHECK(Length(RunRaw(p)) == 0);
}

TEST_CASE("SimulateElevatorGuards: NegativeMaxVelocityReturnsEmpty",
          "[SimulateElevatorGuards]") {
  Params p;
  DeriveConstraints(p);
  p.maxVelocityMPS = -1.0;
  CHECK(Length(RunRaw(p)) == 0);
}

TEST_CASE("SimulateElevatorGuards: ZeroMaxAccelerationReturnsEmpty",
          "[SimulateElevatorGuards]") {
  Params p;
  DeriveConstraints(p);
  p.maxAccelerationMPS2 = 0.0;
  CHECK(Length(RunRaw(p)) == 0);
}

TEST_CASE("SimulateElevatorGuards: NegativeMaxAccelerationReturnsEmpty",
          "[SimulateElevatorGuards]") {
  Params p;
  DeriveConstraints(p);
  p.maxAccelerationMPS2 = -1.0;
  CHECK(Length(RunRaw(p)) == 0);
}

// A zero spool radius divides by zero when converting carriage velocity to
// motor shaft speed, producing inf/NaN rows instead of a clean empty result.
TEST_CASE("SimulateElevatorGuards: ZeroSpoolRadiusReturnsEmpty",
          "[SimulateElevatorGuards]") {
  Params p;
  DeriveConstraints(p);
  p.spoolRadiusMeters = 0.0;
  CHECK(Length(RunRaw(p)) == 0);
}

TEST_CASE("SimulateElevatorGuards: NegativeSpoolRadiusReturnsEmpty",
          "[SimulateElevatorGuards]") {
  Params p;
  DeriveConstraints(p);
  p.spoolRadiusMeters = -0.01;
  CHECK(Length(RunRaw(p)) == 0);
}

// A zero efficiency divides by zero when deriving kG from kA.
TEST_CASE("SimulateElevatorGuards: ZeroEfficiencyReturnsEmpty",
          "[SimulateElevatorGuards]") {
  Params p;
  DeriveConstraints(p);
  p.efficiency = 0.0;
  CHECK(Length(RunRaw(p)) == 0);
}

TEST_CASE("SimulateElevatorGuards: NegativeEfficiencyReturnsEmpty",
          "[SimulateElevatorGuards]") {
  Params p;
  DeriveConstraints(p);
  p.efficiency = -0.5;
  CHECK(Length(RunRaw(p)) == 0);
}

TEST_CASE("SimulateElevatorGuards: ZeroGearingReturnsEmpty",
          "[SimulateElevatorGuards]") {
  Params p;
  DeriveConstraints(p);
  p.gearing = 0.0;
  CHECK(Length(RunRaw(p)) == 0);
}

// The public entry point must convert numerical failures into an empty array
// with a console warning rather than letting the exception escape and abort the
// worker. A non-positive load makes Models::ElevatorFromPhysicalConstants throw
// std::domain_error, and it deliberately survives the guards above so this path
// stays reachable.
TEST_CASE("SimulateElevatorGuards: SolverFailureReturnsEmptyInsteadOfThrowing",
          "[SimulateElevatorGuards]") {
  Params p;
  DeriveConstraints(p);
  p.loadKg = 0.0;
  emscripten::val result = emscripten::val::undefined();
  CHECK_NOTHROW(result = RunRaw(p));
  CHECK(Length(result) == 0);
}

// DecimateToJsArray computes `i % decimation`. Integer modulo by zero is a wasm
// trap, not a C++ exception, so the try/catch in SimulateElevator cannot
// intercept it -- an unguarded 0 would abort the whole worker.
TEST_CASE("SimulateElevatorGuards: ZeroDecimationReturnsEmpty",
          "[SimulateElevatorGuards]") {
  Params p;
  DeriveConstraints(p);
  p.decimation = 0;
  CHECK(Length(RunRaw(p)) == 0);
}

TEST_CASE("SimulateElevatorGuards: NegativeDecimationReturnsEmpty",
          "[SimulateElevatorGuards]") {
  Params p;
  DeriveConstraints(p);
  p.decimation = -1;
  CHECK(Length(RunRaw(p)) == 0);
}

// ============================================================================
// SimulateElevator: nominal trajectory
// ============================================================================

TEST_CASE("SimulateElevatorTrajectory: ReachesGoalAndReportsSuccess",
          "[SimulateElevatorTrajectory]") {
  const auto rows = Simulate(Params{});
  REQUIRE_FALSE(rows.empty());

  CHECK(std::abs(rows.back().positionMeters - kTravelMeters) <
        kSuccessThresholdMeters);
  CHECK(rows.back().success);
}

// success is only meaningful on the final element -- it is the one the
// simulation overwrites after the loop. A run truncated long before the goal
// must report failure.
TEST_CASE("SimulateElevatorTrajectory: TruncatedRunReportsFailure",
          "[SimulateElevatorTrajectory]") {
  Params p;
  p.maxSimSeconds = 0.01;
  const auto rows = Simulate(p);
  REQUIRE_FALSE(rows.empty());

  CHECK(std::abs(rows.back().positionMeters - kTravelMeters) >
        kSuccessThresholdMeters);
  CHECK_FALSE(rows.back().success);
}

TEST_CASE("SimulateElevatorTrajectory: StopsAtMaxSimSeconds",
          "[SimulateElevatorTrajectory]") {
  Params p;
  p.maxSimSeconds = 0.01;
  const auto rows = Simulate(p);
  REQUIRE_FALSE(rows.empty());

  CHECK(rows.back().timeSeconds <= p.maxSimSeconds + p.simTimestep);
}

TEST_CASE("SimulateElevatorTrajectory: TimeAdvancesByOneTimestepPerRow",
          "[SimulateElevatorTrajectory]") {
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

TEST_CASE("SimulateElevatorTrajectory: VelocityProfileRisesThenFalls",
          "[SimulateElevatorTrajectory]") {
  const auto rows = Simulate(Params{});
  REQUIRE(rows.size() > 2u);

  size_t peak = 0;
  for (size_t i = 1; i < rows.size(); ++i) {
    if (rows[i].velocityMetersPerSecond > rows[peak].velocityMetersPerSecond) {
      peak = i;
    }
  }

  CHECK(peak > 0u);
  CHECK(peak < rows.size() - 1);
  CHECK(rows[peak].velocityMetersPerSecond >
        rows.front().velocityMetersPerSecond);
  CHECK(rows[peak].velocityMetersPerSecond >
        rows.back().velocityMetersPerSecond);
}

// A row is stamped with the post-step timestamp, so motorRpm and
// velocityMetersPerSecond must both describe the carriage at that instant. Pin
// the identity within a row so the two cannot drift apart again. (The pre-step
// shaft speed is still used for the back-EMF term feeding the voltage clamp,
// which is correct -- that clamp acts on the state at the start of the step.)
TEST_CASE(
    "SimulateElevatorTrajectory: MotorRpmMatchesCarriageVelocityInTheSameRow",
    "[SimulateElevatorTrajectory]") {
  Params p;
  p.decimation = 1;
  const auto rows = Simulate(p);
  REQUIRE(rows.size() > 2u);

  const double toRpm =
      1.0 / p.spoolRadiusMeters * p.gearing * 60.0 / (2.0 * M_PI);

  // The first row is recorded after a step has already been integrated, so the
  // carriage is moving and the reported shaft speed must be non-zero.
  CHECK(rows.front().motorRpm > 0.0);
  for (size_t i = 0; i < rows.size(); ++i) {
    INFO("at row " << i);
    CHECK_THAT(rows[i].motorRpm,
               WithinAbs(rows[i].velocityMetersPerSecond * toRpm, 1e-9));
  }
}

// ============================================================================
// SimulateElevator: cascade rigging
// ============================================================================

// Cascade rigging halves the first stage's travel and doubles the effective
// load. The reported trajectory is the first stage's, so the same requested
// travel distance must end at half the height.
TEST_CASE("SimulateElevatorCascade: HalvesReportedTravelDistance",
          "[SimulateElevatorCascade]") {
  Params direct;
  Params cascade;
  cascade.cascade = true;

  const auto directRows = Simulate(direct);
  const auto cascadeRows = Simulate(cascade);
  REQUIRE_FALSE(directRows.empty());
  REQUIRE_FALSE(cascadeRows.empty());

  CHECK_THAT(cascadeRows.back().positionMeters,
             WithinAbs(kTravelMeters / 2.0, kSuccessThresholdMeters));
  CHECK_THAT(directRows.back().positionMeters,
             WithinAbs(kTravelMeters, kSuccessThresholdMeters));
}

// Doubling the load doubles kG, so a cascade elevator holds itself up with
// roughly twice the gravity feedforward voltage.
TEST_CASE("SimulateElevatorCascade: DoublesEffectiveLoad",
          "[SimulateElevatorCascade]") {
  Params direct;
  Params cascade;
  cascade.cascade = true;

  const auto directRows = Simulate(direct);
  const auto cascadeRows = Simulate(cascade);
  REQUIRE_FALSE(directRows.empty());
  REQUIRE_FALSE(cascadeRows.empty());

  CHECK(cascadeRows.front().motorAppliedVoltageVolts >
        directRows.front().motorAppliedVoltageVolts);
}

// ============================================================================
// SimulateElevator: gravity feedforward
// ============================================================================

// kG is derived as (kA / efficiency) * g * sin(angle), so a horizontal elevator
// needs no gravity feedforward at all. Both runs below share one set of profile
// constraints and start from an identical state, so the closed-loop output on
// the first step is identical and the applied voltages differ by exactly kG.
TEST_CASE(
    "SimulateElevatorGravityFeedforward: "
    "VerticalAppliesExactlyKgMoreThanHorizontal",
    "[SimulateElevatorGravityFeedforward]") {
  Params vertical;
  vertical.angleRadians = M_PI / 2.0;
  DeriveConstraints(vertical);

  Params horizontal = vertical;  // same constraints; only the angle differs
  horizontal.angleRadians = 0.0;

  const auto verticalRows = ToRows(RunRaw(vertical));
  const auto horizontalRows = ToRows(RunRaw(horizontal));
  REQUIRE_FALSE(verticalRows.empty());
  REQUIRE_FALSE(horizontalRows.empty());

  // sin(pi/2) == 1 and efficiency == 1, so kG reduces to kA * g.
  const double expectedKg = (1.0 / IdealPlant().B()(1, 0)) * kGravity;

  // Neither run may be voltage-saturated on the first step, or the difference
  // would be a clamp artifact rather than the gravity term.
  REQUIRE(std::abs(verticalRows.front().motorAppliedVoltageVolts) <
          vertical.batteryVoltageVolts - 1e-6);

  CHECK_THAT(verticalRows.front().motorAppliedVoltageVolts -
                 horizontalRows.front().motorAppliedVoltageVolts,
             WithinAbs(expectedKg, std::abs(expectedKg) * 1e-6));
}

// ============================================================================
// SimulateElevator: decimation
// ============================================================================

TEST_CASE("SimulateElevatorDecimation: EmitsEveryNthRowPlusTheLast",
          "[SimulateElevatorDecimation]") {
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
// SimulateElevator: current limiting
// ============================================================================

namespace {
// The voltage clamp is computed from the velocity at the START of a timestep,
// but GetCurrentDraw() reports current from the velocity AFTER the step. That
// one-step lag lets the reported current overshoot the limit slightly, so these
// assertions allow a small margin rather than demanding an exact bound.
constexpr double kCurrentLimitMargin = 1.05;
}  // namespace

TEST_CASE("SimulateElevatorCurrentLimits: StatorCurrentStaysWithinLimit",
          "[SimulateElevatorCurrentLimits]") {
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

TEST_CASE("SimulateElevatorCurrentLimits: SupplyCurrentStaysWithinLimit",
          "[SimulateElevatorCurrentLimits]") {
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

TEST_CASE("SimulateElevatorCurrentLimits: AppliedVoltageNeverExceedsSupply",
          "[SimulateElevatorCurrentLimits]") {
  Params p;
  const auto rows = Simulate(p);
  REQUIRE_FALSE(rows.empty());

  for (size_t i = 0; i < rows.size(); ++i) {
    INFO("at row " << i);
    CHECK(std::abs(rows[i].motorAppliedVoltageVolts) <=
          p.batteryVoltageVolts + 1e-9);
  }
}

// ============================================================================
// SimulateElevator: battery model
// ============================================================================

TEST_CASE("SimulateElevatorBattery: StiffBatteryHoldsNominalVoltage",
          "[SimulateElevatorBattery]") {
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

TEST_CASE("SimulateElevatorBattery: RealBatterySagsUnderLoadButStaysPositive",
          "[SimulateElevatorBattery]") {
  Params p;
  p.batteryResistanceOhms = 0.015;
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
TEST_CASE("SimulateElevatorBattery: FilterIsSeededAtNominalVoltage",
          "[SimulateElevatorBattery]") {
  Params p;
  p.batteryResistanceOhms = 0.015;
  p.batteryVoltageFilterTimeConstantSeconds = 0.1;
  const auto rows = Simulate(p);
  REQUIRE(rows.size() > 1u);

  CHECK_THAT(rows.front().batteryVoltageVolts,
             WithinAbs(p.batteryVoltageVolts, 0.5));
  CHECK(rows.back().batteryVoltageVolts < rows.front().batteryVoltageVolts);
}

// ============================================================================
// SimulateElevator: energy accounting
// ============================================================================

// energyJoules is the running integral of supply power. With a 0-ohm battery
// the supply voltage is pinned at nominal for every step, so the per-step
// increment is an exact identity rather than an approximation. This pins the
// accumulator to the supply side (not the stator side) and to the correct
// timestep.
TEST_CASE("SimulateElevatorEnergy: IsTheCumulativeIntegralOfSupplyPower",
          "[SimulateElevatorEnergy]") {
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

TEST_CASE("SimulateElevatorEnergy: NetEnergyIsPositiveWhenLifting",
          "[SimulateElevatorEnergy]") {
  Params p;
  p.angleRadians = M_PI / 2.0;
  const auto rows = Simulate(p);
  REQUIRE_FALSE(rows.empty());

  CHECK(rows.back().energyJoules > 0.0);
}

// While decelerating, back-EMF exceeds the applied voltage and the motor pushes
// current back into the battery. The supply current must go negative and the
// accumulated energy must drop, proving recovered energy is credited rather
// than counted as consumption. This is the whole-simulation counterpart to the
// SupplyCurrent.Regen_NegativeStator_YieldsNegativeSupply case in
// sim_util_test.cc.
TEST_CASE("SimulateElevatorEnergy: RegenerationCreditsEnergyBack",
          "[SimulateElevatorEnergy]") {
  Params p;
  p.angleRadians = M_PI / 2.0;
  p.decimation = 1;
  const auto rows = Simulate(p);
  REQUIRE(rows.size() > 1u);

  bool sawRegen = false;
  for (size_t i = 1; i < rows.size(); ++i) {
    if (rows[i].supplyCurrentDrawAmps < 0.0) {
      INFO("at row " << i);
      sawRegen = true;
      CHECK(rows[i].energyJoules < rows[i - 1].energyJoules);
    }
  }
  INFO("expected a regenerative phase while decelerating");
  CHECK(sawRegen);
}

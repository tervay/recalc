#include "elevator_sim.h"

#include <gtest/gtest.h>

#include <cmath>
#include <vector>

#include "dc_motor.h"
#include "hal_init.h"
#include "wpi/math/system/DCMotor.hpp"
#include "wpi/math/system/Models.hpp"

namespace {

// ElevatorSim::SetInputVoltage and RoboRioSim both touch SimRoboRioData
// without lazy-init. Initialize once for the whole suite (see hal_init.h).
struct HalInitEnvironment : ::testing::Environment {
  void SetUp() override { EnsureHalInitialized(); }
};

const ::testing::Environment* const kHalInitEnvironment =
    ::testing::AddGlobalTestEnvironment(new HalInitEnvironment);

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

// RoboRio sim data is usable after EnsureHalInitialized (see HalInitEnvironment
// above). Production SimulateElevator calls the same helper. Without it,
// SetVInVoltage writes through a null SimRoboRioData into the Wasm null page.
TEST(ElevatorSimHarness, RoboRioVoltageIsReadableAfterHalInit) {
  wpi::sim::RoboRioSim::SetVInVoltage(wpi::units::volt_t{12.0});
  EXPECT_NEAR(wpi::RobotController::GetInputVoltage(), 12.0, 1e-9);
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

TEST(AngledElevatorGravity, HorizontalHasNoGravityComponent) {
  // sin(0) = 0, so an unpowered horizontal elevator must not accelerate at all.
  EXPECT_DOUBLE_EQ(UnpoweredVelocityAfterOneStep(0.0, 1e-3), 0.0);
}

TEST(AngledElevatorGravity, VerticalFallsAtFullGravity) {
  // Closed-form solution of vdot = A11*v - g with v(0) = 0:
  //   v(t) = (-g / A11) * (exp(A11*t) - 1)
  const double dt = 1e-3;
  const double a11 = IdealPlant().A()(1, 1);
  const double expected = (-kGravity / a11) * (std::exp(a11 * dt) - 1.0);

  EXPECT_NEAR(UnpoweredVelocityAfterOneStep(M_PI / 2.0, dt), expected,
              std::abs(expected) * 1e-6);
}

// Gravity must scale with sin(angle), not cos(angle) and not a constant. The
// ODE is linear and the angle enters only through the constant gravity term, so
// v(theta)/v(pi/2) is exactly sin(theta) regardless of the timestep. This ratio
// form makes the test independent of the integrator's local truncation error.
class GravityAngleScalingTest : public ::testing::TestWithParam<double> {};

TEST_P(GravityAngleScalingTest, VelocityRatioTracksSineOfAngle) {
  const double angle = GetParam();
  const double dt = 1e-3;
  const double vertical = UnpoweredVelocityAfterOneStep(M_PI / 2.0, dt);
  ASSERT_LT(vertical, 0.0) << "vertical elevator must fall";

  EXPECT_NEAR(UnpoweredVelocityAfterOneStep(angle, dt) / vertical,
              std::sin(angle), 1e-9);
}

INSTANTIATE_TEST_SUITE_P(VariousAngles, GravityAngleScalingTest,
                         ::testing::Values(0.0, M_PI / 6.0, M_PI / 4.0,
                                           M_PI / 3.0, M_PI / 2.0));

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

// At steady state vdot = 0, so A11*v + efficiency*B10*u = 0, giving
// v_ss = -efficiency*B10*u/A11. Asserting the absolute value (not just a ratio)
// pins BOTH halves of the contract: efficiency multiplies B, and A is left
// alone. If efficiency were also applied to A it would cancel out here and the
// measured steady state would be the full-efficiency value.
TEST(AngledElevatorEfficiency, SteadyStateMatchesEfficiencyScaledBOverA) {
  const double efficiency = 0.5;
  const double voltage = 6.0;
  const auto plant = IdealPlant();
  const double expected =
      -efficiency * plant.B()(1, 0) * voltage / plant.A()(1, 1);

  EXPECT_NEAR(SteadyStateVelocity(efficiency, voltage), expected,
              std::abs(expected) * 1e-6);
}

TEST(AngledElevatorEfficiency, HalvingEfficiencyHalvesSteadyStateVelocity) {
  const double full = SteadyStateVelocity(1.0, 6.0);
  ASSERT_GT(full, 0.0);
  EXPECT_NEAR(SteadyStateVelocity(0.5, 6.0) / full, 0.5, 1e-6);
}

TEST(AngledElevatorEfficiency, LowerEfficiencyReducesInitialAcceleration) {
  // From rest the back-EMF term is zero, so the first step isolates the motor
  // force: v(dt) is proportional to efficiency.
  const double dt = 1e-4;
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

  EXPECT_NEAR(half.GetVelocity().to<double>() / full.GetVelocity().to<double>(),
              0.5, 1e-6);
}

// ============================================================================
// AngledElevatorSim: travel limits
// ============================================================================

TEST(AngledElevatorLimits, LowerLimitPinsPositionAndZeroesVelocity) {
  // Start just above the floor and let gravity pull the carriage through it.
  AngledElevatorSim sim(TestMotor(), kGearing, wpi::units::kilogram_t(kLoadKg),
                        wpi::units::meter_t(kSpoolRadiusMeters), 0.0, 2.0, 5e-4,
                        M_PI / 2.0, 1.0);
  sim.SetInputVoltage(wpi::units::volt_t(0.0));
  for (int i = 0; i < 50; ++i) {
    sim.Update(wpi::units::second_t(1e-3));
  }

  EXPECT_DOUBLE_EQ(sim.GetPosition().to<double>(), 0.0);
  EXPECT_DOUBLE_EQ(sim.GetVelocity().to<double>(), 0.0);
}

TEST(AngledElevatorLimits, UpperLimitPinsPositionAndZeroesVelocity) {
  // Start just below the ceiling and drive hard into it.
  AngledElevatorSim sim(TestMotor(), kGearing, wpi::units::kilogram_t(kLoadKg),
                        wpi::units::meter_t(kSpoolRadiusMeters), 0.0, 2.0,
                        1.9995, M_PI / 2.0, 1.0);
  sim.SetInputVoltage(wpi::units::volt_t(12.0));
  for (int i = 0; i < 50; ++i) {
    sim.Update(wpi::units::second_t(1e-3));
  }

  EXPECT_DOUBLE_EQ(sim.GetPosition().to<double>(), 2.0);
  EXPECT_DOUBLE_EQ(sim.GetVelocity().to<double>(), 0.0);
}

// ============================================================================
// SimulateElevator: degenerate inputs
//
// Every degenerate input returns an empty array rather than throwing or
// emitting inf/NaN rows, matching the contract already established by
// feedforward_gains.h.
// ============================================================================

TEST(SimulateElevatorGuards, ZeroMaxVelocityReturnsEmpty) {
  Params p;
  DeriveConstraints(p);
  p.maxVelocityMPS = 0.0;
  EXPECT_EQ(Length(RunRaw(p)), 0);
}

TEST(SimulateElevatorGuards, NegativeMaxVelocityReturnsEmpty) {
  Params p;
  DeriveConstraints(p);
  p.maxVelocityMPS = -1.0;
  EXPECT_EQ(Length(RunRaw(p)), 0);
}

TEST(SimulateElevatorGuards, ZeroMaxAccelerationReturnsEmpty) {
  Params p;
  DeriveConstraints(p);
  p.maxAccelerationMPS2 = 0.0;
  EXPECT_EQ(Length(RunRaw(p)), 0);
}

TEST(SimulateElevatorGuards, NegativeMaxAccelerationReturnsEmpty) {
  Params p;
  DeriveConstraints(p);
  p.maxAccelerationMPS2 = -1.0;
  EXPECT_EQ(Length(RunRaw(p)), 0);
}

// A zero spool radius divides by zero when converting carriage velocity to
// motor shaft speed, producing inf/NaN rows instead of a clean empty result.
TEST(SimulateElevatorGuards, ZeroSpoolRadiusReturnsEmpty) {
  Params p;
  DeriveConstraints(p);
  p.spoolRadiusMeters = 0.0;
  EXPECT_EQ(Length(RunRaw(p)), 0);
}

TEST(SimulateElevatorGuards, NegativeSpoolRadiusReturnsEmpty) {
  Params p;
  DeriveConstraints(p);
  p.spoolRadiusMeters = -0.01;
  EXPECT_EQ(Length(RunRaw(p)), 0);
}

// A zero efficiency divides by zero when deriving kG from kA.
TEST(SimulateElevatorGuards, ZeroEfficiencyReturnsEmpty) {
  Params p;
  DeriveConstraints(p);
  p.efficiency = 0.0;
  EXPECT_EQ(Length(RunRaw(p)), 0);
}

TEST(SimulateElevatorGuards, NegativeEfficiencyReturnsEmpty) {
  Params p;
  DeriveConstraints(p);
  p.efficiency = -0.5;
  EXPECT_EQ(Length(RunRaw(p)), 0);
}

TEST(SimulateElevatorGuards, ZeroGearingReturnsEmpty) {
  Params p;
  DeriveConstraints(p);
  p.gearing = 0.0;
  EXPECT_EQ(Length(RunRaw(p)), 0);
}

// The public entry point must convert numerical failures into an empty array
// with a console warning rather than letting the exception escape and abort the
// worker. A non-positive load makes Models::ElevatorFromPhysicalConstants throw
// std::domain_error, and it deliberately survives the guards above so this path
// stays reachable.
TEST(SimulateElevatorGuards, SolverFailureReturnsEmptyInsteadOfThrowing) {
  Params p;
  DeriveConstraints(p);
  p.loadKg = 0.0;
  emscripten::val result = emscripten::val::undefined();
  EXPECT_NO_THROW({ result = RunRaw(p); });
  EXPECT_EQ(Length(result), 0);
}

// DecimateToJsArray computes `i % decimation`. Integer modulo by zero is a wasm
// trap, not a C++ exception, so the try/catch in SimulateElevator cannot
// intercept it -- an unguarded 0 would abort the whole worker.
TEST(SimulateElevatorGuards, ZeroDecimationReturnsEmpty) {
  Params p;
  DeriveConstraints(p);
  p.decimation = 0;
  EXPECT_EQ(Length(RunRaw(p)), 0);
}

TEST(SimulateElevatorGuards, NegativeDecimationReturnsEmpty) {
  Params p;
  DeriveConstraints(p);
  p.decimation = -1;
  EXPECT_EQ(Length(RunRaw(p)), 0);
}

// ============================================================================
// SimulateElevator: nominal trajectory
// ============================================================================

TEST(SimulateElevatorTrajectory, ReachesGoalAndReportsSuccess) {
  const auto rows = Simulate(Params{});
  ASSERT_FALSE(rows.empty());

  EXPECT_LT(std::abs(rows.back().positionMeters - kTravelMeters),
            kSuccessThresholdMeters);
  EXPECT_TRUE(rows.back().success);
}

// success is only meaningful on the final element -- it is the one the
// simulation overwrites after the loop. A run truncated long before the goal
// must report failure.
TEST(SimulateElevatorTrajectory, TruncatedRunReportsFailure) {
  Params p;
  p.maxSimSeconds = 0.01;
  const auto rows = Simulate(p);
  ASSERT_FALSE(rows.empty());

  EXPECT_GT(std::abs(rows.back().positionMeters - kTravelMeters),
            kSuccessThresholdMeters);
  EXPECT_FALSE(rows.back().success);
}

TEST(SimulateElevatorTrajectory, StopsAtMaxSimSeconds) {
  Params p;
  p.maxSimSeconds = 0.01;
  const auto rows = Simulate(p);
  ASSERT_FALSE(rows.empty());

  EXPECT_LE(rows.back().timeSeconds, p.maxSimSeconds + p.simTimestep);
}

TEST(SimulateElevatorTrajectory, TimeAdvancesByOneTimestepPerRow) {
  Params p;
  p.decimation = 1;
  const auto rows = Simulate(p);
  ASSERT_GT(rows.size(), 2u);

  EXPECT_NEAR(rows[0].timeSeconds, p.simTimestep, 1e-12);
  for (size_t i = 1; i < rows.size(); ++i) {
    EXPECT_NEAR(rows[i].timeSeconds - rows[i - 1].timeSeconds, p.simTimestep,
                1e-9)
        << "at row " << i;
  }
}

TEST(SimulateElevatorTrajectory, VelocityProfileRisesThenFalls) {
  const auto rows = Simulate(Params{});
  ASSERT_GT(rows.size(), 2u);

  size_t peak = 0;
  for (size_t i = 1; i < rows.size(); ++i) {
    if (rows[i].velocityMetersPerSecond > rows[peak].velocityMetersPerSecond) {
      peak = i;
    }
  }

  EXPECT_GT(peak, 0u);
  EXPECT_LT(peak, rows.size() - 1);
  EXPECT_GT(rows[peak].velocityMetersPerSecond,
            rows.front().velocityMetersPerSecond);
  EXPECT_GT(rows[peak].velocityMetersPerSecond,
            rows.back().velocityMetersPerSecond);
}

// A row is stamped with the post-step timestamp, so motorRpm and
// velocityMetersPerSecond must both describe the carriage at that instant. Pin
// the identity within a row so the two cannot drift apart again. (The pre-step
// shaft speed is still used for the back-EMF term feeding the voltage clamp,
// which is correct -- that clamp acts on the state at the start of the step.)
TEST(SimulateElevatorTrajectory, MotorRpmMatchesCarriageVelocityInTheSameRow) {
  Params p;
  p.decimation = 1;
  const auto rows = Simulate(p);
  ASSERT_GT(rows.size(), 2u);

  const double toRpm =
      1.0 / p.spoolRadiusMeters * p.gearing * 60.0 / (2.0 * M_PI);

  // The first row is recorded after a step has already been integrated, so the
  // carriage is moving and the reported shaft speed must be non-zero.
  EXPECT_GT(rows.front().motorRpm, 0.0);
  for (size_t i = 0; i < rows.size(); ++i) {
    EXPECT_NEAR(rows[i].motorRpm, rows[i].velocityMetersPerSecond * toRpm, 1e-9)
        << "at row " << i;
  }
}

// ============================================================================
// SimulateElevator: cascade rigging
// ============================================================================

// Cascade rigging halves the first stage's travel and doubles the effective
// load. The reported trajectory is the first stage's, so the same requested
// travel distance must end at half the height.
TEST(SimulateElevatorCascade, HalvesReportedTravelDistance) {
  Params direct;
  Params cascade;
  cascade.cascade = true;

  const auto directRows = Simulate(direct);
  const auto cascadeRows = Simulate(cascade);
  ASSERT_FALSE(directRows.empty());
  ASSERT_FALSE(cascadeRows.empty());

  EXPECT_NEAR(cascadeRows.back().positionMeters, kTravelMeters / 2.0,
              kSuccessThresholdMeters);
  EXPECT_NEAR(directRows.back().positionMeters, kTravelMeters,
              kSuccessThresholdMeters);
}

// Doubling the load doubles kG, so a cascade elevator holds itself up with
// roughly twice the gravity feedforward voltage.
TEST(SimulateElevatorCascade, DoublesEffectiveLoad) {
  Params direct;
  Params cascade;
  cascade.cascade = true;

  const auto directRows = Simulate(direct);
  const auto cascadeRows = Simulate(cascade);
  ASSERT_FALSE(directRows.empty());
  ASSERT_FALSE(cascadeRows.empty());

  EXPECT_GT(cascadeRows.front().motorAppliedVoltageVolts,
            directRows.front().motorAppliedVoltageVolts);
}

// ============================================================================
// SimulateElevator: gravity feedforward
// ============================================================================

// kG is derived as (kA / efficiency) * g * sin(angle), so a horizontal elevator
// needs no gravity feedforward at all. Both runs below share one set of profile
// constraints and start from an identical state, so the closed-loop output on
// the first step is identical and the applied voltages differ by exactly kG.
TEST(SimulateElevatorGravityFeedforward,
     VerticalAppliesExactlyKgMoreThanHorizontal) {
  Params vertical;
  vertical.angleRadians = M_PI / 2.0;
  DeriveConstraints(vertical);

  Params horizontal = vertical;  // same constraints; only the angle differs
  horizontal.angleRadians = 0.0;

  const auto verticalRows = ToRows(RunRaw(vertical));
  const auto horizontalRows = ToRows(RunRaw(horizontal));
  ASSERT_FALSE(verticalRows.empty());
  ASSERT_FALSE(horizontalRows.empty());

  // sin(pi/2) == 1 and efficiency == 1, so kG reduces to kA * g.
  const double expectedKg = (1.0 / IdealPlant().B()(1, 0)) * kGravity;

  // Neither run may be voltage-saturated on the first step, or the difference
  // would be a clamp artifact rather than the gravity term.
  ASSERT_LT(std::abs(verticalRows.front().motorAppliedVoltageVolts),
            vertical.batteryVoltageVolts - 1e-6);

  EXPECT_NEAR(verticalRows.front().motorAppliedVoltageVolts -
                  horizontalRows.front().motorAppliedVoltageVolts,
              expectedKg, std::abs(expectedKg) * 1e-6);
}

// ============================================================================
// SimulateElevator: decimation
// ============================================================================

TEST(SimulateElevatorDecimation, EmitsEveryNthRowPlusTheLast) {
  Params full;
  full.decimation = 1;
  Params decimated;
  decimated.decimation = 10;

  const auto fullRows = Simulate(full);
  const auto decimatedRows = Simulate(decimated);
  ASSERT_GT(fullRows.size(), 10u);

  const size_t n = fullRows.size();
  const size_t expected = (n - 1) / 10 + 1 + ((n - 1) % 10 == 0 ? 0 : 1);
  EXPECT_EQ(decimatedRows.size(), expected);

  // The final raw sample is always included, even off a decimation boundary.
  EXPECT_NEAR(decimatedRows.back().timeSeconds, fullRows.back().timeSeconds,
              1e-12);
  EXPECT_NEAR(decimatedRows.front().timeSeconds, fullRows.front().timeSeconds,
              1e-12);
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

TEST(SimulateElevatorCurrentLimits, StatorCurrentStaysWithinLimit) {
  Params p;
  p.statorLimitAmps = 40.0;
  p.supplyLimitAmps = 1000.0;
  const auto rows = Simulate(p);
  ASSERT_FALSE(rows.empty());

  for (size_t i = 0; i < rows.size(); ++i) {
    EXPECT_LE(std::abs(rows[i].statorCurrentDrawAmps),
              p.statorLimitAmps * kCurrentLimitMargin)
        << "at row " << i;
  }
}

TEST(SimulateElevatorCurrentLimits, SupplyCurrentStaysWithinLimit) {
  Params p;
  p.statorLimitAmps = 1000.0;
  p.supplyLimitAmps = 30.0;
  const auto rows = Simulate(p);
  ASSERT_FALSE(rows.empty());

  for (size_t i = 0; i < rows.size(); ++i) {
    EXPECT_LE(std::abs(rows[i].supplyCurrentDrawAmps),
              p.supplyLimitAmps * kCurrentLimitMargin)
        << "at row " << i;
  }
}

TEST(SimulateElevatorCurrentLimits, AppliedVoltageNeverExceedsSupply) {
  Params p;
  const auto rows = Simulate(p);
  ASSERT_FALSE(rows.empty());

  for (size_t i = 0; i < rows.size(); ++i) {
    EXPECT_LE(std::abs(rows[i].motorAppliedVoltageVolts),
              p.batteryVoltageVolts + 1e-9)
        << "at row " << i;
  }
}

// ============================================================================
// SimulateElevator: battery model
// ============================================================================

TEST(SimulateElevatorBattery, StiffBatteryHoldsNominalVoltage) {
  Params p;
  p.batteryResistanceOhms = 0.0;
  const auto rows = Simulate(p);
  ASSERT_FALSE(rows.empty());

  for (size_t i = 0; i < rows.size(); ++i) {
    EXPECT_NEAR(rows[i].batteryVoltageVolts, p.batteryVoltageVolts, 1e-9)
        << "at row " << i;
  }
}

TEST(SimulateElevatorBattery, RealBatterySagsUnderLoadButStaysPositive) {
  Params p;
  p.batteryResistanceOhms = 0.015;
  const auto rows = Simulate(p);
  ASSERT_GT(rows.size(), 1u);

  double minVoltage = p.batteryVoltageVolts;
  for (const auto& row : rows) {
    minVoltage = std::min(minVoltage, row.batteryVoltageVolts);
    EXPECT_GT(row.batteryVoltageVolts, 0.0);
    EXPECT_LE(row.batteryVoltageVolts, p.batteryVoltageVolts + 1e-9);
  }
  EXPECT_LT(minVoltage, p.batteryVoltageVolts);
}

// The single-pole IIR filter is seeded at the nominal voltage, so the first
// sample must still be close to nominal even though the load is already
// applied. Without the filter reset the first sample would jump straight to the
// loaded voltage.
TEST(SimulateElevatorBattery, FilterIsSeededAtNominalVoltage) {
  Params p;
  p.batteryResistanceOhms = 0.015;
  p.batteryVoltageFilterTimeConstantSeconds = 0.1;
  const auto rows = Simulate(p);
  ASSERT_GT(rows.size(), 1u);

  EXPECT_NEAR(rows.front().batteryVoltageVolts, p.batteryVoltageVolts, 0.5);
  EXPECT_LT(rows.back().batteryVoltageVolts, rows.front().batteryVoltageVolts);
}

// ============================================================================
// SimulateElevator: energy accounting
// ============================================================================

// energyJoules is the running integral of supply power. With a 0-ohm battery
// the supply voltage is pinned at nominal for every step, so the per-step
// increment is an exact identity rather than an approximation. This pins the
// accumulator to the supply side (not the stator side) and to the correct
// timestep.
TEST(SimulateElevatorEnergy, IsTheCumulativeIntegralOfSupplyPower) {
  Params p;
  p.batteryResistanceOhms = 0.0;
  p.decimation = 1;
  const auto rows = Simulate(p);
  ASSERT_GT(rows.size(), 1u);

  const double firstExpected = rows.front().supplyCurrentDrawAmps *
                               p.batteryVoltageVolts * p.simTimestep;
  EXPECT_NEAR(rows.front().energyJoules, firstExpected,
              std::abs(firstExpected) * 1e-9);

  for (size_t i = 1; i < rows.size(); ++i) {
    const double expected =
        rows[i].supplyCurrentDrawAmps * p.batteryVoltageVolts * p.simTimestep;
    EXPECT_NEAR(rows[i].energyJoules - rows[i - 1].energyJoules, expected,
                std::abs(expected) * 1e-9 + 1e-12)
        << "at row " << i;
  }
}

TEST(SimulateElevatorEnergy, NetEnergyIsPositiveWhenLifting) {
  Params p;
  p.angleRadians = M_PI / 2.0;
  const auto rows = Simulate(p);
  ASSERT_FALSE(rows.empty());

  EXPECT_GT(rows.back().energyJoules, 0.0);
}

// While decelerating, back-EMF exceeds the applied voltage and the motor pushes
// current back into the battery. The supply current must go negative and the
// accumulated energy must drop, proving recovered energy is credited rather
// than counted as consumption. This is the whole-simulation counterpart to the
// SupplyCurrent.Regen_NegativeStator_YieldsNegativeSupply case in
// sim_util_test.cc.
TEST(SimulateElevatorEnergy, RegenerationCreditsEnergyBack) {
  Params p;
  p.angleRadians = M_PI / 2.0;
  p.decimation = 1;
  const auto rows = Simulate(p);
  ASSERT_GT(rows.size(), 1u);

  bool sawRegen = false;
  for (size_t i = 1; i < rows.size(); ++i) {
    if (rows[i].supplyCurrentDrawAmps < 0.0) {
      sawRegen = true;
      EXPECT_LT(rows[i].energyJoules, rows[i - 1].energyJoules)
          << "at row " << i;
    }
  }
  EXPECT_TRUE(sawRegen) << "expected a regenerative phase while decelerating";
}

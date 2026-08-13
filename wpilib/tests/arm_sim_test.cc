#include "arm_sim.h"

#include <gtest/gtest.h>

#include <cmath>
#include <vector>

#include "dc_motor.h"
#include "hal_init.h"
#include "wpi/math/system/DCMotor.hpp"
#include "wpi/math/system/Models.hpp"

namespace {

// SingleJointedArmSim::SetInputVoltage and RoboRioSim both touch SimRoboRioData
// without lazy-init. Initialize once for the whole suite (see hal_init.h).
struct HalInitEnvironment : ::testing::Environment {
  void SetUp() override { EnsureHalInitialized(); }
};

const ::testing::Environment* const kHalInitEnvironment =
    ::testing::AddGlobalTestEnvironment(new HalInitEnvironment);

// EfficiencyArmSim re-applies gravity itself, reproducing upstream
// SingleJointedArmSim's hardcoded 9.8 rather than the 9.80665 used by
// elevator_sim.h and feedforward_gains.h. These tests assert the code as
// written, so the constant must match arm_sim.h exactly.
constexpr double kArmGravity = 9.8;

// Physical configuration shared by most tests: a 1x KrakenX60 on a 100:1
// reduction swinging a 24in arm with 10 in^2*lb of inertia from horizontal to
// vertical. These mirror the values used by the TypeScript integration test in
// app/lib/math/arm.worker.test.ts so the two layers stay comparable.
constexpr double kGearing = 100.0;
constexpr double kMoi = 0.0029263965;     // 10 in^2*lb
constexpr double kArmLenMeters = 0.6096;  // 24 in
constexpr double kMinAngle = 0.0;         // horizontal
const double kMaxAngle = M_PI / 2.0;      // vertical

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
  return wpi::math::Models::SingleJointedArmFromPhysicalConstants(
      TestMotor(), wpi::units::kilogram_square_meter_t(moi), gearing);
}

// SimulateArm leaves RoboRioSim's VIn wherever the battery model ended up, and
// SingleJointedArmSim::SetInputVoltage clamps its argument to it. Reset before
// any test that drives a sim directly, so results never depend on the order the
// tests happen to run in.
void ResetSupplyVoltage() {
  wpi::sim::RoboRioSim::SetVInVoltage(wpi::units::volt_t{12.0});
}

// ---------------------------------------------------------------------------
// Parameters for SimulateArm. Defaults describe a run that comfortably reaches
// its goal: a 0-ohm battery, so the closed-form assertions below are exact
// identities rather than approximations.
// ---------------------------------------------------------------------------
struct Params {
  double gearing = kGearing;
  double momentOfInertiaKgMSquared = kMoi;
  double armLengthMeters = kArmLenMeters;
  double minAngleRadians = kMinAngle;
  double maxAngleRadians = kMaxAngle;
  double startingAngleRadians = kMinAngle;
  double statorLimitAmps = 60.0;
  double supplyLimitAmps = 90.0;
  double statorVoltageVolts = 12.0;
  double batteryResistanceOhms = 0.0;
  double batteryVoltageVolts = 12.0;
  double efficiency = 1.0;
  bool goingUp = true;
  double simTimestep = 0.001;
  int decimation = 1;
  double maxSimSeconds = 3.0;
  double batteryVoltageFilterTimeConstantSeconds = 0.1;
};

emscripten::val RunRaw(const Params& p) {
  DCMotorWasm* motor = MakeMotorWasm(TestMotor(), 1);
  emscripten::val result = SimulateArm(
      motor, p.gearing, p.momentOfInertiaKgMSquared, p.armLengthMeters,
      p.minAngleRadians, p.maxAngleRadians, p.startingAngleRadians,
      p.statorLimitAmps, p.supplyLimitAmps, p.statorVoltageVolts,
      p.batteryResistanceOhms, p.batteryVoltageVolts, p.efficiency, p.goingUp,
      p.simTimestep, p.decimation, p.maxSimSeconds,
      p.batteryVoltageFilterTimeConstantSeconds);
  delete motor;
  return result;
}

int Length(const emscripten::val& v) { return v["length"].as<int>(); }

std::vector<ArmSimStateInternal> ToRows(const emscripten::val& v) {
  std::vector<ArmSimStateInternal> rows;
  const int n = Length(v);
  rows.reserve(n);
  for (int i = 0; i < n; ++i) {
    const emscripten::val s = v[i];
    rows.push_back(
        {s["angleRadians"].as<double>(),
         s["angularVelocityRadPerSec"].as<double>(),
         s["statorCurrentDrawAmps"].as<double>(),
         s["supplyCurrentDrawAmps"].as<double>(), s["timeSeconds"].as<double>(),
         s["batteryVoltageVolts"].as<double>(),
         s["motorAppliedVoltageVolts"].as<double>(), s["motorRpm"].as<double>(),
         s["energyJoules"].as<double>(), s["success"].as<bool>()});
  }
  return rows;
}

std::vector<ArmSimStateInternal> Simulate(const Params& p) {
  return ToRows(RunRaw(p));
}

// Converts an arm angular velocity to the reported motor shaft RPM. SimulateArm
// reports a magnitude (see the std::abs at arm_sim.h), unlike the flywheel and
// elevator, because the arm is the only mechanism that runs in both directions.
double ToMotorRpm(double armRadPerSec, double gearing = kGearing) {
  return std::abs(armRadPerSec) * gearing * 60.0 / (2.0 * M_PI);
}

// Free-swings an unpowered arm for one timestep from rest and returns the
// resulting velocity. Travel limits are set far away so neither one clamps.
double UnpoweredVelocityAfterOneStep(double startingAngleRadians,
                                     double armLenMeters, double dt,
                                     double moi = kMoi) {
  ResetSupplyVoltage();
  EfficiencyArmSim sim(
      TestMotor(), kGearing, wpi::units::kilogram_square_meter_t(moi),
      wpi::units::meter_t(armLenMeters), wpi::units::radian_t(-10.0),
      wpi::units::radian_t(10.0), startingAngleRadians, 1.0);
  sim.SetInputVoltage(wpi::units::volt_t(0.0));
  sim.Update(wpi::units::second_t(dt));
  return sim.GetVelocity().to<double>();
}

// Closed-form solution of vdot = A11*v + G with v(0) = 0, where G is the
// constant gravitational angular acceleration:
//   v(t) = (G / A11) * (exp(A11*t) - 1)
// Valid while the angle barely moves, so cos(theta) stays effectively constant.
double ExpectedUnpoweredVelocity(double startingAngleRadians,
                                 double armLenMeters, double dt,
                                 double moi = kMoi) {
  const double a11 = IdealPlant(moi).A()(1, 1);
  const double gravity =
      -3.0 / 2.0 * kArmGravity / armLenMeters * std::cos(startingAngleRadians);
  return (gravity / a11) * (std::exp(a11 * dt) - 1.0);
}

// Runs a gravity-free arm (arm length 0 disables the gravity term) at a fixed
// voltage long enough to reach steady state, and returns the terminal velocity.
// The plant's time constant is -1/A(1,1) ~ 26 us, so 2 s is far past settling.
double SteadyStateArmVelocity(double efficiency, double voltage) {
  ResetSupplyVoltage();
  EfficiencyArmSim sim(TestMotor(), kGearing,
                       wpi::units::kilogram_square_meter_t(kMoi),
                       wpi::units::meter_t(0.0), wpi::units::radian_t(-1000.0),
                       wpi::units::radian_t(1000.0), 0.0, efficiency);
  sim.SetInputVoltage(wpi::units::volt_t(voltage));
  for (int i = 0; i < 2000; ++i) {
    sim.Update(wpi::units::second_t(1e-3));
  }
  return sim.GetVelocity().to<double>();
}

}  // namespace

// ============================================================================
// Harness
// ============================================================================

// RoboRio sim data is usable after EnsureHalInitialized (see hal_init.h).
// Production SimulateArm calls the same helper. Without it, SetVInVoltage
// writes through a null SimRoboRioData into the Wasm null page.
TEST(ArmSimHarness, RoboRioVoltageIsReadableAfterHalInit) {
  wpi::sim::RoboRioSim::SetVInVoltage(wpi::units::volt_t{12.0});
  EXPECT_NEAR(wpi::RobotController::GetInputVoltage(), 12.0, 1e-9);
}

// ============================================================================
// EfficiencyArmSim: gravity
//
// EfficiencyArmSim passes simulateGravity=false to its base and re-applies
// gravity inside UpdateX, because replacing UpdateX wholesale would otherwise
// drop the base class's gravity term entirely. The model is the WPILib uniform
// rod: alpha = -3/2 * g * cos(theta) / L.
//
// Driven through the public API (SetInputVoltage / Update / GetVelocity) rather
// than the protected UpdateX, so these test behavior rather than
// implementation.
// ============================================================================

// A horizontal arm has cos(0) = 1, so it sees the full gravitational torque.
// The step is 1 us rather than the 10 us used by the ratio tests below: with a
// plant time constant of ~26 us, RKDP's local truncation error at 10 us is
// ~4e-6 relative, which would swamp the 1e-6 tolerance. Ratio tests cancel that
// error out; this absolute comparison cannot.
TEST(EfficiencyArmGravity, HorizontalArmFallsAtFullGravity) {
  const double dt = 1e-6;
  const double expected = ExpectedUnpoweredVelocity(0.0, kArmLenMeters, dt);
  ASSERT_LT(expected, 0.0) << "a horizontal arm must fall";

  EXPECT_NEAR(UnpoweredVelocityAfterOneStep(0.0, kArmLenMeters, dt), expected,
              std::abs(expected) * 1e-6);
}

// A vertical arm has cos(pi/2) = 0, so the gravity term vanishes. M_PI / 2 is
// not exactly pi/2 in double precision -- its cosine is 6.1e-17 rather than 0
// -- so the residual velocity is ~1e-20 instead of a hard zero. Comparing
// against the horizontal case pins that the model uses cos, not sin: a
// sin-based term would be maximal here rather than negligible.
TEST(EfficiencyArmGravity, VerticalArmHasNoGravityTorque) {
  const double dt = 1e-5;
  const double horizontal =
      UnpoweredVelocityAfterOneStep(0.0, kArmLenMeters, dt);
  ASSERT_LT(horizontal, 0.0) << "a horizontal arm must fall";

  EXPECT_LT(
      std::abs(UnpoweredVelocityAfterOneStep(M_PI / 2.0, kArmLenMeters, dt)),
      std::abs(horizontal) * 1e-12);
}

// The `if (m_armLenMeters > 0.0)` branch exists to avoid dividing by zero. A
// zero-length arm must therefore produce no gravity at all -- not an infinity,
// not a NaN. This is why SimulateArm deliberately does not guard arm length.
TEST(EfficiencyArmGravity, ZeroArmLengthDisablesGravity) {
  const double v = UnpoweredVelocityAfterOneStep(0.0, 0.0, 1e-5);
  EXPECT_TRUE(std::isfinite(v));
  EXPECT_DOUBLE_EQ(v, 0.0);
}

// The branch tests `> 0.0`, not `!= 0.0`, so a negative length disables gravity
// rather than flipping its sign.
TEST(EfficiencyArmGravity, NegativeArmLengthAlsoDisablesGravity) {
  const double v = UnpoweredVelocityAfterOneStep(0.0, -0.5, 1e-5);
  EXPECT_TRUE(std::isfinite(v));
  EXPECT_DOUBLE_EQ(v, 0.0);
}

// Gravity must scale with cos(angle), not sin(angle) and not a constant. The
// velocity is exactly linear in the gravity term over one step, so the ratio
// v(theta)/v(0) isolates cos(theta) independently of the integrator's local
// truncation error. It is only approximately independent -- unlike the
// elevator's equivalent -- because the arm's gravity term depends on the state,
// so a very short step is used to keep the angle effectively constant.
class GravityAngleScalingTest : public ::testing::TestWithParam<double> {};

TEST_P(GravityAngleScalingTest, VelocityRatioTracksCosineOfAngle) {
  const double angle = GetParam();
  const double dt = 1e-5;
  const double horizontal =
      UnpoweredVelocityAfterOneStep(0.0, kArmLenMeters, dt);
  ASSERT_LT(horizontal, 0.0) << "a horizontal arm must fall";

  EXPECT_NEAR(
      UnpoweredVelocityAfterOneStep(angle, kArmLenMeters, dt) / horizontal,
      std::cos(angle), 1e-6);
}

INSTANTIATE_TEST_SUITE_P(VariousAngles, GravityAngleScalingTest,
                         ::testing::Values(0.0, M_PI / 6.0, M_PI / 4.0,
                                           M_PI / 3.0, M_PI / 2.0));

// The uniform-rod model puts no moment of inertia in the gravity term:
// alpha = -3/2 * g * cos(theta) / L is the same for a heavy arm and a light
// one. Inertia still enters A11, so the resulting velocities differ -- the
// assertion is that each matches its own closed form built from the SAME
// gravity term.
TEST(EfficiencyArmGravity, GravityIsIndependentOfMomentOfInertia) {
  const double dt = 1e-6;  // see HorizontalArmFallsAtFullGravity
  const double heavyMoi = 4.0 * kMoi;

  const double lightExpected =
      ExpectedUnpoweredVelocity(0.0, kArmLenMeters, dt);
  const double heavyExpected =
      ExpectedUnpoweredVelocity(0.0, kArmLenMeters, dt, heavyMoi);
  ASSERT_NE(lightExpected, heavyExpected) << "inertia must still affect A11";

  EXPECT_NEAR(UnpoweredVelocityAfterOneStep(0.0, kArmLenMeters, dt),
              lightExpected, std::abs(lightExpected) * 1e-6);
  EXPECT_NEAR(UnpoweredVelocityAfterOneStep(0.0, kArmLenMeters, dt, heavyMoi),
              heavyExpected, std::abs(heavyExpected) * 1e-6);
}

// alpha is inversely proportional to L, and inertia is unchanged here, so A11
// is identical between the two runs and the ratio is exactly 1/2.
TEST(EfficiencyArmGravity, GravityScalesInverselyWithArmLength) {
  const double dt = 1e-5;
  const double shortArm = UnpoweredVelocityAfterOneStep(0.0, kArmLenMeters, dt);
  ASSERT_LT(shortArm, 0.0);

  EXPECT_NEAR(
      UnpoweredVelocityAfterOneStep(0.0, 2.0 * kArmLenMeters, dt) / shortArm,
      0.5, 1e-6);
}

// ============================================================================
// EfficiencyArmSim: efficiency
//
// Run with an arm length of 0 so gravity is off and the steady state has a
// closed form.
// ============================================================================

// At steady state vdot = 0, so A11*v + efficiency*B10*u = 0, giving
// v_ss = -efficiency*B10*u/A11. Asserting the absolute value (not just a ratio)
// pins BOTH halves of the contract: efficiency multiplies B, and A is left
// alone. If efficiency were also applied to A it would cancel out here and the
// measured steady state would be the full-efficiency value.
TEST(EfficiencyArm, SteadyStateMatchesEfficiencyScaledBOverA) {
  const double efficiency = 0.5;
  const double voltage = 6.0;
  const auto plant = IdealPlant();
  const double expected =
      -efficiency * plant.B()(1, 0) * voltage / plant.A()(1, 1);

  EXPECT_NEAR(SteadyStateArmVelocity(efficiency, voltage), expected,
              std::abs(expected) * 1e-6);
}

TEST(EfficiencyArm, HalvingEfficiencyHalvesSteadyStateVelocity) {
  const double full = SteadyStateArmVelocity(1.0, 6.0);
  ASSERT_GT(full, 0.0);
  EXPECT_NEAR(SteadyStateArmVelocity(0.5, 6.0) / full, 0.5, 1e-6);
}

TEST(EfficiencyArm, LowerEfficiencyReducesInitialAcceleration) {
  // From rest the back-EMF term is zero, so the first step isolates the motor
  // torque: v(dt) is proportional to efficiency.
  const double dt = 1e-6;
  ResetSupplyVoltage();
  EfficiencyArmSim full(TestMotor(), kGearing,
                        wpi::units::kilogram_square_meter_t(kMoi),
                        wpi::units::meter_t(0.0), wpi::units::radian_t(-10.0),
                        wpi::units::radian_t(10.0), 0.0, 1.0);
  EfficiencyArmSim half(TestMotor(), kGearing,
                        wpi::units::kilogram_square_meter_t(kMoi),
                        wpi::units::meter_t(0.0), wpi::units::radian_t(-10.0),
                        wpi::units::radian_t(10.0), 0.0, 0.5);
  full.SetInputVoltage(wpi::units::volt_t(6.0));
  half.SetInputVoltage(wpi::units::volt_t(6.0));
  full.Update(wpi::units::second_t(dt));
  half.Update(wpi::units::second_t(dt));

  EXPECT_NEAR(half.GetVelocity().to<double>() / full.GetVelocity().to<double>(),
              0.5, 1e-6);
}

// The gravity term is added outside the (efficiency - 1) * B * u correction, so
// with no input voltage the B term vanishes entirely and efficiency cannot
// affect the result. A gearbox does not make gravity weaker.
TEST(EfficiencyArm, EfficiencyDoesNotAffectGravity) {
  const double dt = 1e-5;
  ResetSupplyVoltage();
  EfficiencyArmSim full(
      TestMotor(), kGearing, wpi::units::kilogram_square_meter_t(kMoi),
      wpi::units::meter_t(kArmLenMeters), wpi::units::radian_t(-10.0),
      wpi::units::radian_t(10.0), 0.0, 1.0);
  EfficiencyArmSim quarter(
      TestMotor(), kGearing, wpi::units::kilogram_square_meter_t(kMoi),
      wpi::units::meter_t(kArmLenMeters), wpi::units::radian_t(-10.0),
      wpi::units::radian_t(10.0), 0.0, 0.25);
  full.SetInputVoltage(wpi::units::volt_t(0.0));
  quarter.SetInputVoltage(wpi::units::volt_t(0.0));
  full.Update(wpi::units::second_t(dt));
  quarter.Update(wpi::units::second_t(dt));

  ASSERT_LT(full.GetVelocity().to<double>(), 0.0);
  EXPECT_DOUBLE_EQ(quarter.GetVelocity().to<double>(),
                   full.GetVelocity().to<double>());
}

// ============================================================================
// EfficiencyArmSim: travel limits
// ============================================================================

TEST(EfficiencyArmLimits, LowerLimitPinsAngleAndZeroesVelocity) {
  ResetSupplyVoltage();
  EfficiencyArmSim sim(
      TestMotor(), kGearing, wpi::units::kilogram_square_meter_t(kMoi),
      wpi::units::meter_t(kArmLenMeters), wpi::units::radian_t(0.0),
      wpi::units::radian_t(2.0), 0.01, 1.0);
  sim.SetInputVoltage(wpi::units::volt_t(-12.0));
  for (int i = 0; i < 50; ++i) {
    sim.Update(wpi::units::second_t(1e-3));
  }

  // UpdateX returns the literal {m_minAngleRad, 0.0}, so both are exact.
  EXPECT_DOUBLE_EQ(sim.GetAngle().to<double>(), 0.0);
  EXPECT_DOUBLE_EQ(sim.GetVelocity().to<double>(), 0.0);
}

TEST(EfficiencyArmLimits, UpperLimitPinsAngleAndZeroesVelocity) {
  ResetSupplyVoltage();
  EfficiencyArmSim sim(
      TestMotor(), kGearing, wpi::units::kilogram_square_meter_t(kMoi),
      wpi::units::meter_t(kArmLenMeters), wpi::units::radian_t(0.0),
      wpi::units::radian_t(2.0), 1.99, 1.0);
  sim.SetInputVoltage(wpi::units::volt_t(12.0));
  for (int i = 0; i < 50; ++i) {
    sim.Update(wpi::units::second_t(1e-3));
  }

  EXPECT_DOUBLE_EQ(sim.GetAngle().to<double>(), 2.0);
  EXPECT_DOUBLE_EQ(sim.GetVelocity().to<double>(), 0.0);
}

// The limit predicates are inclusive (`angle <= minAngle`), which is what makes
// SimulateArm return an empty array when it starts already at its goal.
TEST(EfficiencyArmLimits, LimitPredicatesAreInclusiveAtConstruction) {
  ResetSupplyVoltage();
  EfficiencyArmSim atLower(
      TestMotor(), kGearing, wpi::units::kilogram_square_meter_t(kMoi),
      wpi::units::meter_t(kArmLenMeters), wpi::units::radian_t(0.0),
      wpi::units::radian_t(2.0), 0.0, 1.0);
  EXPECT_TRUE(atLower.HasHitLowerLimit());
  EXPECT_FALSE(atLower.HasHitUpperLimit());

  EfficiencyArmSim atUpper(
      TestMotor(), kGearing, wpi::units::kilogram_square_meter_t(kMoi),
      wpi::units::meter_t(kArmLenMeters), wpi::units::radian_t(0.0),
      wpi::units::radian_t(2.0), 2.0, 1.0);
  EXPECT_TRUE(atUpper.HasHitUpperLimit());
  EXPECT_FALSE(atUpper.HasHitLowerLimit());
}

// ============================================================================
// SimulateArm: degenerate inputs
//
// Every degenerate input returns an empty array rather than throwing, hanging,
// or trapping, matching the contract already established by elevator_sim.h.
// ============================================================================

// DecimateToJsArray computes `i % decimation`. Integer modulo by zero is a wasm
// trap, not a C++ exception, so the try/catch in SimulateArm cannot intercept
// it -- an unguarded 0 would abort the whole worker.
TEST(SimulateArmGuards, ZeroDecimationReturnsEmpty) {
  Params p;
  p.decimation = 0;
  EXPECT_EQ(Length(RunRaw(p)), 0);
}

TEST(SimulateArmGuards, NegativeDecimationReturnsEmpty) {
  Params p;
  p.decimation = -1;
  EXPECT_EQ(Length(RunRaw(p)), 0);
}

// A non-positive timestep never advances `timestamp`, so the maxSimSeconds
// break is unreachable, and Update(0s) never moves the arm, so the goal limit
// is never reached. That is an infinite loop, which no try/catch can recover
// from.
TEST(SimulateArmGuards, ZeroSimTimestepReturnsEmpty) {
  Params p;
  p.simTimestep = 0.0;
  EXPECT_EQ(Length(RunRaw(p)), 0);
}

TEST(SimulateArmGuards, NegativeSimTimestepReturnsEmpty) {
  Params p;
  p.simTimestep = -0.001;
  EXPECT_EQ(Length(RunRaw(p)), 0);
}

TEST(SimulateArmGuards, ZeroMaxSimSecondsReturnsEmpty) {
  Params p;
  p.maxSimSeconds = 0.0;
  EXPECT_EQ(Length(RunRaw(p)), 0);
}

TEST(SimulateArmGuards, NegativeMaxSimSecondsReturnsEmpty) {
  Params p;
  p.maxSimSeconds = -1.0;
  EXPECT_EQ(Length(RunRaw(p)), 0);
}

// Models::SingleJointedArmFromPhysicalConstants throws std::domain_error for a
// non-positive gearing. Guarding avoids console spam from the optimizer grid.
TEST(SimulateArmGuards, ZeroGearingReturnsEmpty) {
  Params p;
  p.gearing = 0.0;
  EXPECT_EQ(Length(RunRaw(p)), 0);
}

TEST(SimulateArmGuards, NegativeGearingReturnsEmpty) {
  Params p;
  p.gearing = -2.0;
  EXPECT_EQ(Length(RunRaw(p)), 0);
}

// Same factory throws "J must be greater than zero."
TEST(SimulateArmGuards, ZeroMomentOfInertiaReturnsEmpty) {
  Params p;
  p.momentOfInertiaKgMSquared = 0.0;
  EXPECT_EQ(Length(RunRaw(p)), 0);
}

TEST(SimulateArmGuards, NegativeMomentOfInertiaReturnsEmpty) {
  Params p;
  p.momentOfInertiaKgMSquared = -0.001;
  EXPECT_EQ(Length(RunRaw(p)), 0);
}

// A zero-efficiency mechanism is physically inert: the (efficiency - 1) * B * u
// correction exactly cancels the motor torque, so the arm would otherwise hang
// at its lower limit for the full maxSimSeconds producing a flat, useless
// trace.
TEST(SimulateArmGuards, ZeroEfficiencyReturnsEmpty) {
  Params p;
  p.efficiency = 0.0;
  EXPECT_EQ(Length(RunRaw(p)), 0);
}

TEST(SimulateArmGuards, NegativeEfficiencyReturnsEmpty) {
  Params p;
  p.efficiency = -0.5;
  EXPECT_EQ(Length(RunRaw(p)), 0);
}

// ClampVoltageForCurrentLimits ends with std::clamp(x, -vSupply, vSupply).
// A negative supply voltage makes that lo > hi, which is undefined behavior.
TEST(SimulateArmGuards, ZeroBatteryVoltageReturnsEmpty) {
  Params p;
  p.batteryVoltageVolts = 0.0;
  EXPECT_EQ(Length(RunRaw(p)), 0);
}

TEST(SimulateArmGuards, NegativeBatteryVoltageReturnsEmpty) {
  Params p;
  p.batteryVoltageVolts = -12.0;
  EXPECT_EQ(Length(RunRaw(p)), 0);
}

// An inverted travel range makes SingleJointedArmSim::SetState call
// std::clamp(angle, min, max) with lo > hi, which is undefined behavior. The
// guard is behavior-preserving: both limit predicates are already true in this
// configuration, so the loop never ran and the result was already empty.
TEST(SimulateArmGuards, MaxAngleBelowMinAngleReturnsEmpty) {
  Params p;
  p.minAngleRadians = 1.0;
  p.maxAngleRadians = 0.5;
  p.startingAngleRadians = 0.75;
  EXPECT_EQ(Length(RunRaw(p)), 0);
}

TEST(SimulateArmGuards, EqualMinAndMaxAngleReturnsEmpty) {
  Params p;
  p.minAngleRadians = 1.0;
  p.maxAngleRadians = 1.0;
  p.startingAngleRadians = 1.0;
  EXPECT_EQ(Length(RunRaw(p)), 0);
}

// Arm length is deliberately NOT guarded: SimulateArm never divides by it, and
// EfficiencyArmSim's own `> 0.0` branch turns gravity off cleanly. A
// zero-length arm is a gravity-free arm, not an error. Pinned so nobody
// "helpfully" adds a guard here later.
TEST(SimulateArmGuards, ZeroArmLengthStillSimulates) {
  Params p;
  p.armLengthMeters = 0.0;
  const auto rows = Simulate(p);
  ASSERT_FALSE(rows.empty());

  for (size_t i = 0; i < rows.size(); ++i) {
    EXPECT_TRUE(std::isfinite(rows[i].angleRadians)) << "at row " << i;
    EXPECT_TRUE(std::isfinite(rows[i].angularVelocityRadPerSec))
        << "at row " << i;
  }
}

TEST(SimulateArmGuards, NegativeArmLengthStillSimulates) {
  Params p;
  p.armLengthMeters = -0.5;
  EXPECT_GT(Length(RunRaw(p)), 0);
}

// The public entry point must convert numerical failures into an empty array
// rather than letting an exception escape and abort the worker. This config
// passes every guard, keeping the try/catch path reachable.
TEST(SimulateArmGuards, HostileButValidInputDoesNotThrow) {
  Params p;
  p.efficiency = 1e-12;
  p.maxSimSeconds = 0.05;
  emscripten::val result = emscripten::val::undefined();
  EXPECT_NO_THROW({ result = RunRaw(p); });
  EXPECT_GT(Length(result), 0);
}

// ============================================================================
// SimulateArm: nominal trajectory
// ============================================================================

TEST(SimulateArmTrajectory, GoingUpDrivesTowardMaxAngleWithPositiveVoltage) {
  Params p;
  p.goingUp = true;
  const auto rows = Simulate(p);
  ASSERT_GT(rows.size(), 2u);

  EXPECT_TRUE(rows.back().success);
  for (size_t i = 0; i < rows.size(); ++i) {
    EXPECT_GT(rows[i].motorAppliedVoltageVolts, 0.0) << "at row " << i;
  }
  for (size_t i = 1; i < rows.size(); ++i) {
    EXPECT_GT(rows[i].angleRadians, rows[i - 1].angleRadians) << "at row " << i;
  }
}

TEST(SimulateArmTrajectory, GoingDownDrivesTowardMinAngleWithNegativeVoltage) {
  Params p;
  p.goingUp = false;
  p.startingAngleRadians = kMaxAngle;
  const auto rows = Simulate(p);
  ASSERT_GT(rows.size(), 2u);

  EXPECT_TRUE(rows.back().success);
  for (size_t i = 0; i < rows.size(); ++i) {
    EXPECT_LT(rows[i].motorAppliedVoltageVolts, 0.0) << "at row " << i;
  }
  for (size_t i = 1; i < rows.size(); ++i) {
    EXPECT_LT(rows[i].angleRadians, rows[i - 1].angleRadians) << "at row " << i;
  }
}

// The push is guarded by `if (!isAtGoal())`, so the iteration that actually
// reaches the limit is dropped. The reported trajectory therefore always stops
// one timestep short of the goal and never reports the limit angle itself.
TEST(SimulateArmTrajectory, FinalAtLimitStateIsNeverRecorded) {
  Params p;
  p.decimation = 1;
  const auto rows = Simulate(p);
  ASSERT_GT(rows.size(), 2u);
  ASSERT_TRUE(rows.back().success);

  EXPECT_LT(rows.back().angleRadians, kMaxAngle);

  double maxAbsVelocity = 0.0;
  for (const auto& row : rows) {
    maxAbsVelocity =
        std::max(maxAbsVelocity, std::abs(row.angularVelocityRadPerSec));
  }
  // The gap is whatever the arm covers in the single dropped timestep.
  EXPECT_LE(kMaxAngle - rows.back().angleRadians,
            maxAbsVelocity * p.simTimestep * 1.5);
}

// isAtGoal() is evaluated before the first iteration, and the constructor's
// SetState has already populated the output vector the limit predicates read.
TEST(SimulateArmTrajectory, StartingAtTheUpperGoalYieldsEmptyArray) {
  Params p;
  p.goingUp = true;
  p.startingAngleRadians = kMaxAngle;
  EXPECT_EQ(Length(RunRaw(p)), 0);
}

TEST(SimulateArmTrajectory, StartingAtTheLowerGoalYieldsEmptyArray) {
  Params p;
  p.goingUp = false;
  p.startingAngleRadians = kMinAngle;
  EXPECT_EQ(Length(RunRaw(p)), 0);
}

// success is only meaningful on the final element -- it is the one the
// simulation overwrites after the loop. Every earlier row keeps the `true` it
// was constructed with.
TEST(SimulateArmTrajectory, TruncatedRunReportsFailureOnTheLastRowOnly) {
  Params p;
  p.maxSimSeconds = 0.01;
  const auto rows = Simulate(p);
  ASSERT_GT(rows.size(), 1u);

  EXPECT_LT(rows.back().angleRadians, kMaxAngle);
  EXPECT_FALSE(rows.back().success);
  for (size_t i = 0; i + 1 < rows.size(); ++i) {
    EXPECT_TRUE(rows[i].success) << "at row " << i;
  }
}

TEST(SimulateArmTrajectory, StopsAtMaxSimSeconds) {
  Params p;
  p.maxSimSeconds = 0.01;
  const auto rows = Simulate(p);
  ASSERT_FALSE(rows.empty());

  EXPECT_LE(rows.back().timeSeconds, p.maxSimSeconds + p.simTimestep);
}

TEST(SimulateArmTrajectory, TimeAdvancesByOneTimestepPerRow) {
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

// Efficiency scales the motor torque, so a lossier gearbox reaches the same
// goal strictly later. The C++ mirror of arm.worker.test.ts's efficiency case.
TEST(SimulateArmTrajectory, LowerEfficiencyTakesLonger) {
  Params full;
  Params lossy;
  lossy.efficiency = 0.7;

  const auto fullRows = Simulate(full);
  const auto lossyRows = Simulate(lossy);
  ASSERT_FALSE(fullRows.empty());
  ASSERT_FALSE(lossyRows.empty());
  ASSERT_TRUE(lossyRows.back().success);

  EXPECT_GT(lossyRows.back().timeSeconds, fullRows.back().timeSeconds);
}

// Gravity opposes an arm on the way up and assists it on the way down, so the
// same travel takes longer upward. The default arm is far too light for that
// difference to clear numerical noise -- its motor torque outweighs gravity by
// four orders of magnitude -- so this case uses a heavy arm where gravity is a
// meaningful fraction of the available torque.
TEST(SimulateArmTrajectory, GoingUpIsSlowerThanGoingDownForAGravityBoundArm) {
  Params up;
  up.momentOfInertiaKgMSquared = 2.0;
  up.goingUp = true;
  up.startingAngleRadians = kMinAngle;

  Params down = up;
  down.goingUp = false;
  down.startingAngleRadians = kMaxAngle;

  const auto upRows = Simulate(up);
  const auto downRows = Simulate(down);
  ASSERT_FALSE(upRows.empty());
  ASSERT_FALSE(downRows.empty());
  ASSERT_TRUE(upRows.back().success);
  ASSERT_TRUE(downRows.back().success);

  EXPECT_GT(upRows.back().timeSeconds, downRows.back().timeSeconds);
}

// ============================================================================
// SimulateArm: post-step row coherence
//
// A row is pushed after `timestamp += simTimestep`, so every field in it must
// describe the arm at that timestamp. The angle, the velocity, and the derived
// motorRpm are therefore all read AFTER the step. (The pre-step shaft speed is
// still used for the back-EMF term feeding the voltage clamp, which is correct
// -- that clamp must act on the state at the start of the step.)
// ============================================================================

TEST(SimulateArmCoherence, MotorRpmMatchesVelocityInTheSameRow) {
  Params p;
  p.decimation = 1;
  const auto rows = Simulate(p);
  ASSERT_GT(rows.size(), 2u);

  for (size_t i = 0; i < rows.size(); ++i) {
    EXPECT_NEAR(rows[i].motorRpm,
                ToMotorRpm(rows[i].angularVelocityRadPerSec, p.gearing), 1e-9)
        << "at row " << i;
  }
}

// The first row is recorded after a step has already been integrated, so the
// arm is moving and both the velocity and the RPM must be non-zero.
TEST(SimulateArmCoherence, FirstRowReportsNonZeroVelocityAndRpm) {
  Params p;
  p.decimation = 1;
  const auto rows = Simulate(p);
  ASSERT_FALSE(rows.empty());

  EXPECT_GT(rows.front().angularVelocityRadPerSec, 0.0);
  EXPECT_GT(rows.front().motorRpm, 0.0);
}

// The defect this contract fixes was a velocity that described the arm BEFORE
// the step sitting next to an angle that described it AFTER. The secant
// velocity across a step must lie between the velocities reported at its two
// ends, by the mean value theorem. A velocity shifted by one row breaks the
// bracket on every accelerating step.
//
// This uses a heavy arm rather than the default one. At the default inertia the
// plant time constant is ~26 us against a 1 ms step, and RKDP does not resolve
// that: the integrated angle advances about 10% slower than the integrated
// velocity says it should, which swamps the shift being tested for. A 2 kg-m^2
// arm has a ~18 ms time constant, so the integration is accurate and the
// bracket measures the contract rather than truncation error.
TEST(SimulateArmCoherence, ReportedVelocityBracketsTheAngleSecant) {
  Params p;
  p.momentOfInertiaKgMSquared = 2.0;
  p.decimation = 1;
  const auto rows = Simulate(p);
  ASSERT_GT(rows.size(), 2u);

  for (size_t i = 1; i < rows.size(); ++i) {
    const double secant =
        (rows[i].angleRadians - rows[i - 1].angleRadians) / p.simTimestep;
    const double lo = std::min(rows[i - 1].angularVelocityRadPerSec,
                               rows[i].angularVelocityRadPerSec);
    const double hi = std::max(rows[i - 1].angularVelocityRadPerSec,
                               rows[i].angularVelocityRadPerSec);
    EXPECT_GE(secant, lo - 1e-6) << "at row " << i;
    EXPECT_LE(secant, hi + 1e-6) << "at row " << i;
  }
}

// motorRpm is reported as a magnitude, so a descending arm pairs a negative
// velocity with a positive shaft speed.
TEST(SimulateArmCoherence, MotorRpmIsNonNegativeGoingDown) {
  Params p;
  p.goingUp = false;
  p.startingAngleRadians = kMaxAngle;
  p.decimation = 1;
  const auto rows = Simulate(p);
  ASSERT_GT(rows.size(), 2u);

  for (size_t i = 0; i < rows.size(); ++i) {
    EXPECT_LT(rows[i].angularVelocityRadPerSec, 0.0) << "at row " << i;
    EXPECT_GT(rows[i].motorRpm, 0.0) << "at row " << i;
    EXPECT_NEAR(rows[i].motorRpm,
                ToMotorRpm(rows[i].angularVelocityRadPerSec, p.gearing), 1e-9)
        << "at row " << i;
  }
}

TEST(SimulateArmCoherence, MotorRpmStaysConsistentUnderDecimation) {
  Params p;
  p.decimation = 10;
  const auto rows = Simulate(p);
  ASSERT_GT(rows.size(), 2u);

  for (size_t i = 0; i < rows.size(); ++i) {
    EXPECT_NEAR(rows[i].motorRpm,
                ToMotorRpm(rows[i].angularVelocityRadPerSec, p.gearing), 1e-9)
        << "at row " << i;
  }
}

// ============================================================================
// SimulateArm: decimation
// ============================================================================

TEST(SimulateArmDecimation, EmitsEveryNthRowPlusTheLast) {
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
// SimulateArm: current limiting
// ============================================================================

namespace {
// The voltage clamp is computed from the velocity at the START of a timestep,
// but GetCurrentDraw() reports current from the velocity AFTER the step. That
// one-step lag lets the reported current overshoot the limit slightly, so these
// assertions allow a small margin rather than demanding an exact bound.
constexpr double kCurrentLimitMargin = 1.05;
}  // namespace

TEST(SimulateArmCurrentLimits, StatorCurrentStaysWithinLimit) {
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

TEST(SimulateArmCurrentLimits, SupplyCurrentStaysWithinLimit) {
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

TEST(SimulateArmCurrentLimits, AppliedVoltageNeverExceedsSupply) {
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
// SimulateArm: battery model
// ============================================================================

TEST(SimulateArmBattery, StiffBatteryHoldsNominalVoltage) {
  Params p;
  p.batteryResistanceOhms = 0.0;
  const auto rows = Simulate(p);
  ASSERT_FALSE(rows.empty());

  for (size_t i = 0; i < rows.size(); ++i) {
    EXPECT_NEAR(rows[i].batteryVoltageVolts, p.batteryVoltageVolts, 1e-9)
        << "at row " << i;
  }
}

TEST(SimulateArmBattery, RealBatterySagsUnderLoadButStaysPositive) {
  Params p;
  p.batteryResistanceOhms = 0.015;
  const auto rows = Simulate(p);
  ASSERT_GT(rows.size(), 1u);

  double minVoltage = p.batteryVoltageVolts;
  for (const auto& row : rows) {
    minVoltage = std::min(minVoltage, row.batteryVoltageVolts);
    EXPECT_GT(row.batteryVoltageVolts, 0.0);
  }
  EXPECT_LT(minVoltage, p.batteryVoltageVolts);
}

// The single-pole IIR filter is seeded at the nominal voltage, so the first
// sample must still be close to nominal even though the load is already
// applied. Without the filter reset the first sample would jump straight to the
// loaded voltage.
TEST(SimulateArmBattery, FilterIsSeededAtNominalVoltage) {
  Params p;
  p.batteryResistanceOhms = 0.015;
  p.batteryVoltageFilterTimeConstantSeconds = 0.1;
  const auto rows = Simulate(p);
  ASSERT_GT(rows.size(), 1u);

  EXPECT_NEAR(rows.front().batteryVoltageVolts, p.batteryVoltageVolts, 0.5);
}

// ============================================================================
// SimulateArm: energy accounting
// ============================================================================

// energyJoules is the running integral of supply power. With a 0-ohm battery
// the supply voltage is pinned at nominal for every step, so the per-step
// increment is an exact identity rather than an approximation. This pins the
// accumulator to the supply side (not the stator side) and to the correct
// timestep.
TEST(SimulateArmEnergy, IsTheCumulativeIntegralOfSupplyPower) {
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

TEST(SimulateArmEnergy, NetEnergyIsPositiveWhenLifting) {
  Params p;
  p.goingUp = true;
  const auto rows = Simulate(p);
  ASSERT_FALSE(rows.empty());

  EXPECT_GT(rows.back().energyJoules, 0.0);
}

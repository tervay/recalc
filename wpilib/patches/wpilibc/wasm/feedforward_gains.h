#pragma once

#include <emscripten/val.h>

#include <cmath>
#include <stdexcept>

#include "dc_motor.h"
#include "wasm_console.h"
#include "wpi/math/system/DCMotor.hpp"
#include "wpi/math/system/LinearSystem.hpp"
#include "wpi/math/system/Models.hpp"
#include "wpi/units/angle.hpp"
#include "wpi/units/length.hpp"
#include "wpi/units/mass.hpp"
#include "wpi/units/moment_of_inertia.hpp"

// Standard gravity, matching elevator_sim.h's kGravityMetersPerSecondSquared
// (kept as a separate constant here -- rather than shared -- since this
// header may be included alongside elevator_sim.h and C++ does not allow two
// separate `inline constexpr` definitions of the same name to be introduced
// from different headers into one translation unit).
inline constexpr double kFeedforwardGravityMetersPerSecondSquared = 9.80665;

// Feedforward gains (kV, kA, kG) derived from WPILib's Models::* physical
// plants, extended with ReCalc-specific mechanical efficiency and (for the
// linear mechanism) mounting-angle terms that the upstream Models classes do
// not model. At efficiency = 1.0, kV/kA reduce exactly to the values you
// would get by extracting -A(1,1)/B(1,0) and 1/B(1,0) directly from the
// corresponding upstream LinearSystem (see feedforward_gains_test.cc).
struct FeedforwardGains {
  double kV;
  double kA;
  double kG;
};

// ============================================================================
// Layer 1: Pure C++ compute. No emscripten dependency, so these are directly
// unit-testable. May throw std::domain_error (bad physical constants, from
// the Models:: factories) -- callers that need a non-throwing API should use
// the wasm entry points below, which catch and report these.
// ============================================================================

// Computes linear (elevator/arm-extension-style) feedforward gains.
//
// Builds the ideal plant via Models::ElevatorFromPhysicalConstants, extracts
// kV/kA from A/B exactly as the plant's B matrix maps voltage to
// acceleration, then divides both by efficiency: the AngledElevatorSim
// (elevator_sim.h) scales only the B matrix (motor force) by efficiency,
// leaving back-EMF damping (A) untouched, so less of a given voltage
// reaches the load as efficiency drops -- meaning *more* voltage is needed
// per unit of commanded velocity/acceleration as efficiency decreases.
//
// kG reuses the exact idiom already established in elevator_sim.h:132-142,
// so the simulator and this feedforward computation stay consistent.
inline FeedforwardGains ComputeLinearFeedforwardGainsCore(
    const wpi::math::DCMotor& motor, double gearing, double loadKg,
    double spoolRadiusMeters, double efficiency, double angleRadians) {
  auto idealPlantFull = wpi::math::Models::ElevatorFromPhysicalConstants(
      motor, wpi::units::kilogram_t(loadKg),
      wpi::units::meter_t(spoolRadiusMeters), gearing);

  const double kaIdeal = 1.0 / idealPlantFull.B()(1, 0);
  const double kvIdeal = -idealPlantFull.A()(1, 1) / idealPlantFull.B()(1, 0);

  const double kA = kaIdeal / efficiency;
  const double kV = kvIdeal / efficiency;
  const double kG = (kaIdeal / efficiency) *
                    kFeedforwardGravityMetersPerSecondSquared *
                    std::sin(angleRadians);

  return FeedforwardGains{kV, kA, kG};
}

// Computes single-jointed arm feedforward gains.
//
// Same kV/kA idiom as ComputeLinearFeedforwardGainsCore, using
// Models::SingleJointedArmFromPhysicalConstants for the ideal plant.
//
// kG is the voltage required to hold the arm horizontal (the maximum
// gravity-torque case), matching kVkA.ts's calculateAngularFeedforwardKg
// convention: torque_gravity = -comMass * g * comLength * cos(angle), which
// is maximal in magnitude at angle = 0 (horizontal) and zero at angle = 90deg
// (vertical) -- see arm_sim.h's EfficiencyArmSim gravity term
// (`-3/2 * g/L * cos(theta)`, the same physical model specialized to a
// uniform rod) for the cross-check on this angle convention. Since this
// function has no angle parameter (mirroring the TS signature), callers are
// responsible for scaling kG by cos(angle-from-horizontal) if a
// non-horizontal holding voltage is needed.
inline FeedforwardGains ComputeAngularFeedforwardGainsCore(
    const wpi::math::DCMotor& motor, double gearing,
    double momentOfInertiaKgM2, double efficiency, double comMassKg,
    double comLengthMeters) {
  auto idealPlantFull =
      wpi::math::Models::SingleJointedArmFromPhysicalConstants(
          motor, wpi::units::kilogram_square_meter_t(momentOfInertiaKgM2),
          gearing);

  const double kaIdeal = 1.0 / idealPlantFull.B()(1, 0);
  const double kvIdeal = -idealPlantFull.A()(1, 1) / idealPlantFull.B()(1, 0);

  const double kA = kaIdeal / efficiency;
  const double kV = kvIdeal / efficiency;
  const double kG = kA * kFeedforwardGravityMetersPerSecondSquared *
                    comLengthMeters * comMassKg / momentOfInertiaKgM2;

  return FeedforwardGains{kV, kA, kG};
}

// Computes flywheel feedforward gains.
//
// Same kV/kA idiom, using Models::FlywheelFromPhysicalConstants. Flywheels
// are not gravity-loaded (the load spins about an axis with no net torque
// due to gravity), so kG is always 0.
inline FeedforwardGains ComputeFlywheelFeedforwardGainsCore(
    const wpi::math::DCMotor& motor, double gearing,
    double momentOfInertiaKgM2, double efficiency) {
  auto idealPlant = wpi::math::Models::FlywheelFromPhysicalConstants(
      motor, wpi::units::kilogram_square_meter_t(momentOfInertiaKgM2),
      gearing);

  const double kaIdeal = 1.0 / idealPlant.B()(0, 0);
  const double kvIdeal = -idealPlant.A()(0, 0) / idealPlant.B()(0, 0);

  return FeedforwardGains{kvIdeal / efficiency, kaIdeal / efficiency, 0.0};
}

// ============================================================================
// Layer 2: wasm entry points. Thin wrappers around the Core functions above
// that guard degenerate inputs, catch exceptions, and marshal the result to
// a JS object.
// ============================================================================

inline emscripten::val FeedforwardGainsToVal(const FeedforwardGains& gains) {
  emscripten::val result = emscripten::val::object();
  result.set("kV", gains.kV);
  result.set("kA", gains.kA);
  result.set("kG", gains.kG);
  return result;
}

inline emscripten::val ZeroFeedforwardGains() {
  return FeedforwardGainsToVal(FeedforwardGains{0.0, 0.0, 0.0});
}

// Public entry point for linear feedforward gains. Wraps
// ComputeLinearFeedforwardGainsCore in a try-catch so that bad physical
// constants return {kV: 0, kA: 0, kG: 0} with a diagnostic console.warn
// instead of aborting the worker. efficiency <= 0 is guarded explicitly
// (rather than left to throw) because it would otherwise silently produce an
// infinite or wrongly-signed result via division, not a thrown exception.
inline emscripten::val ComputeLinearFeedforwardGains(
    DCMotorWasm* motor, double gearing, double loadKg,
    double spoolRadiusMeters, double efficiency, double angleRadians) {
  if (gearing <= 0.0 || spoolRadiusMeters <= 0.0 || efficiency <= 0.0) {
    return ZeroFeedforwardGains();
  }

  try {
    return FeedforwardGainsToVal(ComputeLinearFeedforwardGainsCore(
        motor->getMotor(), gearing, loadKg, spoolRadiusMeters, efficiency,
        angleRadians));
  } catch (const std::exception& e) {
    ConsoleWarn(
        "ComputeLinearFeedforwardGains: {} (gearing={} loadKg={} "
        "spoolRadiusMeters={})",
        e.what(), gearing, loadKg, spoolRadiusMeters);
    return ZeroFeedforwardGains();
  } catch (...) {
    ConsoleWarn(
        "ComputeLinearFeedforwardGains: unknown exception (gearing={} "
        "loadKg={} spoolRadiusMeters={})",
        gearing, loadKg, spoolRadiusMeters);
    return ZeroFeedforwardGains();
  }
}

// Public entry point for single-jointed arm feedforward gains. Same
// try-catch and efficiency-guard idiom as ComputeLinearFeedforwardGains.
inline emscripten::val ComputeAngularFeedforwardGains(
    DCMotorWasm* motor, double gearing, double momentOfInertiaKgM2,
    double efficiency, double comMassKg, double comLengthMeters) {
  if (gearing <= 0.0 || momentOfInertiaKgM2 <= 0.0 || efficiency <= 0.0) {
    return ZeroFeedforwardGains();
  }

  try {
    return FeedforwardGainsToVal(ComputeAngularFeedforwardGainsCore(
        motor->getMotor(), gearing, momentOfInertiaKgM2, efficiency,
        comMassKg, comLengthMeters));
  } catch (const std::exception& e) {
    ConsoleWarn(
        "ComputeAngularFeedforwardGains: {} (gearing={} momentOfInertiaKgM2="
        "{})",
        e.what(), gearing, momentOfInertiaKgM2);
    return ZeroFeedforwardGains();
  } catch (...) {
    ConsoleWarn(
        "ComputeAngularFeedforwardGains: unknown exception (gearing={} "
        "momentOfInertiaKgM2={})",
        gearing, momentOfInertiaKgM2);
    return ZeroFeedforwardGains();
  }
}

// Public entry point for flywheel feedforward gains. Same try-catch and
// efficiency-guard idiom as ComputeLinearFeedforwardGains.
inline emscripten::val ComputeFlywheelFeedforwardGains(
    DCMotorWasm* motor, double gearing, double momentOfInertiaKgM2,
    double efficiency) {
  if (gearing <= 0.0 || momentOfInertiaKgM2 <= 0.0 || efficiency <= 0.0) {
    return ZeroFeedforwardGains();
  }

  try {
    return FeedforwardGainsToVal(ComputeFlywheelFeedforwardGainsCore(
        motor->getMotor(), gearing, momentOfInertiaKgM2, efficiency));
  } catch (const std::exception& e) {
    ConsoleWarn(
        "ComputeFlywheelFeedforwardGains: {} (gearing={} momentOfInertiaKgM2="
        "{})",
        e.what(), gearing, momentOfInertiaKgM2);
    return ZeroFeedforwardGains();
  } catch (...) {
    ConsoleWarn(
        "ComputeFlywheelFeedforwardGains: unknown exception (gearing={} "
        "momentOfInertiaKgM2={})",
        gearing, momentOfInertiaKgM2);
    return ZeroFeedforwardGains();
  }
}

#pragma once

#include <emscripten/val.h>

#include <stdexcept>

#include "dc_motor.h"
#include "wasm_console.h"
#include "wpi/math/controller/LinearQuadraticRegulator.hpp"
#include "wpi/math/system/DCMotor.hpp"
#include "wpi/math/system/LinearSystem.hpp"
#include "wpi/math/system/Models.hpp"
#include "wpi/units/angle.hpp"
#include "wpi/units/length.hpp"
#include "wpi/units/mass.hpp"
#include "wpi/units/moment_of_inertia.hpp"
#include "wpi/units/time.hpp"
#include "wpi/units/voltage.hpp"

// Feedback gains (kP, kD) derived from an LQR-tuned state-space controller.
// kD is 0.0 for the flywheel, whose plant here has a single state (angular
// velocity): the state-feedback gain matrix K is 1x1, so there is no second
// state (e.g. angular acceleration) for a derivative term to attach to via
// this LQR formulation. This is a limitation of modeling the flywheel as a
// single-state plant, not a general property of velocity control -- a
// classical PIDController's D term is perfectly usable on a flywheel (it
// acts on the derivative of the tracking error, not on a plant state), it's
// just not something this state-feedback approach produces.
struct FeedbackGains {
  double kP;
  double kD;
};

EMSCRIPTEN_DECLARE_VAL_TYPE(FeedbackGainsVal);

// ============================================================================
// Layer 1: Pure C++ compute. No emscripten dependency, so these are directly
// unit-testable. May throw std::domain_error (bad physical constants, from
// the Models:: factories) or std::invalid_argument (LQR: (A, B) pair
// unstabilizable) -- callers that need a non-throwing API should use the
// wasm entry points below, which catch and report these.
// ============================================================================

// Computes elevator position/velocity feedback gains via LQR.
//
// Builds a position-only-output LinearSystem<2,1,1> from the ideal plant,
// scaling the motor-side row by efficiency to model mechanical losses
// (matches elevator_sim.h's SimulateElevatorImpl), then solves the
// discrete-time LQR and compensates for sensor latency.
inline FeedbackGains ComputeElevatorFeedbackGainsCore(
    const wpi::math::DCMotor& motor, double gearing, double massKg,
    double spoolRadiusMeters, double efficiency, double qPositionMeters,
    double qVelocityMPS, double rVolts, double dtSeconds,
    double sensorDelaySeconds) {
  auto idealPlantFull = wpi::math::Models::ElevatorFromPhysicalConstants(
      motor, wpi::units::kilogram_t(massKg),
      wpi::units::meter_t(spoolRadiusMeters), gearing);

  // Efficiency scales the whole motor-side row, so A(1,1) moves with B.
  // A(0,1) is the kinematic derivative relation and must stay exactly 1.
  wpi::math::Matrixd<2, 2> controllerA = idealPlantFull.A();
  controllerA(1, 1) *= efficiency;
  wpi::math::Matrixd<2, 1> controllerB = idealPlantFull.B() * efficiency;
  wpi::math::Matrixd<1, 2> controllerC;
  controllerC << 1, 0;
  wpi::math::Matrixd<1, 1> controllerD;
  controllerD << 0;
  wpi::math::LinearSystem<2, 1, 1> plant{controllerA, controllerB, controllerC,
                                         controllerD};

  wpi::math::LinearQuadraticRegulator<2, 1> controller{
      plant,
      {qPositionMeters, qVelocityMPS},
      {rVolts},
      wpi::units::second_t(dtSeconds)};

  controller.LatencyCompensate(plant, wpi::units::second_t(dtSeconds),
                               wpi::units::second_t(sensorDelaySeconds));

  return FeedbackGains{controller.K(0, 0), controller.K(0, 1)};
}

// Computes single-jointed arm angle/angular-velocity feedback gains via LQR.
//
// Same idiom as ComputeElevatorFeedbackGainsCore, using
// Models::SingleJointedArmFromPhysicalConstants for the ideal plant.
inline FeedbackGains ComputeArmFeedbackGainsCore(
    const wpi::math::DCMotor& motor, double gearing,
    double momentOfInertiaKgMSquared, double efficiency, double qPositionRad,
    double qVelocityRadPerSec, double rVolts, double dtSeconds,
    double sensorDelaySeconds) {
  auto idealPlantFull =
      wpi::math::Models::SingleJointedArmFromPhysicalConstants(
          motor, wpi::units::kilogram_square_meter_t(momentOfInertiaKgMSquared),
          gearing);

  // Efficiency scales the whole motor-side row, so A(1,1) moves with B.
  // A(0,1) is the kinematic derivative relation and must stay exactly 1.
  wpi::math::Matrixd<2, 2> controllerA = idealPlantFull.A();
  controllerA(1, 1) *= efficiency;
  wpi::math::Matrixd<2, 1> controllerB = idealPlantFull.B() * efficiency;
  wpi::math::Matrixd<1, 2> controllerC;
  controllerC << 1, 0;
  wpi::math::Matrixd<1, 1> controllerD;
  controllerD << 0;
  wpi::math::LinearSystem<2, 1, 1> plant{controllerA, controllerB, controllerC,
                                         controllerD};

  wpi::math::LinearQuadraticRegulator<2, 1> controller{
      plant,
      {qPositionRad, qVelocityRadPerSec},
      {rVolts},
      wpi::units::second_t(dtSeconds)};

  controller.LatencyCompensate(plant, wpi::units::second_t(dtSeconds),
                               wpi::units::second_t(sensorDelaySeconds));

  return FeedbackGains{controller.K(0, 0), controller.K(0, 1)};
}

// Computes flywheel angular-velocity feedback gain via LQR.
//
// The ideal plant already has a single (velocity) output, so unlike the
// elevator/arm cases there is no need to rebuild C/D for a position-only
// output -- just rescale A and B by efficiency and reuse the ideal plant's
// C/D.
inline FeedbackGains ComputeFlywheelFeedbackGainsCore(
    const wpi::math::DCMotor& motor, double gearing,
    double momentOfInertiaKgMSquared, double efficiency,
    double qVelocityRadPerSec, double rVolts, double dtSeconds,
    double sensorDelaySeconds) {
  auto idealPlant = wpi::math::Models::FlywheelFromPhysicalConstants(
      motor, wpi::units::kilogram_square_meter_t(momentOfInertiaKgMSquared),
      gearing);

  wpi::math::Matrixd<1, 1> controllerA = idealPlant.A() * efficiency;
  wpi::math::Matrixd<1, 1> controllerB = idealPlant.B() * efficiency;
  wpi::math::LinearSystem<1, 1, 1> plant{controllerA, controllerB,
                                         idealPlant.C(), idealPlant.D()};

  wpi::math::LinearQuadraticRegulator<1, 1> controller{
      plant, {qVelocityRadPerSec}, {rVolts}, wpi::units::second_t(dtSeconds)};

  controller.LatencyCompensate(plant, wpi::units::second_t(dtSeconds),
                               wpi::units::second_t(sensorDelaySeconds));

  return FeedbackGains{controller.K(0, 0), 0.0};
}

// ============================================================================
// Layer 2: wasm entry points. Thin wrappers around the Core functions above
// that guard degenerate inputs, catch exceptions, and marshal the result to
// a JS object.
// ============================================================================

inline FeedbackGainsVal FeedbackGainsToVal(const FeedbackGains& gains) {
  emscripten::val result = emscripten::val::object();
  result.set("kP", gains.kP);
  result.set("kD", gains.kD);
  return FeedbackGainsVal(result);
}

inline FeedbackGainsVal ZeroFeedbackGains() {
  return FeedbackGainsToVal(FeedbackGains{0.0, 0.0});
}

// Public entry point for elevator feedback gains. Wraps
// ComputeElevatorFeedbackGainsCore in a try-catch so that DARE solver
// failures and bad physical constants return {kP: 0, kD: 0} with a
// diagnostic console.warn instead of aborting the worker.
inline FeedbackGainsVal ComputeElevatorFeedbackGains(
    DCMotorWasm* motor, double gearing, double massKg, double spoolRadiusMeters,
    double efficiency, double qPositionMeters, double qVelocityMPS,
    double rVolts, double dtSeconds, double sensorDelaySeconds) {
  if (dtSeconds <= 0.0 || qPositionMeters <= 0.0 || qVelocityMPS <= 0.0 ||
      rVolts <= 0.0) {
    return ZeroFeedbackGains();
  }

  try {
    return FeedbackGainsToVal(ComputeElevatorFeedbackGainsCore(
        motor->getMotor(), gearing, massKg, spoolRadiusMeters, efficiency,
        qPositionMeters, qVelocityMPS, rVolts, dtSeconds, sensorDelaySeconds));
  } catch (const std::exception& e) {
    ConsoleWarn(
        "ComputeElevatorFeedbackGains: {} (gearing={} massKg={} "
        "spoolRadiusMeters={})",
        e.what(), gearing, massKg, spoolRadiusMeters);
    return ZeroFeedbackGains();
  } catch (...) {
    ConsoleWarn(
        "ComputeElevatorFeedbackGains: unknown exception (gearing={} massKg={} "
        "spoolRadiusMeters={})",
        gearing, massKg, spoolRadiusMeters);
    return ZeroFeedbackGains();
  }
}

// Public entry point for single-jointed arm feedback gains. Same try-catch
// idiom as ComputeElevatorFeedbackGains.
inline FeedbackGainsVal ComputeArmFeedbackGains(
    DCMotorWasm* motor, double gearing, double momentOfInertiaKgMSquared,
    double efficiency, double qPositionRad, double qVelocityRadPerSec,
    double rVolts, double dtSeconds, double sensorDelaySeconds) {
  if (dtSeconds <= 0.0 || qPositionRad <= 0.0 || qVelocityRadPerSec <= 0.0 ||
      rVolts <= 0.0) {
    return ZeroFeedbackGains();
  }

  try {
    return FeedbackGainsToVal(ComputeArmFeedbackGainsCore(
        motor->getMotor(), gearing, momentOfInertiaKgMSquared, efficiency,
        qPositionRad, qVelocityRadPerSec, rVolts, dtSeconds,
        sensorDelaySeconds));
  } catch (const std::exception& e) {
    ConsoleWarn(
        "ComputeArmFeedbackGains: {} (gearing={} momentOfInertiaKgMSquared={})",
        e.what(), gearing, momentOfInertiaKgMSquared);
    return ZeroFeedbackGains();
  } catch (...) {
    ConsoleWarn(
        "ComputeArmFeedbackGains: unknown exception (gearing={} "
        "momentOfInertiaKgMSquared={})",
        gearing, momentOfInertiaKgMSquared);
    return ZeroFeedbackGains();
  }
}

// Public entry point for flywheel feedback gain. Same try-catch idiom as
// ComputeElevatorFeedbackGains.
inline FeedbackGainsVal ComputeFlywheelFeedbackGains(
    DCMotorWasm* motor, double gearing, double momentOfInertiaKgMSquared,
    double efficiency, double qVelocityRadPerSec, double rVolts,
    double dtSeconds, double sensorDelaySeconds) {
  if (dtSeconds <= 0.0 || qVelocityRadPerSec <= 0.0 || rVolts <= 0.0) {
    return ZeroFeedbackGains();
  }

  try {
    return FeedbackGainsToVal(ComputeFlywheelFeedbackGainsCore(
        motor->getMotor(), gearing, momentOfInertiaKgMSquared, efficiency,
        qVelocityRadPerSec, rVolts, dtSeconds, sensorDelaySeconds));
  } catch (const std::exception& e) {
    ConsoleWarn(
        "ComputeFlywheelFeedbackGains: {} (gearing={} "
        "momentOfInertiaKgMSquared={})",
        e.what(), gearing, momentOfInertiaKgMSquared);
    return ZeroFeedbackGains();
  } catch (...) {
    ConsoleWarn(
        "ComputeFlywheelFeedbackGains: unknown exception (gearing={} "
        "momentOfInertiaKgMSquared={})",
        gearing, momentOfInertiaKgMSquared);
    return ZeroFeedbackGains();
  }
}

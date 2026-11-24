#pragma once

#include <emscripten/val.h>

#include <algorithm>
#include <cmath>
#include <stdexcept>
#include <vector>

#include "dc_motor.h"
#include "hal_init.h"
#include "sim_util.h"
#include "wasm_console.h"
#include "wpi/math/system/Models.hpp"
#include "wpi/simulation/DCMotorSim.hpp"
#include "wpi/simulation/RoboRioSim.hpp"
#include "wpi/system/RobotController.hpp"

EMSCRIPTEN_DECLARE_VAL_TYPE(MotorCurveRows);

// One point on a motor's characteristic curve.
struct MotorCurveSimStateInternal {
  double angularVelocityRadPerSec;
  double statorCurrentDrawAmps;
  double supplyCurrentDrawAmps;
  double torqueNewtonMeters;
  double motorAppliedVoltageVolts;
  double efficiency;
};

struct MotorCurveParams {
  double momentOfInertiaKgMSquared;
  double statorLimitAmps;
  double supplyLimitAmps;
  double statorVoltageVolts;
  double supplyVoltageVolts;
  double simTimestep;
  int decimation;
  int maxIterations;
};

// Sweeps a motor from stall to free speed. SI units; current limits are totals
// (per-motor limit * quantity). The moment of inertia only sets sample density,
// not the steady-state curve. Returns a JS array decimated by `decimation`.
inline emscripten::val SimulateMotorCurveImpl(const DCMotorWasm* motor,
                                              const MotorCurveParams& params) {
  // Not recoverable further down: modulo by zero traps, a non-positive timestep
  // never accelerates the motor, and ClampVoltageForCurrentLimits' trailing
  // std::clamp(x, -vSupply, vSupply) is UB once vSupply goes negative.
  if (params.decimation <= 0 || params.maxIterations <= 0 ||
      params.simTimestep <= 0.0 || params.momentOfInertiaKgMSquared <= 0.0 ||
      params.supplyVoltageVolts <= 0.0) {
    return emscripten::val::array();
  }

  EnsureHalInitialized();

  constexpr double kGearing = 1.0;

  wpi::sim::DCMotorSim sim(
      wpi::math::Models::AngularPositionFromPhysicalConstants(
          motor->getMotor(),
          wpi::units::kilogram_square_meter_t(params.momentOfInertiaKgMSquared),
          kGearing),
      motor->getMotor());

  // SetInputVoltage clamps to the RoboRIO bus voltage, so publish it here.
  wpi::sim::RoboRioSim::SetVInVoltage(
      wpi::units::volt_t(params.supplyVoltageVolts));

  const double rOhms = motor->getROhms();
  const double kvRadPerSecPerVolt = motor->getKvRadPerSecPerVolt();
  const double freeCurrentAmps = motor->getFreeCurrentAmps();
  const double freeSpeedRadPerSec = motor->getFreeSpeedRadPerSec();

  std::vector<MotorCurveSimStateInternal> states;

  int iterations = 0;
  while (sim.GetAngularVelocity().to<double>() <= freeSpeedRadPerSec &&
         iterations < params.maxIterations) {
    iterations++;

    const auto motorShaftRadPerSec = sim.GetAngularVelocity().to<double>();
    const double vBackEmf = kvRadPerSecPerVolt > 0.0
                                ? motorShaftRadPerSec / kvRadPerSecPerVolt
                                : 0.0;
    const double vSupply = wpi::RobotController::GetInputVoltage();

    const double vApplied = ClampVoltageForCurrentLimits({
        .vApplied = params.statorVoltageVolts,
        .vBackEmf = vBackEmf,
        .rOhms = rOhms,
        .statorLimitAmps = params.statorLimitAmps,
        .supplyLimitAmps = params.supplyLimitAmps,
        .vSupply = vSupply,
    });

    sim.SetInputVoltage(wpi::units::volt_t(vApplied));

    // Recorded before Update(), unlike flywheel_sim.h: a characteristic curve
    // needs every field at the same instant, and sampling after the step would
    // drop the stall point.
    const auto statorCurrent = sim.GetCurrentDraw().to<double>();
    const double supplyCurrent =
        SupplyCurrentFromStator(statorCurrent, vApplied, vSupply);

    // Shaft power as back-EMF times torque-producing current, not Kt * I * w:
    // the plant is frictionless and Kt (stall-derived) is inconsistent with Kv
    // (free-speed-derived), so Kt * I * w exceeds 100% efficiency near free
    // speed wherever Kt * Kv > 1.
    const double torqueCurrent = statorCurrent - freeCurrentAmps;
    const double inputPower = vApplied * statorCurrent;
    const double efficiency =
        inputPower == 0.0
            ? 0.0
            : std::max(0.0, (vBackEmf * torqueCurrent) / inputPower);

    states.push_back({
        .angularVelocityRadPerSec = motorShaftRadPerSec,
        .statorCurrentDrawAmps = statorCurrent,
        .supplyCurrentDrawAmps = supplyCurrent,
        .torqueNewtonMeters = sim.GetTorque().to<double>(),
        .motorAppliedVoltageVolts = vApplied,
        .efficiency = efficiency,
    });

    sim.Update(wpi::units::second_t(params.simTimestep));
  }

  return DecimateToJsArray<MotorCurveSimStateInternal>(
      states, params.decimation, [](const MotorCurveSimStateInternal& s) {
        emscripten::val state = emscripten::val::object();
        state.set("angularVelocityRadPerSec", s.angularVelocityRadPerSec);
        state.set("statorCurrentDrawAmps", s.statorCurrentDrawAmps);
        state.set("supplyCurrentDrawAmps", s.supplyCurrentDrawAmps);
        state.set("torqueNewtonMeters", s.torqueNewtonMeters);
        state.set("motorAppliedVoltageVolts", s.motorAppliedVoltageVolts);
        state.set("efficiency", s.efficiency);
        return state;
      });
}

// Numerical exceptions return an empty array rather than aborting the worker.
inline MotorCurveRows SimulateMotorCurve(const DCMotorWasm* motor,
                                         const MotorCurveParams& params) {
  try {
    return MotorCurveRows(SimulateMotorCurveImpl(motor, params));
  } catch (const std::exception& e) {
    ConsoleWarn(
        "SimulateMotorCurve: {} (moi={} statorA={} supplyA={} statorV={} "
        "supplyV={})",
        e.what(), params.momentOfInertiaKgMSquared, params.statorLimitAmps,
        params.supplyLimitAmps, params.statorVoltageVolts,
        params.supplyVoltageVolts);
    return MotorCurveRows(emscripten::val::array());
  } catch (...) {
    ConsoleWarn(
        "SimulateMotorCurve: unknown exception (moi={} statorA={} supplyA={} "
        "statorV={} supplyV={})",
        params.momentOfInertiaKgMSquared, params.statorLimitAmps,
        params.supplyLimitAmps, params.statorVoltageVolts,
        params.supplyVoltageVolts);
    return MotorCurveRows(emscripten::val::array());
  }
}

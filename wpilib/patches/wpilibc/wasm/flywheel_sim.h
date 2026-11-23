#pragma once

#include <emscripten/val.h>

#include <cmath>
#include <numbers>
#include <stdexcept>
#include <vector>

#include "dc_motor.h"
#include "hal_init.h"
#include "sim_util.h"
#include "wasm_console.h"
#include "wpi/math/filter/LinearFilter.hpp"
#include "wpi/math/system/Models.hpp"
#include "wpi/math/system/NumericalIntegration.hpp"
#include "wpi/simulation/BatterySim.hpp"
#include "wpi/simulation/FlywheelSim.hpp"
#include "wpi/simulation/RoboRioSim.hpp"
#include "wpi/system/RobotController.hpp"

// FlywheelSim subclass that supports torque efficiency [0, 1].
// Overrides UpdateX to scale the motor-side dynamics by efficiency.
//
// Efficiency models a lossy gearbox delivering efficiency * Kt * I to the
// wheel, with I = (u - backEmf) / R. Both the applied-voltage term and the
// back-EMF term pass through the same gearbox, so efficiency multiplies the
// whole state derivative -- A and B alike -- and cancels at steady state.
// Efficiency therefore costs spin-up time, never top speed.
class EfficiencyFlywheelSim : public wpi::sim::FlywheelSim {
 public:
  EfficiencyFlywheelSim(const wpi::math::DCMotor& gearbox, double gearing,
                        wpi::units::kilogram_square_meter_t moi,
                        double efficiency)
      : FlywheelSim(wpi::math::Models::FlywheelFromPhysicalConstants(
                        gearbox, moi, gearing),
                    gearbox),
        m_efficiency(efficiency) {}

 protected:
  wpi::math::Vectord<1> UpdateX(const wpi::math::Vectord<1>& currentXhat,
                                const wpi::math::Vectord<1>& u,
                                wpi::units::second_t dt) override {
    return wpi::math::RKDP(
        [&](const wpi::math::Vectord<1>& x,
            const wpi::math::Vectord<1>& u_) -> wpi::math::Vectord<1> {
          wpi::math::Vectord<1> xdot = m_plant.A() * x + m_plant.B() * u_;
          // Gearbox losses on the single motor-side state.
          xdot *= m_efficiency;
          return xdot;
        },
        currentXhat, u, dt);
  }

 private:
  double m_efficiency;
};

EMSCRIPTEN_DECLARE_VAL_TYPE(FlywheelSimRows);

// Internal state record for one timestep of the flywheel simulation.
struct FlywheelSimStateInternal {
  double angularVelocityRadPerSec;
  double statorCurrentDrawAmps;
  double supplyCurrentDrawAmps;
  double timeSeconds;
  double batteryVoltageVolts;
  double motorAppliedVoltageVolts;
  double motorRpm;
  double energyJoules;
  bool success;
};

struct FlywheelSimParams {
  double gearing;
  double momentOfInertiaKgMSquared;
  double targetAngularVelocityRadPerSec;
  double statorLimitAmps;
  double supplyLimitAmps;
  double statorVoltageVolts;
  double batteryResistanceOhms;
  double batteryVoltageVolts;
  double efficiency;
  double simTimestep;
  int decimation;
  double maxSimSeconds;
  double batteryVoltageFilterTimeConstantSeconds;
  double initialAngularVelocityRadPerSec;
};

// Full flywheel simulation loop. Parameters must be in SI units:
//   statorLimitAmps   — total stator current limit (per-motor limit * quantity)
//   supplyLimitAmps   — total supply current limit (per-motor limit * quantity)
//   efficiency        — torque efficiency in [0, 1]
// Returns a JS array of state objects decimated by `decimation`, with the last
// state always included (matches obliterateArray behaviour in utils.ts).
inline emscripten::val SimulateFlywheelImpl(const DCMotorWasm* motor,
                                            const FlywheelSimParams& params) {
  // Guard degenerate inputs, mirroring elevator_sim.h. Three of these are not
  // recoverable further down and so cannot be left to the try/catch below:
  //   - decimation: DecimateToJsArray computes `i % decimation`, and integer
  //     modulo by zero is a wasm trap rather than a C++ exception.
  //   - simTimestep: a non-positive step never advances `timestamp`, so the
  //     maxSimSeconds break is unreachable and Update() never spins the wheel.
  //     The loop never terminates.
  //   - batteryVoltageVolts: ClampVoltageForCurrentLimits ends with
  //     std::clamp(x, -vSupply, vSupply), which is undefined behavior once
  //     vSupply goes negative.
  // A non-positive gearing or moment of inertia makes the model factory throw.
  // A non-positive target needs no guard: the loop below exits immediately.
  if (params.decimation <= 0 || params.simTimestep <= 0.0 ||
      params.maxSimSeconds <= 0.0 || params.gearing <= 0.0 ||
      params.momentOfInertiaKgMSquared <= 0.0 || params.efficiency <= 0.0 ||
      params.batteryVoltageVolts <= 0.0) {
    return emscripten::val::array();
  }

  EnsureHalInitialized();

  EfficiencyFlywheelSim flywheel(
      motor->getMotor(), params.gearing,
      wpi::units::kilogram_square_meter_t(params.momentOfInertiaKgMSquared),
      params.efficiency);

  // Set initial angular velocity (non-zero for recovery simulations)
  if (params.initialAngularVelocityRadPerSec != 0.0) {
    wpi::math::Vectord<1> initialState;
    initialState(0) = params.initialAngularVelocityRadPerSec;
    flywheel.SetState(initialState);
  }

  wpi::sim::RoboRioSim::SetVInVoltage(
      wpi::units::volt_t(params.batteryVoltageVolts));

  const double rOhms = motor->getROhms();
  const double kvRadPerSecPerVolt = motor->getKvRadPerSecPerVolt();
  double timestamp = 0.0;
  double energyJoules = 0.0;

  auto batteryFilter = wpi::math::LinearFilter<double>::SinglePoleIIR(
      params.batteryVoltageFilterTimeConstantSeconds,
      wpi::units::second_t(params.simTimestep));
  batteryFilter.Reset(std::span<const double>{&params.batteryVoltageVolts, 1},
                      std::span<const double>{&params.batteryVoltageVolts, 1});

  std::vector<FlywheelSimStateInternal> states;

  while (flywheel.GetAngularVelocity().to<double>() <
         params.targetAngularVelocityRadPerSec) {
    double vApplied = params.statorVoltageVolts;

    // Motor shaft angular velocity (rad/s) from flywheel velocity
    const auto flywheelRadPerSec = flywheel.GetAngularVelocity().to<double>();
    const double motorShaftRadPerSec = flywheelRadPerSec * params.gearing;
    const double vBackEmf = kvRadPerSecPerVolt > 0.0
                                ? motorShaftRadPerSec / kvRadPerSecPerVolt
                                : 0.0;

    const double vSupply = wpi::RobotController::GetInputVoltage();

    vApplied = ClampVoltageForCurrentLimits({
        .vApplied = vApplied,
        .vBackEmf = vBackEmf,
        .rOhms = rOhms,
        .statorLimitAmps = params.statorLimitAmps,
        .supplyLimitAmps = params.supplyLimitAmps,
        .vSupply = vSupply,
    });

    flywheel.SetInputVoltage(wpi::units::volt_t(vApplied));
    flywheel.Update(wpi::units::second_t(params.simTimestep));
    timestamp += params.simTimestep;

    const auto statorCurrent = flywheel.GetCurrentDraw().to<double>();
    const double supplyCurrent =
        SupplyCurrentFromStator(statorCurrent, vApplied, vSupply);
    energyJoules += supplyCurrent * vSupply * params.simTimestep;

    // Battery voltage under load, smoothed by a single-pole IIR filter
    std::vector<wpi::units::ampere_t> currents = {
        wpi::units::ampere_t(supplyCurrent),
    };
    const auto rawBatteryVoltage =
        wpi::sim::BatterySim::Calculate(
            wpi::units::volt_t(params.batteryVoltageVolts),
            wpi::units::ohm_t(params.batteryResistanceOhms), currents)
            .to<double>();
    const double filteredBatteryVoltage =
        batteryFilter.Calculate(rawBatteryVoltage);

    // The row is stamped with the post-step `timestamp`, so every field in it
    // is read after the step. `motorShaftRadPerSec` above is the pre-step value
    // and is deliberately not reused here: it feeds the back-EMF term of the
    // voltage clamp, which must act on the state at the start of the step.
    const auto updatedFlywheelRadPerSec =
        flywheel.GetAngularVelocity().to<double>();
    const double motorRpm = updatedFlywheelRadPerSec * params.gearing * 60.0 /
                            (2.0 * std::numbers::pi);
    states.push_back({
        .angularVelocityRadPerSec = updatedFlywheelRadPerSec,
        .statorCurrentDrawAmps = statorCurrent,
        .supplyCurrentDrawAmps = supplyCurrent,
        .timeSeconds = timestamp,
        .batteryVoltageVolts = filteredBatteryVoltage,
        .motorAppliedVoltageVolts = vApplied,
        .motorRpm = motorRpm,
        .energyJoules = energyJoules,
        .success = true,
    });

    wpi::sim::RoboRioSim::SetVInVoltage(
        wpi::units::volt_t(filteredBatteryVoltage));

    if (timestamp > params.maxSimSeconds) {
      if (!states.empty()) {
        states.back().success = false;
      }
      break;
    }
  }

  return DecimateToJsArray<FlywheelSimStateInternal>(
      states, params.decimation, [](const FlywheelSimStateInternal& s) {
        emscripten::val state = emscripten::val::object();
        state.set("angularVelocityRadPerSec", s.angularVelocityRadPerSec);
        state.set("statorCurrentDrawAmps", s.statorCurrentDrawAmps);
        state.set("supplyCurrentDrawAmps", s.supplyCurrentDrawAmps);
        state.set("timeSeconds", s.timeSeconds);
        state.set("batteryVoltageVolts", s.batteryVoltageVolts);
        state.set("motorAppliedVoltageVolts", s.motorAppliedVoltageVolts);
        state.set("motorRpm", s.motorRpm);
        state.set("energyJoules", s.energyJoules);
        state.set("success", s.success);
        return state;
      });
}

// Public entry point. Wraps SimulateFlywheelImpl in a try-catch so that
// numerical exceptions return an empty array with a diagnostic console.warn
// instead of aborting the worker.
inline FlywheelSimRows SimulateFlywheel(const DCMotorWasm* motor,
                                        const FlywheelSimParams& params) {
  try {
    return FlywheelSimRows(SimulateFlywheelImpl(motor, params));
  } catch (const std::exception& e) {
    ConsoleWarn(
        "SimulateFlywheel: {} (gearing={} moi={} target={} statorA={} "
        "supplyA={})",
        e.what(), params.gearing, params.momentOfInertiaKgMSquared,
        params.targetAngularVelocityRadPerSec, params.statorLimitAmps,
        params.supplyLimitAmps);
    return FlywheelSimRows(emscripten::val::array());
  } catch (...) {
    ConsoleWarn(
        "SimulateFlywheel: unknown exception (gearing={} moi={} target={} "
        "statorA={} supplyA={})",
        params.gearing, params.momentOfInertiaKgMSquared,
        params.targetAngularVelocityRadPerSec, params.statorLimitAmps,
        params.supplyLimitAmps);
    return FlywheelSimRows(emscripten::val::array());
  }
}

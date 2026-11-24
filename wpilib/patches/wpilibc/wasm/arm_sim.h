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
#include "wpi/math/system/NumericalIntegration.hpp"
#include "wpi/simulation/BatterySim.hpp"
#include "wpi/simulation/RoboRioSim.hpp"
#include "wpi/simulation/SingleJointedArmSim.hpp"
#include "wpi/system/RobotController.hpp"

inline constexpr double kArmGravityMetersPerSecondSquared = 9.80665;

struct EfficiencyArmConfig {
  double gearing;
  double momentOfInertiaKgMSquared;
  double armLengthMeters;
  double minAngleRadians;
  double maxAngleRadians;
  double startingAngleRadians;
  double efficiency;
};

// SingleJointedArmSim subclass that supports torque efficiency [0, 1].
// Overrides UpdateX to scale the motor-side dynamics by efficiency, and
// re-applies gravity (which would otherwise be omitted since UpdateX is fully
// replaced).
//
// Efficiency models a lossy gearbox delivering efficiency * Kt * I to the arm,
// with I = (u - backEmf) / R. Both the applied-voltage term and the back-EMF
// term pass through the same gearbox, so efficiency multiplies the whole
// angular-acceleration row -- A and B alike -- and cancels at steady state.
// Efficiency therefore costs acceleration, never top speed. Gravity acts on
// the arm directly rather than through the gearbox, so it is applied outside
// the scale.
class EfficiencyArmSim : public wpi::sim::SingleJointedArmSim {
 public:
  EfficiencyArmSim(const wpi::math::DCMotor& gearbox,
                   const EfficiencyArmConfig& config)
      : SingleJointedArmSim(gearbox, config.gearing,
                            wpi::units::kilogram_square_meter_t(
                                config.momentOfInertiaKgMSquared),
                            wpi::units::meter_t(config.armLengthMeters),
                            wpi::units::radian_t(config.minAngleRadians),
                            wpi::units::radian_t(config.maxAngleRadians),
                            false,  // We handle gravity manually in UpdateX
                            wpi::units::radian_t(config.startingAngleRadians)),
        m_minAngleRad(config.minAngleRadians),
        m_maxAngleRad(config.maxAngleRadians),
        m_armLenMeters(config.armLengthMeters),
        m_efficiency(config.efficiency) {}

 protected:
  wpi::math::Vectord<2> UpdateX(const wpi::math::Vectord<2>& currentXhat,
                                const wpi::math::Vectord<1>& u,
                                wpi::units::second_t dt) override {
    auto updatedXhat = wpi::math::RKDP(
        [&](const wpi::math::Vectord<2>& x,
            const wpi::math::Vectord<1>& u_) -> wpi::math::Vectord<2> {
          wpi::math::Vectord<2> xdot = m_plant.A() * x + m_plant.B() * u_;
          // Gearbox losses on the motor-side row. xdot(0) is the kinematic
          // omega = dtheta/dt relation and must not be scaled.
          xdot(1) *= m_efficiency;
          // Gravity on a point mass at the arm length: alpha = -g / L *
          // cos(theta), matching the calculator's J = m * L^2 and kG.
          if (m_armLenMeters > 0.0) {
            xdot(1) += -kArmGravityMetersPerSecondSquared / m_armLenMeters *
                       std::cos(x(0));
          }
          return xdot;
        },
        currentXhat, u, dt);

    if (WouldHitLowerLimit(wpi::units::radian_t{updatedXhat(0)})) {
      return wpi::math::Vectord<2>{m_minAngleRad, 0.0};
    }
    if (WouldHitUpperLimit(wpi::units::radian_t{updatedXhat(0)})) {
      return wpi::math::Vectord<2>{m_maxAngleRad, 0.0};
    }
    return updatedXhat;
  }

 private:
  double m_minAngleRad;
  double m_maxAngleRad;
  double m_armLenMeters;
  double m_efficiency;
};

EMSCRIPTEN_DECLARE_VAL_TYPE(ArmSimRows);

// Internal state record for one timestep of the arm simulation.
struct ArmSimStateInternal {
  double angleRadians;
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

struct ArmSimParams {
  double gearing;
  double momentOfInertiaKgMSquared;
  double armLengthMeters;
  double minAngleRadians;
  double maxAngleRadians;
  double startingAngleRadians;
  double statorLimitAmps;
  double supplyLimitAmps;
  double statorVoltageVolts;
  double batteryResistanceOhms;
  double batteryVoltageVolts;
  double efficiency;
  bool goingUp;
  double simTimestep;
  int decimation;
  double maxSimSeconds;
  double batteryVoltageFilterTimeConstantSeconds;
};

// Full single-jointed arm simulation loop. Parameters must be in SI units:
//   statorLimitAmps   — total stator current limit (per-motor limit × quantity)
//   supplyLimitAmps   — total supply current limit (per-motor limit × quantity)
//   efficiency        — torque efficiency in [0, 1]
//   goingUp           — true: arm moves from startingAngle toward maxAngle;
//                       false: arm moves from startingAngle toward minAngle
// Returns a JS array of state objects decimated by `decimation`, with the last
// state always included (matches obliterateArray behaviour in utils.ts).
inline emscripten::val SimulateArmImpl(const DCMotorWasm* motor,
                                       const ArmSimParams& params) {
  // Guard degenerate inputs, mirroring elevator_sim.h. Three of these are not
  // recoverable further down and so cannot be left to the try/catch below:
  //   - decimation: DecimateToJsArray computes `i % decimation`, and integer
  //     modulo by zero is a wasm trap rather than a C++ exception.
  //   - simTimestep: a non-positive step never advances `timestamp`, so the
  //     maxSimSeconds break is unreachable and Update() never moves the arm.
  //     The loop never terminates.
  //   - batteryVoltageVolts: ClampVoltageForCurrentLimits ends with
  //     std::clamp(x, -vSupply, vSupply), which is undefined behavior once
  //     vSupply goes negative.
  // A non-positive gearing or moment of inertia makes the model factory throw,
  // and an inverted travel range makes SetState's std::clamp undefined. Arm
  // length is deliberately absent: nothing here divides by it, and
  // EfficiencyArmSim's own `> 0.0` branch turns gravity off cleanly.
  if (params.decimation <= 0 || params.simTimestep <= 0.0 ||
      params.maxSimSeconds <= 0.0 || params.gearing <= 0.0 ||
      params.momentOfInertiaKgMSquared <= 0.0 || params.efficiency <= 0.0 ||
      params.batteryVoltageVolts <= 0.0 ||
      params.maxAngleRadians <= params.minAngleRadians) {
    return emscripten::val::array();
  }

  EnsureHalInitialized();

  EfficiencyArmSim arm(
      motor->getMotor(),
      {
          .gearing = params.gearing,
          .momentOfInertiaKgMSquared = params.momentOfInertiaKgMSquared,
          .armLengthMeters = params.armLengthMeters,
          .minAngleRadians = params.minAngleRadians,
          .maxAngleRadians = params.maxAngleRadians,
          .startingAngleRadians = params.startingAngleRadians,
          .efficiency = params.efficiency,
      });

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

  std::vector<ArmSimStateInternal> states;

  const auto isAtGoal = [&] {
    return params.goingUp ? arm.HasHitUpperLimit() : arm.HasHitLowerLimit();
  };

  while (!isAtGoal()) {
    // Directed voltage: positive when going up, negative when going down
    double vApplied =
        params.goingUp ? params.statorVoltageVolts : -params.statorVoltageVolts;

    // Motor shaft angular velocity (rad/s) from arm velocity
    const auto armRadPerSec = arm.GetVelocity().to<double>();
    const double motorShaftRadPerSec = armRadPerSec * params.gearing;
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

    arm.SetInputVoltage(wpi::units::volt_t(vApplied));
    arm.Update(wpi::units::second_t(params.simTimestep));
    timestamp += params.simTimestep;

    const auto statorCurrent = arm.GetCurrentDraw().to<double>();
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

    if (!isAtGoal()) {
      // The row is stamped with the post-step `timestamp`, so every field in it
      // is read after the step. `motorShaftRadPerSec` above is the pre-step
      // value and is deliberately not reused here: it feeds the back-EMF term
      // of the voltage clamp, which must act on the state at the start of the
      // step. motorRpm is a magnitude because the arm runs in both directions.
      const auto updatedArmRadPerSec = arm.GetVelocity().to<double>();
      const double motorRpm = std::abs(updatedArmRadPerSec * params.gearing) *
                              60.0 / (2.0 * std::numbers::pi);
      states.push_back({
          .angleRadians = arm.GetAngle().to<double>(),
          .angularVelocityRadPerSec = updatedArmRadPerSec,
          .statorCurrentDrawAmps = statorCurrent,
          .supplyCurrentDrawAmps = supplyCurrent,
          .timeSeconds = timestamp,
          .batteryVoltageVolts = filteredBatteryVoltage,
          .motorAppliedVoltageVolts = vApplied,
          .motorRpm = motorRpm,
          .energyJoules = energyJoules,
          .success = true,
      });
    }

    wpi::sim::RoboRioSim::SetVInVoltage(
        wpi::units::volt_t(filteredBatteryVoltage));

    if (timestamp > params.maxSimSeconds) {
      if (!states.empty()) {
        states.back().success = false;
      }
      break;
    }
  }

  return DecimateToJsArray<ArmSimStateInternal>(
      states, params.decimation, [](const ArmSimStateInternal& s) {
        emscripten::val state = emscripten::val::object();
        state.set("angleRadians", s.angleRadians);
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

// Public entry point. Wraps SimulateArmImpl in a try-catch so that numerical
// exceptions return an empty array with a diagnostic console.warn instead of
// aborting the worker.
inline ArmSimRows SimulateArm(const DCMotorWasm* motor,
                              const ArmSimParams& params) {
  try {
    return ArmSimRows(SimulateArmImpl(motor, params));
  } catch (const std::exception& e) {
    ConsoleWarn(
        "SimulateArm: {} (gearing={} moi={} armLen={} minAngle={} "
        "maxAngle={})",
        e.what(), params.gearing, params.momentOfInertiaKgMSquared,
        params.armLengthMeters, params.minAngleRadians, params.maxAngleRadians);
    return ArmSimRows(emscripten::val::array());
  } catch (...) {
    ConsoleWarn(
        "SimulateArm: unknown exception (gearing={} moi={} armLen={} "
        "minAngle={} maxAngle={})",
        params.gearing, params.momentOfInertiaKgMSquared,
        params.armLengthMeters, params.minAngleRadians, params.maxAngleRadians);
    return ArmSimRows(emscripten::val::array());
  }
}

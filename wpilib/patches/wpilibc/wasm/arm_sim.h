#pragma once

#include <emscripten/val.h>

#include <cmath>
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

// SingleJointedArmSim subclass that supports torque efficiency [0, 1].
// Overrides UpdateX to scale the motor force (B matrix) by efficiency while
// leaving back-EMF damping (A matrix) untouched, and re-applies gravity
// (which would otherwise be omitted since UpdateX is fully replaced).
class EfficiencyArmSim : public wpi::sim::SingleJointedArmSim {
 public:
  EfficiencyArmSim(const wpi::math::DCMotor& gearbox, double gearing,
                   wpi::units::kilogram_square_meter_t moi,
                   wpi::units::meter_t armLength, wpi::units::radian_t minAngle,
                   wpi::units::radian_t maxAngle, double startingAngleRadians,
                   double efficiency)
      : SingleJointedArmSim(gearbox, gearing, moi, armLength, minAngle,
                            maxAngle,
                            false,  // We handle gravity manually in UpdateX
                            wpi::units::radian_t(startingAngleRadians)),
        m_minAngleRad(minAngle.to<double>()),
        m_maxAngleRad(maxAngle.to<double>()),
        m_armLenMeters(armLength.to<double>()),
        m_efficiency(efficiency) {}

 protected:
  wpi::math::Vectord<2> UpdateX(const wpi::math::Vectord<2>& currentXhat,
                                const wpi::math::Vectord<1>& u,
                                wpi::units::second_t dt) override {
    auto updatedXhat = wpi::math::RKDP(
        [&](const wpi::math::Vectord<2>& x,
            const wpi::math::Vectord<1>& u_) -> wpi::math::Vectord<2> {
          wpi::math::Vectord<2> xdot = m_plant.A() * x + m_plant.B() * u_;
          // Scale motor torque by efficiency (B term only, preserves back-EMF)
          xdot(1) += (m_efficiency - 1.0) * m_plant.B()(1, 0) * u_(0);
          // Gravity: alpha = -3/2 * g / L * cos(theta), per WPILib arm model
          if (m_armLenMeters > 0.0) {
            xdot(1) += -3.0 / 2.0 * 9.8 / m_armLenMeters * std::cos(x(0));
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

// Full single-jointed arm simulation loop. Parameters must be in SI units:
//   statorLimitAmps   — total stator current limit (per-motor limit × quantity)
//   supplyLimitAmps   — total supply current limit (per-motor limit × quantity)
//   efficiency        — torque efficiency in [0, 1]
//   goingUp           — true: arm moves from startingAngle toward maxAngle;
//                       false: arm moves from startingAngle toward minAngle
// Returns a JS array of state objects decimated by `decimation`, with the last
// state always included (matches obliterateArray behaviour in utils.ts).
inline emscripten::val SimulateArmImpl(
    DCMotorWasm* motor, double gearing, double momentOfInertiaKgMSquared,
    double armLengthMeters, double minAngleRadians, double maxAngleRadians,
    double startingAngleRadians, double statorLimitAmps, double supplyLimitAmps,
    double statorVoltageVolts, double batteryResistanceOhms,
    double batteryVoltageVolts, double efficiency, bool goingUp,
    double simTimestep, int decimation, double maxSimSeconds,
    double batteryVoltageFilterTimeConstantSeconds) {
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
  if (decimation <= 0 || simTimestep <= 0.0 || maxSimSeconds <= 0.0 ||
      gearing <= 0.0 || momentOfInertiaKgMSquared <= 0.0 || efficiency <= 0.0 ||
      batteryVoltageVolts <= 0.0 || maxAngleRadians <= minAngleRadians) {
    return emscripten::val::array();
  }

  EnsureHalInitialized();

  EfficiencyArmSim arm(
      motor->getMotor(), gearing,
      wpi::units::kilogram_square_meter_t(momentOfInertiaKgMSquared),
      wpi::units::meter_t(armLengthMeters),
      wpi::units::radian_t(minAngleRadians),
      wpi::units::radian_t(maxAngleRadians), startingAngleRadians, efficiency);

  wpi::sim::RoboRioSim::SetVInVoltage(wpi::units::volt_t(batteryVoltageVolts));

  const double rOhms = motor->getROhms();
  const double kvRadPerSecPerVolt = motor->getKvRadPerSecPerVolt();
  double timestamp = 0.0;
  double energyJoules = 0.0;

  auto batteryFilter = wpi::math::LinearFilter<double>::SinglePoleIIR(
      batteryVoltageFilterTimeConstantSeconds,
      wpi::units::second_t(simTimestep));
  batteryFilter.Reset(std::span<const double>{&batteryVoltageVolts, 1},
                      std::span<const double>{&batteryVoltageVolts, 1});

  std::vector<ArmSimStateInternal> states;

  auto isAtGoal = [&]() {
    return goingUp ? arm.HasHitUpperLimit() : arm.HasHitLowerLimit();
  };

  while (!isAtGoal()) {
    // Directed voltage: positive when going up, negative when going down
    double vApplied = goingUp ? statorVoltageVolts : -statorVoltageVolts;

    // Motor shaft angular velocity (rad/s) from arm velocity
    const double armRadPerSec = arm.GetVelocity().to<double>();
    const double motorShaftRadPerSec = armRadPerSec * gearing;
    const double vBackEmf = kvRadPerSecPerVolt > 0.0
                                ? motorShaftRadPerSec / kvRadPerSecPerVolt
                                : 0.0;

    const double vSupply = wpi::RobotController::GetInputVoltage();

    vApplied = ClampVoltageForCurrentLimits(
        vApplied, vBackEmf, rOhms, statorLimitAmps, supplyLimitAmps, vSupply);

    arm.SetInputVoltage(wpi::units::volt_t(vApplied));
    arm.Update(wpi::units::second_t(simTimestep));
    timestamp += simTimestep;

    const double statorCurrent = arm.GetCurrentDraw().to<double>();
    const double supplyCurrent =
        SupplyCurrentFromStator(statorCurrent, vApplied, vSupply);
    energyJoules += supplyCurrent * vSupply * simTimestep;

    // Battery voltage under load, smoothed by a single-pole IIR filter
    std::vector<wpi::units::ampere_t> currents = {
        wpi::units::ampere_t(supplyCurrent)};
    const double rawBatteryVoltage =
        wpi::sim::BatterySim::Calculate(
            wpi::units::volt_t(batteryVoltageVolts),
            wpi::units::ohm_t(batteryResistanceOhms), currents)
            .to<double>();
    const double filteredBatteryVoltage =
        batteryFilter.Calculate(rawBatteryVoltage);

    if (!isAtGoal()) {
      // The row is stamped with the post-step `timestamp`, so every field in it
      // is read after the step. `motorShaftRadPerSec` above is the pre-step
      // value and is deliberately not reused here: it feeds the back-EMF term
      // of the voltage clamp, which must act on the state at the start of the
      // step. motorRpm is a magnitude because the arm runs in both directions.
      const double updatedArmRadPerSec = arm.GetVelocity().to<double>();
      const double motorRpm =
          std::abs(updatedArmRadPerSec * gearing) * 60.0 / (2.0 * M_PI);
      states.push_back({arm.GetAngle().to<double>(), updatedArmRadPerSec,
                        statorCurrent, supplyCurrent, timestamp,
                        filteredBatteryVoltage, vApplied, motorRpm,
                        energyJoules, true});
    }

    wpi::sim::RoboRioSim::SetVInVoltage(
        wpi::units::volt_t(filteredBatteryVoltage));

    if (timestamp > maxSimSeconds) {
      if (!states.empty()) {
        states.back().success = false;
      }
      break;
    }
  }

  return DecimateToJsArray<ArmSimStateInternal>(
      states, decimation, [](const ArmSimStateInternal& s) {
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
inline ArmSimRows SimulateArm(
    DCMotorWasm* motor, double gearing, double momentOfInertiaKgMSquared,
    double armLengthMeters, double minAngleRadians, double maxAngleRadians,
    double startingAngleRadians, double statorLimitAmps, double supplyLimitAmps,
    double statorVoltageVolts, double batteryResistanceOhms,
    double batteryVoltageVolts, double efficiency, bool goingUp,
    double simTimestep, int decimation, double maxSimSeconds,
    double batteryVoltageFilterTimeConstantSeconds) {
  try {
    return ArmSimRows(SimulateArmImpl(
        motor, gearing, momentOfInertiaKgMSquared, armLengthMeters,
        minAngleRadians, maxAngleRadians, startingAngleRadians, statorLimitAmps,
        supplyLimitAmps, statorVoltageVolts, batteryResistanceOhms,
        batteryVoltageVolts, efficiency, goingUp, simTimestep, decimation,
        maxSimSeconds, batteryVoltageFilterTimeConstantSeconds));
  } catch (const std::exception& e) {
    ConsoleWarn(
        "SimulateArm: {} (gearing={} moi={} armLen={} minAngle={} "
        "maxAngle={})",
        e.what(), gearing, momentOfInertiaKgMSquared, armLengthMeters,
        minAngleRadians, maxAngleRadians);
    return ArmSimRows(emscripten::val::array());
  } catch (...) {
    ConsoleWarn(
        "SimulateArm: unknown exception (gearing={} moi={} armLen={} "
        "minAngle={} maxAngle={})",
        gearing, momentOfInertiaKgMSquared, armLengthMeters, minAngleRadians,
        maxAngleRadians);
    return ArmSimRows(emscripten::val::array());
  }
}

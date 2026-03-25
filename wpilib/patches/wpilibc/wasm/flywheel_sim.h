#pragma once

#include <cmath>
#include <emscripten/val.h>
#include <vector>

#include "wpi/math/system/Models.hpp"
#include "wpi/math/system/NumericalIntegration.hpp"
#include "wpi/simulation/BatterySim.hpp"
#include "wpi/simulation/FlywheelSim.hpp"
#include "wpi/simulation/RoboRioSim.hpp"
#include "wpi/system/RobotController.hpp"

#include "dc_motor.h"
#include "sim_util.h"

// FlywheelSim subclass that supports torque efficiency [0, 1].
// Overrides UpdateX to scale the motor force (B matrix) by efficiency while
// leaving back-EMF damping (A matrix) untouched.
class EfficiencyFlywheelSim : public wpi::sim::FlywheelSim {
public:
  EfficiencyFlywheelSim(const wpi::math::DCMotor &gearbox, double gearing,
                        wpi::units::kilogram_square_meter_t moi,
                        double efficiency)
      : FlywheelSim(wpi::math::Models::FlywheelFromPhysicalConstants(
                        gearbox, moi, gearing),
                    gearbox),
        m_efficiency(efficiency) {}

protected:
  wpi::math::Vectord<1> UpdateX(const wpi::math::Vectord<1> &currentXhat,
                                const wpi::math::Vectord<1> &u,
                                wpi::units::second_t dt) override {
    return wpi::math::RKDP(
        [&](const wpi::math::Vectord<1> &x,
            const wpi::math::Vectord<1> &u_) -> wpi::math::Vectord<1> {
          wpi::math::Vectord<1> xdot = m_plant.A() * x + m_plant.B() * u_;
          // Scale motor force by efficiency (B term only, preserves back-EMF)
          xdot(0) += (m_efficiency - 1.0) * m_plant.B()(0, 0) * u_(0);
          return xdot;
        },
        currentXhat, u, dt);
  }

private:
  double m_efficiency;
};

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

// Full flywheel simulation loop. Parameters must be in SI units:
//   statorLimitAmps   — total stator current limit (per-motor limit * quantity)
//   supplyLimitAmps   — total supply current limit (per-motor limit * quantity)
//   efficiency        — torque efficiency in [0, 1]
// Returns a JS array of state objects decimated by `decimation`, with the last
// state always included (matches obliterateArray behaviour in utils.ts).
inline emscripten::val
SimulateFlywheel(DCMotorWasm *motor, double gearing, double moiKgMSquared,
                 double targetAngularVelocityRadPerSec, double statorLimitAmps,
                 double supplyLimitAmps, double statorVoltageVolts,
                 double batteryResistanceOhms, double batteryVoltageVolts,
                 double efficiency, double simTimestep, int decimation,
                 double maxSimSeconds) {
  EfficiencyFlywheelSim flywheel(
      motor->getMotor(), gearing,
      wpi::units::kilogram_square_meter_t(moiKgMSquared), efficiency);

  wpi::sim::RoboRioSim::SetVInVoltage(wpi::units::volt_t(batteryVoltageVolts));

  const double rOhms = motor->getROhms();
  const double kvRadPerSecPerVolt = motor->getKvRadPerSecPerVolt();
  double timestamp = 0.0;
  double energyJoules = 0.0;

  std::vector<FlywheelSimStateInternal> states;

  while (flywheel.GetAngularVelocity().to<double>() <
         targetAngularVelocityRadPerSec) {
    double vApplied = statorVoltageVolts;

    // Motor shaft angular velocity (rad/s) from flywheel velocity
    const double flywheelRadPerSec = flywheel.GetAngularVelocity().to<double>();
    const double motorShaftRadPerSec = flywheelRadPerSec * gearing;
    const double vBackEmf = motorShaftRadPerSec / kvRadPerSecPerVolt;

    const double vSupply = wpi::RobotController::GetInputVoltage();

    vApplied = ClampVoltageForCurrentLimits(
        vApplied, vBackEmf, rOhms, statorLimitAmps, supplyLimitAmps, vSupply);

    flywheel.SetInputVoltage(wpi::units::volt_t(vApplied));
    flywheel.Update(wpi::units::second_t(simTimestep));
    timestamp += simTimestep;

    const double statorCurrent = flywheel.GetCurrentDraw().to<double>();
    const double supplyCurrent = statorCurrent * vApplied / vSupply;
    energyJoules += supplyCurrent * vSupply * simTimestep;

    // Battery voltage under load
    std::vector<wpi::units::ampere_t> currents = {
        wpi::units::ampere_t(supplyCurrent)};
    const double newBatteryVoltage =
        wpi::sim::BatterySim::Calculate(
            wpi::units::volt_t(batteryVoltageVolts),
            wpi::units::ohm_t(batteryResistanceOhms), currents)
            .to<double>();

    const double motorRpm = motorShaftRadPerSec * 60.0 / (2.0 * M_PI);
    states.push_back({flywheel.GetAngularVelocity().to<double>(), statorCurrent,
                      supplyCurrent, timestamp, newBatteryVoltage, vApplied,
                      motorRpm, energyJoules, true});

    wpi::sim::RoboRioSim::SetVInVoltage(wpi::units::volt_t(newBatteryVoltage));

    if (timestamp > maxSimSeconds) {
      if (!states.empty()) {
        states.back().success = false;
      }
      break;
    }
  }

  return DecimateToJsArray<FlywheelSimStateInternal>(
      states, decimation, [](const FlywheelSimStateInternal &s) {
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

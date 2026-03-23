#pragma once

#include <cmath>
#include <emscripten/val.h>
#include <vector>

#include "frc/RobotController.h"
#include "frc/simulation/BatterySim.h"
#include "frc/simulation/FlywheelSim.h"
#include "frc/simulation/RoboRioSim.h"
#include "frc/system/NumericalIntegration.h"
#include "frc/system/plant/LinearSystemId.h"
#include "units/angular_velocity.h"
#include "units/current.h"
#include "units/moment_of_inertia.h"
#include "units/time.h"
#include "units/voltage.h"

#include "dc_motor.h"
#include "sim_util.h"

// FlywheelSim subclass that supports torque efficiency [0, 1].
// Overrides UpdateX to scale the motor force (B matrix) by efficiency while
// leaving back-EMF damping (A matrix) untouched.
class EfficiencyFlywheelSim : public frc::sim::FlywheelSim {
public:
  EfficiencyFlywheelSim(const frc::DCMotor &gearbox, double gearing,
                        units::kilogram_square_meter_t moi, double efficiency)
      : FlywheelSim(frc::LinearSystemId::FlywheelSystem(gearbox, moi, gearing),
                    gearbox),
        m_efficiency(efficiency) {}

protected:
  frc::Vectord<1> UpdateX(const frc::Vectord<1> &currentXhat,
                          const frc::Vectord<1> &u,
                          units::second_t dt) override {
    return frc::RKDP(
        [&](const frc::Vectord<1> &x,
            const frc::Vectord<1> &u_) -> frc::Vectord<1> {
          frc::Vectord<1> xdot = m_plant.A() * x + m_plant.B() * u_;
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
  EfficiencyFlywheelSim flywheel(motor->getMotor(), gearing,
                                 units::kilogram_square_meter_t(moiKgMSquared),
                                 efficiency);

  frc::sim::RoboRioSim::SetVInVoltage(units::volt_t(batteryVoltageVolts));

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

    const double vSupply = frc::RobotController::GetInputVoltage();

    vApplied = ClampVoltageForCurrentLimits(
        vApplied, vBackEmf, rOhms, statorLimitAmps, supplyLimitAmps, vSupply);

    flywheel.SetInputVoltage(units::volt_t(vApplied));
    flywheel.Update(units::second_t(simTimestep));
    timestamp += simTimestep;

    const double statorCurrent = flywheel.GetCurrentDraw().to<double>();
    const double supplyCurrent = statorCurrent * vApplied / vSupply;
    energyJoules += supplyCurrent * vSupply * simTimestep;

    // Battery voltage under load
    std::vector<units::ampere_t> currents = {units::ampere_t(supplyCurrent)};
    const double newBatteryVoltage =
        frc::sim::BatterySim::Calculate(units::volt_t(batteryVoltageVolts),
                                        units::ohm_t(batteryResistanceOhms),
                                        currents)
            .to<double>();

    const double motorRpm = motorShaftRadPerSec * 60.0 / (2.0 * M_PI);
    states.push_back({flywheel.GetAngularVelocity().to<double>(), statorCurrent,
                      supplyCurrent, timestamp, newBatteryVoltage, vApplied,
                      motorRpm, energyJoules, true});

    frc::sim::RoboRioSim::SetVInVoltage(units::volt_t(newBatteryVoltage));

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

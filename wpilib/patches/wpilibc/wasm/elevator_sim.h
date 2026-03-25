#pragma once

#include <cmath>
#include <emscripten/val.h>
#include <vector>

#include "wpi/math/system/NumericalIntegration.hpp"
#include "wpi/simulation/BatterySim.hpp"
#include "wpi/simulation/ElevatorSim.hpp"
#include "wpi/simulation/RoboRioSim.hpp"
#include "wpi/system/RobotController.hpp"

#include "dc_motor.h"
#include "sim_util.h"

// ElevatorSim subclass that supports angle (radians from horizontal) and torque
// efficiency [0, 1]. Overrides UpdateX to replace the hardcoded vertical
// gravity with sin(angle)*9.8 and to scale the motor force (B matrix) by
// efficiency while leaving back-EMF damping (A matrix) untouched.
class AngledElevatorSim : public wpi::sim::ElevatorSim {
public:
  AngledElevatorSim(const wpi::math::DCMotor &gearbox, double gearing,
                    wpi::units::kilogram_t carriageMass,
                    wpi::units::meter_t drumRadius, double minHeightMeters,
                    double maxHeightMeters, double startingHeightMeters,
                    double angleRadians, double efficiency)
      : ElevatorSim(gearbox, gearing, carriageMass, drumRadius,
                    wpi::units::meter_t(minHeightMeters),
                    wpi::units::meter_t(maxHeightMeters),
                    false, // disable base class gravity — handled here
                    wpi::units::meter_t(startingHeightMeters)),
        m_minH(minHeightMeters), m_maxH(maxHeightMeters), m_angle(angleRadians),
        m_efficiency(efficiency) {}

protected:
  wpi::math::Vectord<2> UpdateX(const wpi::math::Vectord<2> &currentXhat,
                                const wpi::math::Vectord<1> &u,
                                wpi::units::second_t dt) override {
    auto updatedXhat = wpi::math::RKDP(
        [&](const wpi::math::Vectord<2> &x,
            const wpi::math::Vectord<1> &u_) -> wpi::math::Vectord<2> {
          wpi::math::Vectord<2> xdot = m_plant.A() * x + m_plant.B() * u_;
          // Scale motor force by efficiency (B term only, preserves back-EMF)
          xdot(1) += (m_efficiency - 1.0) * m_plant.B()(1, 0) * u_(0);
          // Angle-adjusted gravity: full at 90deg (vertical), zero at 0deg
          // (horizontal)
          xdot(1) -= 9.8 * std::sin(m_angle);
          return xdot;
        },
        currentXhat, u, dt);

    if (WouldHitLowerLimit(wpi::units::meter_t{updatedXhat(0)})) {
      return wpi::math::Vectord<2>{m_minH, 0.0};
    }
    if (WouldHitUpperLimit(wpi::units::meter_t{updatedXhat(0)})) {
      return wpi::math::Vectord<2>{m_maxH, 0.0};
    }
    return updatedXhat;
  }

private:
  double m_minH;
  double m_maxH;
  double m_angle;      // radians from horizontal
  double m_efficiency; // torque efficiency in [0, 1]
};

// Internal state record for one timestep of the elevator simulation.
struct ElevatorSimStateInternal {
  double positionMeters;
  double velocityMetersPerSecond;
  double statorCurrentDrawAmps;
  double supplyCurrentDrawAmps;
  double timeSeconds;
  double batteryVoltageVolts;
  double motorAppliedVoltageVolts;
  double motorRpm;
  double energyJoules;
  bool success;
};

// Full elevator simulation loop. Parameters must be in SI units:
//   statorLimitAmps   — total stator current limit (per-motor limit × quantity)
//   spoolRadiusMeters — spool radius (not diameter)
//   angleRadians      — mechanism angle from horizontal (π/2 = vertical)
//   efficiency        — torque efficiency in [0, 1]
//   cascade           — if true, models a cascading elevator: the first stage
//                       travels half the carriage distance (travelDistance/2)
//                       and carries double the load (loadKg*2)
// Returns a JS array of state objects decimated by `decimation`, with the last
// state always included (matches obliterateArray behaviour in utils.ts).
inline emscripten::val
SimulateElevator(DCMotorWasm *motor, double gearing, double loadKg,
                 double spoolRadiusMeters, double travelDistanceMeters,
                 double statorLimitAmps, double supplyLimitAmps,
                 double statorVoltageVolts, double batteryResistanceOhms,
                 double batteryVoltageVolts, double simTimestep, int decimation,
                 double maxSimSeconds, double angleRadians, double efficiency,
                 bool cascade) {
  // Cascade rigging: the first stage travels half the carriage distance, and
  // the effective load is doubled (each side of the cascade belt carries the
  // full carriage + object weight). Stage-2 frame weight is omitted here.
  // Reference: https://www.chiefdelphi.com/t/cascade-elevator-gearing/345099/12
  if (cascade) {
    travelDistanceMeters *= 0.5;
    loadKg *= 2.0;
  }

  AngledElevatorSim elevator(
      motor->getMotor(), gearing, wpi::units::kilogram_t(loadKg),
      wpi::units::meter_t(spoolRadiusMeters), 0.0, travelDistanceMeters, 0.0,
      angleRadians, efficiency);

  wpi::sim::RoboRioSim::SetVInVoltage(wpi::units::volt_t(batteryVoltageVolts));

  const double rOhms = motor->getROhms();
  const double kvRadPerSecPerVolt = motor->getKvRadPerSecPerVolt();
  double timestamp = 0.0;
  double energyJoules = 0.0;

  std::vector<ElevatorSimStateInternal> states;

  while (elevator.GetPosition().to<double>() < travelDistanceMeters) {
    double vApplied = statorVoltageVolts;

    // Motor shaft angular velocity (rad/s) from carriage velocity
    const double velocityMPS = elevator.GetVelocity().to<double>();
    const double motorShaftRadPerSec =
        velocityMPS / spoolRadiusMeters * gearing;
    const double vBackEmf = motorShaftRadPerSec / kvRadPerSecPerVolt;

    const double vSupply = wpi::RobotController::GetInputVoltage();

    vApplied = ClampVoltageForCurrentLimits(
        vApplied, vBackEmf, rOhms, statorLimitAmps, supplyLimitAmps, vSupply);

    elevator.SetInputVoltage(wpi::units::volt_t(vApplied));
    elevator.Update(wpi::units::second_t(simTimestep));
    timestamp += simTimestep;

    const double statorCurrent = elevator.GetCurrentDraw().to<double>();
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

    if (!elevator.HasHitUpperLimit()) {
      const double motorRpm = motorShaftRadPerSec * 60.0 / (2.0 * M_PI);
      states.push_back({elevator.GetPosition().to<double>(),
                        elevator.GetVelocity().to<double>(), statorCurrent,
                        supplyCurrent, timestamp, newBatteryVoltage, vApplied,
                        motorRpm, energyJoules, true});
    }

    wpi::sim::RoboRioSim::SetVInVoltage(wpi::units::volt_t(newBatteryVoltage));

    if (timestamp > maxSimSeconds) {
      if (!states.empty()) {
        states.back().success = false;
      }
      break;
    }
  }

  return DecimateToJsArray<ElevatorSimStateInternal>(
      states, decimation, [](const ElevatorSimStateInternal &s) {
        emscripten::val state = emscripten::val::object();
        state.set("positionMeters", s.positionMeters);
        state.set("velocityMetersPerSecond", s.velocityMetersPerSecond);
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

#pragma once

#include <vector>

#include "frc/RobotController.h"
#include "frc/simulation/BatterySim.h"
#include "frc/simulation/RoboRioSim.h"
#include "units/current.h"
#include "units/impedance.h"
#include "units/voltage.h"

inline void RoboRioSim_SetVInVoltage(double voltageVolts) {
  frc::sim::RoboRioSim::SetVInVoltage(units::volt_t(voltageVolts));
}

inline double RobotController_GetInputVoltage() {
  return frc::RobotController::GetInputVoltage();
}

inline double
BatterySim_Calculate(const std::vector<double> &currentDrawsAmps) {
  std::vector<units::ampere_t> currents;
  for (double a : currentDrawsAmps) {
    currents.push_back(units::ampere_t(a));
  }
  return frc::sim::BatterySim::Calculate(currents).to<double>();
}

// Uses default 12 V nominal voltage and 20 mΩ internal resistance.
inline double BatterySim_CalculateDefaultBatteryLoadedVoltage(
    const std::vector<double> &currentDrawsAmps) {
  std::vector<units::ampere_t> currents;
  for (double a : currentDrawsAmps) {
    currents.push_back(units::ampere_t(a));
  }
  return frc::sim::BatterySim::Calculate(currents).to<double>();
}

inline double BatterySim_CalculateLoadedBatteryVoltage(
    double nominalVoltageVolts, double resistanceOhms,
    const std::vector<double> &currentDrawsAmps) {
  std::vector<units::ampere_t> currents;
  for (double a : currentDrawsAmps) {
    currents.push_back(units::ampere_t(a));
  }
  return frc::sim::BatterySim::Calculate(units::volt_t(nominalVoltageVolts),
                                         units::ohm_t(resistanceOhms), currents)
      .to<double>();
}

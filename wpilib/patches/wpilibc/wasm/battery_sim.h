#pragma once

#include <vector>

#include "hal_init.h"
#include "wpi/simulation/BatterySim.hpp"
#include "wpi/simulation/RoboRioSim.hpp"
#include "wpi/system/RobotController.hpp"

inline void RoboRioSim_SetVInVoltage(double voltageVolts) {
  EnsureHalInitialized();
  wpi::sim::RoboRioSim::SetVInVoltage(wpi::units::volt_t(voltageVolts));
}

inline double RobotController_GetInputVoltage() {
  EnsureHalInitialized();
  return wpi::RobotController::GetInputVoltage();
}

// Uses default 12 V nominal voltage and 20 mΩ internal resistance.
inline double BatterySim_CalculateDefaultBatteryLoadedVoltage(
    const std::vector<double>& currentDrawsAmps) {
  const std::vector<wpi::units::ampere_t> currents(currentDrawsAmps.begin(),
                                                   currentDrawsAmps.end());
  return wpi::sim::BatterySim::Calculate(currents).to<double>();
}

inline double BatterySim_CalculateLoadedBatteryVoltage(
    double nominalVoltageVolts, double resistanceOhms,
    const std::vector<double>& currentDrawsAmps) {
  const std::vector<wpi::units::ampere_t> currents(currentDrawsAmps.begin(),
                                                   currentDrawsAmps.end());
  return wpi::sim::BatterySim::Calculate(
             wpi::units::volt_t(nominalVoltageVolts),
             wpi::units::ohm_t(resistanceOhms), currents)
      .to<double>();
}

#pragma once

namespace wpi::hal::init {
void InitializeRoboRioData();
}

// WPILib's HALSIM_* RoboRio setters (and ElevatorSim::SetInputVoltage via
// RobotController::GetBatteryVoltage) dereference SimRoboRioData without
// calling CheckInit(). Touching them before the pointer is set writes into
// the Wasm null page — overwriting Emscripten's stack cookie at address 8
// and aborting on exit under ASSERTIONS.
//
// Do NOT call HAL_Initialize here: under Emscripten it tries to start
// threads (DriverStation / notifiers) and throws
// "thread constructor failed: Not supported". Only the RoboRio sim data
// store is required for voltage get/set and ElevatorSim clamping.
inline void EnsureHalInitialized() {
  static const bool once = [] {
    wpi::hal::init::InitializeRoboRioData();
    return true;
  }();
  (void)once;
}

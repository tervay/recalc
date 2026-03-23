#include <emscripten/bind.h>

#include "arm_sim.h"
#include "battery_sim.h"
#include "dc_motor.h"
#include "dc_motor_sim.h"
#include "elevator_sim.h"
#include "flywheel_sim.h"

using namespace emscripten;

EMSCRIPTEN_BINDINGS(wpilibc) {
  // Register vector<double> for automatic conversion from JavaScript arrays
  register_vector<double>("VectorDouble");

  // DCMotor
  class_<DCMotorWasm>("DCMotor")
      .constructor<double, double, double, double, double, int>()
      .function("getFreeCurrentAmps", &DCMotorWasm::getFreeCurrentAmps)
      .function("getFreeSpeedRadPerSec", &DCMotorWasm::getFreeSpeedRadPerSec)
      .function("getKtNMPerAmp", &DCMotorWasm::getKtNMPerAmp)
      .function("getKvRadPerSecPerVolt", &DCMotorWasm::getKvRadPerSecPerVolt)
      .function("getNominalVoltageVolts", &DCMotorWasm::getNominalVoltageVolts)
      .function("getROhms", &DCMotorWasm::getROhms)
      .function("getStallCurrentAmps", &DCMotorWasm::getStallCurrentAmps)
      .function("getStallTorqueNewtonMeters",
                &DCMotorWasm::getStallTorqueNewtonMeters)
      .function("currentFromSpeedAndVoltage(speedRadPerSec, inputVoltageVolts)",
                &DCMotorWasm::currentFromSpeedAndVoltage)
      .function("currentFromTorque(torqueNewtonMeters)",
                &DCMotorWasm::currentFromTorque)
      .function("torqueFromCurrent(currentAmps)",
                &DCMotorWasm::torqueFromCurrent)
      .function("voltageFromTorqueAndSpeed(torqueNewtonMeters, speedRadPerSec)",
                &DCMotorWasm::voltageFromTorqueAndSpeed)
      .function(
          "speedFromTorqueAndVoltage(torqueNewtonMeters, inputVoltageVolts)",
          &DCMotorWasm::speedFromTorqueAndVoltage)
      .function("withReduction(gearboxReduction)", &DCMotorWasm::withReduction,
                allow_raw_pointers());

  // ElevatorSim (step-by-step)
  class_<ElevatorSimWasm>("ElevatorSim")
      .constructor<DCMotorWasm *, double, double, double, double, double, bool,
                   double>(allow_raw_pointers())
      .function("setInputVoltage(voltageVolts)",
                &ElevatorSimWasm::setInputVoltage)
      .function("update(dtSeconds)", &ElevatorSimWasm::update)
      .function("getPosition", &ElevatorSimWasm::getPosition)
      .function("getVelocity", &ElevatorSimWasm::getVelocity)
      .function("getCurrentDraw", &ElevatorSimWasm::getCurrentDraw)
      .function("hasHitLowerLimit", &ElevatorSimWasm::hasHitLowerLimit)
      .function("hasHitUpperLimit", &ElevatorSimWasm::hasHitUpperLimit);

  // FlywheelSim
  class_<FlywheelSimWasm>("FlywheelSim")
      .constructor<DCMotorWasm *, double, double>(allow_raw_pointers())
      .function("setInputVoltage(voltageVolts)",
                &FlywheelSimWasm::setInputVoltage)
      .function("update(dtSeconds)", &FlywheelSimWasm::update)
      .function("getAngularVelocity", &FlywheelSimWasm::getAngularVelocity)
      .function("getCurrentDraw", &FlywheelSimWasm::getCurrentDraw);

  // DCMotorSim
  class_<DCMotorSimWasm>("DCMotorSim")
      .constructor<DCMotorWasm *, double, double>(allow_raw_pointers())
      .function("setInputVoltage(voltageVolts)",
                &DCMotorSimWasm::setInputVoltage)
      .function("update(dtSeconds)", &DCMotorSimWasm::update)
      .function("getAngularPosition", &DCMotorSimWasm::getAngularPosition)
      .function("getAngularVelocity", &DCMotorSimWasm::getAngularVelocity)
      .function("getAngularAcceleration",
                &DCMotorSimWasm::getAngularAcceleration)
      .function("getTorque", &DCMotorSimWasm::getTorque)
      .function("getInputVoltage", &DCMotorSimWasm::getInputVoltage)
      .function("getJ", &DCMotorSimWasm::getJ)
      .function("getCurrentDraw", &DCMotorSimWasm::getCurrentDraw);

  // SingleJointedArmSim
  class_<SingleJointedArmSimWasm>("SingleJointedArmSim")
      .constructor<DCMotorWasm *, double, double, double, double, double, bool,
                   double>(allow_raw_pointers())
      .function("setInputVoltage(voltageVolts)",
                &SingleJointedArmSimWasm::setInputVoltage)
      .function("update(dtSeconds)", &SingleJointedArmSimWasm::update)
      .function("getAngle", &SingleJointedArmSimWasm::getAngle)
      .function("getAngularVelocity",
                &SingleJointedArmSimWasm::getAngularVelocity)
      .function("getCurrentDraw", &SingleJointedArmSimWasm::getCurrentDraw)
      .function("hasHitLowerLimit", &SingleJointedArmSimWasm::hasHitLowerLimit)
      .function("hasHitUpperLimit", &SingleJointedArmSimWasm::hasHitUpperLimit);

  // RoboRioSim static methods
  function("RoboRioSim_setVInVoltage(voltageVolts)", &RoboRioSim_SetVInVoltage);

  // RobotController static methods
  function("RobotController_getInputVoltage", &RobotController_GetInputVoltage);

  // BatterySim static methods
  function("BatterySim_calculate(currentDrawsAmps)", &BatterySim_Calculate);
  function("BatterySim_calculateDefaultBatteryLoadedVoltage(currentDrawsAmps)",
           &BatterySim_CalculateDefaultBatteryLoadedVoltage);
  function("BatterySim_calculateLoadedBatteryVoltage(nominalVoltageVolts, "
           "resistanceOhms, currentDrawsAmps)",
           &BatterySim_CalculateLoadedBatteryVoltage);

  // Full elevator simulation loop
  function("simulateElevator(motor, gearing, loadKg, spoolRadiusMeters, "
           "travelDistanceMeters, statorLimitAmps, supplyLimitAmps, "
           "statorVoltageVolts, batteryResistanceOhms, batteryVoltageVolts, "
           "simTimestep, decimation, maxSimSeconds, angleRadians, efficiency, "
           "cascade)",
           &SimulateElevator, allow_raw_pointers());
}

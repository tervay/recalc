#include <emscripten/bind.h>

#include "arm_sim.h"
#include "battery_sim.h"
#include "dc_motor.h"
#include "dc_motor_sim.h"
#include "elevator_sim.h"
#include "feedback_gains.h"
#include "feedforward_gains.h"
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

  // DCMotorSim
  class_<DCMotorSimWasm>("DCMotorSim")
      .constructor<DCMotorWasm*, double, double>(allow_raw_pointers())
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
      .constructor<DCMotorWasm*, double, double, double, double, double, bool,
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
  function(
      "BatterySim_calculateLoadedBatteryVoltage(nominalVoltageVolts, "
      "resistanceOhms, currentDrawsAmps)",
      &BatterySim_CalculateLoadedBatteryVoltage);

  // Full elevator simulation loop
  function(
      "simulateElevator(motor, gearing, loadKg, spoolRadiusMeters, "
      "travelDistanceMeters, statorLimitAmps, supplyLimitAmps, "
      "batteryResistanceOhms, batteryVoltageVolts, "
      "simTimestep, decimation, maxSimSeconds, angleRadians, efficiency, "
      "cascade, batteryVoltageFilterTimeConstantSeconds, "
      "maxVelocityMPS, maxAccelerationMPS2, "
      "qPositionMeters, qVelocityMPS, rVolts, sensorDelaySeconds, "
      "kalmanFilterPositionStdDev, kalmanFilterVelocityStdDev, "
      "kalmanFilterEncoderPositionStdDev)",
      &SimulateElevator, allow_raw_pointers());

  // Full flywheel simulation loop
  function(
      "simulateFlywheel(motor, gearing, moiKgMSquared, "
      "targetAngularVelocityRadPerSec, statorLimitAmps, supplyLimitAmps, "
      "statorVoltageVolts, batteryResistanceOhms, batteryVoltageVolts, "
      "efficiency, simTimestep, decimation, maxSimSeconds, "
      "batteryVoltageFilterTimeConstantSeconds, "
      "initialAngularVelocityRadPerSec)",
      &SimulateFlywheel, allow_raw_pointers());

  // Full arm simulation loop
  function(
      "simulateArm(motor, gearing, momentOfInertiaKgMSquared, "
      "armLengthMeters, minAngleRadians, maxAngleRadians, "
      "startingAngleRadians, statorLimitAmps, supplyLimitAmps, "
      "statorVoltageVolts, batteryResistanceOhms, batteryVoltageVolts, "
      "efficiency, goingUp, simTimestep, decimation, maxSimSeconds, "
      "batteryVoltageFilterTimeConstantSeconds)",
      &SimulateArm, allow_raw_pointers());

  // LQR-derived feedback gains (kP, kD)
  function(
      "computeElevatorFeedbackGains(motor, gearing, massKg, "
      "spoolRadiusMeters, efficiency, qPositionMeters, qVelocityMPS, "
      "rVolts, dtSeconds, sensorDelaySeconds)",
      &ComputeElevatorFeedbackGains, allow_raw_pointers());

  function(
      "computeArmFeedbackGains(motor, gearing, momentOfInertiaKgMSquared, "
      "efficiency, qPositionRad, qVelocityRadPerSec, rVolts, dtSeconds, "
      "sensorDelaySeconds)",
      &ComputeArmFeedbackGains, allow_raw_pointers());

  function(
      "computeFlywheelFeedbackGains(motor, gearing, "
      "momentOfInertiaKgMSquared, efficiency, qVelocityRadPerSec, rVolts, "
      "dtSeconds, sensorDelaySeconds)",
      &ComputeFlywheelFeedbackGains, allow_raw_pointers());

  // Feedforward gains (kV, kA, kG)
  function(
      "computeLinearFeedforwardGains(motor, gearing, loadKg, "
      "spoolRadiusMeters, efficiency, angleRadians)",
      &ComputeLinearFeedforwardGains, allow_raw_pointers());

  function(
      "computeAngularFeedforwardGains(motor, gearing, "
      "momentOfInertiaKgMSquared, efficiency, comMassKg, comLengthMeters)",
      &ComputeAngularFeedforwardGains, allow_raw_pointers());

  function(
      "computeFlywheelFeedforwardGains(motor, gearing, "
      "momentOfInertiaKgMSquared, efficiency)",
      &ComputeFlywheelFeedforwardGains, allow_raw_pointers());
}

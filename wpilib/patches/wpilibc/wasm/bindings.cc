#include <emscripten/bind.h>
#include <emscripten/wire.h>

#include "arm_sim.h"
#include "battery_sim.h"
#include "dc_motor.h"
#include "dc_motor_sim.h"
#include "elevator_sim.h"
#include "feedback_gains.h"
#include "feedforward_gains.h"
#include "flywheel_sim.h"
#include "motor_curve_sim.h"

using emscripten::allow_raw_pointers;
using emscripten::class_;
using emscripten::function;
using emscripten::register_type;
using emscripten::register_vector;
using emscripten::value_object;

EMSCRIPTEN_BINDINGS(wpilibc) {
  // Register vector<double> for automatic conversion from JavaScript arrays
  register_vector<double>("VectorDouble");

  // Custom val types: give the --emit-tsd output real shapes instead of `any`.
  // Each string is the TypeScript type of the corresponding val the function
  // returns; runtime behaviour is unchanged (still a plain JS array/object).
  register_type<FeedbackGainsVal>("FeedbackGains",
                                  "{ kP: number; kD: number }");
  register_type<FeedforwardGainsVal>("FeedforwardGains",
                                     "{ kV: number; kA: number; kG: number }");
  register_type<ElevatorSimRows>(
      "ElevatorSimRows",
      "{ positionMeters: number; velocityMetersPerSecond: number; "
      "statorCurrentDrawAmps: number; supplyCurrentDrawAmps: number; "
      "timeSeconds: number; batteryVoltageVolts: number; "
      "motorAppliedVoltageVolts: number; motorRpm: number; "
      "energyJoules: number; success: boolean; timeToGoalSeconds: number }[]");
  register_type<ArmSimRows>(
      "ArmSimRows",
      "{ angleRadians: number; angularVelocityRadPerSec: number; "
      "statorCurrentDrawAmps: number; supplyCurrentDrawAmps: number; "
      "timeSeconds: number; batteryVoltageVolts: number; "
      "motorAppliedVoltageVolts: number; motorRpm: number; "
      "energyJoules: number; success: boolean }[]");
  register_type<FlywheelSimRows>(
      "FlywheelSimRows",
      "{ angularVelocityRadPerSec: number; statorCurrentDrawAmps: number; "
      "supplyCurrentDrawAmps: number; timeSeconds: number; "
      "batteryVoltageVolts: number; motorAppliedVoltageVolts: number; "
      "motorRpm: number; energyJoules: number; success: boolean }[]");
  register_type<MotorCurveRows>(
      "MotorCurveRows",
      "{ angularVelocityRadPerSec: number; statorCurrentDrawAmps: number; "
      "supplyCurrentDrawAmps: number; torqueNewtonMeters: number; "
      "motorAppliedVoltageVolts: number; efficiency: number }[]");

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
      .function("withReduction(gearboxReduction)", &DCMotorWasm::withReduction);

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

  // RoboRioSim static methods
  function("RoboRioSim_setVInVoltage(voltageVolts)", &RoboRioSim_SetVInVoltage);

  // RobotController static methods
  function("RobotController_getInputVoltage", &RobotController_GetInputVoltage);

  // BatterySim static methods
  function("BatterySim_calculateDefaultBatteryLoadedVoltage(currentDrawsAmps)",
           &BatterySim_CalculateDefaultBatteryLoadedVoltage);
  function(
      "BatterySim_calculateLoadedBatteryVoltage(nominalVoltageVolts, "
      "resistanceOhms, currentDrawsAmps)",
      &BatterySim_CalculateLoadedBatteryVoltage);

  // Full elevator simulation loop
  value_object<ElevatorSimParams>("ElevatorSimParams")
      .field("gearing", &ElevatorSimParams::gearing)
      .field("loadKg", &ElevatorSimParams::loadKg)
      .field("spoolRadiusMeters", &ElevatorSimParams::spoolRadiusMeters)
      .field("travelDistanceMeters", &ElevatorSimParams::travelDistanceMeters)
      .field("statorLimitAmps", &ElevatorSimParams::statorLimitAmps)
      .field("supplyLimitAmps", &ElevatorSimParams::supplyLimitAmps)
      .field("batteryResistanceOhms", &ElevatorSimParams::batteryResistanceOhms)
      .field("batteryVoltageVolts", &ElevatorSimParams::batteryVoltageVolts)
      .field("simTimestep", &ElevatorSimParams::simTimestep)
      .field("decimation", &ElevatorSimParams::decimation)
      .field("maxSimSeconds", &ElevatorSimParams::maxSimSeconds)
      .field("angleRadians", &ElevatorSimParams::angleRadians)
      .field("efficiency", &ElevatorSimParams::efficiency)
      .field("cascade", &ElevatorSimParams::cascade)
      .field("batteryVoltageFilterTimeConstantSeconds",
             &ElevatorSimParams::batteryVoltageFilterTimeConstantSeconds)
      .field("maxVelocityMPS", &ElevatorSimParams::maxVelocityMPS)
      .field("maxAccelerationMPS2", &ElevatorSimParams::maxAccelerationMPS2)
      .field("qPositionMeters", &ElevatorSimParams::qPositionMeters)
      .field("qVelocityMPS", &ElevatorSimParams::qVelocityMPS)
      .field("rVolts", &ElevatorSimParams::rVolts)
      .field("sensorDelaySeconds", &ElevatorSimParams::sensorDelaySeconds)
      .field("kalmanFilterPositionStdDev",
             &ElevatorSimParams::kalmanFilterPositionStdDev)
      .field("kalmanFilterVelocityStdDev",
             &ElevatorSimParams::kalmanFilterVelocityStdDev)
      .field("kalmanFilterEncoderPositionStdDev",
             &ElevatorSimParams::kalmanFilterEncoderPositionStdDev);
  function("simulateElevator(motor, params)", &SimulateElevator,
           allow_raw_pointers());

  // Full flywheel simulation loop
  value_object<FlywheelSimParams>("FlywheelSimParams")
      .field("gearing", &FlywheelSimParams::gearing)
      .field("momentOfInertiaKgMSquared",
             &FlywheelSimParams::momentOfInertiaKgMSquared)
      .field("targetAngularVelocityRadPerSec",
             &FlywheelSimParams::targetAngularVelocityRadPerSec)
      .field("statorLimitAmps", &FlywheelSimParams::statorLimitAmps)
      .field("supplyLimitAmps", &FlywheelSimParams::supplyLimitAmps)
      .field("statorVoltageVolts", &FlywheelSimParams::statorVoltageVolts)
      .field("batteryResistanceOhms", &FlywheelSimParams::batteryResistanceOhms)
      .field("batteryVoltageVolts", &FlywheelSimParams::batteryVoltageVolts)
      .field("efficiency", &FlywheelSimParams::efficiency)
      .field("simTimestep", &FlywheelSimParams::simTimestep)
      .field("decimation", &FlywheelSimParams::decimation)
      .field("maxSimSeconds", &FlywheelSimParams::maxSimSeconds)
      .field("batteryVoltageFilterTimeConstantSeconds",
             &FlywheelSimParams::batteryVoltageFilterTimeConstantSeconds)
      .field("initialAngularVelocityRadPerSec",
             &FlywheelSimParams::initialAngularVelocityRadPerSec);
  function("simulateFlywheel(motor, params)", &SimulateFlywheel,
           allow_raw_pointers());

  // Full motor characteristic-curve sweep
  value_object<MotorCurveParams>("MotorCurveParams")
      .field("momentOfInertiaKgMSquared",
             &MotorCurveParams::momentOfInertiaKgMSquared)
      .field("statorLimitAmps", &MotorCurveParams::statorLimitAmps)
      .field("supplyLimitAmps", &MotorCurveParams::supplyLimitAmps)
      .field("statorVoltageVolts", &MotorCurveParams::statorVoltageVolts)
      .field("supplyVoltageVolts", &MotorCurveParams::supplyVoltageVolts)
      .field("simTimestep", &MotorCurveParams::simTimestep)
      .field("decimation", &MotorCurveParams::decimation)
      .field("maxIterations", &MotorCurveParams::maxIterations);
  function("simulateMotorCurve(motor, params)", &SimulateMotorCurve,
           allow_raw_pointers());

  // Full arm simulation loop
  value_object<ArmSimParams>("ArmSimParams")
      .field("gearing", &ArmSimParams::gearing)
      .field("momentOfInertiaKgMSquared",
             &ArmSimParams::momentOfInertiaKgMSquared)
      .field("armLengthMeters", &ArmSimParams::armLengthMeters)
      .field("minAngleRadians", &ArmSimParams::minAngleRadians)
      .field("maxAngleRadians", &ArmSimParams::maxAngleRadians)
      .field("startingAngleRadians", &ArmSimParams::startingAngleRadians)
      .field("statorLimitAmps", &ArmSimParams::statorLimitAmps)
      .field("supplyLimitAmps", &ArmSimParams::supplyLimitAmps)
      .field("statorVoltageVolts", &ArmSimParams::statorVoltageVolts)
      .field("batteryResistanceOhms", &ArmSimParams::batteryResistanceOhms)
      .field("batteryVoltageVolts", &ArmSimParams::batteryVoltageVolts)
      .field("efficiency", &ArmSimParams::efficiency)
      .field("goingUp", &ArmSimParams::goingUp)
      .field("simTimestep", &ArmSimParams::simTimestep)
      .field("decimation", &ArmSimParams::decimation)
      .field("maxSimSeconds", &ArmSimParams::maxSimSeconds)
      .field("batteryVoltageFilterTimeConstantSeconds",
             &ArmSimParams::batteryVoltageFilterTimeConstantSeconds);
  function("simulateArm(motor, params)", &SimulateArm, allow_raw_pointers());

  // LQR-derived feedback gains (kP, kD)
  value_object<ElevatorFeedbackParams>("ElevatorFeedbackParams")
      .field("gearing", &ElevatorFeedbackParams::gearing)
      .field("massKg", &ElevatorFeedbackParams::massKg)
      .field("spoolRadiusMeters", &ElevatorFeedbackParams::spoolRadiusMeters)
      .field("efficiency", &ElevatorFeedbackParams::efficiency)
      .field("qPositionMeters", &ElevatorFeedbackParams::qPositionMeters)
      .field("qVelocityMPS", &ElevatorFeedbackParams::qVelocityMPS)
      .field("rVolts", &ElevatorFeedbackParams::rVolts)
      .field("dtSeconds", &ElevatorFeedbackParams::dtSeconds)
      .field("sensorDelaySeconds", &ElevatorFeedbackParams::sensorDelaySeconds);
  function("computeElevatorFeedbackGains(motor, params)",
           &ComputeElevatorFeedbackGains, allow_raw_pointers());

  value_object<ArmFeedbackParams>("ArmFeedbackParams")
      .field("gearing", &ArmFeedbackParams::gearing)
      .field("momentOfInertiaKgMSquared",
             &ArmFeedbackParams::momentOfInertiaKgMSquared)
      .field("efficiency", &ArmFeedbackParams::efficiency)
      .field("qPositionRad", &ArmFeedbackParams::qPositionRad)
      .field("qVelocityRadPerSec", &ArmFeedbackParams::qVelocityRadPerSec)
      .field("rVolts", &ArmFeedbackParams::rVolts)
      .field("dtSeconds", &ArmFeedbackParams::dtSeconds)
      .field("sensorDelaySeconds", &ArmFeedbackParams::sensorDelaySeconds);
  function("computeArmFeedbackGains(motor, params)", &ComputeArmFeedbackGains,
           allow_raw_pointers());

  value_object<FlywheelFeedbackParams>("FlywheelFeedbackParams")
      .field("gearing", &FlywheelFeedbackParams::gearing)
      .field("momentOfInertiaKgMSquared",
             &FlywheelFeedbackParams::momentOfInertiaKgMSquared)
      .field("efficiency", &FlywheelFeedbackParams::efficiency)
      .field("qVelocityRadPerSec", &FlywheelFeedbackParams::qVelocityRadPerSec)
      .field("rVolts", &FlywheelFeedbackParams::rVolts)
      .field("dtSeconds", &FlywheelFeedbackParams::dtSeconds)
      .field("sensorDelaySeconds", &FlywheelFeedbackParams::sensorDelaySeconds);
  function("computeFlywheelFeedbackGains(motor, params)",
           &ComputeFlywheelFeedbackGains, allow_raw_pointers());

  // Feedforward gains (kV, kA, kG)
  value_object<LinearFeedforwardParams>("LinearFeedforwardParams")
      .field("gearing", &LinearFeedforwardParams::gearing)
      .field("loadKg", &LinearFeedforwardParams::loadKg)
      .field("spoolRadiusMeters", &LinearFeedforwardParams::spoolRadiusMeters)
      .field("efficiency", &LinearFeedforwardParams::efficiency)
      .field("angleRadians", &LinearFeedforwardParams::angleRadians);
  function("computeLinearFeedforwardGains(motor, params)",
           &ComputeLinearFeedforwardGains, allow_raw_pointers());

  value_object<AngularFeedforwardParams>("AngularFeedforwardParams")
      .field("gearing", &AngularFeedforwardParams::gearing)
      .field("momentOfInertiaKgMSquared",
             &AngularFeedforwardParams::momentOfInertiaKgMSquared)
      .field("efficiency", &AngularFeedforwardParams::efficiency)
      .field("comMassKg", &AngularFeedforwardParams::comMassKg)
      .field("comLengthMeters", &AngularFeedforwardParams::comLengthMeters);
  function("computeAngularFeedforwardGains(motor, params)",
           &ComputeAngularFeedforwardGains, allow_raw_pointers());

  value_object<FlywheelFeedforwardParams>("FlywheelFeedforwardParams")
      .field("gearing", &FlywheelFeedforwardParams::gearing)
      .field("momentOfInertiaKgMSquared",
             &FlywheelFeedforwardParams::momentOfInertiaKgMSquared)
      .field("efficiency", &FlywheelFeedforwardParams::efficiency);
  function("computeFlywheelFeedforwardGains(motor, params)",
           &ComputeFlywheelFeedforwardGains, allow_raw_pointers());
}

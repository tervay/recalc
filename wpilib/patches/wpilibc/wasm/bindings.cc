#include <emscripten/bind.h>
#include <emscripten/val.h>
#include <vector>

// Include wpilibc headers
#include "frc/RobotController.h"
#include "frc/simulation/BatterySim.h"
#include "frc/simulation/ElevatorSim.h"
#include "frc/simulation/FlywheelSim.h"
#include "frc/simulation/RoboRioSim.h"
#include "frc/system/plant/DCMotor.h"
#include "frc/system/plant/LinearSystemId.h"

// Include wpimath headers (for units)
#include "units/angular_velocity.h"
#include "units/current.h"
#include "units/impedance.h"
#include "units/length.h"
#include "units/mass.h"
#include "units/moment_of_inertia.h"
#include "units/time.h"
#include "units/torque.h"
#include "units/velocity.h"
#include "units/voltage.h"

using namespace emscripten;
using namespace frc;
using namespace frc::sim;

// DCMotor bindings - constructor
// We store DCMotor instances and pass them by reference
class DCMotorWasm {
public:
  DCMotorWasm(double nominalVoltageVolts, double stallTorqueNewtonMeters,
              double stallCurrentAmps, double freeCurrentAmps,
              double freeSpeedRadPerSec, int numMotors)
      : motor(units::volt_t(nominalVoltageVolts),
              units::newton_meter_t(stallTorqueNewtonMeters),
              units::ampere_t(stallCurrentAmps),
              units::ampere_t(freeCurrentAmps),
              units::radians_per_second_t(freeSpeedRadPerSec), numMotors) {}

  // Constructor from existing DCMotor (for WithReduction)
  DCMotorWasm(const DCMotor &existingMotor) : motor(existingMotor) {}

  const DCMotor &getMotor() const { return motor; }

  // Accessor methods for DCMotor fields
  double getFreeCurrentAmps() const { return motor.freeCurrent.to<double>(); }

  double getFreeSpeedRadPerSec() const { return motor.freeSpeed.to<double>(); }

  double getKtNMPerAmp() const { return motor.Kt.to<double>(); }

  double getKvRadPerSecPerVolt() const { return motor.Kv.to<double>(); }

  double getNominalVoltageVolts() const {
    return motor.nominalVoltage.to<double>();
  }

  double getROhms() const { return motor.R.to<double>(); }

  double getStallCurrentAmps() const { return motor.stallCurrent.to<double>(); }

  double getStallTorqueNewtonMeters() const {
    return motor.stallTorque.to<double>();
  }

  // DCMotor methods
  double currentFromSpeedAndVoltage(double speedRadPerSec,
                                    double inputVoltageVolts) const {
    return motor
        .Current(units::radians_per_second_t(speedRadPerSec),
                 units::volt_t(inputVoltageVolts))
        .to<double>();
  }

  double currentFromTorque(double torqueNewtonMeters) const {
    return motor.Current(units::newton_meter_t(torqueNewtonMeters))
        .to<double>();
  }

  double torqueFromCurrent(double currentAmps) const {
    return motor.Torque(units::ampere_t(currentAmps)).to<double>();
  }

  double voltageFromTorqueAndSpeed(double torqueNewtonMeters,
                                   double speedRadPerSec) const {
    return motor
        .Voltage(units::newton_meter_t(torqueNewtonMeters),
                 units::radians_per_second_t(speedRadPerSec))
        .to<double>();
  }

  double speedFromTorqueAndVoltage(double torqueNewtonMeters,
                                   double inputVoltageVolts) const {
    return motor
        .Speed(units::newton_meter_t(torqueNewtonMeters),
               units::volt_t(inputVoltageVolts))
        .to<double>();
  }

  DCMotorWasm *withReduction(double gearboxReduction) {
    return new DCMotorWasm(motor.WithReduction(gearboxReduction));
  }

private:
  DCMotor motor;
};

// ElevatorSim bindings
class ElevatorSimWasm {
public:
  // Constructor using the simpler form: DCMotor, gearing, mass, radius, etc.
  ElevatorSimWasm(DCMotorWasm *gearbox, double gearing, double carriageMassKg,
                  double drumRadiusMeters, double minHeightMeters,
                  double maxHeightMeters, bool simulateGravity,
                  double startingHeightMeters)
      : elevator(
            gearbox->getMotor(), gearing, units::kilogram_t(carriageMassKg),
            units::meter_t(drumRadiusMeters), units::meter_t(minHeightMeters),
            units::meter_t(maxHeightMeters), simulateGravity,
            units::meter_t(startingHeightMeters)) {}

  void setInputVoltage(double voltageVolts) {
    elevator.SetInputVoltage(units::volt_t(voltageVolts));
  }

  void update(double dtSeconds) { elevator.Update(units::second_t(dtSeconds)); }

  double getPosition() const { return elevator.GetPosition().to<double>(); }

  double getVelocity() const { return elevator.GetVelocity().to<double>(); }

  double getCurrentDraw() const {
    return elevator.GetCurrentDraw().to<double>();
  }

  bool hasHitLowerLimit() const { return elevator.HasHitLowerLimit(); }

  bool hasHitUpperLimit() const { return elevator.HasHitUpperLimit(); }

private:
  ElevatorSim elevator;
};

// FlywheelSim bindings
class FlywheelSimWasm {
public:
  // Constructor using DCMotor, gearing, and moment of inertia
  FlywheelSimWasm(DCMotorWasm *gearbox, double gearing,
                  double momentOfInertiaKgMSquared)
      : flywheel(LinearSystemId::FlywheelSystem(
                     gearbox->getMotor(),
                     units::kilogram_square_meter_t(momentOfInertiaKgMSquared),
                     gearing),
                 gearbox->getMotor()) {}

  void setInputVoltage(double voltageVolts) {
    flywheel.SetInputVoltage(units::volt_t(voltageVolts));
  }

  void update(double dtSeconds) { flywheel.Update(units::second_t(dtSeconds)); }

  double getAngularVelocity() const {
    return flywheel.GetAngularVelocity().to<double>();
  }

  double getCurrentDraw() const {
    return flywheel.GetCurrentDraw().to<double>();
  }

private:
  FlywheelSim flywheel;
};

// RoboRioSim wrapper functions for WebAssembly
void RoboRioSim_SetVInVoltage(double voltageVolts) {
  RoboRioSim::SetVInVoltage(units::volt_t(voltageVolts));
}

// RobotController wrapper functions for WebAssembly
double RobotController_GetInputVoltage() {
  return RobotController::GetInputVoltage();
}

// BatterySim wrapper functions for WebAssembly
double BatterySim_Calculate(const std::vector<double> &currentDrawsAmps) {
  std::vector<units::ampere_t> currents;

  // Convert vector of doubles to vector of ampere_t
  for (double currentAmps : currentDrawsAmps) {
    currents.push_back(units::ampere_t(currentAmps));
  }

  return BatterySim::Calculate(currents).to<double>();
}

// calculateDefaultBatteryLoadedVoltage - uses default 12V nominal and 20mOhm
// resistance
double BatterySim_CalculateDefaultBatteryLoadedVoltage(
    const std::vector<double> &currentDrawsAmps) {
  std::vector<units::ampere_t> currents;

  // Convert vector of doubles to vector of ampere_t
  for (double currentAmps : currentDrawsAmps) {
    currents.push_back(units::ampere_t(currentAmps));
  }

  // Calculate with default values: 12V nominal, 20mOhm resistance
  return BatterySim::Calculate(currents).to<double>();
}

// calculateLoadedBatteryVoltage - takes nominal voltage, resistance, and
// current draws
double BatterySim_CalculateLoadedBatteryVoltage(
    double nominalVoltageVolts, double resistanceOhms,
    const std::vector<double> &currentDrawsAmps) {
  std::vector<units::ampere_t> currents;

  // Convert vector of doubles to vector of ampere_t
  for (double currentAmps : currentDrawsAmps) {
    currents.push_back(units::ampere_t(currentAmps));
  }

  // Calculate with specified nominal voltage and resistance
  return BatterySim::Calculate(units::volt_t(nominalVoltageVolts),
                               units::ohm_t(resistanceOhms), currents)
      .to<double>();
}

// Emscripten bindings
EMSCRIPTEN_BINDINGS(wpilibc) {
  // Register vector<double> for automatic conversion from JavaScript arrays
  register_vector<double>("VectorDouble");

  // DCMotor constructor - takes motor parameters directly
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

  // ElevatorSim
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
}
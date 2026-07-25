#pragma once

#include "dc_motor.h"
#include "wpi/math/system/Models.hpp"
#include "wpi/simulation/DCMotorSim.hpp"

// WASM wrapper for wpi::sim::DCMotorSim.
class DCMotorSimWasm {
 public:
  DCMotorSimWasm(DCMotorWasm* gearbox, double gearing,
                 double momentOfInertiaKgMSquared)
      : motorSim(
            wpi::math::Models::SingleJointedArmFromPhysicalConstants(
                gearbox->getMotor(),
                wpi::units::kilogram_square_meter_t(momentOfInertiaKgMSquared),
                gearing),
            gearbox->getMotor()) {}

  void setInputVoltage(double voltageVolts) {
    motorSim.SetInputVoltage(wpi::units::volt_t(voltageVolts));
  }

  void update(double dtSeconds) {
    motorSim.Update(wpi::units::second_t(dtSeconds));
  }

  double getAngularPosition() const {
    return motorSim.GetAngularPosition().to<double>();
  }

  double getAngularVelocity() const {
    return motorSim.GetAngularVelocity().to<double>();
  }

  double getAngularAcceleration() const {
    return motorSim.GetAngularAcceleration().to<double>();
  }

  double getTorque() const { return motorSim.GetTorque().to<double>(); }

  double getInputVoltage() const {
    return motorSim.GetInputVoltage().to<double>();
  }

  double getJ() const { return motorSim.GetJ().to<double>(); }

  double getCurrentDraw() const {
    return motorSim.GetCurrentDraw().to<double>();
  }

 private:
  wpi::sim::DCMotorSim motorSim;
};

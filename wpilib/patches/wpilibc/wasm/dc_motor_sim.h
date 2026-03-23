#pragma once

#include "frc/simulation/DCMotorSim.h"
#include "frc/system/plant/LinearSystemId.h"
#include "units/angle.h"
#include "units/angular_acceleration.h"
#include "units/angular_velocity.h"
#include "units/current.h"
#include "units/moment_of_inertia.h"
#include "units/time.h"
#include "units/torque.h"
#include "units/voltage.h"

#include "dc_motor.h"

// WASM wrapper for frc::sim::DCMotorSim.
class DCMotorSimWasm {
public:
  DCMotorSimWasm(DCMotorWasm *gearbox, double gearing,
                 double momentOfInertiaKgMSquared)
      : motorSim(frc::LinearSystemId::DCMotorSystem(
                     gearbox->getMotor(),
                     units::kilogram_square_meter_t(momentOfInertiaKgMSquared),
                     gearing),
                 gearbox->getMotor()) {}

  void setInputVoltage(double voltageVolts) {
    motorSim.SetInputVoltage(units::volt_t(voltageVolts));
  }

  void update(double dtSeconds) { motorSim.Update(units::second_t(dtSeconds)); }

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
  frc::sim::DCMotorSim motorSim;
};

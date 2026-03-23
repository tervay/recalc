#pragma once

#include "frc/simulation/FlywheelSim.h"
#include "frc/system/plant/LinearSystemId.h"
#include "units/angular_velocity.h"
#include "units/current.h"
#include "units/moment_of_inertia.h"
#include "units/time.h"
#include "units/voltage.h"

#include "dc_motor.h"

// WASM wrapper for frc::sim::FlywheelSim.
class FlywheelSimWasm {
public:
  FlywheelSimWasm(DCMotorWasm *gearbox, double gearing,
                  double momentOfInertiaKgMSquared)
      : flywheel(frc::LinearSystemId::FlywheelSystem(
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
  frc::sim::FlywheelSim flywheel;
};

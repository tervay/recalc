#pragma once

#include "wpi/simulation/SingleJointedArmSim.hpp"

#include "dc_motor.h"

// WASM wrapper for wpi::sim::SingleJointedArmSim.
class SingleJointedArmSimWasm {
public:
  SingleJointedArmSimWasm(DCMotorWasm *gearbox, double gearing,
                          double momentOfInertiaKgMSquared,
                          double armLengthMeters, double minAngleRadians,
                          double maxAngleRadians, bool simulateGravity,
                          double startingAngleRadians)
      : arm(gearbox->getMotor(), gearing,
            wpi::units::kilogram_square_meter_t(momentOfInertiaKgMSquared),
            wpi::units::meter_t(armLengthMeters),
            wpi::units::radian_t(minAngleRadians),
            wpi::units::radian_t(maxAngleRadians), simulateGravity,
            wpi::units::radian_t(startingAngleRadians)) {}

  void setInputVoltage(double voltageVolts) {
    arm.SetInputVoltage(wpi::units::volt_t(voltageVolts));
  }

  void update(double dtSeconds) { arm.Update(wpi::units::second_t(dtSeconds)); }

  double getAngle() const { return arm.GetAngle().to<double>(); }

  double getAngularVelocity() const { return arm.GetVelocity().to<double>(); }

  double getCurrentDraw() const { return arm.GetCurrentDraw().to<double>(); }

  bool hasHitLowerLimit() const { return arm.HasHitLowerLimit(); }

  bool hasHitUpperLimit() const { return arm.HasHitUpperLimit(); }

private:
  wpi::sim::SingleJointedArmSim arm;
};

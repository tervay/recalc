#pragma once

#include "frc/simulation/SingleJointedArmSim.h"
#include "units/angle.h"
#include "units/angular_velocity.h"
#include "units/current.h"
#include "units/length.h"
#include "units/moment_of_inertia.h"
#include "units/time.h"
#include "units/voltage.h"

#include "dc_motor.h"

// WASM wrapper for frc::sim::SingleJointedArmSim.
class SingleJointedArmSimWasm {
public:
  SingleJointedArmSimWasm(DCMotorWasm *gearbox, double gearing,
                          double momentOfInertiaKgMSquared,
                          double armLengthMeters, double minAngleRadians,
                          double maxAngleRadians, bool simulateGravity,
                          double startingAngleRadians)
      : arm(gearbox->getMotor(), gearing,
            units::kilogram_square_meter_t(momentOfInertiaKgMSquared),
            units::meter_t(armLengthMeters), units::radian_t(minAngleRadians),
            units::radian_t(maxAngleRadians), simulateGravity,
            units::radian_t(startingAngleRadians)) {}

  void setInputVoltage(double voltageVolts) {
    arm.SetInputVoltage(units::volt_t(voltageVolts));
  }

  void update(double dtSeconds) { arm.Update(units::second_t(dtSeconds)); }

  double getAngle() const { return arm.GetAngle().to<double>(); }

  double getAngularVelocity() const { return arm.GetVelocity().to<double>(); }

  double getCurrentDraw() const { return arm.GetCurrentDraw().to<double>(); }

  bool hasHitLowerLimit() const { return arm.HasHitLowerLimit(); }

  bool hasHitUpperLimit() const { return arm.HasHitUpperLimit(); }

private:
  frc::sim::SingleJointedArmSim arm;
};

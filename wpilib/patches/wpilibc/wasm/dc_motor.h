#pragma once

#include "wpi/math/system/DCMotor.hpp"

// WASM wrapper for wpi::math::DCMotor. Stores a DCMotor by value and exposes
// its fields and methods to JavaScript via plain doubles.
class DCMotorWasm {
 public:
  DCMotorWasm(double nominalVoltageVolts, double stallTorqueNewtonMeters,
              double stallCurrentAmps, double freeCurrentAmps,
              double freeSpeedRadPerSec, int numMotors)
      : motor(wpi::units::volt_t(nominalVoltageVolts),
              wpi::units::newton_meter_t(stallTorqueNewtonMeters),
              wpi::units::ampere_t(stallCurrentAmps),
              wpi::units::ampere_t(freeCurrentAmps),
              wpi::units::radians_per_second_t(freeSpeedRadPerSec), numMotors) {
  }

  // Constructor from existing DCMotor (used by withReduction)
  explicit DCMotorWasm(const wpi::math::DCMotor& existingMotor)
      : motor(existingMotor) {}

  const wpi::math::DCMotor& getMotor() const { return motor; }

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

  double currentFromSpeedAndVoltage(double speedRadPerSec,
                                    double inputVoltageVolts) const {
    return motor
        .Current(wpi::units::radians_per_second_t(speedRadPerSec),
                 wpi::units::volt_t(inputVoltageVolts))
        .to<double>();
  }

  double currentFromTorque(double torqueNewtonMeters) const {
    return motor.Current(wpi::units::newton_meter_t(torqueNewtonMeters))
        .to<double>();
  }

  double torqueFromCurrent(double currentAmps) const {
    return motor.Torque(wpi::units::ampere_t(currentAmps)).to<double>();
  }

  double voltageFromTorqueAndSpeed(double torqueNewtonMeters,
                                   double speedRadPerSec) const {
    return motor
        .Voltage(wpi::units::newton_meter_t(torqueNewtonMeters),
                 wpi::units::radians_per_second_t(speedRadPerSec))
        .to<double>();
  }

  double speedFromTorqueAndVoltage(double torqueNewtonMeters,
                                   double inputVoltageVolts) const {
    return motor
        .Velocity(wpi::units::newton_meter_t(torqueNewtonMeters),
                  wpi::units::volt_t(inputVoltageVolts))
        .to<double>();
  }

  DCMotorWasm* withReduction(double gearboxReduction) {
    return new DCMotorWasm(motor.WithReduction(gearboxReduction));
  }

 private:
  wpi::math::DCMotor motor;
};

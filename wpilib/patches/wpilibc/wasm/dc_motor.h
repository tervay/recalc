#pragma once

#include <memory>

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

  [[nodiscard]] const wpi::math::DCMotor& getMotor() const { return motor; }

  [[nodiscard]] double getFreeCurrentAmps() const {
    return motor.freeCurrent.to<double>();
  }
  [[nodiscard]] double getFreeSpeedRadPerSec() const {
    return motor.freeSpeed.to<double>();
  }
  [[nodiscard]] double getKtNMPerAmp() const { return motor.Kt.to<double>(); }
  [[nodiscard]] double getKvRadPerSecPerVolt() const {
    return motor.Kv.to<double>();
  }
  [[nodiscard]] double getNominalVoltageVolts() const {
    return motor.nominalVoltage.to<double>();
  }
  [[nodiscard]] double getROhms() const { return motor.R.to<double>(); }
  [[nodiscard]] double getStallCurrentAmps() const {
    return motor.stallCurrent.to<double>();
  }
  [[nodiscard]] double getStallTorqueNewtonMeters() const {
    return motor.stallTorque.to<double>();
  }

  [[nodiscard]] double currentFromSpeedAndVoltage(
      double speedRadPerSec, double inputVoltageVolts) const {
    return motor
        .Current(wpi::units::radians_per_second_t(speedRadPerSec),
                 wpi::units::volt_t(inputVoltageVolts))
        .to<double>();
  }

  [[nodiscard]] double currentFromTorque(double torqueNewtonMeters) const {
    return motor.Current(wpi::units::newton_meter_t(torqueNewtonMeters))
        .to<double>();
  }

  [[nodiscard]] double torqueFromCurrent(double currentAmps) const {
    return motor.Torque(wpi::units::ampere_t(currentAmps)).to<double>();
  }

  [[nodiscard]] double voltageFromTorqueAndSpeed(double torqueNewtonMeters,
                                                 double speedRadPerSec) const {
    return motor
        .Voltage(wpi::units::newton_meter_t(torqueNewtonMeters),
                 wpi::units::radians_per_second_t(speedRadPerSec))
        .to<double>();
  }

  [[nodiscard]] double speedFromTorqueAndVoltage(
      double torqueNewtonMeters, double inputVoltageVolts) const {
    return motor
        .Velocity(wpi::units::newton_meter_t(torqueNewtonMeters),
                  wpi::units::volt_t(inputVoltageVolts))
        .to<double>();
  }

  [[nodiscard]] std::unique_ptr<DCMotorWasm> withReduction(
      double gearboxReduction) {
    return std::make_unique<DCMotorWasm>(motor.WithReduction(gearboxReduction));
  }

 private:
  wpi::math::DCMotor motor;
};

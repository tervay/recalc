#pragma once

#include <emscripten/val.h>

#include <cmath>
#include <vector>

#include "dc_motor.h"
#include "hal_init.h"
#include "sim_util.h"
#include "wpi/math/filter/LinearFilter.hpp"
#include "wpi/math/system/NumericalIntegration.hpp"
#include "wpi/simulation/BatterySim.hpp"
#include "wpi/simulation/RoboRioSim.hpp"
#include "wpi/simulation/SingleJointedArmSim.hpp"
#include "wpi/system/RobotController.hpp"

// WASM wrapper for wpi::sim::SingleJointedArmSim.
class SingleJointedArmSimWasm {
 public:
  SingleJointedArmSimWasm(DCMotorWasm* gearbox, double gearing,
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

// SingleJointedArmSim subclass that supports torque efficiency [0, 1].
// Overrides UpdateX to scale the motor force (B matrix) by efficiency while
// leaving back-EMF damping (A matrix) untouched, and re-applies gravity
// (which would otherwise be omitted since UpdateX is fully replaced).
class EfficiencyArmSim : public wpi::sim::SingleJointedArmSim {
 public:
  EfficiencyArmSim(const wpi::math::DCMotor& gearbox, double gearing,
                   wpi::units::kilogram_square_meter_t moi,
                   wpi::units::meter_t armLength, wpi::units::radian_t minAngle,
                   wpi::units::radian_t maxAngle, double startingAngleRadians,
                   double efficiency)
      : SingleJointedArmSim(gearbox, gearing, moi, armLength, minAngle,
                            maxAngle,
                            false,  // We handle gravity manually in UpdateX
                            wpi::units::radian_t(startingAngleRadians)),
        m_minAngleRad(minAngle.to<double>()),
        m_maxAngleRad(maxAngle.to<double>()),
        m_armLenMeters(armLength.to<double>()),
        m_efficiency(efficiency) {}

 protected:
  wpi::math::Vectord<2> UpdateX(const wpi::math::Vectord<2>& currentXhat,
                                const wpi::math::Vectord<1>& u,
                                wpi::units::second_t dt) override {
    auto updatedXhat = wpi::math::RKDP(
        [&](const wpi::math::Vectord<2>& x,
            const wpi::math::Vectord<1>& u_) -> wpi::math::Vectord<2> {
          wpi::math::Vectord<2> xdot = m_plant.A() * x + m_plant.B() * u_;
          // Scale motor torque by efficiency (B term only, preserves back-EMF)
          xdot(1) += (m_efficiency - 1.0) * m_plant.B()(1, 0) * u_(0);
          // Gravity: alpha = -3/2 * g / L * cos(theta), per WPILib arm model
          if (m_armLenMeters > 0.0) {
            xdot(1) += -3.0 / 2.0 * 9.8 / m_armLenMeters * std::cos(x(0));
          }
          return xdot;
        },
        currentXhat, u, dt);

    if (WouldHitLowerLimit(wpi::units::radian_t{updatedXhat(0)})) {
      return wpi::math::Vectord<2>{m_minAngleRad, 0.0};
    }
    if (WouldHitUpperLimit(wpi::units::radian_t{updatedXhat(0)})) {
      return wpi::math::Vectord<2>{m_maxAngleRad, 0.0};
    }
    return updatedXhat;
  }

 private:
  double m_minAngleRad;
  double m_maxAngleRad;
  double m_armLenMeters;
  double m_efficiency;
};

// Internal state record for one timestep of the arm simulation.
struct ArmSimStateInternal {
  double angleRadians;
  double angularVelocityRadPerSec;
  double statorCurrentDrawAmps;
  double supplyCurrentDrawAmps;
  double timeSeconds;
  double batteryVoltageVolts;
  double motorAppliedVoltageVolts;
  double motorRpm;
  double energyJoules;
  bool success;
};

// Full single-jointed arm simulation loop. Parameters must be in SI units:
//   statorLimitAmps   — total stator current limit (per-motor limit × quantity)
//   supplyLimitAmps   — total supply current limit (per-motor limit × quantity)
//   efficiency        — torque efficiency in [0, 1]
//   goingUp           — true: arm moves from startingAngle toward maxAngle;
//                       false: arm moves from startingAngle toward minAngle
// Returns a JS array of state objects decimated by `decimation`, with the last
// state always included (matches obliterateArray behaviour in utils.ts).
inline emscripten::val SimulateArm(
    DCMotorWasm* motor, double gearing, double momentOfInertiaKgMSquared,
    double armLengthMeters, double minAngleRadians, double maxAngleRadians,
    double startingAngleRadians, double statorLimitAmps, double supplyLimitAmps,
    double statorVoltageVolts, double batteryResistanceOhms,
    double batteryVoltageVolts, double efficiency, bool goingUp,
    double simTimestep, int decimation, double maxSimSeconds,
    double batteryVoltageFilterTimeConstantSeconds) {
  EnsureHalInitialized();

  EfficiencyArmSim arm(
      motor->getMotor(), gearing,
      wpi::units::kilogram_square_meter_t(momentOfInertiaKgMSquared),
      wpi::units::meter_t(armLengthMeters),
      wpi::units::radian_t(minAngleRadians),
      wpi::units::radian_t(maxAngleRadians), startingAngleRadians, efficiency);

  wpi::sim::RoboRioSim::SetVInVoltage(wpi::units::volt_t(batteryVoltageVolts));

  const double rOhms = motor->getROhms();
  const double kvRadPerSecPerVolt = motor->getKvRadPerSecPerVolt();
  double timestamp = 0.0;
  double energyJoules = 0.0;

  auto batteryFilter = wpi::math::LinearFilter<double>::SinglePoleIIR(
      batteryVoltageFilterTimeConstantSeconds,
      wpi::units::second_t(simTimestep));
  batteryFilter.Reset(std::span<const double>{&batteryVoltageVolts, 1},
                      std::span<const double>{&batteryVoltageVolts, 1});

  std::vector<ArmSimStateInternal> states;

  auto isAtGoal = [&]() {
    return goingUp ? arm.HasHitUpperLimit() : arm.HasHitLowerLimit();
  };

  while (!isAtGoal()) {
    // Directed voltage: positive when going up, negative when going down
    double vApplied = goingUp ? statorVoltageVolts : -statorVoltageVolts;

    // Motor shaft angular velocity (rad/s) from arm velocity
    const double armRadPerSec = arm.GetVelocity().to<double>();
    const double motorShaftRadPerSec = armRadPerSec * gearing;
    const double vBackEmf = kvRadPerSecPerVolt > 0.0
                                ? motorShaftRadPerSec / kvRadPerSecPerVolt
                                : 0.0;

    const double vSupply = wpi::RobotController::GetInputVoltage();

    vApplied = ClampVoltageForCurrentLimits(
        vApplied, vBackEmf, rOhms, statorLimitAmps, supplyLimitAmps, vSupply);

    arm.SetInputVoltage(wpi::units::volt_t(vApplied));
    arm.Update(wpi::units::second_t(simTimestep));
    timestamp += simTimestep;

    const double statorCurrent = arm.GetCurrentDraw().to<double>();
    const double supplyCurrent =
        SupplyCurrentFromStator(statorCurrent, vApplied, vSupply);
    energyJoules += supplyCurrent * vSupply * simTimestep;

    // Battery voltage under load, smoothed by a single-pole IIR filter
    std::vector<wpi::units::ampere_t> currents = {
        wpi::units::ampere_t(supplyCurrent)};
    const double rawBatteryVoltage =
        wpi::sim::BatterySim::Calculate(
            wpi::units::volt_t(batteryVoltageVolts),
            wpi::units::ohm_t(batteryResistanceOhms), currents)
            .to<double>();
    const double filteredBatteryVoltage =
        batteryFilter.Calculate(rawBatteryVoltage);

    if (!isAtGoal()) {
      const double motorRpm =
          std::abs(motorShaftRadPerSec) * 60.0 / (2.0 * M_PI);
      states.push_back({arm.GetAngle().to<double>(), armRadPerSec,
                        statorCurrent, supplyCurrent, timestamp,
                        filteredBatteryVoltage, vApplied, motorRpm,
                        energyJoules, true});
    }

    wpi::sim::RoboRioSim::SetVInVoltage(
        wpi::units::volt_t(filteredBatteryVoltage));

    if (timestamp > maxSimSeconds) {
      if (!states.empty()) {
        states.back().success = false;
      }
      break;
    }
  }

  return DecimateToJsArray<ArmSimStateInternal>(
      states, decimation, [](const ArmSimStateInternal& s) {
        emscripten::val state = emscripten::val::object();
        state.set("angleRadians", s.angleRadians);
        state.set("angularVelocityRadPerSec", s.angularVelocityRadPerSec);
        state.set("statorCurrentDrawAmps", s.statorCurrentDrawAmps);
        state.set("supplyCurrentDrawAmps", s.supplyCurrentDrawAmps);
        state.set("timeSeconds", s.timeSeconds);
        state.set("batteryVoltageVolts", s.batteryVoltageVolts);
        state.set("motorAppliedVoltageVolts", s.motorAppliedVoltageVolts);
        state.set("motorRpm", s.motorRpm);
        state.set("energyJoules", s.energyJoules);
        state.set("success", s.success);
        return state;
      });
}

#pragma once

#include <emscripten/val.h>

#include <cmath>
#include <stdexcept>
#include <vector>

#include "dc_motor.h"
#include "hal_init.h"
#include "sim_util.h"
#include "wasm_console.h"
#include "wpi/math/controller/LinearQuadraticRegulator.hpp"
#include "wpi/math/estimator/KalmanFilter.hpp"
#include "wpi/math/filter/LinearFilter.hpp"
#include "wpi/math/system/LinearSystem.hpp"
#include "wpi/math/system/LinearSystemLoop.hpp"
#include "wpi/math/system/Models.hpp"
#include "wpi/math/system/NumericalIntegration.hpp"
#include "wpi/math/trajectory/TrapezoidProfile.hpp"
#include "wpi/simulation/BatterySim.hpp"
#include "wpi/simulation/ElevatorSim.hpp"
#include "wpi/simulation/RoboRioSim.hpp"
#include "wpi/system/RobotController.hpp"
#include "wpi/units/length.hpp"
#include "wpi/units/math.hpp"

inline constexpr double kGravityMetersPerSecondSquared = 9.80665;

// ElevatorSim subclass that supports angle (radians from horizontal) and torque
// efficiency [0, 1]. Overrides UpdateX to replace the hardcoded vertical
// gravity with sin(angle) * g and to scale the motor force (B matrix) by
// efficiency while leaving back-EMF damping (A matrix) untouched.
class AngledElevatorSim : public wpi::sim::ElevatorSim {
 public:
  AngledElevatorSim(const wpi::math::DCMotor& gearbox, double gearing,
                    wpi::units::kilogram_t carriageMass,
                    wpi::units::meter_t drumRadius, double minHeightMeters,
                    double maxHeightMeters, double startingHeightMeters,
                    double angleRadians, double efficiency)
      : ElevatorSim(gearbox, gearing, carriageMass, drumRadius,
                    wpi::units::meter_t(minHeightMeters),
                    wpi::units::meter_t(maxHeightMeters),
                    false,  // disable base class gravity — handled here
                    wpi::units::meter_t(startingHeightMeters)),
        m_minH(minHeightMeters),
        m_maxH(maxHeightMeters),
        m_angle(angleRadians),
        m_efficiency(efficiency) {}

 protected:
  wpi::math::Vectord<2> UpdateX(const wpi::math::Vectord<2>& currentXhat,
                                const wpi::math::Vectord<1>& u,
                                wpi::units::second_t dt) override {
    auto updatedXhat = wpi::math::RKDP(
        [&](const wpi::math::Vectord<2>& x,
            const wpi::math::Vectord<1>& u_) -> wpi::math::Vectord<2> {
          wpi::math::Vectord<2> xdot = m_plant.A() * x + m_plant.B() * u_;
          // Scale motor force by efficiency (B term only, preserves back-EMF)
          xdot(1) += (m_efficiency - 1.0) * m_plant.B()(1, 0) * u_(0);
          // Angle-adjusted gravity: full at 90deg (vertical), zero at 0deg
          // (horizontal)
          xdot(1) -= kGravityMetersPerSecondSquared * std::sin(m_angle);
          return xdot;
        },
        currentXhat, u, dt);

    if (WouldHitLowerLimit(wpi::units::meter_t{updatedXhat(0)})) {
      return wpi::math::Vectord<2>{m_minH, 0.0};
    }
    if (WouldHitUpperLimit(wpi::units::meter_t{updatedXhat(0)})) {
      return wpi::math::Vectord<2>{m_maxH, 0.0};
    }
    return updatedXhat;
  }

 private:
  double m_minH;
  double m_maxH;
  double m_angle;       // radians from horizontal
  double m_efficiency;  // torque efficiency in [0, 1]
};

// Internal state record for one timestep of the elevator simulation.
struct ElevatorSimStateInternal {
  double positionMeters;
  double velocityMetersPerSecond;
  double statorCurrentDrawAmps;
  double supplyCurrentDrawAmps;
  double timeSeconds;
  double batteryVoltageVolts;
  double motorAppliedVoltageVolts;
  double motorRpm;
  double energyJoules;
  bool success;
};

// Core simulation logic. May throw (e.g. from the DARE solver inside LQR or
// KalmanFilter construction) when the plant model is ill-conditioned.
inline emscripten::val SimulateElevatorImpl(
    DCMotorWasm* motor, double gearing, double loadKg, double spoolRadiusMeters,
    double travelDistanceMeters, double statorLimitAmps, double supplyLimitAmps,
    double batteryResistanceOhms, double batteryVoltageVolts,
    double simTimestep, int decimation, double maxSimSeconds,
    double angleRadians, double efficiency, bool cascade,
    double batteryVoltageFilterTimeConstantSeconds, double maxVelocityMPS,
    double maxAccelerationMPS2, double qPositionMeters, double qVelocityMPS,
    double rVolts, double sensorDelaySeconds, double kalmanFilterPositionStdDev,
    double kalmanFilterVelocityStdDev,
    double kalmanFilterEncoderPositionStdDev) {
  // Guard degenerate inputs, mirroring feedforward_gains.h. A non-positive
  // spoolRadiusMeters divides by zero when converting carriage velocity to
  // motor shaft speed, and a non-positive efficiency divides by zero when
  // deriving kG from kA -- both silently, producing inf/NaN states rather than
  // raising. decimation is guarded too because DecimateToJsArray computes
  // `i % decimation`: integer modulo by zero is a wasm trap, which the
  // try/catch in SimulateElevator below cannot intercept.
  if (maxVelocityMPS <= 0.0 || maxAccelerationMPS2 <= 0.0 || gearing <= 0.0 ||
      spoolRadiusMeters <= 0.0 || efficiency <= 0.0 || decimation <= 0) {
    return emscripten::val::array();
  }

  // RoboRioSim / RobotController / ElevatorSim::SetInputVoltage all touch
  // SimRoboRioData without lazy-init; see hal_init.h.
  EnsureHalInitialized();

  // Cascade rigging: the first stage travels half the carriage distance, and
  // the effective load is doubled (each side of the cascade belt carries the
  // full carriage + object weight). Stage-2 frame weight is omitted here.
  // kA and kG are computed from loadKg below, so doubling loadKg is sufficient.
  // Reference: https://www.chiefdelphi.com/t/cascade-elevator-gearing/345099/12
  if (cascade) {
    travelDistanceMeters *= 0.5;
    loadKg *= 2.0;
  }

  AngledElevatorSim elevator(
      motor->getMotor(), gearing, wpi::units::kilogram_t(loadKg),
      wpi::units::meter_t(spoolRadiusMeters), 0.0, travelDistanceMeters, 0.0,
      angleRadians, efficiency);

  wpi::sim::RoboRioSim::SetVInVoltage(wpi::units::volt_t(batteryVoltageVolts));

  // Build ideal plant from physical constants for deriving kG and feedforward.
  auto idealPlantFull = wpi::math::Models::ElevatorFromPhysicalConstants(
      motor->getMotor(), wpi::units::kilogram_t(loadKg),
      wpi::units::meter_t(spoolRadiusMeters), gearing);

  // Derive kG volts from the plant's B matrix (voltage to acceleration gain).
  // u = a / B(1,0) where a is gravity's acceleration along the mechanism.
  const double kaIdeal = 1.0 / idealPlantFull.B()(1, 0);
  const double kGVolts = (kaIdeal / efficiency) *
                         kGravityMetersPerSecondSquared *
                         std::sin(angleRadians);

  // Build LinearSystem<2,1,1> for the controller, scaling B by efficiency.
  wpi::math::Matrixd<2, 1> controllerB = idealPlantFull.B() * efficiency;
  wpi::math::Matrixd<1, 2> controllerC;
  controllerC << 1, 0;
  wpi::math::Matrixd<1, 1> controllerD;
  controllerD << 0;
  wpi::math::LinearSystem<2, 1, 1> plant{idealPlantFull.A(), controllerB,
                                         controllerC, controllerD};

  // Kalman filter (fixed noise -- not user-exposed)
  wpi::math::KalmanFilter<2, 1, 1> observer{
      plant,
      {kalmanFilterPositionStdDev, kalmanFilterVelocityStdDev},
      {kalmanFilterEncoderPositionStdDev},
      wpi::units::second_t(simTimestep)};

  // LQR with user-tunable Q/R (Bryson's rule)
  wpi::math::LinearQuadraticRegulator<2, 1> controller{
      plant,
      {qPositionMeters, qVelocityMPS},
      {rVolts},
      wpi::units::second_t(simTimestep)};

  controller.LatencyCompensate(plant, wpi::units::second_t(simTimestep),
                               wpi::units::second_t(sensorDelaySeconds));

  // LinearSystemLoop: plant + LQR + Kalman + voltage clamp at rVolts
  wpi::math::LinearSystemLoop<2, 1, 1> loop{plant, controller, observer,
                                            wpi::units::volt_t(rVolts),
                                            wpi::units::second_t(simTimestep)};
  loop.Reset(wpi::math::Vectord<2>{0.0, 0.0});

  const double kvRadPerSecPerVolt = motor->getKvRadPerSecPerVolt();
  const double rOhms = motor->getROhms();
  double timestamp = 0.0;
  double energyJoules = 0.0;

  auto batteryFilter = wpi::math::LinearFilter<double>::SinglePoleIIR(
      batteryVoltageFilterTimeConstantSeconds,
      wpi::units::second_t(simTimestep));
  batteryFilter.Reset(std::span<const double>{&batteryVoltageVolts, 1},
                      std::span<const double>{&batteryVoltageVolts, 1});

  // Build motion profile
  using Distance = wpi::units::meters;

  wpi::math::TrapezoidProfile<Distance> profile{
      {wpi::units::meters_per_second_t(maxVelocityMPS),
       wpi::units::meters_per_second_squared_t(maxAccelerationMPS2)}};

  wpi::math::TrapezoidProfile<Distance>::State profileState{
      wpi::units::meter_t(0.0), wpi::units::meters_per_second_t(0.0)};
  wpi::math::TrapezoidProfile<Distance>::State goalState{
      wpi::units::meter_t(travelDistanceMeters),
      wpi::units::meters_per_second_t(0.0)};

  // Pre-compute total profile time
  profile.Calculate(wpi::units::second_t(0.0), profileState, goalState);
  const double totalProfileTime = profile.TotalTime().to<double>();

  std::vector<ElevatorSimStateInternal> states;

  while (timestamp < totalProfileTime && timestamp < maxSimSeconds) {
    const auto nextProfileState = profile.Calculate(
        wpi::units::second_t(simTimestep), profileState, goalState);

    loop.SetNextR(wpi::math::Vectord<2>{nextProfileState.position.value(),
                                        nextProfileState.velocity.value()});

    loop.Correct(wpi::math::Vectord<1>{elevator.GetPosition().value()});
    loop.Predict(wpi::units::second_t(simTimestep));

    double vApplied = loop.U(0) + kGVolts;

    // Motor shaft angular velocity (rad/s) from carriage velocity
    const double velocityMPS = elevator.GetVelocity().to<double>();
    const double motorShaftRadPerSec =
        velocityMPS / spoolRadiusMeters * gearing;
    const double vBackEmf = motorShaftRadPerSec / kvRadPerSecPerVolt;

    const double vSupply = wpi::RobotController::GetInputVoltage();

    vApplied = ClampVoltageForCurrentLimits(
        vApplied, vBackEmf, rOhms, statorLimitAmps, supplyLimitAmps, vSupply);

    elevator.SetInputVoltage(wpi::units::volt_t(vApplied));
    elevator.Update(wpi::units::second_t(simTimestep));

    profileState = nextProfileState;
    timestamp += simTimestep;

    const double statorCurrent = elevator.GetCurrentDraw().to<double>();
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

    // The row is stamped with the post-step `timestamp`, so every field in it
    // is read after the step. `motorShaftRadPerSec` above is the pre-step value
    // and is deliberately not reused here: it feeds the back-EMF term of the
    // voltage clamp, which must act on the state at the start of the step.
    const double updatedVelocityMPS = elevator.GetVelocity().to<double>();
    const double motorRpm =
        updatedVelocityMPS / spoolRadiusMeters * gearing * 60.0 / (2.0 * M_PI);
    states.push_back({elevator.GetPosition().to<double>(), updatedVelocityMPS,
                      statorCurrent, supplyCurrent, timestamp,
                      filteredBatteryVoltage, vApplied, motorRpm, energyJoules,
                      true});

    wpi::sim::RoboRioSim::SetVInVoltage(
        wpi::units::volt_t(filteredBatteryVoltage));
  }

  // Mark success based on whether the position reached the goal within 3 inches
  const wpi::units::meter_t successThreshold = wpi::units::inch_t{3.0};
  const bool success =
      !states.empty() &&
      wpi::units::math::abs(elevator.GetPosition() -
                            wpi::units::meter_t{travelDistanceMeters}) <
          successThreshold;
  if (!states.empty()) {
    states.back().success = success;
  }

  return DecimateToJsArray<ElevatorSimStateInternal>(
      states, decimation, [](const ElevatorSimStateInternal& s) {
        emscripten::val state = emscripten::val::object();
        state.set("positionMeters", s.positionMeters);
        state.set("velocityMetersPerSecond", s.velocityMetersPerSecond);
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

// Public entry point. Wraps SimulateElevatorImpl in a try-catch so that
// DARE solver failures and other numerical exceptions return an empty array
// with a diagnostic console.warn instead of aborting the worker.
inline emscripten::val SimulateElevator(
    DCMotorWasm* motor, double gearing, double loadKg, double spoolRadiusMeters,
    double travelDistanceMeters, double statorLimitAmps, double supplyLimitAmps,
    double batteryResistanceOhms, double batteryVoltageVolts,
    double simTimestep, int decimation, double maxSimSeconds,
    double angleRadians, double efficiency, bool cascade,
    double batteryVoltageFilterTimeConstantSeconds, double maxVelocityMPS,
    double maxAccelerationMPS2, double qPositionMeters, double qVelocityMPS,
    double rVolts, double sensorDelaySeconds, double kalmanFilterPositionStdDev,
    double kalmanFilterVelocityStdDev,
    double kalmanFilterEncoderPositionStdDev) {
  try {
    return SimulateElevatorImpl(
        motor, gearing, loadKg, spoolRadiusMeters, travelDistanceMeters,
        statorLimitAmps, supplyLimitAmps, batteryResistanceOhms,
        batteryVoltageVolts, simTimestep, decimation, maxSimSeconds,
        angleRadians, efficiency, cascade,
        batteryVoltageFilterTimeConstantSeconds, maxVelocityMPS,
        maxAccelerationMPS2, qPositionMeters, qVelocityMPS, rVolts,
        sensorDelaySeconds, kalmanFilterPositionStdDev,
        kalmanFilterVelocityStdDev, kalmanFilterEncoderPositionStdDev);
  } catch (const std::exception& e) {
    ConsoleWarn(
        "SimulateElevator: {} (gearing={} loadKg={} spoolR={} statorA={} "
        "supplyA={})",
        e.what(), gearing, loadKg, spoolRadiusMeters, statorLimitAmps,
        supplyLimitAmps);
    return emscripten::val::array();
  } catch (...) {
    ConsoleWarn(
        "SimulateElevator: unknown exception (gearing={} loadKg={} spoolR={} "
        "statorA={} supplyA={})",
        gearing, loadKg, spoolRadiusMeters, statorLimitAmps, supplyLimitAmps);
    return emscripten::val::array();
  }
}

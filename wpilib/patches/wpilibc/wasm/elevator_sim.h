#pragma once

#include <emscripten/val.h>

#include <cmath>
#include <numbers>
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
inline constexpr double kGoalToleranceMeters = 0.0127;
inline constexpr double kGoalHoldSeconds = 0.1;

EMSCRIPTEN_DECLARE_VAL_TYPE(ElevatorSimRows);

struct AngledElevatorConfig {
  double gearing;
  double loadKg;
  double spoolRadiusMeters;
  double minHeightMeters;
  double maxHeightMeters;
  double startingHeightMeters;
  double angleRadians;
  double efficiency;
};

// ElevatorSim subclass that supports angle (radians from horizontal) and torque
// efficiency [0, 1]. Overrides UpdateX to replace the hardcoded vertical
// gravity with sin(angle) * g and to scale the motor-side dynamics by
// efficiency.
//
// Efficiency models a lossy gearbox delivering efficiency * Kt * I to the
// carriage, with I = (u - backEmf) / R. Both the applied-voltage term and the
// back-EMF term pass through the same gearbox, so efficiency multiplies the
// whole acceleration row -- A and B alike -- and cancels at steady state.
// Efficiency therefore costs acceleration, never top speed. Gravity acts on
// the carriage directly rather than through the gearbox, so it is applied
// outside the scale.
class AngledElevatorSim : public wpi::sim::ElevatorSim {
 public:
  AngledElevatorSim(const wpi::math::DCMotor& gearbox,
                    const AngledElevatorConfig& config)
      : ElevatorSim(gearbox, config.gearing,
                    wpi::units::kilogram_t(config.loadKg),
                    wpi::units::meter_t(config.spoolRadiusMeters),
                    wpi::units::meter_t(config.minHeightMeters),
                    wpi::units::meter_t(config.maxHeightMeters),
                    false,  // disable base class gravity — handled here
                    wpi::units::meter_t(config.startingHeightMeters)),
        m_minH(config.minHeightMeters),
        m_maxH(config.maxHeightMeters),
        m_angle(config.angleRadians),
        m_efficiency(config.efficiency) {}

 protected:
  wpi::math::Vectord<2> UpdateX(const wpi::math::Vectord<2>& currentXhat,
                                const wpi::math::Vectord<1>& u,
                                wpi::units::second_t dt) override {
    auto updatedXhat = wpi::math::RKDP(
        [&](const wpi::math::Vectord<2>& x,
            const wpi::math::Vectord<1>& u_) -> wpi::math::Vectord<2> {
          wpi::math::Vectord<2> xdot = m_plant.A() * x + m_plant.B() * u_;
          // Gearbox losses on the motor-side row. xdot(0) is the kinematic
          // v = dx/dt relation and must not be scaled.
          xdot(1) *= m_efficiency;
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
  double timeToGoalSeconds;
};

struct ElevatorSimParams {
  double gearing;
  double loadKg;
  double spoolRadiusMeters;
  double travelDistanceMeters;
  double statorLimitAmps;
  double supplyLimitAmps;
  double batteryResistanceOhms;
  double batteryVoltageVolts;
  double simTimestep;
  int decimation;
  double maxSimSeconds;
  double angleRadians;
  double efficiency;
  bool cascade;
  double batteryVoltageFilterTimeConstantSeconds;
  double maxVelocityMPS;
  double maxAccelerationMPS2;
  double qPositionMeters;
  double qVelocityMPS;
  double rVolts;
  double sensorDelaySeconds;
  double kalmanFilterPositionStdDev;
  double kalmanFilterVelocityStdDev;
  double kalmanFilterEncoderPositionStdDev;
};

// Core simulation logic. May throw (e.g. from the DARE solver inside LQR or
// KalmanFilter construction) when the plant model is ill-conditioned.
inline emscripten::val SimulateElevatorImpl(const DCMotorWasm* motor,
                                            const ElevatorSimParams& params) {
  // Guard degenerate inputs, mirroring feedforward_gains.h. A non-positive
  // spoolRadiusMeters divides by zero when converting carriage velocity to
  // motor shaft speed, and a non-positive efficiency divides by zero when
  // deriving kG from kA -- both silently, producing inf/NaN states rather than
  // raising. decimation is guarded too because DecimateToJsArray computes
  // `i % decimation`: integer modulo by zero is a wasm trap, which the
  // try/catch in SimulateElevator below cannot intercept.
  if (params.maxVelocityMPS <= 0.0 || params.maxAccelerationMPS2 <= 0.0 ||
      params.gearing <= 0.0 || params.spoolRadiusMeters <= 0.0 ||
      params.efficiency <= 0.0 || params.decimation <= 0) {
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
  constexpr double kCascadeTravelFraction = 0.5;
  constexpr double kCascadeLoadMultiplier = 2.0;
  const double travelDistanceMeters =
      params.cascade ? params.travelDistanceMeters * kCascadeTravelFraction
                     : params.travelDistanceMeters;
  const double loadKg =
      params.cascade ? params.loadKg * kCascadeLoadMultiplier : params.loadKg;

  AngledElevatorSim elevator(motor->getMotor(),
                             {
                                 .gearing = params.gearing,
                                 .loadKg = loadKg,
                                 .spoolRadiusMeters = params.spoolRadiusMeters,
                                 .minHeightMeters = 0.0,
                                 .maxHeightMeters = travelDistanceMeters,
                                 .startingHeightMeters = 0.0,
                                 .angleRadians = params.angleRadians,
                                 .efficiency = params.efficiency,
                             });

  wpi::sim::RoboRioSim::SetVInVoltage(
      wpi::units::volt_t(params.batteryVoltageVolts));

  // Build ideal plant from physical constants for deriving kG and feedforward.
  const auto idealPlantFull =
      wpi::math::Models::LinearPositionFromPhysicalConstants(
          motor->getMotor(), wpi::units::kilogram_t(loadKg),
          wpi::units::meter_t(params.spoolRadiusMeters), params.gearing);

  // Derive kG volts from the plant's B matrix (voltage to acceleration gain).
  // u = a / B(1,0) where a is gravity's acceleration along the mechanism.
  const double kaIdeal = 1.0 / idealPlantFull.B()(1, 0);
  const double kGVolts = (kaIdeal / params.efficiency) *
                         kGravityMetersPerSecondSquared *
                         std::sin(params.angleRadians);

  // Build LinearSystem<2,1,1> for the controller, matching AngledElevatorSim:
  // efficiency scales the motor-side row, so A(1,1) moves with B. A(0,1) is
  // the kinematic v = dx/dt relation and must stay exactly 1.
  wpi::math::Matrixd<2, 2> controllerA = idealPlantFull.A();
  controllerA(1, 1) *= params.efficiency;
  const wpi::math::Matrixd<2, 1> controllerB =
      idealPlantFull.B() * params.efficiency;
  wpi::math::Matrixd<1, 2> controllerC;
  controllerC << 1, 0;
  wpi::math::Matrixd<1, 1> controllerD;
  controllerD << 0;
  wpi::math::LinearSystem<2, 1, 1> plant{controllerA, controllerB, controllerC,
                                         controllerD};

  // Kalman filter (fixed noise -- not user-exposed)
  wpi::math::KalmanFilter<2, 1, 1> observer{
      plant,
      {params.kalmanFilterPositionStdDev, params.kalmanFilterVelocityStdDev},
      {params.kalmanFilterEncoderPositionStdDev},
      wpi::units::second_t(params.simTimestep)};

  // LQR with user-tunable Q/R (Bryson's rule)
  wpi::math::LinearQuadraticRegulator<2, 1> controller{
      plant,
      {params.qPositionMeters, params.qVelocityMPS},
      {params.rVolts},
      wpi::units::second_t(params.simTimestep)};

  controller.LatencyCompensate(plant, wpi::units::second_t(params.simTimestep),
                               wpi::units::second_t(params.sensorDelaySeconds));

  // LinearSystemLoop: plant + LQR + Kalman + voltage clamp at rVolts
  wpi::math::LinearSystemLoop<2, 1, 1> loop{
      plant, controller, observer, wpi::units::volt_t(params.rVolts),
      wpi::units::second_t(params.simTimestep)};
  loop.Reset(wpi::math::Vectord<2>{0.0, 0.0});

  const double kvRadPerSecPerVolt = motor->getKvRadPerSecPerVolt();
  const double rOhms = motor->getROhms();
  double timestamp = 0.0;
  double energyJoules = 0.0;

  auto batteryFilter = wpi::math::LinearFilter<double>::SinglePoleIIR(
      params.batteryVoltageFilterTimeConstantSeconds,
      wpi::units::second_t(params.simTimestep));
  batteryFilter.Reset(std::span<const double>{&params.batteryVoltageVolts, 1},
                      std::span<const double>{&params.batteryVoltageVolts, 1});

  // Build motion profile
  using Distance = wpi::units::meters;

  wpi::math::TrapezoidProfile<Distance> profile{
      {wpi::units::meters_per_second_t(params.maxVelocityMPS),
       wpi::units::meters_per_second_squared_t(params.maxAccelerationMPS2)}};

  wpi::math::TrapezoidProfile<Distance>::State profileState{
      .position = wpi::units::meter_t(0.0),
      .velocity = wpi::units::meters_per_second_t(0.0),
  };
  const wpi::math::TrapezoidProfile<Distance>::State goalState{
      .position = wpi::units::meter_t(travelDistanceMeters),
      .velocity = wpi::units::meters_per_second_t(0.0),
  };

  // Pre-compute total profile time
  profile.Calculate(wpi::units::second_t(0.0), profileState, goalState);
  const auto totalProfileTime = profile.Duration().to<double>();

  std::vector<ElevatorSimStateInternal> states;

  const double goalToleranceMeters =
      params.cascade ? kGoalToleranceMeters / 2.0 : kGoalToleranceMeters;
  bool inGoalBand = false;
  double goalBandEnteredAt = 0.0;
  size_t goalBandEnteredIndex = 0;

  while (timestamp < params.maxSimSeconds &&
         (timestamp < totalProfileTime || !inGoalBand ||
          timestamp - goalBandEnteredAt < kGoalHoldSeconds)) {
    const auto nextProfileState = profile.Calculate(
        wpi::units::second_t(params.simTimestep), profileState, goalState);

    loop.SetNextR(wpi::math::Vectord<2>{nextProfileState.position.value(),
                                        nextProfileState.velocity.value()});

    loop.Correct(wpi::math::Vectord<1>{elevator.GetPosition().value()});
    loop.Predict(wpi::units::second_t(params.simTimestep));

    double vApplied = loop.U(0) + kGVolts;

    // Motor shaft angular velocity (rad/s) from carriage velocity
    const auto velocityMPS = elevator.GetVelocity().to<double>();
    const double motorShaftRadPerSec =
        velocityMPS / params.spoolRadiusMeters * params.gearing;
    const double vBackEmf = motorShaftRadPerSec / kvRadPerSecPerVolt;

    const double vSupply = wpi::RobotController::GetInputVoltage();

    vApplied = ClampVoltageForCurrentLimits({
        .vApplied = vApplied,
        .vBackEmf = vBackEmf,
        .rOhms = rOhms,
        .statorLimitAmps = params.statorLimitAmps,
        .supplyLimitAmps = params.supplyLimitAmps,
        .vSupply = vSupply,
    });

    elevator.SetInputVoltage(wpi::units::volt_t(vApplied));
    elevator.Update(wpi::units::second_t(params.simTimestep));

    profileState = nextProfileState;
    timestamp += params.simTimestep;

    const auto statorCurrent = elevator.GetCurrentDraw().to<double>();
    const double supplyCurrent =
        SupplyCurrentFromStator(statorCurrent, vApplied, vSupply);
    energyJoules += supplyCurrent * vSupply * params.simTimestep;

    // Battery voltage under load, smoothed by a single-pole IIR filter
    std::vector<wpi::units::ampere_t> currents = {
        wpi::units::ampere_t(supplyCurrent),
    };
    const auto rawBatteryVoltage =
        wpi::sim::BatterySim::Calculate(
            wpi::units::volt_t(params.batteryVoltageVolts),
            wpi::units::ohm_t(params.batteryResistanceOhms), currents)
            .to<double>();
    const double filteredBatteryVoltage =
        batteryFilter.Calculate(rawBatteryVoltage);

    // The row is stamped with the post-step `timestamp`, so every field in it
    // is read after the step. `motorShaftRadPerSec` above is the pre-step value
    // and is deliberately not reused here: it feeds the back-EMF term of the
    // voltage clamp, which must act on the state at the start of the step.
    const auto updatedVelocityMPS = elevator.GetVelocity().to<double>();
    const double motorRpm = updatedVelocityMPS / params.spoolRadiusMeters *
                            params.gearing * 60.0 / (2.0 * std::numbers::pi);
    states.push_back({
        .positionMeters = elevator.GetPosition().to<double>(),
        .velocityMetersPerSecond = updatedVelocityMPS,
        .statorCurrentDrawAmps = statorCurrent,
        .supplyCurrentDrawAmps = supplyCurrent,
        .timeSeconds = timestamp,
        .batteryVoltageVolts = filteredBatteryVoltage,
        .motorAppliedVoltageVolts = vApplied,
        .motorRpm = motorRpm,
        .energyJoules = energyJoules,
        .success = true,
        .timeToGoalSeconds = 0.0,
    });

    const bool nowInGoalBand =
        std::abs(states.back().positionMeters - travelDistanceMeters) <=
        goalToleranceMeters;
    if (nowInGoalBand && !inGoalBand) {
      goalBandEnteredAt = timestamp;
      goalBandEnteredIndex = states.size() - 1;
    }
    inGoalBand = nowInGoalBand;

    wpi::sim::RoboRioSim::SetVInVoltage(
        wpi::units::volt_t(filteredBatteryVoltage));
  }

  // Success means the carriage settled within the goal band. The time to goal
  // is when it entered the band for good, or the end of the run if it never
  // settled.
  const bool success = !states.empty() && inGoalBand;
  if (!states.empty()) {
    states.back().success = success;
    const double timeToGoalSeconds =
        success ? states.at(goalBandEnteredIndex).timeSeconds
                : states.back().timeSeconds;
    for (auto& state : states) {
      state.timeToGoalSeconds = timeToGoalSeconds;
    }
  }

  return DecimateToJsArray<ElevatorSimStateInternal>(
      states, params.decimation, [](const ElevatorSimStateInternal& s) {
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
        state.set("timeToGoalSeconds", s.timeToGoalSeconds);
        return state;
      });
}

// Public entry point. Wraps SimulateElevatorImpl in a try-catch so that
// DARE solver failures and other numerical exceptions return an empty array
// with a diagnostic console.warn instead of aborting the worker.
inline ElevatorSimRows SimulateElevator(const DCMotorWasm* motor,
                                        const ElevatorSimParams& params) {
  try {
    return ElevatorSimRows(SimulateElevatorImpl(motor, params));
  } catch (const std::exception& e) {
    ConsoleWarn(
        "SimulateElevator: {} (gearing={} loadKg={} spoolR={} statorA={} "
        "supplyA={})",
        e.what(), params.gearing, params.loadKg, params.spoolRadiusMeters,
        params.statorLimitAmps, params.supplyLimitAmps);
    return ElevatorSimRows(emscripten::val::array());
  } catch (...) {
    ConsoleWarn(
        "SimulateElevator: unknown exception (gearing={} loadKg={} spoolR={} "
        "statorA={} supplyA={})",
        params.gearing, params.loadKg, params.spoolRadiusMeters,
        params.statorLimitAmps, params.supplyLimitAmps);
    return ElevatorSimRows(emscripten::val::array());
  }
}

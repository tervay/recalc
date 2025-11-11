#include <emscripten/bind.h>
#include <emscripten/val.h>

// Include wpimath headers
#include "frc/controller/ElevatorFeedforward.h"
#include "frc/controller/PIDController.h"
#include "frc/geometry/Pose2d.h"
#include "frc/geometry/Rotation2d.h"
#include "frc/geometry/Transform2d.h"
#include "frc/geometry/Translation2d.h"
#include "units/acceleration.h"
#include "units/angle.h"
#include "units/length.h"
#include "units/time.h"
#include "units/velocity.h"
#include "units/voltage.h"

using namespace emscripten;
using namespace frc;
using namespace units;

// Helper functions to create objects from JavaScript numbers
Translation2d createTranslation2d(double x, double y) {
  return Translation2d(meter_t(x), meter_t(y));
}

Rotation2d createRotation2dFromRadians(double radians) {
  return Rotation2d(radian_t(radians));
}

Pose2d createPose2d(double x, double y, double rotationRadians) {
  return Pose2d(meter_t(x), meter_t(y), Rotation2d(radian_t(rotationRadians)));
}

// Wrapper functions to extract values from units
double translation2d_getX(const Translation2d &t) { return t.X().value(); }

double translation2d_getY(const Translation2d &t) { return t.Y().value(); }

double translation2d_getDistance(const Translation2d &t,
                                 const Translation2d &other) {
  return t.Distance(other).value();
}

double translation2d_getNorm(const Translation2d &t) {
  return t.Norm().value();
}

double rotation2d_getRadians(const Rotation2d &r) {
  return r.Radians().value();
}

double rotation2d_getDegrees(const Rotation2d &r) {
  return r.Degrees().value();
}

double pose2d_getX(const Pose2d &p) { return p.X().value(); }

double pose2d_getY(const Pose2d &p) { return p.Y().value(); }

// PIDController bindings
class PIDControllerWasm {
public:
  PIDControllerWasm(double kp, double ki, double kd) : controller(kp, ki, kd) {}

  double calculate(double measurement, double setpoint) {
    return controller.Calculate(measurement, setpoint);
  }

  void reset() { controller.Reset(); }

private:
  PIDController controller;
};

// ElevatorFeedforward bindings
class ElevatorFeedforwardWasm {
public:
  // Constructor with kS, kG, kV, kA, dt (all in base units)
  ElevatorFeedforwardWasm(double kS, double kG, double kV, double kA, double dt)
      : feedforward(units::volt_t(kS), units::volt_t(kG),
                    units::unit_t<frc::ElevatorFeedforward::kv_unit>(kV),
                    units::unit_t<frc::ElevatorFeedforward::ka_unit>(kA),
                    units::second_t(dt)) {}

  // Constructor with kS, kG, kV, kA (dt defaults to 0.020)
  ElevatorFeedforwardWasm(double kS, double kG, double kV, double kA)
      : ElevatorFeedforwardWasm(kS, kG, kV, kA, 0.020) {}

  // Constructor with kS, kG, kV (kA defaults to 0, dt defaults to 0.020)
  ElevatorFeedforwardWasm(double kS, double kG, double kV)
      : ElevatorFeedforwardWasm(kS, kG, kV, 0.0, 0.020) {}

  // Calculate with single velocity (current velocity)
  double calculate(double currentVelocity) {
    return feedforward.Calculate(units::meters_per_second_t(currentVelocity))
        .to<double>();
  }

private:
  ElevatorFeedforward feedforward;
};

// Emscripten bindings
EMSCRIPTEN_BINDINGS(wpimath) {
  // Translation2d
  class_<Translation2d>("Translation2d")
      .constructor<>()
      .function("getX", &translation2d_getX)
      .function("getY", &translation2d_getY)
      .function("getDistance", &translation2d_getDistance)
      .function("getNorm", &translation2d_getNorm);

  // Rotation2d
  class_<Rotation2d>("Rotation2d")
      .constructor<>()
      .function("getRadians", &rotation2d_getRadians)
      .function("getDegrees", &rotation2d_getDegrees)
      .function("getCos", &Rotation2d::Cos)
      .function("getSin", &Rotation2d::Sin);

  // Transform2d
  class_<Transform2d>("Transform2d")
      .constructor<>()
      .constructor<const Translation2d &, const Rotation2d &>();

  // Pose2d
  class_<Pose2d>("Pose2d")
      .constructor<>()
      .constructor<const Translation2d &, const Rotation2d &>()
      .function("getX", &pose2d_getX)
      .function("getY", &pose2d_getY)
      .function("getTranslation", &Pose2d::Translation, allow_raw_pointers())
      .function("getRotation", &Pose2d::Rotation, allow_raw_pointers())
      .function("transformBy", &Pose2d::TransformBy, allow_raw_pointers())
      .function("relativeTo", &Pose2d::RelativeTo, allow_raw_pointers());

  // Factory functions for creating from JavaScript numbers
  function("createTranslation2d", &createTranslation2d);
  function("createRotation2dFromRadians", &createRotation2dFromRadians);
  function("createPose2d", &createPose2d);

  // PIDController
  class_<PIDControllerWasm>("PIDController")
      .constructor<double, double, double>()
      .function("calculate", &PIDControllerWasm::calculate)
      .function("reset", &PIDControllerWasm::reset);

  // ElevatorFeedforward
  class_<ElevatorFeedforwardWasm>("ElevatorFeedforward")
      .constructor<double, double, double, double, double>()
      .constructor<double, double, double, double>()
      .constructor<double, double, double>()
      .function("calculate",
                static_cast<double (ElevatorFeedforwardWasm::*)(double)>(
                    &ElevatorFeedforwardWasm::calculate));
}

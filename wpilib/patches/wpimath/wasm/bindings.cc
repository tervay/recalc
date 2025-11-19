#include <emscripten/bind.h>
#include <emscripten/val.h>

// Include wpimath headers
#include "frc/controller/ElevatorFeedforward.h"
#include "frc/controller/PIDController.h"
#include "frc/geometry/Pose3d.h"
#include "frc/geometry/Rotation3d.h"
#include "frc/geometry/Transform3d.h"
#include "frc/geometry/Translation3d.h"
#include "units/acceleration.h"
#include "units/angle.h"
#include "units/length.h"
#include "units/time.h"
#include "units/velocity.h"
#include "units/voltage.h"

using namespace emscripten;
using namespace frc;
using namespace units;

// Wrapper functions to extract values from units
double translation3d_getX(const Translation3d &t) { return t.X().value(); }

double translation3d_getY(const Translation3d &t) { return t.Y().value(); }

double translation3d_getZ(const Translation3d &t) { return t.Z().value(); }

double translation3d_getDistance(const Translation3d &t,
                                 const Translation3d &other) {
  return t.Distance(other).value();
}

double translation3d_getNorm(const Translation3d &t) {
  return t.Norm().value();
}

double rotation3d_getX(const Rotation3d &r) { return r.X().value(); }

double rotation3d_getY(const Rotation3d &r) { return r.Y().value(); }

double rotation3d_getZ(const Rotation3d &r) { return r.Z().value(); }

double pose3d_getX(const Pose3d &p) { return p.X().value(); }

double pose3d_getY(const Pose3d &p) { return p.Y().value(); }

double pose3d_getZ(const Pose3d &p) { return p.Z().value(); }

// Wrapper constructors to convert from double to unit types
Translation3d *translation3d_new_xyz(double x, double y, double z) {
  return new Translation3d(meter_t{x}, meter_t{y}, meter_t{z});
}

Translation3d *translation3d_new_distance_angle(double distance,
                                                const Rotation3d &angle) {
  return new Translation3d(meter_t{distance}, angle);
}

Rotation3d *rotation3d_new_xyz(double x, double y, double z) {
  return new Rotation3d(radian_t{x}, radian_t{y}, radian_t{z});
}

Transform3d *transform3d_new_xyz_rotation(double x, double y, double z,
                                          const Rotation3d &rotation) {
  return new Transform3d(meter_t{x}, meter_t{y}, meter_t{z}, rotation);
}

// Emscripten bindings
EMSCRIPTEN_BINDINGS(wpimath) {
  // Translation3d
  class_<Translation3d>("Translation3d")
      .constructor<>()
      .constructor(&translation3d_new_xyz, allow_raw_pointers())
      .constructor(&translation3d_new_distance_angle, allow_raw_pointers())
      .function("getX", &translation3d_getX)
      .function("getY", &translation3d_getY)
      .function("getZ", &translation3d_getZ)
      .function("getDistance", &translation3d_getDistance)
      .function("getNorm", &translation3d_getNorm);

  // Rotation3d
  class_<Rotation3d>("Rotation3d")
      .constructor<>()
      .constructor(&rotation3d_new_xyz, allow_raw_pointers())
      .function("getX", &rotation3d_getX)
      .function("getY", &rotation3d_getY)
      .function("getZ", &rotation3d_getZ);

  // Transform3d
  class_<Transform3d>("Transform3d")
      .constructor<>()
      .constructor(&transform3d_new_xyz_rotation, allow_raw_pointers())
      .constructor<const Translation3d &, const Rotation3d &>();

  // Pose3d
  class_<Pose3d>("Pose3d")
      .constructor<>()
      .constructor<const Translation3d &, const Rotation3d &>()
      .function("getX", &pose3d_getX)
      .function("getY", &pose3d_getY)
      .function("getZ", &pose3d_getZ)
      .function("getTranslation", &Pose3d::Translation, allow_raw_pointers())
      .function("getRotation", &Pose3d::Rotation, allow_raw_pointers())
      .function("transformBy", &Pose3d::TransformBy, allow_raw_pointers())
      .function("relativeTo", &Pose3d::RelativeTo, allow_raw_pointers());
}

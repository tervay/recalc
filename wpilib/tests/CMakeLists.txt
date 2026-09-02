cmake_minimum_required(VERSION 3.16)
project(recalc_wpilib_tests CXX)

set(CMAKE_CXX_STANDARD 23)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# When compiling with Emscripten, target Node.js and ensure the process exits
# when main() returns (required for CI to get a meaningful exit code).
#
# -fwasm-exceptions selects native Wasm exception handling. It must be
# applied uniformly to every compiled/linked piece that participates in
# throw/catch across a translation unit or library boundary -- including
# Catch2 itself (see tests/Dockerfile's catch2-libs stage) and
# libwpimath.a (see tests/Dockerfile's wpilib-libs stage) -- since mixing
# it with Emscripten's default legacy JS-based exception model produces
# "undefined symbol: __resumeException" at link time.
if(EMSCRIPTEN)
  add_compile_options(-fwasm-exceptions)
  # STACK_SIZE is raised above Emscripten's 64 KiB default because the
  # elevator tests pull in WPILib + Eigen with assertions on; the stack is
  # fixed and does not grow with ALLOW_MEMORY_GROWTH.
  add_link_options(
      -sENVIRONMENT=node
      -sEXIT_RUNTIME=1
      -sALLOW_MEMORY_GROWTH=1
      -sSTACK_SIZE=1MB
      -lembind
      -fwasm-exceptions
  )
  set(CMAKE_EXECUTABLE_SUFFIX ".js")
endif()

enable_testing()

# Catch2 is pre-built and installed by the Dockerfile before any test sources
# are copied, so its compilation is Docker-layer-cached independently of test
# source changes. Catch2::Catch2WithMain carries the include dirs, the static
# library, and main().
set(CATCH2_INSTALL_DIR "/catch2-install" CACHE PATH
    "Install prefix of the Emscripten-built Catch2 (see tests/Dockerfile)")
list(PREPEND CMAKE_PREFIX_PATH "${CATCH2_INSTALL_DIR}")

# Emscripten's toolchain sets CMAKE_FIND_ROOT_PATH_MODE_PACKAGE to ONLY, which
# confines find_package to the emsdk sysroot -- so CMAKE_PREFIX_PATH alone is
# not enough to see a prefix installed outside it. NO_CMAKE_FIND_ROOT_PATH
# lifts that restriction for this one lookup.
find_package(Catch2 3 REQUIRED NO_CMAKE_FIND_ROOT_PATH)

# Shared patch include dir: every test pulls its header under test from this
# one directory.
set(PATCH_INCLUDE_DIR ${CMAKE_CURRENT_SOURCE_DIR}/../patches/wpilibc/wasm)

add_library(patch_headers INTERFACE)
target_include_directories(patch_headers INTERFACE ${PATCH_INCLUDE_DIR})

# ----------------------------------------------------------------------------
# wpimath_deps
#
# Unlike sim_util.h (header-only, no compiled WPILib dependency),
# feedback_gains.h and feedforward_gains.h's Core functions call into
# wpi::math::LinearQuadraticRegulator and the wpi::math::Models factories,
# which are only partially header-only (e.g. MathSharedStore, the DARE
# solver's error reporting, and Eigen's protobuf/struct glue require the
# compiled wpimath/wpiutil static libraries). The Dockerfile builds those
# from the same pinned WPILib commit as the production wasm build (see
# ../wpilib.conf) into /wpilib-artifacts/lib, with headers staged under
# /wpilib-artifacts/include. See tests/Dockerfile's "wpilib-libs" stage
# for details.
#
# This INTERFACE library bundles the include dirs, prebuilt libs, and the
# C++20 requirement (wpimath is compiled as C++20 upstream). It is consumed
# through wpilibc_deps below.
# ----------------------------------------------------------------------------

set(WPILIB_ARTIFACTS_DIR "/wpilib-artifacts" CACHE PATH
    "Directory containing the prebuilt WPILib static libraries and their headers")

add_library(wpimath_prebuilt STATIC IMPORTED GLOBAL)
set_target_properties(wpimath_prebuilt PROPERTIES
    IMPORTED_LOCATION "${WPILIB_ARTIFACTS_DIR}/lib/libwpimath.a")

add_library(wpiutil_prebuilt STATIC IMPORTED GLOBAL)
set_target_properties(wpiutil_prebuilt PROPERTIES
    IMPORTED_LOCATION "${WPILIB_ARTIFACTS_DIR}/lib/libwpiutil.a")

set(WPIMATH_SRC "${WPILIB_ARTIFACTS_DIR}/include/wpimath/src")
set(WPIUTIL_SRC "${WPILIB_ARTIFACTS_DIR}/include/wpiutil/src")

add_library(wpimath_deps INTERFACE)

target_include_directories(wpimath_deps SYSTEM INTERFACE
    ${WPIMATH_SRC}/main/native/include
    ${WPIMATH_SRC}/generated/main/native/cpp
    ${WPIMATH_SRC}/main/native/thirdparty/eigen/include
    ${WPIMATH_SRC}/main/native/thirdparty/gcem/include
    ${WPIMATH_SRC}/main/native/thirdparty/sleipnir/include
    ${WPIMATH_SRC}/main/native/thirdparty/sleipnir/src
    ${WPIUTIL_SRC}/main/native/include
    ${WPIUTIL_SRC}/main/native/thirdparty/argparse/include
    ${WPIUTIL_SRC}/main/native/thirdparty/debugging/include
    ${WPIUTIL_SRC}/main/native/thirdparty/expected/include
    ${WPIUTIL_SRC}/main/native/thirdparty/json/include
    ${WPIUTIL_SRC}/main/native/thirdparty/llvm/include
    ${WPIUTIL_SRC}/main/native/thirdparty/mpack/include
    ${WPIUTIL_SRC}/main/native/thirdparty/nanopb/include
    ${WPIUTIL_SRC}/main/native/thirdparty/sigslot/include
    ${WPIUTIL_SRC}/main/native/thirdparty/upb/include
)

target_link_libraries(wpimath_deps INTERFACE
    patch_headers
    wpimath_prebuilt
    wpiutil_prebuilt
)

# -fwasm-exceptions is already applied globally above.
target_compile_features(wpimath_deps INTERFACE cxx_std_23)

# ----------------------------------------------------------------------------
# wpilibc_deps
#
# elevator_sim.h goes a layer beyond the gain headers: AngledElevatorSim derives
# from wpi::sim::ElevatorSim, and SimulateElevatorImpl calls BatterySim,
# RoboRioSim, and RobotController. Those live in wpilibc and the HAL, not
# wpimath, so this target needs the full library set from the "wpilib-libs"
# Dockerfile stage rather than the wpimath-only subset above.
#
# arm_sim.h, flywheel_sim.h and battery_sim.h reach the same libraries:
# EfficiencyArmSim/EfficiencyFlywheelSim derive from the wpi::sim classes, and
# all three call BatterySim, RoboRioSim, and RobotController.
#
# The archives are globbed rather than named individually: the exact file names
# WPILib emits (e.g. libwpiHal.a vs libhal.a) vary across upstream commits, and
# the stage stages every archive it produces. Wrapping the whole set in
# --start-group/--end-group also removes any dependency on static link order.
# ----------------------------------------------------------------------------

file(GLOB WPILIB_ARCHIVES "${WPILIB_ARTIFACTS_DIR}/lib/*.a")
list(LENGTH WPILIB_ARCHIVES WPILIB_ARCHIVE_COUNT)
if(WPILIB_ARCHIVE_COUNT EQUAL 0)
  message(FATAL_ERROR
      "No WPILib archives found in ${WPILIB_ARTIFACTS_DIR}/lib -- the "
      "wpilib-libs Dockerfile stage did not stage its build output.")
endif()

set(WPILIBC_SRC "${WPILIB_ARTIFACTS_DIR}/include/wpilibc/src")
set(HAL_SRC     "${WPILIB_ARTIFACTS_DIR}/include/hal/src")
set(NTCORE_SRC  "${WPILIB_ARTIFACTS_DIR}/include/ntcore/src")
set(TELEMETRY_SRC "${WPILIB_ARTIFACTS_DIR}/include/telemetry/src")
set(TUNABLES_SRC  "${WPILIB_ARTIFACTS_DIR}/include/tunables/src")

add_library(wpilibc_deps INTERFACE)

target_include_directories(wpilibc_deps SYSTEM INTERFACE
    ${WPILIBC_SRC}/main/native/include
    ${WPILIBC_SRC}/generated/main/native/include
    ${HAL_SRC}/main/native/include
    ${HAL_SRC}/generated/main/native/include
    ${NTCORE_SRC}/main/native/include
    ${NTCORE_SRC}/generated/main/native/include
    ${TELEMETRY_SRC}/main/native/include
    ${TUNABLES_SRC}/main/native/include
)

# Reuses wpimath_deps for the shared wpimath/wpiutil include dirs, the patch
# include dir, and cxx_std_23.
target_link_libraries(wpilibc_deps INTERFACE
    wpimath_deps
    -Wl,--start-group ${WPILIB_ARCHIVES} -Wl,--end-group
)

# ntcore_stub.cc is deliberately empty (see patches/wpilibc/wasm/stubs), so every
# NetworkTables symbol wpilibc references is undefined at link time. The
# production wpilibc_wasm target tolerates this the same way; none of those
# symbols are reachable from the elevator simulation.
target_link_options(wpilibc_deps INTERFACE -sERROR_ON_UNDEFINED_SYMBOLS=0)

# ----------------------------------------------------------------------------
# The tests.
#
# All test sources link into one binary. They used to be nine executables, one
# per header under test, each linking its own minimal dependency set. Five of
# those linked the full WPILib archive group, so collapsing them turns nine
# expensive wasm links into one. Adding a test means adding its source file
# below and nothing else.
#
# Everything links against wpilibc_deps -- the superset target -- rather than
# the narrower dependency each source would need alone: wpilibc_deps already
# pulls in wpimath_deps, which pulls in patch_headers, and a single binary can
# only have one link line. That also means wpilibc_deps'
# -sERROR_ON_UNDEFINED_SYMBOLS=0 now covers the whole binary rather than five of
# nine targets. The rationale is unchanged -- ntcore_stub.cc is deliberately
# empty and none of the NetworkTables symbols it leaves undefined are reachable
# from the simulations.
#
# hal_init_listener.cc is not a test file: it registers the one-time HAL
# initialization that runs before the first test case.
# ----------------------------------------------------------------------------

add_executable(recalc_tests
    hal_init_listener.cc
    arm_sim_test.cc
    battery_sim_test.cc
    elevator_sim_test.cc
    feedback_gains_test.cc
    feedforward_gains_test.cc
    flywheel_sim_test.cc
    motor_curve_sim_test.cc
    sim_util_test.cc
    wasm_console_test.cc
)

target_link_libraries(recalc_tests PRIVATE Catch2::Catch2WithMain wpilibc_deps)

add_test(NAME recalc_tests COMMAND node $<TARGET_FILE_NAME:recalc_tests>)

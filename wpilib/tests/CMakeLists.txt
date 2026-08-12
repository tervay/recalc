cmake_minimum_required(VERSION 3.16)
project(recalc_wpilib_tests CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# When compiling with Emscripten, target Node.js and ensure the process exits
# when main() returns (required for CI to get a meaningful exit code).
#
# -fwasm-exceptions selects native Wasm exception handling. It must be
# applied uniformly to every compiled/linked piece that participates in
# throw/catch across a translation unit or library boundary -- including
# GoogleTest itself (see tests/Dockerfile's gtest-libs stage) and
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

# Each test is one source file plus a set of dependency targets. Declaring the
# executable and its CTest registration together keeps the Dockerfile out of the
# loop: a new test needs one line at the bottom of this file and nothing else.
# The container's entrypoint is `ctest`, which discovers whatever is registered
# here.
#
# gtest_main pulls in gtest through its INTERFACE_LINK_LIBRARIES, so linking it
# alone is enough.
function(add_wasm_test name)
  add_executable(${name}_tests ${name}_test.cc)
  target_link_libraries(${name}_tests PRIVATE gtest_main ${ARGN})
  add_test(NAME ${name}_tests COMMAND node $<TARGET_FILE_NAME:${name}_tests>)
endfunction()

# GoogleTest is pre-built by the Dockerfile before any test sources are
# copied, so its compilation is Docker-layer-cached independently of test
# source changes. Point at those artifacts directly rather than rebuilding.
set(GTEST_BUILD_DIR  "/gtest-build"                           CACHE PATH "")
set(GTEST_INCLUDE_DIR "/usr/src/googletest/googletest/include" CACHE PATH "")

add_library(gtest STATIC IMPORTED GLOBAL)
set_target_properties(gtest PROPERTIES
    IMPORTED_LOCATION             "${GTEST_BUILD_DIR}/lib/libgtest.a"
    INTERFACE_INCLUDE_DIRECTORIES "${GTEST_INCLUDE_DIR}")

add_library(gtest_main STATIC IMPORTED GLOBAL)
set_target_properties(gtest_main PROPERTIES
    IMPORTED_LOCATION    "${GTEST_BUILD_DIR}/lib/libgtest_main.a"
    INTERFACE_LINK_LIBRARIES gtest)

# Shared patch include dir: sim_util_tests only needs sim_util.h/dc_motor.h,
# while the gain tests additionally need feedback_gains.h/feedforward_gains.h,
# but every test pulls its header under test from this one directory.
set(PATCH_INCLUDE_DIR ${CMAKE_CURRENT_SOURCE_DIR}/../patches/wpilibc/wasm)

add_library(patch_headers INTERFACE)
target_include_directories(patch_headers INTERFACE ${PATCH_INCLUDE_DIR})

# ----------------------------------------------------------------------------
# wpimath_deps
#
# Unlike sim_util_tests (header-only, no compiled WPILib dependency),
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
# C++20 requirement (wpimath is compiled as C++20 upstream) shared by both
# gain-test executables below.
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
    ${WPIUTIL_SRC}/main/native/thirdparty/fmtlib/include
)

target_link_libraries(wpimath_deps INTERFACE
    patch_headers
    wpimath_prebuilt
    wpiutil_prebuilt
)

# -fwasm-exceptions is already applied globally above.
target_compile_features(wpimath_deps INTERFACE cxx_std_20)

# wasm_console.h formats through fmtlib and resolves fmt's compiled symbols out
# of libwpiutil.a, but needs none of the wpimath include set above.
add_library(console_deps INTERFACE)

target_include_directories(console_deps SYSTEM INTERFACE
    ${WPIUTIL_SRC}/main/native/thirdparty/fmtlib/include)

target_link_libraries(console_deps INTERFACE patch_headers wpiutil_prebuilt)

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

add_library(wpilibc_deps INTERFACE)

target_include_directories(wpilibc_deps SYSTEM INTERFACE
    ${WPILIBC_SRC}/main/native/include
    ${WPILIBC_SRC}/generated/main/native/include
    ${HAL_SRC}/main/native/include
    ${HAL_SRC}/generated/main/native/include
    ${NTCORE_SRC}/main/native/include
    ${NTCORE_SRC}/generated/main/native/include
)

# Reuses wpimath_deps for the shared wpimath/wpiutil include dirs, the patch
# include dir, and cxx_std_20.
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
# The tests. <name> maps to <name>_test.cc, the <name>_tests executable, and the
# CTest case of the same name.
# ----------------------------------------------------------------------------

add_wasm_test(sim_util          patch_headers)
add_wasm_test(wasm_console      console_deps)
add_wasm_test(feedback_gains    wpimath_deps)
add_wasm_test(feedforward_gains wpimath_deps)
add_wasm_test(elevator_sim      wpilibc_deps)
add_wasm_test(arm_sim           wpilibc_deps)
add_wasm_test(flywheel_sim      wpilibc_deps)
add_wasm_test(battery_sim       wpilibc_deps)

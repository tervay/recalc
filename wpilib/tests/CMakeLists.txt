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
# libwpimath.a (see tests/Dockerfile's wpimath-libs stage) -- since mixing
# it with Emscripten's default legacy JS-based exception model produces
# "undefined symbol: __resumeException" at link time.
if(EMSCRIPTEN)
  add_compile_options(-fwasm-exceptions)
  add_link_options(
      -sENVIRONMENT=node
      -sEXIT_RUNTIME=1
      -sALLOW_MEMORY_GROWTH=1
      -lembind
      -fwasm-exceptions
  )
  set(CMAKE_EXECUTABLE_SUFFIX ".js")
endif()

enable_testing()

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
# but all three pull from the same directory.
set(PATCH_INCLUDE_DIR ${CMAKE_CURRENT_SOURCE_DIR}/../patches/wpilibc/wasm)

add_executable(sim_util_tests sim_util_test.cc)

target_include_directories(sim_util_tests BEFORE PRIVATE ${PATCH_INCLUDE_DIR})

target_link_libraries(sim_util_tests PRIVATE gtest gtest_main)

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
# ../wpilib.conf) into /wpimath-artifacts/lib, with headers staged under
# /wpimath-artifacts/include. See tests/Dockerfile's "wpimath-libs" stage
# for details.
#
# This INTERFACE library bundles the include dirs, prebuilt libs, and the
# C++20 requirement (wpimath is compiled as C++20 upstream) shared by both
# gain-test executables below.
# ----------------------------------------------------------------------------

set(WPIMATH_ARTIFACTS_DIR "/wpimath-artifacts" CACHE PATH
    "Directory containing prebuilt libwpimath.a/libwpiutil.a and their headers")

add_library(wpimath_prebuilt STATIC IMPORTED GLOBAL)
set_target_properties(wpimath_prebuilt PROPERTIES
    IMPORTED_LOCATION "${WPIMATH_ARTIFACTS_DIR}/lib/libwpimath.a")

add_library(wpiutil_prebuilt STATIC IMPORTED GLOBAL)
set_target_properties(wpiutil_prebuilt PROPERTIES
    IMPORTED_LOCATION "${WPIMATH_ARTIFACTS_DIR}/lib/libwpiutil.a")

set(WPIMATH_SRC "${WPIMATH_ARTIFACTS_DIR}/include/wpimath/src")
set(WPIUTIL_SRC "${WPIMATH_ARTIFACTS_DIR}/include/wpiutil/src")

add_library(wpimath_deps INTERFACE)

target_include_directories(wpimath_deps SYSTEM INTERFACE
    ${PATCH_INCLUDE_DIR}
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

target_link_libraries(wpimath_deps INTERFACE wpimath_prebuilt wpiutil_prebuilt)

# -fwasm-exceptions is already applied globally above.
target_compile_features(wpimath_deps INTERFACE cxx_std_20)

add_executable(wasm_console_tests wasm_console_test.cc)

target_include_directories(wasm_console_tests BEFORE PRIVATE
    ${PATCH_INCLUDE_DIR}
    ${WPIUTIL_SRC}/main/native/thirdparty/fmtlib/include
)

target_link_libraries(wasm_console_tests PRIVATE gtest gtest_main wpiutil_prebuilt)

add_executable(feedback_gains_tests feedback_gains_test.cc)
target_link_libraries(feedback_gains_tests PRIVATE gtest gtest_main wpimath_deps)

add_executable(feedforward_gains_tests feedforward_gains_test.cc)
target_link_libraries(feedforward_gains_tests PRIVATE gtest gtest_main wpimath_deps)

foreach(test_target sim_util_tests wasm_console_tests feedback_gains_tests feedforward_gains_tests)
  add_test(NAME ${test_target} COMMAND node ${test_target}.js)
endforeach()

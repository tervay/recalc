cmake_minimum_required(VERSION 3.16)
project(sim_util_tests CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# When compiling with Emscripten, target Node.js and ensure the process exits
# when main() returns (required for CI to get a meaningful exit code).
if(EMSCRIPTEN)
  add_link_options(
      -sENVIRONMENT=node
      -sEXIT_RUNTIME=1
      -sALLOW_MEMORY_GROWTH=1
      -lembind
  )
  set(CMAKE_EXECUTABLE_SUFFIX ".js")
endif()

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

add_executable(sim_util_tests sim_util_test.cc)

target_include_directories(sim_util_tests BEFORE PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}/../patches/wpilibc/wasm
)

target_link_libraries(sim_util_tests PRIVATE gtest gtest_main)

enable_testing()
add_test(NAME sim_util_tests COMMAND node sim_util_tests.js)

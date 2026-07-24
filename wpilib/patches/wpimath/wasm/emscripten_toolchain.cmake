# Emscripten CMake toolchain file
# This file configures CMake to use Emscripten for WebAssembly compilation

set(CMAKE_SYSTEM_NAME Emscripten)
set(CMAKE_SYSTEM_VERSION 1)
set(CMAKE_C_COMPILER "emcc")
set(CMAKE_CXX_COMPILER "em++")
set(CMAKE_ASM_COMPILER "emcc")

# Set the root path for Emscripten
if(DEFINED ENV{EMSCRIPTEN_ROOT_PATH})
    set(EMSCRIPTEN_ROOT_PATH $ENV{EMSCRIPTEN_ROOT_PATH})
else()
    set(EMSCRIPTEN_ROOT_PATH "/usr/lib/emscripten")
endif()

# Set find programs
set(CMAKE_FIND_ROOT_PATH_MODE_PROGRAM NEVER)
set(CMAKE_FIND_ROOT_PATH_MODE_LIBRARY ONLY)
set(CMAKE_FIND_ROOT_PATH_MODE_INCLUDE ONLY)
set(CMAKE_FIND_ROOT_PATH_MODE_PACKAGE ONLY)

# Emscripten-specific flags
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -s USE_PTHREADS=0")
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -s USE_PTHREADS=0 -std=c++20")

# Disable shared libraries for WebAssembly
set(BUILD_SHARED_LIBS OFF)

# Set output format
set(CMAKE_EXECUTABLE_SUFFIX ".js")


# WebAssembly build configuration for wpimath
# This is included as a subdirectory from wpimath/CMakeLists.txt
# It assumes wpimath and wpiutil targets are already defined

# Only build wasm module if Emscripten toolchain is being used
if(CMAKE_SYSTEM_NAME STREQUAL "Emscripten")
    # Set C++ standard
    set(CMAKE_CXX_STANDARD 20)
    set(CMAKE_CXX_STANDARD_REQUIRED ON)

    # Emscripten-specific settings
    set(CMAKE_EXECUTABLE_SUFFIX ".js")

    # Source files for WebAssembly wrapper
    set(WASM_SOURCES
        bindings.cc
    )

    # Create the WebAssembly module
    add_executable(wpimath_wasm ${WASM_SOURCES})

    # Link against wpimath and wpiutil (from parent scope)
    target_link_libraries(wpimath_wasm 
        PRIVATE 
        wpimath
        wpiutil
    )

    # Include directories
    target_include_directories(wpimath_wasm 
        PRIVATE
        ${CMAKE_CURRENT_SOURCE_DIR}/../src/main/native/include
        ${CMAKE_CURRENT_SOURCE_DIR}/../src/generated/main/native/cpp
        ${CMAKE_CURRENT_SOURCE_DIR}/../src/main/native/thirdparty/eigen/include
        ${CMAKE_CURRENT_SOURCE_DIR}/../src/main/native/thirdparty/gcem/include
        ${CMAKE_CURRENT_SOURCE_DIR}/../src/main/native/thirdparty/sleipnir/include
    )

    # Emscripten compilation flags (only compile-time flags here)
    target_compile_options(wpimath_wasm PRIVATE
        -O3
        -flto
        -std=c++20
    )

    # Emscripten linker flags
    # Each -s flag must be a single string argument
    set(EMSCRIPTEN_LINK_FLAGS
        "-sWASM=1"
        "-sMODULARIZE=1"
        "-sEXPORT_NAME=createWpimathModule"
        "-sEXPORTED_FUNCTIONS=[_malloc,_free]"
        "-sEXPORTED_RUNTIME_METHODS=[ccall,cwrap,UTF8ToString,stringToUTF8]"
        "-sALLOW_MEMORY_GROWTH=1"
        "-sINITIAL_MEMORY=16777216"
        "-sMAXIMUM_MEMORY=268435456"
        "-sENVIRONMENT=node,web"
        "-sEXPORT_ES6=1"
        "-O3"
        "-flto"
        "--bind"
        "--no-entry"
        "--emit-tsd"
        "${CMAKE_BINARY_DIR}/wpimath/wasm/wpimath_wasm.d.ts"
    )
    
    target_link_options(wpimath_wasm PRIVATE ${EMSCRIPTEN_LINK_FLAGS})

    # Set output directory
    set_target_properties(wpimath_wasm PROPERTIES
        RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/wpimath/wasm
    )
endif()

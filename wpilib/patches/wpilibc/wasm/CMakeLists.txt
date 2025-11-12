# WebAssembly build configuration for wpilibc
# This is included as a subdirectory from wpilibc/CMakeLists.txt
# It assumes wpilibc, hal, wpimath, and wpiutil targets are already defined

# Only build wasm module if Emscripten toolchain is being used
if(CMAKE_SYSTEM_NAME STREQUAL "Emscripten")
    # Add ntcore stub if ntcore is not available
    if(NOT TARGET ntcore)
        add_subdirectory(stubs)
    endif()
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
    add_executable(wpilibc_wasm ${WASM_SOURCES})

    # Link against wpilibc, hal, wpimath, and wpiutil (from parent scope)
    # Use ntcore stub if real ntcore is not available
    if(TARGET ntcore)
        target_link_libraries(wpilibc_wasm PRIVATE ntcore)
    elseif(TARGET ntcore_stub)
        target_link_libraries(wpilibc_wasm PRIVATE ntcore_stub)
    endif()

    target_link_libraries(wpilibc_wasm 
        PRIVATE 
        wpilibc
        hal
        wpimath
        wpiutil
    )


    # Include directories
    target_include_directories(wpilibc_wasm 
        PRIVATE
        ${CMAKE_CURRENT_SOURCE_DIR}/../src/main/native/include
        ${CMAKE_CURRENT_SOURCE_DIR}/../src/generated/main/native/include
        ${CMAKE_CURRENT_SOURCE_DIR}/../../wpimath/src/main/native/include
        ${CMAKE_CURRENT_SOURCE_DIR}/../../wpimath/src/generated/main/native/cpp
        ${CMAKE_CURRENT_SOURCE_DIR}/../../wpimath/src/main/native/thirdparty/eigen/include
        ${CMAKE_CURRENT_SOURCE_DIR}/../../wpimath/src/main/native/thirdparty/gcem/include
        ${CMAKE_CURRENT_SOURCE_DIR}/../../wpimath/src/main/native/thirdparty/sleipnir/include
    )

    # Emscripten compilation flags (only compile-time flags here)
    target_compile_options(wpilibc_wasm PRIVATE
        -O3
        -flto
        -std=c++20
    )

    # Emscripten linker flags
    # Each -s flag must be a single string argument
    set(EMSCRIPTEN_LINK_FLAGS
        "-sWASM=1"
        "-sMODULARIZE=1"
        "-sEXPORT_NAME=createWpilibcModule"
        "-sEXPORTED_FUNCTIONS=[_malloc,_free]"
        "-sEXPORTED_RUNTIME_METHODS=[ccall,cwrap,UTF8ToString,stringToUTF8]"
        "-sALLOW_MEMORY_GROWTH=1"
        "-sINITIAL_MEMORY=16777216"
        "-sMAXIMUM_MEMORY=268435456"
        "-sENVIRONMENT=node,web"
        "-sERROR_ON_UNDEFINED_SYMBOLS=0"
        "-sEXPORT_ES6=1"
        "-O3"
        "-flto"
        "--bind"
        "--no-entry"
        "--emit-tsd"
        "${CMAKE_BINARY_DIR}/wpilibc/wasm/wpilibc_wasm.d.ts"
    )

    target_link_options(wpilibc_wasm PRIVATE ${EMSCRIPTEN_LINK_FLAGS})

    # Set output directory
    set_target_properties(wpilibc_wasm PROPERTIES
        RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/wpilibc/wasm
    )
endif()
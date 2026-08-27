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
    set(CMAKE_CXX_STANDARD 23)
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
    #
    # -Oz over -O3: measured on the full bound API surface, -Oz shrinks the
    # brotli-compressed payload (what Vercel serves) by 22,477 bytes, 205,220
    # -> 182,743, an 11% cut. See wasm/OPTIMIZATION.md for the flag-by-flag
    # measurements, including the ones that turned out to be worth nothing.
    #
    # -flto only ever applies to bindings.cc: the WPILib archives are compiled
    # by the parent build without it. Compiling them with -flto too was tried
    # and rejected -- it produces a module in which DCMotorSim::update() never
    # returns. Do not add -flto to the parent build's CMAKE_CXX_FLAGS.
    target_compile_options(wpilibc_wasm PRIVATE
        -Oz
        -flto
        -std=c++23
        -fwasm-exceptions
    )

    # Emscripten linker flags
    # Each -s flag must be a single string argument
    set(EMSCRIPTEN_LINK_FLAGS
        "-sWASM=1"
        "-sMODULARIZE=1"
        "-sEXPORT_NAME=createWpilibcModule"
        "-sEXPORTED_FUNCTIONS=[_malloc,_free]"
        # UTF8ToString and stringToUTF8 are not called from JS; all data crosses
        # the boundary via emscripten::val (Embind), which handles string
        # conversion internally.  Removing them shrinks the JS glue.
        "-sEXPORTED_RUNTIME_METHODS=[]"
        "-sALLOW_MEMORY_GROWTH=1"
        "-sGROWABLE_ARRAYBUFFERS=0"
        "-sINITIAL_MEMORY=16777216"
        "-sMAXIMUM_MEMORY=268435456"
        "-sENVIRONMENT=web,worker,node"
        "-sWASM_BIGINT=1"
        "-sINCOMING_MODULE_JS_API=[locateFile]"
        "-sERROR_ON_UNDEFINED_SYMBOLS=0"
        "-sEXPORT_ES6=1"
        # emmalloc in place of dlmalloc: -1,788 bytes brotli, no behaviour change
        # for this module, which only ever allocates through Embind.
        "-sMALLOC=emmalloc"
        # Embind's glue is generated without new Function(): -379 bytes brotli,
        # and it keeps the module usable under a strict CSP.
        "-sDYNAMIC_EXECUTION=0"
        "-sTEXTDECODER=2"
        "-Oz"
        "-flto"
        "-fwasm-exceptions"
        "--closure=1"
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
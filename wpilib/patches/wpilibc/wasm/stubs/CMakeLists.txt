# Minimal ntcore stub for WebAssembly builds
# Since wpinet doesn't compile for WebAssembly, we create an empty library
# that satisfies the linker. wpilibc will link against this, but NetworkTables
# functionality won't work (which is fine for ElevatorSim).

if(CMAKE_SYSTEM_NAME STREQUAL "Emscripten")
    # Create an empty library - we'll use linker flags to handle undefined symbols
    add_library(ntcore_stub STATIC
        ntcore_stub.cc
    )

    # Make it look like ntcore to wpilibc
    add_library(ntcore ALIAS ntcore_stub)

    # Include the actual ntcore headers so code compiles
    # The implementations won't be available, but we can use weak symbols
    # or just let undefined symbols be handled at link time
    target_include_directories(ntcore_stub
        PUBLIC
        ${CMAKE_CURRENT_SOURCE_DIR}/../../../../ntcore/src/main/native/include
    )

    target_link_libraries(ntcore_stub PUBLIC wpiutil)

    # Allow undefined symbols - wpilibc code that uses ntcore will have
    # undefined references, but they won't be called for ElevatorSim
    target_link_options(ntcore_stub PRIVATE
        "-sERROR_ON_UNDEFINED_SYMBOLS=0"
    )

    set_property(TARGET ntcore_stub PROPERTY FOLDER "libraries")
endif()
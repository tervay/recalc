#!/bin/bash

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

WPILIBC_WASM="$SCRIPT_DIR/patches/wpilibc/wasm"
WPIMATH_WASM="$SCRIPT_DIR/patches/wpimath/wasm"

# Format all wpilibc wasm sources (bindings.cc + headers)
docker run -v "$SCRIPT_DIR":/src xianpengshen/clang-tools:19 \
  clang-format --style=file:/src/.clang-format -i \
    patches/wpilibc/wasm/bindings.cc \
    patches/wpilibc/wasm/arm_sim.h \
    patches/wpilibc/wasm/battery_sim.h \
    patches/wpilibc/wasm/dc_motor.h \
    patches/wpilibc/wasm/dc_motor_sim.h \
    patches/wpilibc/wasm/elevator_sim.h \
    patches/wpilibc/wasm/flywheel_sim.h \
    patches/wpilibc/wasm/sim_util.h

# Format wpimath wasm sources
docker run -v "$SCRIPT_DIR":/src xianpengshen/clang-tools:19 \
  clang-format --style=file:/src/.clang-format -i \
    patches/wpimath/wasm/bindings.cc

# Format tests
docker run -v "$SCRIPT_DIR":/src xianpengshen/clang-tools:19 \
  clang-format --style=file:/src/.clang-format -i \
    tests/sim_util_test.cc

# Fix file permissions after Docker formatting (files are owned by root)
WPILIBC_FILES=(
  "$WPILIBC_WASM/bindings.cc"
  "$WPILIBC_WASM/arm_sim.h"
  "$WPILIBC_WASM/battery_sim.h"
  "$WPILIBC_WASM/dc_motor.h"
  "$WPILIBC_WASM/dc_motor_sim.h"
  "$WPILIBC_WASM/elevator_sim.h"
  "$WPILIBC_WASM/flywheel_sim.h"
  "$WPIMATH_WASM/bindings.cc"
  "$SCRIPT_DIR/tests/sim_util_test.cc"
)

EXISTING_FILES=()
for f in "${WPILIBC_FILES[@]}"; do
  [ -f "$f" ] && EXISTING_FILES+=("$f")
done

if [ ${#EXISTING_FILES[@]} -gt 0 ]; then
  sudo chown "$(id -u):$(id -g)" "${EXISTING_FILES[@]}" 2>/dev/null || true
fi

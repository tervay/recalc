#!/bin/bash

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

docker run -v "$SCRIPT_DIR":/src xianpengshen/clang-tools:19 clang-format -i patches/wpilibc/wasm/bindings.cc
docker run -v "$SCRIPT_DIR":/src xianpengshen/clang-tools:19 clang-format -i patches/wpimath/wasm/bindings.cc

# Fix file permissions after Docker formatting (files are owned by root)
if [ -f "$SCRIPT_DIR/patches/wpilibc/wasm/bindings.cc" ] || [ -f "$SCRIPT_DIR/patches/wpimath/wasm/bindings.cc" ]; then
  sudo chown $(id -u):$(id -g) "$SCRIPT_DIR/patches/wpilibc/wasm/bindings.cc" "$SCRIPT_DIR/patches/wpimath/wasm/bindings.cc" 2>/dev/null || true
fi
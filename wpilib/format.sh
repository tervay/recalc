#!/bin/bash

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

docker run -v "$SCRIPT_DIR":/src xianpengshen/clang-tools:19 clang-format -i patches/wpilibc/wasm/bindings.cc
docker run -v "$SCRIPT_DIR":/src xianpengshen/clang-tools:19 clang-format -i patches/wpimath/wasm/bindings.cc
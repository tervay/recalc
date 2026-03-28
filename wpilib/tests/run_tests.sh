#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WPILIB_DIR="$(dirname "$SCRIPT_DIR")"

IMAGE_NAME="recalc-wpilib-tests"

echo "=== Building test image (context: $WPILIB_DIR) ==="
docker build \
    --file "$SCRIPT_DIR/Dockerfile" \
    --tag "$IMAGE_NAME" \
    "$WPILIB_DIR"

echo "=== Running tests ==="
docker run --rm "$IMAGE_NAME"

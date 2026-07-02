#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WPILIB_DIR="$(dirname "$SCRIPT_DIR")"

IMAGE_NAME="recalc-wpilib-tests"

# feedback_gains_tests links against a real libwpimath.a built from the same
# pinned WPILib commit as the production wasm build, so it must be pinned the
# same way -- see wpilib.conf and ../Dockerfile.
WPILIB_CONF="$WPILIB_DIR/wpilib.conf"
if [ ! -f "$WPILIB_CONF" ]; then
    echo "ERROR: wpilib.conf not found at $WPILIB_CONF" >&2
    exit 1
fi
# shellcheck source=../wpilib.conf
source "$WPILIB_CONF"
if [ -z "${WPILIB_COMMIT:-}" ]; then
    echo "ERROR: WPILIB_COMMIT is not set in wpilib.conf" >&2
    exit 1
fi

echo "=== Building test image (context: $WPILIB_DIR) ==="
docker build \
    --file "$SCRIPT_DIR/Dockerfile" \
    --tag "$IMAGE_NAME" \
    --build-arg WPILIB_REPO="$WPILIB_REPO" \
    --build-arg WPILIB_COMMIT="$WPILIB_COMMIT" \
    "$WPILIB_DIR"

echo "=== Running tests ==="
docker run --rm "$IMAGE_NAME"

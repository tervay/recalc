#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
IMAGE_NAME="recalc-wpilib-leak-check"

WPILIB_CONF="$SCRIPT_DIR/wpilib.conf"
if [ ! -f "$WPILIB_CONF" ]; then
    echo "ERROR: wpilib.conf not found at $WPILIB_CONF" >&2
    exit 1
fi
# shellcheck source=wpilib.conf
source "$WPILIB_CONF"
if [ -z "${WPILIB_COMMIT:-}" ]; then
    echo "ERROR: WPILIB_COMMIT is not set in wpilib.conf" >&2
    exit 1
fi

TS_VERSION=$(jq -r '.devDependencies.typescript // .dependencies.typescript' "$PROJECT_ROOT/package.json")
if [ -z "$TS_VERSION" ] || [ "$TS_VERSION" = "null" ]; then
    echo "ERROR: Could not determine TypeScript version from package.json" >&2
    exit 1
fi

docker build \
    --file "$SCRIPT_DIR/Dockerfile" \
    --target leak-check \
    --tag "$IMAGE_NAME" \
    --build-arg WPILIB_REPO="$WPILIB_REPO" \
    --build-arg WPILIB_COMMIT="$WPILIB_COMMIT" \
    --build-arg TS_VERSION="$TS_VERSION" \
    "$SCRIPT_DIR"

docker run --rm "$IMAGE_NAME"

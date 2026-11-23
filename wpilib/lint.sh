#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

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

docker build \
    --file "$SCRIPT_DIR/tests/Dockerfile" \
    --target lint \
    --build-arg WPILIB_REPO="$WPILIB_REPO" \
    --build-arg WPILIB_COMMIT="$WPILIB_COMMIT" \
    "$SCRIPT_DIR"

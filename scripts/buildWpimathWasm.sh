#!/bin/bash
set -e

OUTPUT_DIR="$(pwd)/app/lib/generated/wpimath"
DOCKER_IMAGE="wpimath-wasm-builder"
DOCKERFILE="$(dirname "$0")/Dockerfile.wpimath-wasm"
REPO_URL="https://github.com/wpilibsuite/allwpilib.git"
# Hard-coded commit ID for reproducible builds
WPILIB_COMMIT="HEAD"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

function log_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

function log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

function log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
  log_error "Docker is not installed or not available in PATH. Please install Docker."
  exit 1
fi

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Build Docker image if it doesn't exist or if Dockerfile/build script is newer
SCRIPT_DIR="$(dirname "$0")"
BUILD_SCRIPT="$SCRIPT_DIR/build-wpimath-wasm-internal.sh"
WRAPPER_CPP="$SCRIPT_DIR/wpimath_wrapper.cpp"
IMAGE_EXISTS=$(docker image inspect "$DOCKER_IMAGE" &> /dev/null && echo "yes" || echo "no")

if [ "$IMAGE_EXISTS" = "no" ] || \
   [ "$DOCKERFILE" -nt "$(docker image inspect "$DOCKER_IMAGE" --format '{{.Created}}' 2>/dev/null || echo '1970-01-01')" ] || \
   [ "$BUILD_SCRIPT" -nt "$(docker image inspect "$DOCKER_IMAGE" --format '{{.Created}}' 2>/dev/null || echo '1970-01-01')" ] || \
   [ "$WRAPPER_CPP" -nt "$(docker image inspect "$DOCKER_IMAGE" --format '{{.Created}}' 2>/dev/null || echo '1970-01-01')" ]; then
  log_info "Building Docker image: $DOCKER_IMAGE (this will build wpimath and cache it)"
  log_info "Using commit: $WPILIB_COMMIT"
  docker build \
    -f "$DOCKERFILE" \
    -t "$DOCKER_IMAGE" \
    --build-arg WPILIB_REPO_URL="$REPO_URL" \
    --build-arg WPILIB_COMMIT="$WPILIB_COMMIT" \
    "$SCRIPT_DIR"
else
  log_info "Using cached Docker image: $DOCKER_IMAGE"
fi

log_info "Linking WASM module..."
log_info "Output: $OUTPUT_DIR"

# Run Docker container - the build script is already in the image
docker run --rm \
  -v "$OUTPUT_DIR:/output" \
  -e "OUTPUT_DIR=/output" \
  "$DOCKER_IMAGE"

log_info ""
log_info "Successfully built wpimath WASM files to $OUTPUT_DIR"

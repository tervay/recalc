#!/bin/bash

set -e

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# Get the project root (parent of wpilib directory)
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

OUTPUT_DIR="$PROJECT_ROOT/app/lib/generated/wpimath"
DOCKER_IMAGE="wpilib-builder"
DOCKERFILE="$SCRIPT_DIR/Dockerfile"
WPILIB_COMMIT="02252b58d7bdf91d2c4c4ac38788c84087cba60b"

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

# docker run -v $PWD:/src xianpengshen/clang-tools:19 clang-format -i patches/wpilibc/wasm/bindings.cc
# docker run -v $PWD:/src xianpengshen/clang-tools:19 clang-format -i patches/wpimath/wasm/bindings.cc

# Fix file permissions after Docker formatting (files are owned by root)
if [ -f "$SCRIPT_DIR/patches/wpilibc/wasm/bindings.cc" ] || [ -f "$SCRIPT_DIR/patches/wpimath/wasm/bindings.cc" ]; then
  sudo chown $(id -u):$(id -g) "$SCRIPT_DIR/patches/wpilibc/wasm/bindings.cc" "$SCRIPT_DIR/patches/wpimath/wasm/bindings.cc" 2>/dev/null || true
fi

# Function to copy generated WASM files from container
# Arguments:
#   $1: Container ID
#   $2: Container source directory (e.g., "/build/allwpilib/build/wpimath/wasm")
#   $3: Base filename (e.g., "wpimath_wasm" or "wpilibc_wasm")
#   $4: Output directory on host
function copy_wasm_files() {
  local container_id="$1"
  local container_source="$2"
  local base_filename="$3"
  local output_dir="$4"
  
  # Copy .js file (required)
  if docker cp "$container_id:$container_source/${base_filename}.js" "$output_dir/${base_filename}.js" 2>/dev/null; then
    log_info "Copied ${base_filename}.js"
  else
    log_error "Failed to copy ${base_filename}.js"
    docker rm "$container_id" >/dev/null
    exit 1
  fi
  
  # Copy .wasm file (optional - may be embedded in JS)
  if docker cp "$container_id:$container_source/${base_filename}.wasm" "$output_dir/${base_filename}.wasm" 2>/dev/null; then
    log_info "Copied ${base_filename}.wasm"
  else
    log_warn "${base_filename}.wasm not found (may be embedded in JS)"
  fi
  
  # Copy .d.ts file (optional)
  if docker cp "$container_id:$container_source/${base_filename}.d.ts" "$output_dir/${base_filename}.d.ts" 2>/dev/null; then
    log_info "Copied ${base_filename}.d.ts"
  else
    log_warn "${base_filename}.d.ts not found"
  fi
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
  log_error "Docker is not installed or not available in PATH. Please install Docker."
  exit 1
fi

log_info "Building Docker image..."
docker build -f "$DOCKERFILE" -t "$DOCKER_IMAGE" --build-arg WPILIB_COMMIT="$WPILIB_COMMIT" "$SCRIPT_DIR"

log_info "Creating output directories..."
mkdir -p "$OUTPUT_DIR"
mkdir -p "$PROJECT_ROOT/app/lib/generated/wpilibc"

log_info "Copying generated files from container..."
CONTAINER_ID=$(docker create "$DOCKER_IMAGE")

# Copy wpimath files
log_info "Copying wpimath files..."
copy_wasm_files "$CONTAINER_ID" "/build/allwpilib/build/wpimath/wasm" "wpimath_wasm" "$OUTPUT_DIR"

# Copy wpilibc files
log_info "Copying wpilibc files..."
copy_wasm_files "$CONTAINER_ID" "/build/allwpilib/build/wpilibc/wasm" "wpilibc_wasm" "$PROJECT_ROOT/app/lib/generated/wpilibc"

# Clean up container
docker rm "$CONTAINER_ID" >/dev/null

log_info "Successfully copied files"


#!/bin/bash
set -e

OUTPUT_DIR="${OUTPUT_DIR:-/output}"

echo "Linking wpimath WASM module with Emscripten..."
echo "Output: $OUTPUT_DIR"

# Use pre-built libraries from Docker image
WPIMATH_LIB="/usr/local/lib/wpimath/libwpimath.a"
WPIUTIL_LIB="/usr/local/lib/wpimath/libwpiutil.a"
WPIMATH_INCLUDE="/usr/local/include/wpimath"

if [ ! -f "$WPIMATH_LIB" ] || [ ! -f "$WPIUTIL_LIB" ]; then
  echo "ERROR: Pre-built wpimath libraries not found in image"
  echo "Expected: $WPIMATH_LIB and $WPIUTIL_LIB"
  exit 1
fi

# Create a WASM module by linking the static library
echo "Creating WASM module from static library..."
WASM_OUTPUT="/tmp/wpimath_wasm"

# Build include path list from pre-installed headers
echo "Finding include directories..."
# Find all thirdparty include directories
THIRDPARTY_INCLUDES=$(find "$WPIMATH_INCLUDE" -type d -name "thirdparty" 2>/dev/null | while read thirdpartydir; do
  find "$thirdpartydir" -type d -name "include" 2>/dev/null
done | sed 's|^|-I|' | tr '\n' ' ' || echo "")

# Also include parent directories so that includes like <gcem.hpp> work
# gcem.hpp is in wpimath/src/main/native/thirdparty/gcem/include/gcem.hpp
# So we need to include the parent of the include directory
THIRDPARTY_PARENT_INCLUDES=$(find "$WPIMATH_INCLUDE" -type d -name "include" -path "*/thirdparty/*" 2>/dev/null | \
  xargs -I {} dirname {} | sed 's|^|-I|' | tr '\n' ' ' || echo "")

# Build comprehensive include path list
ALL_INCLUDES="-I$WPIMATH_INCLUDE $THIRDPARTY_INCLUDES $THIRDPARTY_PARENT_INCLUDES"

# Copy wrapper source files to temp location
WRAPPER_DIR="/tmp/wpimath_wrappers"
mkdir -p "$WRAPPER_DIR"
cp /usr/local/bin/wpimath_wrapper.cpp "$WRAPPER_DIR/wpimath_wrapper.cpp"

# Create stub protobuf headers to satisfy includes (protobuf is disabled)
# The headers include protobuf files but we don't need the actual protobuf functionality
STUB_PROTOBUF_DIR="$WRAPPER_DIR/wpimath/protobuf"
mkdir -p "$STUB_PROTOBUF_DIR"
cat > "$STUB_PROTOBUF_DIR/geometry2d.npb.h" <<'EOF'
// Stub protobuf header - protobuf is disabled for WASM build
#ifndef WPIMATH_PROTOBUF_GEOMETRY2D_NPB_H
#define WPIMATH_PROTOBUF_GEOMETRY2D_NPB_H

// Stub types for protobuf messages (not used when protobuf is disabled)
// These are C-style type names used by nanopb
typedef struct {} wpi_proto_ProtobufTwist2d;
typedef struct {} wpi_proto_ProtobufPose2d;
typedef struct {} wpi_proto_ProtobufTransform2d;
typedef struct {} wpi_proto_ProtobufRotation2d;
typedef struct {} wpi_proto_ProtobufTranslation2d;

#endif
EOF

# Add stub protobuf directory to includes
STUB_INCLUDES="-I$WRAPPER_DIR"

# Link the static library into a WASM module with embind
echo "Linking WASM module with embind (wpimath_wrapper.cpp)..."

# Build with embind wrapper - this must succeed (no protobuf required)
echo "Linking WASM module with pre-built libraries..."
emcc "$WRAPPER_DIR/wpimath_wrapper.cpp" \
  "$WPIMATH_LIB" \
  "$WPIUTIL_LIB" \
  $ALL_INCLUDES $STUB_INCLUDES \
  -std=c++20 \
  -o "$WASM_OUTPUT.js" \
  -s WASM=1 \
  -s EXPORTED_RUNTIME_METHODS='["ccall","cwrap","UTF8ToString","stringToUTF8"]' \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s MODULARIZE=1 \
  -s EXPORT_NAME="'wpimathModule'" \
  -s EXPORT_ES6=1 \
  -s EXPORT_ALL=1 \
  --bind \
  --emit-tsd="$WASM_OUTPUT.d.ts" \
  -O3

# Copy WASM files and related artifacts
echo "Collecting build artifacts..."
mkdir -p "$OUTPUT_DIR"

# Copy our generated WASM files
if [ -f "$WASM_OUTPUT.js" ]; then
  cp "$WASM_OUTPUT.js" "$OUTPUT_DIR/wpimath.js"
  [ -f "$WASM_OUTPUT.wasm" ] && cp "$WASM_OUTPUT.wasm" "$OUTPUT_DIR/wpimath.wasm"
  [ -f "$WASM_OUTPUT.d.ts" ] && cp "$WASM_OUTPUT.d.ts" "$OUTPUT_DIR/wpimath.d.ts"
  echo "Build complete! Artifacts in $OUTPUT_DIR"
  ls -lah "$OUTPUT_DIR"
else
  echo "ERROR: WASM output file not found: $WASM_OUTPUT.js"
  exit 1
fi


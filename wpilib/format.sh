#!/usr/bin/env bash

set -euo pipefail

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if ! command -v clang-format >/dev/null 2>&1; then
  echo "clang-format not found. Run: mise install" >&2
  exit 1
fi

mapfile -d '' files < <(
  find "$SCRIPT_DIR"/patches/*/wasm "$SCRIPT_DIR"/tests \
    -type f \( -name '*.cc' -o -name '*.h' \) -print0
)

if [ ${#files[@]} -eq 0 ]; then
  echo "No C++ sources found to format under patches/*/wasm or tests" >&2
  exit 1
fi

clang-format --style=file:"$SCRIPT_DIR/.clang-format" -i "${files[@]}"

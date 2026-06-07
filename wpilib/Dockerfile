FROM emscripten/emsdk:6.0.0 AS base

RUN apt-get update -qq && \
    apt-get install -y -qq \
    git \
    libprotobuf-dev \
    build-essential \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Set up mise environment variables
SHELL ["/bin/bash", "-o", "pipefail", "-c"]
ENV MISE_DATA_DIR="/mise"
ENV MISE_CONFIG_DIR="/mise"
ENV MISE_CACHE_DIR="/mise/cache"
ENV MISE_INSTALL_PATH="/usr/local/bin/mise"
ENV PATH="/mise/shims:$PATH"

RUN curl https://mise.run | MISE_INSTALL_PATH=/usr/local/bin/mise sh
COPY .mise.toml /build/.mise.toml

WORKDIR /build
RUN mise trust && \
    mise install

ARG TS_VERSION
RUN npm i -g typescript@${TS_VERSION}

# ---- Stage: libs ----
# Compiles all static library dependencies of wpilibc_wasm.
# Cached unless the WPILib commit hash, CMakeLists patches, or toolchain files change.
FROM base AS libs

ARG WPILIB_REPO=https://github.com/wpilibsuite/allwpilib
ARG WPILIB_COMMIT

WORKDIR /build
RUN test -n "${WPILIB_COMMIT}" || { echo "ERROR: WPILIB_COMMIT build arg is required"; exit 1; } && \
    git init /build/allwpilib && \
    cd /build/allwpilib && \
    git remote add origin "${WPILIB_REPO}" && \
    git fetch --depth 1 origin "${WPILIB_COMMIT}" && \
    git checkout FETCH_HEAD

# Apply patches (minimal diffs against upstream)
COPY patches/CMakeLists.patch /tmp/patches/root_CMakeLists.patch
COPY patches/wpimath/CMakeLists.patch /tmp/patches/wpimath_CMakeLists.patch
COPY patches/wpilibc/CMakeLists.patch /tmp/patches/wpilibc_CMakeLists.patch
COPY patches/hal/CMakeLists.patch /tmp/patches/hal_CMakeLists.patch
COPY patches/wpiutil/Handle.hpp.patch /tmp/patches/wpiutil_Handle.patch
RUN patch -p1 -d /build/allwpilib < /tmp/patches/root_CMakeLists.patch && \
    patch -p1 -d /build/allwpilib < /tmp/patches/wpimath_CMakeLists.patch && \
    patch -p1 -d /build/allwpilib < /tmp/patches/wpilibc_CMakeLists.patch && \
    patch -p1 -d /build/allwpilib < /tmp/patches/hal_CMakeLists.patch && \
    patch -p1 -d /build/allwpilib < /tmp/patches/wpiutil_Handle.patch

# Copy new files (wasm/ directories don't exist in upstream)
COPY patches/wpimath/wasm/CMakeLists.txt /build/allwpilib/wpimath/wasm/CMakeLists.txt
COPY patches/wpimath/wasm/emscripten_toolchain.cmake /build/allwpilib/wpimath/wasm/emscripten_toolchain.cmake
COPY patches/wpilibc/wasm/CMakeLists.txt /build/allwpilib/wpilibc/wasm/CMakeLists.txt
COPY patches/wpilibc/wasm/emscripten_toolchain.cmake /build/allwpilib/wpilibc/wasm/emscripten_toolchain.cmake
COPY patches/wpilibc/wasm/stubs/CMakeLists.txt /build/allwpilib/wpilibc/wasm/stubs/CMakeLists.txt
COPY patches/wpilibc/wasm/stubs/ntcore_stub.cc /build/allwpilib/wpilibc/wasm/stubs/ntcore_stub.cc
# Placeholder bindings so cmake can configure and all static lib dependencies
# can be compiled. The real bindings are applied in the next stage.
RUN printf '#include <emscripten/bind.h>\nEMSCRIPTEN_BINDINGS(placeholder) {}\n' \
      | tee /build/allwpilib/wpilibc/wasm/bindings.cc \
            /build/allwpilib/wpimath/wasm/bindings.cc > /dev/null

# Build wpimath
# RUN cd /build/allwpilib && \
#     emcmake cmake -B build -S . \
#       -DCMAKE_BUILD_TYPE=Release \
#       -DBUILD_SHARED_LIBS=OFF \
#       -DWITH_SIMULATION_MODULES=OFF \
#       -DWITH_PROTOBUF=OFF \
#       -DWITH_GUI=OFF \
#       -DWITH_CSCORE=OFF \
#       -DWITH_WPIMATH=ON \
#       -DWITH_WPILIB=OFF \
#       -DWITH_NTCORE=OFF \
#       -DWITH_EXAMPLES=OFF \
#       -DWITH_JAVA=OFF \
#       -DWITH_TESTS=OFF \
#       -G Ninja && \
#     cd build && \
#     emmake ninja wpimath_wasm -j$(nproc)

# cmake configure + build wpilibc_wasm with placeholder bindings.
# This compiles all static lib dependencies (wpiutil, wpimath, hal, wpilibc, ntcore).
RUN cd /build/allwpilib && \
    emcmake cmake -B build -S . \
      -DCMAKE_BUILD_TYPE=Release \
      -DBUILD_SHARED_LIBS=OFF \
      -DWITH_SIMULATION_MODULES=OFF \
      -DWITH_PROTOBUF=OFF \
      -DWITH_GUI=OFF \
      -DWITH_CSCORE=OFF \
      -DWITH_WPIMATH=ON \
      -DWITH_WPILIB=ON \
      -DWITH_NTCORE=ON \
      -DWITH_EXAMPLES=OFF \
      -DWITH_JAVA=OFF \
      -DWITH_TESTS=OFF \
      -DNO_WERROR=ON \
      -G Ninja && \
    cd build && \
    emmake ninja wpilibc_wasm -j$(nproc)

# ---- Stage: final ----
# Copies real bindings and relinks. Only this stage re-runs when bindings.cc changes.
FROM libs

COPY patches/wpilibc/wasm/bindings.cc \
     patches/wpilibc/wasm/arm_sim.h \
     patches/wpilibc/wasm/battery_sim.h \
     patches/wpilibc/wasm/dc_motor.h \
     patches/wpilibc/wasm/dc_motor_sim.h \
     patches/wpilibc/wasm/elevator_sim.h \
     patches/wpilibc/wasm/flywheel_sim.h \
     patches/wpilibc/wasm/sim_util.h \
     /build/allwpilib/wpilibc/wasm/

# Touch to ensure mtime is newer than the placeholder object file, so ninja
# recompiles bindings.cc. All static libs from the libs stage are already built.
RUN touch /build/allwpilib/wpilibc/wasm/bindings.cc && \
    cd /build/allwpilib/build && emmake ninja wpilibc_wasm -j$(nproc)

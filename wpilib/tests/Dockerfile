FROM emscripten/emsdk:6.0.2 AS base

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update -qq && \
    apt-get install -y -qq \
        git \
        libgtest-dev \
        ninja-build \
    && rm -rf /var/lib/apt/lists/*

# ---- Stage: wpimath-libs ----
# Builds the compiled wpimath (+ wpiutil) static libraries that the gain
# tests link against, from the same pinned WPILib commit as the production
# wasm build (see ../Dockerfile and ../wpilib.conf). Only wpi::math is
# configured (no hal/wpilibc/ntcore), keeping this far cheaper than the
# production "libs" stage. Layer-cached independently of test source
# changes; only re-runs if WPILIB_COMMIT changes.
FROM base AS wpimath-libs

ARG WPILIB_REPO=https://github.com/wpilibsuite/allwpilib
ARG WPILIB_COMMIT
WORKDIR /build
RUN test -n "${WPILIB_COMMIT}" || { echo "ERROR: WPILIB_COMMIT build arg is required"; exit 1; } && \
    git init /build/allwpilib && \
    cd /build/allwpilib && \
    git remote add origin "${WPILIB_REPO}" && \
    git fetch --depth 1 origin "${WPILIB_COMMIT}" && \
    git checkout FETCH_HEAD

# Configure and build only the `wpimath` target (which pulls in `wpiutil` as
# a dependency). No patches from ../patches/ are needed here: those patches
# only affect wpilibc/hal/ntcore/wpinet wiring, none of which is configured
# below (WITH_WPILIB=OFF, WITH_NTCORE=OFF).
#
# -fwasm-exceptions must be applied identically everywhere a throw/catch
# crosses a compiled link boundary (here, GoogleTest, and the gain tests in
# tests/CMakeLists.txt) -- see the comment at the top of that file.
RUN cd /build/allwpilib && \
    emcmake cmake -B build -S . \
      -DCMAKE_BUILD_TYPE=Release \
      -DBUILD_SHARED_LIBS=OFF \
      -DCMAKE_CXX_FLAGS=-fwasm-exceptions \
      -DWITH_SIMULATION_MODULES=OFF \
      -DWITH_PROTOBUF=OFF \
      -DWITH_GUI=OFF \
      -DWITH_CSCORE=OFF \
      -DWITH_WPIMATH=ON \
      -DWITH_WPILIB=OFF \
      -DWITH_NTCORE=OFF \
      -DWITH_EXAMPLES=OFF \
      -DWITH_JAVA=OFF \
      -DWITH_TESTS=OFF \
      -DNO_WERROR=ON \
      -G Ninja && \
    cd build && \
    emmake ninja wpimath -j"$(nproc)"

# Stage the compiled archives at a fixed, predictable path -- their exact
# location under build/ is a CMake implementation detail we don't want the
# final stage to have to know about.
RUN mkdir -p /wpimath-artifacts/lib && \
    for lib in libwpimath.a libwpiutil.a; do \
        find /build/allwpilib/build -name "$lib" -exec cp {} /wpimath-artifacts/lib/ \; && \
        test -f "/wpimath-artifacts/lib/$lib" || exit 1; \
    done

# ---- Stage: gtest-libs ----
# Build GoogleTest with Emscripten before copying any test sources. Stable
# layer, cached across CI runs as long as the base image and gtest package
# version don't change. -fwasm-exceptions must match wpimath-libs above.
FROM base AS gtest-libs

RUN emcmake cmake -S /usr/src/googletest -B /gtest-build \
        -G Ninja \
        -DCMAKE_BUILD_TYPE=Release \
        -DCMAKE_CXX_FLAGS=-fwasm-exceptions \
        -DBUILD_GMOCK=OFF \
        -DINSTALL_GTEST=OFF \
    && cmake --build /gtest-build

# ---- Stage: final ----
FROM base

COPY --from=gtest-libs /gtest-build /gtest-build
COPY --from=wpimath-libs /wpimath-artifacts /wpimath-artifacts
# Headers only (no build/ artifacts) for wpimath's and wpiutil's own sources
# and bundled thirdparty deps (eigen, gcem, sleipnir, nanopb, fmtlib, etc.),
# so feedback_gains_tests can include the same wpi/math headers it links
# against above.
COPY --from=wpimath-libs /build/allwpilib/wpimath/src /wpimath-artifacts/include/wpimath/src
COPY --from=wpimath-libs /build/allwpilib/wpiutil/src /wpimath-artifacts/include/wpiutil/src

WORKDIR /src

# Build context is wpilib/ — paths here are relative to that root.
COPY tests/ /src/tests/
COPY patches/wpilibc/wasm/sim_util.h /src/patches/wpilibc/wasm/sim_util.h
COPY patches/wpilibc/wasm/wasm_console.h /src/patches/wpilibc/wasm/wasm_console.h
COPY patches/wpilibc/wasm/dc_motor.h /src/patches/wpilibc/wasm/dc_motor.h
COPY patches/wpilibc/wasm/feedback_gains.h /src/patches/wpilibc/wasm/feedback_gains.h
COPY patches/wpilibc/wasm/feedforward_gains.h /src/patches/wpilibc/wasm/feedforward_gains.h

WORKDIR /src/tests/build

RUN emcmake cmake .. \
        -G Ninja \
        -DCMAKE_BUILD_TYPE=Debug \
    && emmake ninja

# Run both test binaries unconditionally so a failure in one doesn't hide
# the result of the other; fail the container if either fails.
CMD ["sh", "-c", "set -u; status=0; node sim_util_tests.js || status=1; node wasm_console_tests.js || status=1; node feedback_gains_tests.js || status=1; node feedforward_gains_tests.js || status=1; exit \"$status\""]

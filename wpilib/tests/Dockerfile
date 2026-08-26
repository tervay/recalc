FROM emscripten/emsdk:6.0.8 AS base

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update -qq && \
    apt-get install -y -qq \
        git \
        libgtest-dev \
        ninja-build \
        patch \
    && rm -rf /var/lib/apt/lists/*

# ---- Stage: wpilib-libs ----
# Builds the compiled WPILib static libraries the tests link against, from the
# same pinned WPILib commit as the production wasm build (see ../Dockerfile and
# ../wpilib.conf).
#
# This mirrors the production "libs" stage rather than the cheaper wpimath-only
# build it replaced: elevator_sim.h's AngledElevatorSim derives from
# wpi::sim::ElevatorSim and SimulateElevatorImpl calls BatterySim, RoboRioSim,
# and RobotController, all of which live in wpilibc and the HAL. The gain tests
# still only need wpimath, but a superset build keeps one stage instead of two.
#
# Layer-cached independently of test source changes; only re-runs if
# WPILIB_COMMIT or the patches change.
FROM base AS wpilib-libs

ARG WPILIB_REPO=https://github.com/wpilibsuite/allwpilib
ARG WPILIB_COMMIT
WORKDIR /build
RUN test -n "${WPILIB_COMMIT}" || { echo "ERROR: WPILIB_COMMIT build arg is required"; exit 1; } && \
    git init /build/allwpilib && \
    cd /build/allwpilib && \
    git remote add origin "${WPILIB_REPO}" && \
    git fetch --depth 1 origin "${WPILIB_COMMIT}" && \
    git checkout FETCH_HEAD

# The same patches the production build applies, minus wpimath's: that one only
# adds add_subdirectory(wasm) for the wpimath wasm module, which is not built
# here, and skipping it avoids having to stage a second placeholder bindings.cc.
COPY patches/CMakeLists.patch /tmp/patches/root_CMakeLists.patch
COPY patches/wpilibc/CMakeLists.patch /tmp/patches/wpilibc_CMakeLists.patch
COPY patches/hal/CMakeLists.patch /tmp/patches/hal_CMakeLists.patch
RUN patch -p1 -d /build/allwpilib < /tmp/patches/root_CMakeLists.patch && \
    patch -p1 -d /build/allwpilib < /tmp/patches/wpilibc_CMakeLists.patch && \
    patch -p1 -d /build/allwpilib < /tmp/patches/hal_CMakeLists.patch

# The patched wpilibc/CMakeLists.txt calls add_subdirectory(wasm) under
# Emscripten, and the patched root CMakeLists.txt adds wpilibc/wasm/stubs before
# hal, so this scaffolding must exist for cmake to configure -- even though the
# wpilibc_wasm target is never built below.
COPY patches/wpilibc/wasm/CMakeLists.txt /build/allwpilib/wpilibc/wasm/CMakeLists.txt
COPY patches/wpilibc/wasm/emscripten_toolchain.cmake /build/allwpilib/wpilibc/wasm/emscripten_toolchain.cmake
COPY patches/wpilibc/wasm/stubs/CMakeLists.txt /build/allwpilib/wpilibc/wasm/stubs/CMakeLists.txt
COPY patches/wpilibc/wasm/stubs/ntcore_stub.cc /build/allwpilib/wpilibc/wasm/stubs/ntcore_stub.cc
RUN printf '#include <emscripten/bind.h>\nEMSCRIPTEN_BINDINGS(placeholder) {}\n' \
      > /build/allwpilib/wpilibc/wasm/bindings.cc

# Same option set as the production build. Target `wpilibc` (not
# `wpilibc_wasm`), so the placeholder bindings.cc above is never compiled and no
# wasm module is linked -- only the static archives the tests need.
#
# WPILIB_WITH_NTCORE=ON is required, not optional: upstream's CMakeLists.txt
# declares `wpilib_config(OPTIONS WPILIB_WITH_WPILIB REQUIRES WPILIB_WITH_NTCORE
# WPILIB_WITH_WPIMATH)`, which is a hard FATAL_ERROR when unmet. The stage this
# replaced could set it OFF only because it also set WPILIB_WITH_WPILIB=OFF.
# WPILIB_WITH_TESTS and WPILIB_WITH_BENCHMARK must be set OFF explicitly: they
# now default ON and both REQUIRE WPILIB_WITH_EXECUTABLES, which we set OFF.
# It does not actually build
# NetworkTables: the root patch skips add_subdirectory(wpinet)/(ntcore) under
# Emscripten and links the empty wpilibc/wasm/stubs archive instead, so the
# staged output is libntcore_stub.a with no libntcore.a or libwpinet.a.
#
# -fwasm-exceptions must be applied identically everywhere a throw/catch crosses
# a compiled link boundary (here, GoogleTest, and the tests in
# tests/CMakeLists.txt) -- see the comment at the top of that file.
RUN cd /build/allwpilib && \
    emcmake cmake -B build -S . \
      -DCMAKE_BUILD_TYPE=Release \
      -DBUILD_SHARED_LIBS=OFF \
      -DCMAKE_CXX_FLAGS=-fwasm-exceptions \
      -DWPILIB_WITH_SIMULATION_MODULES=OFF \
      -DWPILIB_WITH_GUI=OFF \
      -DWPILIB_WITH_CSCORE=OFF \
      -DWPILIB_WITH_WPIMATH=ON \
      -DWPILIB_WITH_WPILIB=ON \
      -DWPILIB_WITH_NTCORE=ON \
      -DWPILIB_WITH_EXAMPLES=OFF \
      -DWPILIB_WITH_TESTS=OFF \
      -DWPILIB_WITH_BENCHMARK=OFF \
      -DWPILIB_WITH_EXECUTABLES=OFF \
      -DWPILIB_NO_WERROR=ON \
      -G Ninja && \
    cd build && \
    emmake ninja wpilibc -j"$(nproc)"

# Stage every archive the build produced at a fixed, predictable path. Copying
# by glob rather than by name keeps this working when upstream renames a library
# (e.g. libwpiHal.a vs libhal.a); tests/CMakeLists.txt globs the result too.
RUN mkdir -p /wpilib-artifacts/lib && \
    find /build/allwpilib/build -name '*.a' -exec cp {} /wpilib-artifacts/lib/ \; && \
    test -f /wpilib-artifacts/lib/libwpilibc.a || \
      { echo "ERROR: libwpilibc.a was not produced"; ls -la /wpilib-artifacts/lib; exit 1; }

# ---- Stage: gtest-libs ----
# Build GoogleTest with Emscripten before copying any test sources. Stable
# layer, cached across CI runs as long as the base image and gtest package
# version don't change. -fwasm-exceptions must match wpilib-libs above.
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
COPY --from=wpilib-libs /wpilib-artifacts /wpilib-artifacts
# Headers only (no build/ artifacts) for each library's own sources and bundled
# thirdparty deps (eigen, gcem, sleipnir, nanopb, etc.), so the tests can
# include the same headers they link against above.
COPY --from=wpilib-libs /build/allwpilib/wpimath/src /wpilib-artifacts/include/wpimath/src
COPY --from=wpilib-libs /build/allwpilib/wpiutil/src /wpilib-artifacts/include/wpiutil/src
COPY --from=wpilib-libs /build/allwpilib/wpilibc/src /wpilib-artifacts/include/wpilibc/src
COPY --from=wpilib-libs /build/allwpilib/hal/src /wpilib-artifacts/include/hal/src
COPY --from=wpilib-libs /build/allwpilib/ntcore/src /wpilib-artifacts/include/ntcore/src
# wpilibc's public headers include wpi/telemetry/* and wpi/tunables/*, which
# upstream split out into their own top-level libraries.
COPY --from=wpilib-libs /build/allwpilib/telemetry/src /wpilib-artifacts/include/telemetry/src
COPY --from=wpilib-libs /build/allwpilib/tunables/src /wpilib-artifacts/include/tunables/src

WORKDIR /src

# Build context is wpilib/ — paths here are relative to that root.
COPY tests/ /src/tests/
# Every header under test, by glob: adding a test must not require a Dockerfile
# edit. Only .h files are taken, so bindings.cc, CMakeLists.txt,
# emscripten_toolchain.cmake and stubs/ stay out.
#
# Do not do this in the wpilib-libs stage above: that stage's COPY lines sit
# above the expensive WPILib compile, so a glob there would rebuild the whole
# library set on every header edit.
COPY patches/wpilibc/wasm/*.h /src/patches/wpilibc/wasm/

WORKDIR /src/tests/build

RUN emcmake cmake .. \
        -G Ninja \
        -DCMAKE_BUILD_TYPE=Debug \
    && emmake ninja

# ctest runs every case registered by tests/CMakeLists.txt, continues past a
# failing one, and exits non-zero if any failed. --no-tests=error turns an empty
# test list into a failure instead of a silent pass.
#
# ENTRYPOINT rather than CMD so `docker run --rm <image> -R arm_sim` filters
# without restating the flags. For a shell, use --entrypoint sh.
ENTRYPOINT ["ctest", "--output-on-failure", "--no-tests=error"]

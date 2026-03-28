FROM emscripten/emsdk:5.0.3

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update -qq && \
    apt-get install -y -qq \
        libgtest-dev \
        ninja-build \
    && rm -rf /var/lib/apt/lists/*

# Build GoogleTest with Emscripten before copying any test sources.
# This layer is stable and will be cached across CI runs as long as the
# base image and gtest package version do not change.
RUN emcmake cmake -S /usr/src/googletest -B /gtest-build \
        -G Ninja \
        -DCMAKE_BUILD_TYPE=Release \
        -DBUILD_GMOCK=OFF \
        -DINSTALL_GTEST=OFF \
    && cmake --build /gtest-build

WORKDIR /src

# Build context is wpilib/ — paths here are relative to that root.
COPY tests/ /src/tests/
COPY patches/wpilibc/wasm/sim_util.h /src/patches/wpilibc/wasm/sim_util.h

WORKDIR /src/tests/build

RUN emcmake cmake .. \
        -G Ninja \
        -DCMAKE_BUILD_TYPE=Debug \
    && emmake ninja

CMD ["node", "sim_util_tests.js"]

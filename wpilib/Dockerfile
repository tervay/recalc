FROM emscripten/emsdk:4.0.19

RUN apt-get update -qq && \
    apt-get install -y -qq \
    git \
    cmake \
    build-essential \
    python3 \
    protobuf-compiler \
    libprotobuf-dev \
    ninja-build && \
    rm -rf /var/lib/apt/lists/*

RUN npm i -g typescript

WORKDIR /build
COPY allwpilib /build/allwpilib
WORKDIR /build/allwpilib

# Copy over local patches
COPY patches/wpimath/wasm/CMakeLists.txt /build/allwpilib/wpimath/wasm/CMakeLists.txt
COPY patches/wpimath/wasm/bindings.cc /build/allwpilib/wpimath/wasm/bindings.cc
COPY patches/wpimath/wasm/emscripten_toolchain.cmake /build/allwpilib/wpimath/wasm/emscripten_toolchain.cmake
COPY patches/wpimath/CMakeLists.txt /build/allwpilib/wpimath/CMakeLists.txt
COPY patches/wpilibc/wasm/CMakeLists.txt /build/allwpilib/wpilibc/wasm/CMakeLists.txt
COPY patches/wpilibc/wasm/emscripten_toolchain.cmake /build/allwpilib/wpilibc/wasm/emscripten_toolchain.cmake
COPY patches/wpilibc/wasm/bindings.cc /build/allwpilib/wpilibc/wasm/bindings.cc
COPY patches/wpilibc/CMakeLists.txt /build/allwpilib/wpilibc/CMakeLists.txt
COPY patches/wpilibc/wasm/stubs/CMakeLists.txt /build/allwpilib/wpilibc/wasm/stubs/CMakeLists.txt
COPY patches/wpilibc/wasm/stubs/ntcore_stub.cc /build/allwpilib/wpilibc/wasm/stubs/ntcore_stub.cc
COPY patches/CMakeLists.txt /build/allwpilib/CMakeLists.txt

# Build wpimath
RUN cd /build/allwpilib && \
    emcmake cmake -B build -S . \
      -DCMAKE_BUILD_TYPE=Release \
      -DBUILD_SHARED_LIBS=OFF \
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
      -G Ninja && \
    cd build && \
    emmake ninja wpimath_wasm -j$(nproc)

# Build wpilibc
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
      -G Ninja && \
    cd build && \
    emmake ninja wpilibc_wasm -j$(nproc)
// Minimal stub implementation of ntcore for WebAssembly builds.
//
// wpinet/ntcore are not built under Emscripten (see the root CMakeLists
// patch). wpilibc still references NetworkTables symbols: HAL initialization
// constructs static DashboardOpModeSender objects whose Publisher/Subscriber
// members call wpi::nt::Release on destruction. Without these no-ops,
// EXIT_RUNTIME test binaries abort with "missing function: wpi::nt::Release"
// (which can also surface as an Emscripten stack-cookie failure).
//
// Declarations intentionally avoid ntcore headers: those pull in generated
// files (ntcore_c_types.h) that are not available in the stub-only build.
// NT_Handle is int32_t upstream (see wpi/util/Handle.h).

#include <cstdint>

namespace wpi::nt {

using NT_Handle = int32_t;

void Release(NT_Handle) {}

void ReleaseEntry(NT_Handle) {}

void Unpublish(NT_Handle) {}

void RemoveListener(NT_Handle) {}

}  // namespace wpi::nt

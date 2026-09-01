#include <catch2/catch_test_run_info.hpp>
#include <catch2/reporters/catch_reporter_event_listener.hpp>
#include <catch2/reporters/catch_reporter_registrars.hpp>

#include "hal_init.h"

namespace {

// RoboRioSim_SetVInVoltage / RobotController_GetInputVoltage touch
// SimRoboRioData, which has no lazy-init (see hal_init.h). Initialize once for
// the whole binary. The wrappers call EnsureHalInitialized themselves, so this
// is belt-and-braces against declaration order.
//
// This lives in its own translation unit because a Catch2 listener must be
// registered exactly once per binary, and every simulation test file needs it.
struct HalInitListener : Catch::EventListenerBase {
  using EventListenerBase::EventListenerBase;

  void testRunStarting(Catch::TestRunInfo const&) override {
    EnsureHalInitialized();
  }
};

}  // namespace

CATCH_REGISTER_LISTENER(HalInitListener)

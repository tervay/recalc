#include "wasm_console.h"

#include <catch2/catch_test_macros.hpp>
#include <string>

TEST_CASE("FormatConsoleMessage: FormatsExceptionWithContext",
          "[FormatConsoleMessage]") {
  const std::string message = FormatConsoleMessage(
      "ComputeLinearFeedforwardGains: {} (gearing={} loadKg={} "
      "spoolRadiusMeters={})",
      "invalid argument", 12.5, 3.0, 0.025);
  CHECK(message ==
        "ComputeLinearFeedforwardGains: invalid argument (gearing=12.5 "
        "loadKg=3 spoolRadiusMeters=0.025)");
}

TEST_CASE("FormatConsoleMessage: FormatsUnknownExceptionWithContext",
          "[FormatConsoleMessage]") {
  const std::string message = FormatConsoleMessage(
      "SimulateElevator: unknown exception (gearing={} loadKg={} spoolR={} "
      "statorA={} supplyA={})",
      10.0, 5.0, 0.02, 40.0, 60.0);
  CHECK(message ==
        "SimulateElevator: unknown exception (gearing=10 loadKg=5 "
        "spoolR=0.02 statorA=40 supplyA=60)");
}

TEST_CASE("ConsoleWarn: DoesNotThrowUnderNode", "[ConsoleWarn]") {
  CHECK_NOTHROW(ConsoleWarn("wasm_console_test: smoke check ({})", 1));
}

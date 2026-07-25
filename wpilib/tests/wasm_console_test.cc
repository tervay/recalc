#include "wasm_console.h"

#include <gtest/gtest.h>

#include <string>

TEST(FormatConsoleMessage, FormatsExceptionWithContext) {
  const std::string message = FormatConsoleMessage(
      "ComputeLinearFeedforwardGains: {} (gearing={} loadKg={} "
      "spoolRadiusMeters={})",
      "invalid argument", 12.5, 3.0, 0.025);
  EXPECT_EQ(message,
            "ComputeLinearFeedforwardGains: invalid argument (gearing=12.5 "
            "loadKg=3 spoolRadiusMeters=0.025)");
}

TEST(FormatConsoleMessage, FormatsUnknownExceptionWithContext) {
  const std::string message = FormatConsoleMessage(
      "SimulateElevator: unknown exception (gearing={} loadKg={} spoolR={} "
      "statorA={} supplyA={})",
      10.0, 5.0, 0.02, 40.0, 60.0);
  EXPECT_EQ(message,
            "SimulateElevator: unknown exception (gearing=10 loadKg=5 "
            "spoolR=0.02 statorA=40 supplyA=60)");
}

TEST(ConsoleWarn, DoesNotThrowUnderNode) {
  EXPECT_NO_THROW(ConsoleWarn("wasm_console_test: smoke check ({})", 1));
}

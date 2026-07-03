#pragma once

#include <emscripten/val.h>
#include <fmt/core.h>

#include <string>
#include <string_view>
#include <utility>

// Format a diagnostic message for the JS console using {fmt}.
template <typename... Args>
std::string FormatConsoleMessage(fmt::format_string<Args...> fmt,
                                 Args&&... args) {
  return fmt::format(fmt, std::forward<Args>(args)...);
}

inline void ConsoleCall(const char* method, std::string_view message) {
  emscripten::val::global("console").call<void>(method, std::string(message));
}

template <typename... Args>
void ConsoleWarn(fmt::format_string<Args...> fmt, Args&&... args) {
  ConsoleCall("warn", FormatConsoleMessage(fmt, std::forward<Args>(args)...));
}

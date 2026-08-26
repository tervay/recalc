#pragma once

#include <emscripten/val.h>

#include <format>
#include <string>
#include <string_view>
#include <utility>

// Format a diagnostic message for the JS console.
template <typename... Args>
std::string FormatConsoleMessage(std::format_string<Args...> fmt,
                                 Args&&... args) {
  return std::format(fmt, std::forward<Args>(args)...);
}

inline void ConsoleCall(const char* method, std::string_view message) {
  emscripten::val::global("console").call<void>(method, std::string(message));
}

template <typename... Args>
void ConsoleWarn(std::format_string<Args...> fmt, Args&&... args) {
  ConsoleCall("warn", FormatConsoleMessage(fmt, std::forward<Args>(args)...));
}

#pragma once

#include <algorithm>
#include <cmath>
#include <functional>
#include <vector>

#include <emscripten/val.h>

// Clamp an applied voltage to respect both stator and supply current limits.
// This is the C++ equivalent of getvAppliedMinAndMax in currentLimits.ts.
//
// The stator limit produces a linear voltage clamp around back-EMF.
// The supply limit produces a quadratic clamp derived from the power equation
// P = V_supply * I_supply, where I_supply = I_stator * V_applied / V_supply.
inline double ClampVoltageForCurrentLimits(double vApplied, double vBackEmf,
                                           double rOhms,
                                           double statorLimitAmps,
                                           double supplyLimitAmps,
                                           double vSupply) {
  // Stator current limit: |V_applied - V_backEmf| / R <= I_stator_limit
  const double minATerm = vBackEmf - statorLimitAmps * rOhms;
  const double maxATerm = vBackEmf + statorLimitAmps * rOhms;

  // Supply current limit (quadratic): V_applied^2 - V_backEmf*V_applied -
  // I_supply_limit*R*V_supply <= 0
  const double toSqrt =
      (vBackEmf * vBackEmf) / 4.0 + supplyLimitAmps * rOhms * vSupply;
  const double sqrted = std::sqrt(std::max(0.0, toSqrt));

  const double minBTerm = vBackEmf / 2.0 - sqrted;
  const double maxBTerm = vBackEmf / 2.0 + sqrted;

  const double vMin = std::max(minATerm, minBTerm);
  const double vMax = std::min(maxATerm, maxBTerm);

  // Clamp to current-limit bounds, then ensure we stay within supply voltage.
  return std::clamp(std::max(vMin, std::min(vApplied, vMax)), -vSupply,
                    vSupply);
}

// Decimate a state vector and convert to a JS array via a caller-supplied
// serialization function.  Always includes the last element even when it does
// not fall on a decimation boundary (matches obliterateArray in utils.ts).
//
// `serialize` is called once per emitted state and must return an
// emscripten::val object representing that state.
template <typename State>
emscripten::val
DecimateToJsArray(const std::vector<State> &states, int decimation,
                  const std::function<emscripten::val(const State &)> &serialize) {
  emscripten::val result = emscripten::val::array();
  const int n = static_cast<int>(states.size());
  for (int i = 0; i < n; ++i) {
    const bool isDecimated = (i % decimation == 0);
    const bool isLast = (i == n - 1) && (i > 0) && (i % decimation != 0);
    if (!isDecimated && !isLast)
      continue;
    result.call<void>("push", serialize(states[i]));
  }
  return result;
}

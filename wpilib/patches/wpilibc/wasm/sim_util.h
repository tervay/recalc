#pragma once

#include <emscripten/val.h>

#include <algorithm>
#include <cmath>
#include <functional>
#include <vector>

// Clamp an applied voltage to respect both stator and supply current limits.
// This is the C++ equivalent of getvAppliedMinAndMax in currentLimits.ts.
//
// The stator limit produces a linear voltage clamp around back-EMF.
// The supply limit produces a quadratic clamp derived from the power equation
// P = V_supply * I_supply, where I_supply = I_stator * V_applied / V_supply.
inline double ClampVoltageForCurrentLimits(double vApplied, double vBackEmf,
                                           double rOhms, double statorLimitAmps,
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

// Convert a signed stator current draw into the corresponding battery-side
// (supply) current for one timestep, given the applied voltage and the
// instantaneous supply voltage.
//
// Derived from power balance across the motor controller (P_supply =
// P_applied):
//
//   I_supply * V_supply = I_stator_raw * V_applied
//   I_supply            = I_stator_raw * V_applied / V_supply
//
// The sim `GetCurrentDraw()` methods return the stator current already
// multiplied by sgn(V_applied) (i.e. statorCurrent = I_stator_raw *
// sgn(V_applied)). Combining that with |V_applied| here reconstructs
// I_stator_raw * V_applied and therefore yields the correctly *signed* supply
// current: positive = drawing from the battery, negative = regenerating.
//
// Returns 0 when V_supply <= 0 to avoid a divide-by-zero (the battery voltage
// is clamped to >= 0 by BatterySim under extreme loads).
inline double SupplyCurrentFromStator(double statorCurrentAmps, double vApplied,
                                      double vSupply) {
  if (vSupply <= 0.0) {
    return 0.0;
  }
  return statorCurrentAmps * std::abs(vApplied) / vSupply;
}

// Decimate a state vector and convert to a JS array via a caller-supplied
// serialization function.  Always includes the last element even when it does
// not fall on a decimation boundary (matches obliterateArray in utils.ts).
//
// `serialize` is called once per emitted state and must return an
// emscripten::val object representing that state.
template <typename State>
emscripten::val DecimateToJsArray(
    const std::vector<State>& states, int decimation,
    const std::function<emscripten::val(const State&)>& serialize) {
  emscripten::val result = emscripten::val::array();
  const int n = static_cast<int>(states.size());
  for (int i = 0; i < n; ++i) {
    const bool isDecimated = (i % decimation == 0);
    const bool isLast = (i == n - 1) && (i > 0) && (i % decimation != 0);
    if (!isDecimated && !isLast) continue;
    result.call<void>("push", serialize(states[i]));
  }
  return result;
}

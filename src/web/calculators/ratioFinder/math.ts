import { Gearbox, MMTypeStr, MotionMethod, Stage } from "common/models/Gearbox";
import type { Bore } from "common/models/types/common";
import { expose } from "common/tooling/promise-worker";
import { permutations } from "common/tooling/util";
import { RatioFinderStateV1 } from "web/calculators/ratioFinder";

import max from "lodash/max";
import min from "lodash/min";

import ttbPulleys from "generated/ttb/pulleys.json";
import ttbSprockets from "generated/ttb/sprockets.json";
import wcpGears from "generated/wcp/gears.json";
import wcpPulleys from "generated/wcp/pulleys.json";
import wcpSprockets from "generated/wcp/sprockets.json";

const MOTOR_BORES: Bore[] = [
  "SplineXS",
  "Falcon",
  "RS775",
  "RS550",
  "8mm",
  "BAG",
];

function isValidBore(bore: string): bore is Bore {
  return true; // JSON data is pre-validated
}

function isValidVendor(
  vendor: string,
): vendor is
  | "WCP"
  | "VEXpro"
  | "AndyMark"
  | "REV"
  | "VBeltGuys"
  | "CTRE"
  | "Anderson Power"
  | "NI"
  | "TTB"
  | "Printed" {
  return true; // JSON data is pre-validated
}

// Load and filter all available parts
function getMotionMethods(state: RatioFinderStateV1): MotionMethod[] {
  const methods: MotionMethod[] = [];

  // Add gears
  if (state.enableWCP) {
    for (const g of wcpGears) {
      if (
        (state.enable20DPGears && g.dp === 20) ||
        (state.enable32DPGears && g.dp === 32)
      ) {
        if (g.teeth >= state.minGearTeeth && g.teeth <= state.maxGearTeeth) {
          if (isValidBore(g.bore) && isValidVendor(g.vendor)) {
            const method: MotionMethod = {
              teeth: g.teeth,
              bore: g.bore,
              vendor: g.vendor,
              partNumber: g.sku || "",
              url: g.url,
              type: "Gear",
            };
            Object.assign(method, { dp: g.dp });
            methods.push(method);
          }
        }
      }
    }
  }

  // Add pulleys
  const pulleySources = [
    { data: wcpPulleys, enabled: state.enableWCP },
    { data: ttbPulleys, enabled: state.enableTTB },
  ];

  for (const { data, enabled } of pulleySources) {
    if (!enabled) continue;

    for (const p of data) {
      if (
        ((state.enableHTD && p.profile === "HTD") ||
          (state.enableGT2 && p.profile === "GT2") ||
          (state.enableRT25 && p.profile === "RT25")) &&
        p.teeth >= state.minPulleyTeeth &&
        p.teeth <= state.maxPulleyTeeth
      ) {
        if (isValidBore(p.bore) && isValidVendor(p.vendor)) {
          const method: MotionMethod = {
            teeth: p.teeth,
            bore: p.bore,
            vendor: p.vendor,
            partNumber: p.sku,
            url: p.url,
            type: "Pulley",
          };
          Object.assign(method, {
            beltType: p.profile,
            pitch: { s: p.pitch, u: "mm" },
          });
          methods.push(method);
        }
      }
    }
  }

  // Add printed pulleys (can be any bore and any tooth size)
  if (state.printablePulleys) {
    // Minimum teeth per bore (based on physical bore size constraints)
    const boreMinTeeth: Record<Bore, number> = {
      SplineXS: 9,
      Falcon: 9,
      "8mm": 9,
      RS550: 9,
      RS775: 9,
      BAG: 9,
      '1/4" Round': 9,
      '3/8" Hex': 11,
      '1/2" Hex': 13,
      '1.125" Round': 22,
      SplineXL: 26,
      MAXSpline: 26,
    };

    const allBores: Bore[] = Object.keys(boreMinTeeth) as Bore[];

    const beltTypes = [
      { type: "HTD", enabled: state.enableHTD, pitch: 5, unit: "mm" },
      { type: "GT2", enabled: state.enableGT2, pitch: 2, unit: "mm" },
      { type: "RT25", enabled: state.enableRT25, pitch: 2.5, unit: "in" },
    ];

    for (const bore of allBores) {
      const minTeeth = Math.max(boreMinTeeth[bore], state.minPulleyTeeth);

      for (const belt of beltTypes) {
        if (!belt.enabled) continue;

        for (let teeth = minTeeth; teeth <= state.maxPulleyTeeth; teeth++) {
          const method: MotionMethod = {
            teeth,
            bore,
            vendor: "Printed",
            partNumber: `Printed-${belt.type}-${teeth}T-${bore}`,
            url: "",
            type: "Pulley",
          };
          Object.assign(method, {
            beltType: belt.type,
            pitch: { s: belt.pitch, u: belt.unit },
          });
          methods.push(method);
        }
      }
    }
  }

  // Add sprockets
  const sprocketSources = [
    { data: wcpSprockets, enabled: state.enableWCP },
    { data: ttbSprockets, enabled: state.enableTTB },
  ];

  for (const { data, enabled } of sprocketSources) {
    if (!enabled) continue;

    for (const s of data) {
      if (
        ((state.enable25Chain && s.chainType === "#25") ||
          (state.enable35Chain && s.chainType === "#35")) &&
        s.teeth >= state.minSprocketTeeth &&
        s.teeth <= state.maxSprocketTeeth
      ) {
        if (isValidBore(s.bore) && isValidVendor(s.vendor)) {
          const method: MotionMethod = {
            teeth: s.teeth,
            bore: s.bore,
            vendor: s.vendor,
            partNumber: s.sku,
            url: s.url,
            type: "Sprocket",
          };
          Object.assign(method, { chainType: s.chainType });
          methods.push(method);
        }
      }
    }
  }

  // Filter by bore settings
  return methods.filter((m) => {
    const bore = m.bore;

    // Motor bores
    if (MOTOR_BORES.includes(bore)) {
      if (bore === "Falcon" && !state.enableFalconPinions) return false;
      if (bore === "RS775" && !state.enable775Pinions) return false;
      if (bore === "RS550" && !state.enable550Pinions) return false;
      if (bore === "SplineXS" && !state.enableKrakenPinions) return false;
      if (bore === "8mm" && !state.enableNEOPinions) return false;
      return true;
    }

    // Other bores
    if (bore === '1/2" Hex' && !state.enable12HexBore) return false;
    if (bore === '3/8" Hex' && !state.enable38HexBore) return false;
    if (bore === '1.125" Round' && !state.enableBearingBore) return false;
    if (bore === "SplineXL" && !state.enableSplineXL) return false;

    return true;
  });
}

// Check if two methods are compatible (same type and profile)
function compatible(m1: MotionMethod, m2: MotionMethod): boolean {
  return m1.type === m2.type && MMTypeStr(m1) === MMTypeStr(m2);
}

// Build all possible stages
function buildStages(
  methods: MotionMethod[],
  state: RatioFinderStateV1,
): Stage[] {
  const stages: Stage[] = [];
  const minTeeth =
    min([state.minGearTeeth, state.minPulleyTeeth, state.minSprocketTeeth]) ||
    8;
  const maxTeeth =
    max([state.maxGearTeeth, state.maxPulleyTeeth, state.maxSprocketTeeth]) ||
    84;

  // Group methods by teeth count for fast lookup
  const byTeeth: Record<number, MotionMethod[]> = {};
  for (const m of methods) {
    if (!byTeeth[m.teeth]) byTeeth[m.teeth] = [];
    byTeeth[m.teeth].push(m);
  }

  // Generate all stage combinations
  const drivingSizes = state.forceStartingPinionSize
    ? [state.startingPinionSize]
    : Array.from({ length: maxTeeth - minTeeth + 1 }, (_, i) => i + minTeeth);

  for (const driving of drivingSizes) {
    for (let driven = minTeeth; driven <= maxTeeth; driven++) {
      if (driving === driven) continue;

      const drivingMethods = byTeeth[driving] || [];
      const drivenMethods = byTeeth[driven] || [];
      if (drivingMethods.length === 0 || drivenMethods.length === 0) continue;

      // Find compatible pairs
      const validDriving: MotionMethod[] = [];
      const validDriven: MotionMethod[] = [];

      for (const dm of drivingMethods) {
        for (const dn of drivenMethods) {
          // Driven can't have motor bores
          if (MOTOR_BORES.includes(dn.bore)) continue;

          // Must be compatible
          if (!compatible(dm, dn)) continue;

          if (!validDriving.find((m) => m.partNumber === dm.partNumber)) {
            validDriving.push(dm);
          }
          if (!validDriven.find((m) => m.partNumber === dn.partNumber)) {
            validDriven.push(dn);
          }
        }
      }

      if (validDriving.length > 0 && validDriven.length > 0) {
        stages.push(new Stage(driving, driven, validDriving, validDriven));
      }
    }
  }

  return stages;
}

// Filter stages that can connect (share bore between driven and next driving)
function canConnect(s1: Stage, s2: Stage): boolean {
  for (const m1 of s1.drivenMethods) {
    for (const m2 of s2.drivingMethods) {
      if (m1.bore === m2.bore) return true;
    }
  }
  return false;
}

// Filter stages for compatible bores across multi-stage gearbox
function filterBores(stages: Stage[]): Stage[] {
  if (stages.length <= 1) return stages;

  const filtered = stages.map(
    (s) =>
      new Stage(
        s.driving,
        s.driven,
        [...s.drivingMethods],
        [...s.drivenMethods],
      ),
  );

  for (let i = 0; i < filtered.length - 1; i++) {
    const sharedBores = new Set<Bore>();

    for (const m1 of filtered[i].drivenMethods) {
      for (const m2 of filtered[i + 1].drivingMethods) {
        if (m1.bore === m2.bore) {
          sharedBores.add(m1.bore);
        }
      }
    }

    filtered[i].drivenMethods = filtered[i].drivenMethods.filter((m) =>
      sharedBores.has(m.bore),
    );
    filtered[i + 1].drivingMethods = filtered[i + 1].drivingMethods.filter(
      (m) => sharedBores.has(m.bore),
    );
  }

  // Verify all stages still have methods
  for (const s of filtered) {
    if (s.drivingMethods.length === 0 || s.drivenMethods.length === 0) {
      return [];
    }
  }

  return filtered;
}

export function generateOptions(state: RatioFinderStateV1) {
  const allMethods = getMotionMethods(state);
  const allStages = buildStages(allMethods, state);

  // Split into first stages (must have starting bore) and others
  const firstStages = allStages
    .filter((s) => s.drivingMethods.some((m) => m.bore === state.startingBore))
    .map(
      (s) =>
        new Stage(
          s.driving,
          s.driven,
          s.drivingMethods.filter((m) => m.bore === state.startingBore),
          [...s.drivenMethods],
        ),
    );

  const otherStages = allStages;
  const results: Gearbox[] = [];

  // Single stage
  if (state.minStages <= 1 && state.maxStages >= 1) {
    for (const stage of firstStages) {
      const ratio = stage.getRatio();
      if (
        ratio >= state.targetReduction - state.reductionError &&
        ratio <= state.targetReduction + state.reductionError
      ) {
        results.push(new Gearbox([stage]));
      }
    }
  }

  // Multi-stage
  for (let n = 2; n <= state.maxStages; n++) {
    if (n < state.minStages) continue;

    const iter = permutations(otherStages, n - 1);
    let curr = iter.next();

    while (!curr.done) {
      const remaining = curr.value;

      for (const first of firstStages) {
        const stages = [first, ...remaining];
        const ratio = new Gearbox(stages).getRatio();

        if (
          ratio >= state.targetReduction - state.reductionError &&
          ratio <= state.targetReduction + state.reductionError
        ) {
          // Check connectivity
          let ok = true;
          for (let i = 0; i < stages.length - 1; i++) {
            if (!canConnect(stages[i], stages[i + 1])) {
              ok = false;
              break;
            }
          }

          if (ok) {
            const filtered = filterBores(stages);
            if (filtered.length > 0) {
              results.push(new Gearbox(filtered));
            }
          }
        }
      }

      curr = iter.next();
    }
  }

  return results.map((gb) => gb.toObj());
}

const workerFunctions = { generateOptions };
expose(workerFunctions);
type RatioFinderWorkerFunctions = typeof workerFunctions;
export type { RatioFinderWorkerFunctions };

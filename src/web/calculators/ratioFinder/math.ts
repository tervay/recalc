import { Bore, FRCVendor } from "common/models/ExtraTypes";
import {
  GearData,
  Gearbox2,
  MotionMethod,
  Stage2,
} from "common/models/Gearbox";
import amGears from "common/models/data/cots/andymark/gears.json";
import revGears from "common/models/data/cots/rev/gears.json";
import { expose } from "common/tooling/promise-worker";
import { RatioFinderStateV1 } from "web/calculators/ratioFinder";

function stagesFromMinToMax(min: number, max: number): Stage2[] {
  let stages: Stage2[] = [];
  for (let i = min; i <= max; i++) {
    for (let j = min; j <= max; j++) {
      if (i === j) {
        continue;
      }

      stages.push(new Stage2(i, j, [], []));
    }
  }

  return stages;
}

export function allPossibleSingleGearStages(state: RatioFinderStateV1) {
  return stagesFromMinToMax(state.minGearTeeth, state.maxGearTeeth);
}

function shouldLinkMotionMethod(
  mm: MotionMethod,
  state: RatioFinderStateV1,
  driving: boolean
): boolean {
  let good = true;

  if (driving) {
  } else {
    good = good && mm.bore !== "Falcon";
    good = good && mm.bore !== "NEO";
    good = good && mm.bore !== "775";
    good = good && mm.bore !== "550";
  }

  if (!state.enableVEX) {
    good = good && mm.vendor != "VEXpro";
  }
  if (!state.enableREV) {
    good = good && mm.vendor != "REV";
  }
  if (!state.enableWCP) {
    good = good && mm.vendor != "WCP";
  }
  if (!state.enableAM) {
    good = good && mm.vendor != "AndyMark";
  }

  if (mm.bore === "NEO") {
    good = good && state.enableNEOPinions;
  }
  if (mm.bore === "Falcon") {
    good = good && state.enableFalconPinions;
  }
  if (mm.bore === "550") {
    good = good && state.enable550Pinions;
  }
  if (mm.bore === "775") {
    good = good && state.enable775Pinions;
  }

  return good;
}

export function shouldLinkGear(
  gear: GearData,
  state: RatioFinderStateV1,
  driving: boolean
): boolean {
  let good = true;
  if (gear.dp === 20) {
    good = good && state.enable20DPGears;
  }
  if (gear.dp === 32) {
    good = good && state.enable32DPGears;
  }

  return (
    good &&
    shouldLinkMotionMethod({ ...gear, type: "Gear" }, state, driving) &&
    gear.teeth >= state.minGearTeeth &&
    gear.teeth <= state.maxGearTeeth
  );
}

export function linkOverlappingGearStages(
  stages: Stage2[],
  data: Record<string, GearData[]>,
  state: RatioFinderStateV1
) {
  for (const vendor in data) {
    data[vendor].forEach((gear) => {
      stages.forEach((stage) => {
        if (gear.teeth === stage.driven && shouldLinkGear(gear, state, false)) {
          stage.drivenMethods.push({ ...gear, type: "Gear" });
        }

        if (gear.teeth === stage.driving && shouldLinkGear(gear, state, true)) {
          stage.drivingMethods.push({ ...gear, type: "Gear" });
        }
      });
    });
  }
}

export function generateOptions(state: RatioFinderStateV1) {
  let stages = allPossibleSingleGearStages(state);
  linkOverlappingGearStages(
    stages,
    {
      REV: revGears.map((g) => ({
        dp: g.dp,
        bore: g.bore as Bore,
        teeth: g.teeth,
        vendor: g.vendor as FRCVendor,
        partNumber: g.partNumber,
        url: g.url,
      })),
      AndyMark: amGears.map((g) => ({
        dp: g.dp,
        bore: g.bore as Bore,
        teeth: g.teeth,
        vendor: g.vendor as FRCVendor,
        partNumber: g.partNumber,
        url: g.url,
      })),
    },
    state
  );

  stages = stages.filter(
    (stage) =>
      ![
        stage.drivenMethods.length > 0,
        stage.drivingMethods.length > 0,
      ].includes(false)
  );

  let options: Gearbox2[] = [];
  for (let i = state.minStages; i <= state.maxStages; i++) {
    let gbs: Gearbox2[] = [];

    var iter = permutations(stages, i);
    var curr = iter.next();
    while (!curr.done) {
      const gb = new Gearbox2(curr.value);
      const ratio = gb.getRatio();

      let good = true;
      if (state.firstPartPinion) {
        good = gb.containsPinionInGoodPlace();
      } else {
        good = !gb.containsPinionInGoodPlace();
      }

      if (
        ratio >= state.minReduction &&
        ratio <= state.maxReduction &&
        !gb.containsPinionInBadPlace() &&
        good &&
        gb.overlapsBores()
      ) {
        gbs.push(gb);
      }

      curr = iter.next();
    }

    options = options.concat(gbs);
  }

  return options.map((gb) => gb.toObj());
}

const workerFunctions = { generateOptions };
expose(workerFunctions);
type RatioFinderWorkerFunctions = typeof workerFunctions;
export type { RatioFinderWorkerFunctions };

function* permutations<T>(array: T[], r: number) {
  // Algorythm copied from Python `itertools.permutations`.
  var n = array.length;
  if (r === undefined) {
    r = n;
  }
  if (r > n) {
    return;
  }
  var indices = [];
  for (var i = 0; i < n; i++) {
    indices.push(i);
  }
  var cycles = [];
  for (var i = n; i > n - r; i--) {
    cycles.push(i);
  }
  var results = [];
  var res = [];
  for (var k = 0; k < r; k++) {
    res.push(array[indices[k]]);
  }
  yield res;
  // results.push(res);

  var broken = false;
  while (n > 0) {
    for (var i = r - 1; i >= 0; i--) {
      cycles[i]--;
      if (cycles[i] === 0) {
        indices = indices
          .slice(0, i)
          .concat(indices.slice(i + 1).concat(indices.slice(i, i + 1)));
        cycles[i] = n - i;
        broken = false;
      } else {
        var j = cycles[i];
        var x = indices[i];
        indices[i] = indices[n - j];
        indices[n - j] = x;
        var res = [];
        for (var k = 0; k < r; k++) {
          res.push(array[indices[k]]);
        }
        // results.push(res);
        yield res;
        broken = true;
        break;
      }
    }
    if (broken === false) {
      break;
    }
  }

  return;
}

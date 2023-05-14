import { CustomSet } from "common/models/CustomSet";
import { Gearbox, Stage } from "common/models/Gearbox";
import data from "common/models/data/ratioFinderOptions.json";
import { expose } from "common/tooling/promise-worker";
import max from "lodash/max";
import min from "lodash/min";
import { RatioFinderStateV1 } from "web/calculators/ratioFinder";

type PinionChoice = "NEO" | "Falcon" | "775" | "550" | "none";

export function generateOptions(state: RatioFinderStateV1) {
  let options: Gearbox[] = [];
  const absoluteMin =
    min([
      state.minGearTeeth || 6,
      state.minPulleyTeeth || 10,
      state.minSprocketTeeth || 14,
    ]) || 12;
  const absoluteMax =
    max([
      state.maxGearTeeth || 84,
      state.maxPulleyTeeth || 72,
      state.maxSprocketTeeth || 72,
    ]) || 80;

  const singleStageOptions: CustomSet<Stage> = new CustomSet(
    (a, b) => a.driven === b.driven && a.driving === b.driving,
    [] as Stage[]
  );

  let pinionChoice: PinionChoice;
  if (state.enableNEOPinions) {
  }

  if (state.enable20DPGears) {
    singleStageOptions.bulkAdd(getCots20DPGears("NEO"));
  }

  if (state.enable32DPGears) {
    singleStageOptions.bulkAdd(getCots32DPGears("NEO"));
  }

  for (let i = state.minStages; i <= state.maxStages; i++) {
    let gbs: Gearbox[] = [];

    var iter = permutations(singleStageOptions.set, i);
    var curr = iter.next();
    while (!curr.done) {
      const gb = new Gearbox(curr.value);
      const ratio = gb.getRatio();

      if (
        !gb.containsPinionsInBadPlaces() &&
        ratio >= state.minReduction &&
        ratio <= state.maxReduction
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

function getStagesFromList(
  numbers: number[],
  motionSource: string,
  secondIsValid: ((a: number) => boolean) | undefined = undefined
): Stage[] {
  if (secondIsValid === undefined) {
    secondIsValid = (x) => true;
  }

  let stages: Stage[] = [];

  numbers.forEach((i) => {
    numbers.forEach((j) => {
      if (!secondIsValid!(j) || i == j) {
        return;
      }

      stages.push(new Stage(i, j, motionSource));
    });
  });

  return stages;
}

function getCots20DPGears(pinions: PinionChoice): Stage[] {
  return getStagesFromList(
    data["gears"]["20 DP"],
    "20 DP Gears",
    (n) => n >= 18
  );
}

function getCots32DPGears(pinions: PinionChoice): Stage[] {
  return getStagesFromList(
    data["gears"]["32 DP"],
    "32 DP Gears",
    (n) => n >= 18
  );
}

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

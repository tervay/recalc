import fastCartesian from 'fast-cartesian';

import Gear from '~/lib/models/Gear';
import type { RatioDict } from '~/lib/models/Ratio';
import type { Bore } from '~/lib/types/common';

// Typed filters
export interface FindGearboxesFilters {
  minGearTeeth: number;
  maxGearTeeth: number;
  minPulleyTeeth: number;
  maxPulleyTeeth: number;
  minSprocketTeeth: number;
  maxSprocketTeeth: number;

  enableREV: boolean;
  enableWCP: boolean;
  enableAM: boolean;
  enableTTB: boolean;

  enable20DP: boolean;
  enable32DP: boolean;

  enableGT2: boolean;
  enableHTD: boolean;
  enableRT25: boolean;

  enable25Chain: boolean;
  enable35Chain: boolean;

  enableBore12Hex: boolean;
  enableBore38Hex: boolean;
  enableBore1125: boolean;
  enableBoreMAXSpline: boolean;
  enableBoreSplineXL: boolean;
  enablePrintedPulleys: boolean;
}

export interface GearboxSolution {
  ratio: number;
  stages: {
    from: {
      teeth: number;
      skus: string[];
    };
    to: {
      teeth: number;
      skus: string[];
    };
  }[];
}

export async function findGearboxes(
  targetReduction: RatioDict,
  targetReductionErrorThreshold: number,
  startingBore: Bore,
  filters: FindGearboxesFilters,
): Promise<GearboxSolution[]> {
  const maybeSolutions: GearboxSolution[] = [];

  const toothRangeMin = Math.min(
    filters.minGearTeeth,
    filters.minPulleyTeeth,
    filters.minSprocketTeeth,
  );
  const toothRangeMax = Math.max(
    filters.maxGearTeeth,
    filters.maxPulleyTeeth,
    filters.maxSprocketTeeth,
  );

  const range = (min: number, max: number) => {
    return Array.from({ length: max - min + 1 }, (_, i) => min + i);
  };

  const allValidStages = fastCartesian([
    range(toothRangeMin, toothRangeMax),
    range(toothRangeMin, toothRangeMax),
  ]);

  const allValidStagesWithRatios: number[][] = allValidStages
    .filter((stage) => stage[0] !== stage[1])
    .map((stage) => [stage[0], stage[1], stage[1] / stage[0]]);

  const withinErrorThreshold = (ratio: number, targetRatio: number) => {
    return Math.abs(ratio - targetRatio) <= targetReductionErrorThreshold;
  };
  for (const [tooth1, tooth2, ratio] of allValidStagesWithRatios) {
    if (tooth1 === tooth2) {
      continue;
    }
    if (withinErrorThreshold(ratio, targetReduction.magnitude)) {
      maybeSolutions.push({
        ratio: ratio,
        stages: [
          {
            from: { teeth: tooth1, skus: [] },
            to: { teeth: tooth2, skus: [] },
          },
        ],
      });
    }

    for (const [tooth3, tooth4, ratio2] of allValidStagesWithRatios) {
      const combinedRatio = ratio * ratio2;
      if (withinErrorThreshold(combinedRatio, targetReduction.magnitude)) {
        maybeSolutions.push({
          ratio: combinedRatio,
          stages: [
            {
              from: { teeth: tooth1, skus: [] },
              to: { teeth: tooth2, skus: [] },
            },
            {
              from: { teeth: tooth3, skus: [] },
              to: { teeth: tooth4, skus: [] },
            },
          ],
        });
      }
    }
  }

  maybeSolutions.sort(
    (a, b) =>
      Math.abs(a.ratio - targetReduction.magnitude) -
        Math.abs(b.ratio - targetReduction.magnitude) ||
      a.stages.length - b.stages.length,
  );

  const allGears = await Promise.all([
    import('~/genData/WCP/gears.json').then((m) => m.default),
    import('~/genData/REV/gears.json').then((m) => m.default),
  ])
    .then(([wcpGears, revGears]) => [...wcpGears, ...revGears])
    .then((gears) =>
      gears
        .map((g) =>
          Gear.fromJson({
            ...g,
            bore: g.bore as Bore,
          }),
        )
        .filter(
          (g) =>
            g.teeth >= filters.minGearTeeth &&
            g.teeth <= filters.maxGearTeeth &&
            ((filters.enableREV && g.vendor === 'REV') ||
              (filters.enableWCP && g.vendor === 'WCP') ||
              (filters.enableAM && g.vendor === 'AM') ||
              (filters.enableTTB && g.vendor === 'TTB')),
        ),
    );

  const motorBores: Bore[] = [
    '8mm',
    'BAG',
    'Falcon',
    'RS550',
    'RS775',
    'SplineXS',
  ];
  const solutions: GearboxSolution[] = [];
  for (const dp of [20, 32]) {
    if (!filters.enable20DP && dp === 20) {
      continue;
    }
    if (!filters.enable32DP && dp === 32) {
      continue;
    }

    for (const maybeSolution of maybeSolutions) {
      let isValid = true;

      for (const [index, stage] of maybeSolution.stages.entries()) {
        const drivingGears = allGears.filter(
          (g) =>
            g.teeth === stage.from.teeth &&
            g.dp === dp &&
            (index === 0 ? g.bore === startingBore : true) &&
            (index !== 0 ? !motorBores.includes(g.bore) : true),
        );

        const canMakeDrivingThing = drivingGears.length > 0;

        if (!canMakeDrivingThing) {
          isValid = false;
          break;
        }

        stage.from.skus.push(...drivingGears.map((g) => g.sku ?? 'Unknown'));

        const drivenGears = allGears.filter(
          (g) =>
            g.teeth === stage.to.teeth &&
            g.dp === dp &&
            !motorBores.includes(g.bore),
        );
        const canMakeDrivenThing = drivenGears.length > 0;
        if (!canMakeDrivenThing) {
          isValid = false;
          break;
        }

        stage.to.skus.push(...drivenGears.map((g) => g.sku ?? 'Unknown'));
      }
      if (isValid) {
        solutions.push(maybeSolution);
      }
    }
  }

  return Promise.resolve(solutions.slice(0, 50));
}

import fastCartesian from 'fast-cartesian';

import Gear from '~/lib/models/Gear';
import Measurement from '~/lib/models/Measurement';
import Pulley from '~/lib/models/Pulley';
import type { RatioDict } from '~/lib/models/Ratio';
import Ratio from '~/lib/models/Ratio';
import Sprocket from '~/lib/models/Sprocket';
import type { Bore } from '~/lib/types/common';
import type { JSONPlanetaryInstance } from '~/lib/types/planetary';
import type { ChainType } from '~/lib/types/sprockets';

const MOTOR_BORES: Bore[] = [
  '8mm',
  'BAG',
  'Falcon',
  'RS550',
  'RS775',
  'SplineXS',
  'Vortex',
];

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
  enablePlanetaries: boolean;
}

interface SkuInfo {
  sku: string;
  family: 'Gear' | 'Pulley' | 'Sprocket' | 'Planetary';
  pitch: string;
  bore: Bore;
  vendor: string;
  url: string;
}

export interface GearboxSolution {
  ratio: number;
  stages: {
    from: {
      teeth: number;
      skus: SkuInfo[];
    };
    to: {
      teeth: number;
      skus: SkuInfo[];
    };
  }[];
}

function stageFrom20DPGears(
  stage: [number, number],
  stageIndex: number,
  startingBore: Bore,
  gears: Gear[],
): [Gear[], Gear[]] | null {
  const [teeth1, teeth2] = stage;

  const gear1 = gears.filter(
    (g) =>
      g.teeth === teeth1 &&
      g.dp === 20 &&
      (stageIndex === 0
        ? g.bore === startingBore
        : !MOTOR_BORES.includes(g.bore)),
  );
  const gear2 = gears.filter(
    (g) => g.teeth === teeth2 && g.dp === 20 && !MOTOR_BORES.includes(g.bore),
  );

  if (gear1.length === 0 || gear2.length === 0) {
    return null;
  }

  return [gear1, gear2];
}

function stageFrom32DPGears(
  stage: [number, number],
  stageIndex: number,
  startingBore: Bore,
  gears: Gear[],
): [Gear[], Gear[]] | null {
  const [teeth1, teeth2] = stage;

  const gear1 = gears.filter(
    (g) =>
      g.teeth === teeth1 &&
      g.dp === 32 &&
      (stageIndex === 0
        ? g.bore === startingBore
        : !MOTOR_BORES.includes(g.bore)),
  );
  const gear2 = gears.filter(
    (g) => g.teeth === teeth2 && g.dp === 32 && !MOTOR_BORES.includes(g.bore),
  );

  if (gear1.length === 0 || gear2.length === 0) {
    return null;
  }

  return [gear1, gear2];
}

function stageFromGT2Pulleys(
  stage: [number, number],
  stageIndex: number,
  startingBore: Bore,
  pulleys: Pulley[],
): [Pulley[], Pulley[]] | null {
  const [teeth1, teeth2] = stage;

  const pulley1 = pulleys.filter(
    (p) =>
      p.teeth === teeth1 &&
      p.pitch.eq(new Measurement(3, 'mm')) &&
      (stageIndex === 0
        ? p.bore === startingBore
        : !MOTOR_BORES.includes(p.bore)),
  );
  const pulley2 = pulleys.filter(
    (p) =>
      p.teeth === teeth2 &&
      p.pitch.eq(new Measurement(3, 'mm')) &&
      !MOTOR_BORES.includes(p.bore),
  );

  if (pulley1.length === 0 || pulley2.length === 0) {
    return null;
  }

  return [pulley1, pulley2];
}

function stageFromHTDPulleys(
  stage: [number, number],
  stageIndex: number,
  startingBore: Bore,
  pulleys: Pulley[],
): [Pulley[], Pulley[]] | null {
  const [teeth1, teeth2] = stage;

  const pulley1 = pulleys.filter(
    (p) =>
      p.teeth === teeth1 &&
      p.pitch.eq(new Measurement(5, 'mm')) &&
      (stageIndex === 0
        ? p.bore === startingBore
        : !MOTOR_BORES.includes(p.bore)),
  );
  const pulley2 = pulleys.filter(
    (p) =>
      p.teeth === teeth2 &&
      p.pitch.eq(new Measurement(5, 'mm')) &&
      !MOTOR_BORES.includes(p.bore),
  );

  if (pulley1.length === 0 || pulley2.length === 0) {
    return null;
  }

  return [pulley1, pulley2];
}

function stageFrom25ChainSprockets(
  stage: [number, number],
  stageIndex: number,
  startingBore: Bore,
  sprockets: Sprocket[],
): [Sprocket[], Sprocket[]] | null {
  const [teeth1, teeth2] = stage;
  const sprocket1 = sprockets.filter(
    (s) =>
      s.teeth === teeth1 &&
      s.chainType === '#25' &&
      (stageIndex === 0
        ? s.bore === startingBore
        : !MOTOR_BORES.includes(s.bore)),
  );
  const sprocket2 = sprockets.filter(
    (s) =>
      s.teeth === teeth2 &&
      s.chainType === '#25' &&
      !MOTOR_BORES.includes(s.bore),
  );

  if (sprocket1.length === 0 || sprocket2.length === 0) {
    return null;
  }

  return [sprocket1, sprocket2];
}

function stageFrom35ChainSprockets(
  stage: [number, number],
  stageIndex: number,
  startingBore: Bore,
  sprockets: Sprocket[],
): [Sprocket[], Sprocket[]] | null {
  const [teeth1, teeth2] = stage;
  const sprocket1 = sprockets.filter(
    (s) =>
      s.teeth === teeth1 &&
      s.chainType === '#35' &&
      (stageIndex === 0
        ? s.bore === startingBore
        : !MOTOR_BORES.includes(s.bore)),
  );
  const sprocket2 = sprockets.filter(
    (s) =>
      s.teeth === teeth2 &&
      s.chainType === '#35' &&
      !MOTOR_BORES.includes(s.bore),
  );

  if (sprocket1.length === 0 || sprocket2.length === 0) {
    return null;
  }

  return [sprocket1, sprocket2];
}

function stageFromPlanetaries(
  stage: [number, number],
  stageIndex: number,
  startingBore: Bore,
  planetaries: JSONPlanetaryInstance[],
): JSONPlanetaryInstance[] | null {
  const [teeth1, teeth2] = stage;
  if (teeth1 !== 1) {
    return null;
  }

  const planetary = planetaries.filter(
    (p) =>
      (stageIndex === 0
        ? p.inputBore === startingBore
        : !MOTOR_BORES.includes(p.inputBore)) && p.ratio === teeth2 / teeth1,
  );

  if (planetary.length === 0) {
    return null;
  }

  return planetary;
}

export async function findGearboxes(
  targetReduction_: RatioDict,
  targetReductionErrorThreshold: number,
  startingBore: Bore,
  filters: FindGearboxesFilters,
): Promise<{
  count: number;
  solutions: GearboxSolution[];
}> {
  const targetReduction = Ratio.fromDict(targetReduction_);
  const maybeSolutions: GearboxSolution[] = [];
  const skuInfoMap = new Map<string, SkuInfo>();

  const allPlanetaries: JSONPlanetaryInstance[] = await Promise.all([
    import('~/genData/REV/planetaries.json').then((m) => m.default),
  ]).then(([revPlanetaries]) =>
    revPlanetaries.map((p) => ({
      ...p,
      inputBore: p.inputBore as Bore,
      outputBore: p.outputBore as Bore,
    })),
  );

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
  const rangeWith = (range: number[], extras: number[]) => {
    return [...new Set([...range, ...extras])];
  };

  const allValidStages = fastCartesian([
    rangeWith(range(toothRangeMin, toothRangeMax), [1]),
    rangeWith(
      range(toothRangeMin, toothRangeMax),
      allPlanetaries.map((p) => p.ratio),
    ),
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
    if (withinErrorThreshold(ratio, targetReduction.asNumber())) {
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
      if (withinErrorThreshold(combinedRatio, targetReduction.asNumber())) {
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

  allPlanetaries.forEach((p) => {
    skuInfoMap.set(`${p.sku}-${p.inputBore}-${p.outputBore}-${p.ratio}`, {
      sku: p.sku,
      family: 'Planetary',
      pitch: p.slices.join(':'),
      bore: p.inputBore,
      vendor: p.vendor,
      url: p.url,
    });
  });

  const vendorMap: Record<string, boolean> = {
    REV: filters.enableREV,
    WCP: filters.enableWCP,
    AndyMark: filters.enableAM,
    Thrifty: filters.enableTTB,
  };
  const boreFilters: Record<string, boolean> = {
    '1/2" Hex': filters.enableBore12Hex,
    '3/8" Hex': filters.enableBore38Hex,
    '1.125" Round': filters.enableBore1125,
    MAXSpline: filters.enableBoreMAXSpline,
    SplineXL: filters.enableBoreSplineXL,
  };

  const vendorIsEnabled = (vendor: string) => {
    return vendor in vendorMap ? vendorMap[vendor] : true;
  };
  const boreIsEnabled = (bore: Bore) => {
    return bore in boreFilters ? boreFilters[bore] : true;
  };

  const allGears = await Promise.all([
    import('~/genData/WCP/gears.json').then((m) => m.default),
    import('~/genData/REV/gears.json').then((m) => m.default),
  ])
    .then(([wcpGears, revGears]) => [...wcpGears, ...revGears])
    .then((gears) => {
      gears.forEach((g) => {
        skuInfoMap.set(g.sku ?? '', {
          sku: g.sku ?? 'Unknown',
          family: 'Gear',
          pitch: g.dp.toString(),
          bore: g.bore as Bore,
          vendor: g.vendor,
          url: g.url,
        });
      });
      return gears;
    })
    .then((gears) =>
      gears
        .map((g) =>
          Gear.fromJson({
            ...g,
            bore: g.bore as Bore,
          }),
        )
        .filter((g) => {
          if (
            g.teeth < filters.minGearTeeth ||
            g.teeth > filters.maxGearTeeth
          ) {
            return false;
          }

          if (!vendorIsEnabled(g.vendor)) {
            return false;
          }

          if (!boreIsEnabled(g.bore)) {
            return false;
          }

          if (!filters.enable20DP && g.dp === 20) {
            return false;
          }
          if (!filters.enable32DP && g.dp === 32) {
            return false;
          }

          return true;
        }),
    );

  const allPulleys = await Promise.all([
    import('~/genData/WCP/pulleys.json').then((m) => m.default),
    import('~/genData/REV/pulleys.json').then((m) => m.default),
    import('~/genData/AndyMark/pulleys.json').then((m) => m.default),
    import('~/genData/Thrifty/pulleys.json').then((m) => m.default),
  ])
    .then(([wcpPulleys, revPulleys, andyMarkPulleys, thriftyPulleys]) => [
      ...wcpPulleys,
      ...revPulleys,
      ...andyMarkPulleys,
      ...thriftyPulleys,
    ])
    .then((pulleys) => {
      pulleys.forEach((p) => {
        skuInfoMap.set(p.sku ?? '', {
          sku: p.sku ?? 'Unknown',
          family: 'Pulley',
          pitch: p.pitch.toString(),
          bore: p.bore as Bore,
          vendor: p.vendor,
          url: p.url,
        });
      });
      return pulleys;
    })
    .then((pulleys) =>
      pulleys
        .map((p) => Pulley.fromJson({ ...p, bore: p.bore as Bore }))
        .filter((p) => {
          if (
            p.teeth < filters.minPulleyTeeth ||
            p.teeth > filters.maxPulleyTeeth
          ) {
            return false;
          }

          if (!vendorIsEnabled(p.vendor)) {
            return false;
          }

          if (!boreIsEnabled(p.bore)) {
            return false;
          }

          if (!filters.enableGT2 && p.pitch.eq(new Measurement(3, 'mm'))) {
            return false;
          }
          if (!filters.enableHTD && p.pitch.eq(new Measurement(5, 'mm'))) {
            return false;
          }
          if (!filters.enableRT25 && p.pitch.eq(new Measurement(0.25, 'in'))) {
            return false;
          }
          return true;
        }),
    );

  const allSprockets = await Promise.all([
    import('~/genData/WCP/sprockets.json').then((m) => m.default),
    import('~/genData/REV/sprockets.json').then((m) => m.default),
    import('~/genData/Thrifty/sprockets.json').then((m) => m.default),
  ])
    .then(([wcpSprockets, revSprockets, thriftySprockets]) => [
      ...wcpSprockets,
      ...revSprockets,
      ...thriftySprockets,
    ])
    .then((sprockets) => {
      sprockets.forEach((s) => {
        skuInfoMap.set(s.sku ?? '', {
          sku: s.sku ?? 'Unknown',
          family: 'Sprocket',
          pitch: s.chainType,
          bore: s.bore as Bore,
          vendor: s.vendor,
          url: s.url,
        });
      });
      return sprockets;
    })
    .then((sprockets) =>
      sprockets
        .map((s) =>
          Sprocket.fromJson({
            ...s,
            bore: s.bore as Bore,
            chainType: s.chainType as ChainType,
          }),
        )
        .filter((s) => {
          if (
            s.teeth < filters.minSprocketTeeth ||
            s.teeth > filters.maxSprocketTeeth
          ) {
            return false;
          }
          if (!vendorIsEnabled(s.vendor)) {
            return false;
          }
          if (!boreIsEnabled(s.bore)) {
            return false;
          }
          if (!filters.enable25Chain && s.chainType === '#25') {
            return false;
          }
          if (!filters.enable35Chain && s.chainType === '#35') {
            return false;
          }
          return true;
        }),
    );
  const solutions: GearboxSolution[] = [];

  for (const maybeSolution of maybeSolutions) {
    for (const [index, stage] of maybeSolution.stages.entries()) {
      const maybe20DPGears = stageFrom20DPGears(
        [stage.from.teeth, stage.to.teeth],
        index,
        startingBore,
        allGears,
      );
      if (maybe20DPGears) {
        const [driving, driven] = maybe20DPGears;

        stage.from.skus.push(...driving.map((g) => skuInfoMap.get(g.sku!)!));
        stage.to.skus.push(...driven.map((g) => skuInfoMap.get(g.sku!)!));
      }

      const maybe32DPGears = stageFrom32DPGears(
        [stage.from.teeth, stage.to.teeth],
        index,
        startingBore,
        allGears,
      );
      if (maybe32DPGears) {
        const [driving, driven] = maybe32DPGears;

        stage.from.skus.push(...driving.map((g) => skuInfoMap.get(g.sku!)!));
        stage.to.skus.push(...driven.map((g) => skuInfoMap.get(g.sku!)!));
      }

      const maybeGT2Pulleys = stageFromGT2Pulleys(
        [stage.from.teeth, stage.to.teeth],
        index,
        startingBore,
        allPulleys,
      );
      if (maybeGT2Pulleys) {
        const [driving, driven] = maybeGT2Pulleys;

        stage.from.skus.push(...driving.map((p) => skuInfoMap.get(p.sku!)!));
        stage.to.skus.push(...driven.map((p) => skuInfoMap.get(p.sku!)!));
      }

      const maybeHTDPulleys = stageFromHTDPulleys(
        [stage.from.teeth, stage.to.teeth],
        index,
        startingBore,
        allPulleys,
      );
      if (maybeHTDPulleys) {
        const [driving, driven] = maybeHTDPulleys;

        stage.from.skus.push(...driving.map((p) => skuInfoMap.get(p.sku!)!));
        stage.to.skus.push(...driven.map((p) => skuInfoMap.get(p.sku!)!));
      }

      const maybe25ChainSprockets = stageFrom25ChainSprockets(
        [stage.from.teeth, stage.to.teeth],
        index,
        startingBore,
        allSprockets,
      );
      if (maybe25ChainSprockets) {
        const [driving, driven] = maybe25ChainSprockets;

        stage.from.skus.push(...driving.map((s) => skuInfoMap.get(s.sku!)!));
        stage.to.skus.push(...driven.map((s) => skuInfoMap.get(s.sku!)!));
      }

      const maybe35ChainSprockets = stageFrom35ChainSprockets(
        [stage.from.teeth, stage.to.teeth],
        index,
        startingBore,
        allSprockets,
      );
      if (maybe35ChainSprockets) {
        const [driving, driven] = maybe35ChainSprockets;

        stage.from.skus.push(...driving.map((s) => skuInfoMap.get(s.sku!)!));
        stage.to.skus.push(...driven.map((s) => skuInfoMap.get(s.sku!)!));
      }

      const maybePlanetaries = stageFromPlanetaries(
        [stage.from.teeth, stage.to.teeth],
        index,
        startingBore,
        allPlanetaries,
      );
      if (maybePlanetaries) {
        stage.from.skus.push(
          ...maybePlanetaries.map(
            (p) =>
              skuInfoMap.get(
                `${p.sku}-${p.inputBore}-${p.outputBore}-${p.ratio}`,
              )!,
          ),
        );
        stage.to.skus.push(
          ...maybePlanetaries.map(
            (p) =>
              skuInfoMap.get(
                `${p.sku}-${p.inputBore}-${p.outputBore}-${p.ratio}`,
              )!,
          ),
        );
      }

      const sorter = (a: SkuInfo, b: SkuInfo) =>
        a.family.localeCompare(b.family) ||
        a.vendor.localeCompare(b.vendor) ||
        a.pitch.localeCompare(b.pitch) ||
        a.bore.localeCompare(b.bore) ||
        a.sku.localeCompare(b.sku);
      stage.from.skus.sort(sorter);
      stage.to.skus.sort(sorter);
    }

    if (
      maybeSolution.stages.every(
        (stage) => stage.from.skus.length > 0 && stage.to.skus.length > 0,
      )
    ) {
      solutions.push(maybeSolution);
    }
  }

  solutions.sort(
    (a, b) =>
      Math.abs(a.ratio - targetReduction.asNumber()) -
        Math.abs(b.ratio - targetReduction.asNumber()) ||
      a.stages.length - b.stages.length ||
      b.stages.reduce(
        (acc, stage) => acc + stage.from.skus.length + stage.to.skus.length,
        0,
      ) -
        a.stages.reduce(
          (acc, stage) => acc + stage.from.skus.length + stage.to.skus.length,
          0,
        ),
  );

  return Promise.resolve({
    count: solutions.length,
    solutions: solutions.slice(0, 50),
  });
}

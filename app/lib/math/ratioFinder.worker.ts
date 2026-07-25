import fastCartesian from 'fast-cartesian';

import Gear from '~/lib/models/Gear';
import Measurement from '~/lib/models/Measurement';
import Pulley from '~/lib/models/Pulley';
import type { RatioDict } from '~/lib/models/Ratio';
import Ratio from '~/lib/models/Ratio';
import Sprocket from '~/lib/models/Sprocket';
import {
  type Bore,
  type StageFamily,
  type Vendor,
  zBoreSchema,
} from '~/lib/types/common';
import type { JSONGear } from '~/lib/types/gears';
import type { JSONPlanetaryInstance } from '~/lib/types/planetary';
import type { JSONPulley } from '~/lib/types/pulleys';
import type { ChainType, JSONSprocket } from '~/lib/types/sprockets';
import { range } from '~/lib/utils';

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
  enableLastAnvil: boolean;
  enableSDS: boolean;

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
  enableBore5mmHex: boolean;
  enableBore14Round: boolean;
  enableCustomGears: boolean;
  enableCustomPulleys: boolean;
  enableCustomSprockets: boolean;
  enablePlanetaries: boolean;

  /**
   * Per-stage transmission-family constraints, applied positionally. Index 0
   * restricts the first stage, index 1 the second; the stage count itself is
   * still discovered automatically. Each inner array lists the families allowed
   * for that stage, and an absent or empty entry leaves that stage open to any
   * family. When omitted entirely the finder behaves exactly as before.
   */
  stageConstraints?: StageFamily[][];
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

function generateCustomGears(
  minTeeth: number,
  maxTeeth: number,
  bores: Bore[],
): JSONGear[] {
  return fastCartesian([range(minTeeth, maxTeeth), [20, 32], bores]).map(
    ([teeth, dp, bore]) => ({
      teeth: teeth,
      dp: dp,
      bore: bore,
      url: '#',
      sku: `CSTM-${teeth}-${dp}-${bore}`,
      vendor: 'Custom',
    }),
  );
}

function generateCustomPulleys(
  minTeeth: number,
  maxTeeth: number,
  bores: Bore[],
): JSONPulley[] {
  return fastCartesian([
    range(minTeeth, maxTeeth),
    ['GT2', 'HTD', 'RT25'],
    bores,
  ]).map(([teeth, profile, bore]) => ({
    teeth: teeth,
    profile: profile,
    bore: bore,
    url: '#',
    sku: `CSTM-${teeth}-${profile}-${bore}`,
    vendor: 'Custom',
    width: 15,
    pitch:
      profile === 'GT2'
        ? 3
        : profile === 'HTD'
          ? 5
          : new Measurement(0.25, 'in').to('mm').scalar,
  }));
}

function generateCustomSprockets(
  minTeeth: number,
  maxTeeth: number,
  bores: Bore[],
): JSONSprocket[] {
  return fastCartesian([
    range(minTeeth, maxTeeth),
    ['#25', '#35'] satisfies ChainType[],
    bores,
  ]).map(([teeth, chainType, bore]) => ({
    teeth: teeth,
    chainType: chainType,
    bore: bore,
    url: '#',
    sku: `CSTM-${teeth}-${chainType}-${bore}`,
    vendor: 'Custom',
  }));
}

export async function findGearboxes(
  targetReduction_: RatioDict,
  targetReductionErrorThreshold: number,
  startingBore: Bore,
  filters: FindGearboxesFilters,
  // Ceiling on stages to search. Three-stage gearboxes are only ever returned
  // as an automatic fallback when no one- or two-stage option exists; pass 2 to
  // disable that fallback entirely.
  maxStages = 3,
): Promise<{
  count: number;
  solutions: GearboxSolution[];
  autoExpandedToThreeStage: boolean;
}> {
  const targetReduction = Ratio.fromDict(targetReduction_);
  const skuInfoMap = new Map<string, SkuInfo>();

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
    '5mm Hex': filters.enableBore5mmHex,
    '1/4" Round': filters.enableBore14Round,
  };

  const vendorIsEnabled = (vendor: string) => {
    return vendor in vendorMap ? vendorMap[vendor] : true;
  };
  const boreIsEnabled = (bore: Bore) => {
    return bore in boreFilters ? boreFilters[bore] : true;
  };

  const allPlanetaries: JSONPlanetaryInstance[] = await Promise.all([
    import('~/genData/REV/planetaries.json').then((m) => m.default),
    import('~/genData/Thrifty/planetaries.json').then((m) => m.default),
  ]).then((planetariesByVendor) =>
    planetariesByVendor
      .flat()
      .map((p) => ({
        ...p,
        inputBore: p.inputBore as Bore,
        outputBore: p.outputBore as Bore,
        vendor: p.vendor as Vendor,
      }))
      .filter(
        (p) =>
          filters.enablePlanetaries &&
          vendorIsEnabled(p.vendor) &&
          boreIsEnabled(p.inputBore) &&
          boreIsEnabled(p.outputBore),
      ),
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

  // Per-stage transmission-family filter applied positionally: stage index 0 is
  // governed by stageConstraints[0], index 1 by stageConstraints[1]. The stage
  // count is still discovered automatically (1- and 2-stage solutions are both
  // enumerated), so a 1-stage solution only needs to satisfy the first stage's
  // filter. An absent or empty entry leaves that stage open to any family, so
  // the default (no constraints) preserves the original behavior exactly.
  const stageConstraints = filters.stageConstraints ?? [];
  const stageAllowsFamily = (stageIndex: number, family: StageFamily) => {
    const allowed = stageConstraints[stageIndex];
    return (
      allowed === undefined || allowed.length === 0 || allowed.includes(family)
    );
  };

  allPlanetaries.forEach((p) => {
    skuInfoMap.set(`${p.sku}-${p.inputBore}-${p.slices.join(':')}`, {
      sku: p.sku,
      family: 'Planetary',
      pitch: p.slices.join(':'),
      bore: p.inputBore,
      vendor: p.vendor,
      url: p.url,
    });
    skuInfoMap.set(`${p.sku}-${p.outputBore}-${p.slices.join(':')}`, {
      sku: p.sku,
      family: 'Planetary',
      pitch: p.slices.join(':'),
      bore: p.outputBore,
      vendor: p.vendor,
      url: p.url,
    });
  });

  const allGears = await Promise.all([
    import('~/genData/WCP/gears.json').then((m) => m.default),
    import('~/genData/REV/gears.json').then((m) => m.default),
    import('~/genData/SDS/gears.json').then((m) => m.default),
    import('~/genData/AndyMark/gears.json').then((m) => m.default),
    Promise.resolve(
      filters.enableCustomGears
        ? generateCustomGears(
            filters.minGearTeeth,
            filters.maxGearTeeth,
            zBoreSchema.options.filter((bore) => boreIsEnabled(bore)),
          )
        : [],
    ),
  ])
    .then(([wcpGears, revGears, sdsGears, andymarkGears, customGears]) => [
      ...wcpGears,
      ...revGears,
      ...sdsGears,
      ...andymarkGears,
      ...customGears,
    ])
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
            vendor: g.vendor as Vendor,
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
    import('~/genData/LastAnvil/pulleys.json').then((m) => m.default),
    Promise.resolve(
      filters.enableCustomPulleys
        ? generateCustomPulleys(
            filters.minPulleyTeeth,
            filters.maxPulleyTeeth,
            zBoreSchema.options.filter((bore) => boreIsEnabled(bore)),
          )
        : [],
    ),
  ])
    .then(
      ([
        wcpPulleys,
        revPulleys,
        andyMarkPulleys,
        thriftyPulleys,
        lastAnvilPulleys,
        customPulleys,
      ]) => [
        ...wcpPulleys,
        ...revPulleys,
        ...andyMarkPulleys,
        ...thriftyPulleys,
        ...lastAnvilPulleys,
        ...customPulleys,
      ],
    )
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
        .map((p) =>
          Pulley.fromJson({
            ...p,
            bore: p.bore as Bore,
            vendor: p.vendor as Vendor,
          }),
        )
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
    import('~/genData/AndyMark/sprockets.json').then((m) => m.default),
    import('~/genData/LastAnvil/sprockets.json').then((m) => m.default),
    Promise.resolve(
      filters.enableCustomSprockets
        ? generateCustomSprockets(
            filters.minSprocketTeeth,
            filters.maxSprocketTeeth,
            zBoreSchema.options.filter((bore) => boreIsEnabled(bore)),
          )
        : [],
    ),
  ])
    .then(
      ([
        wcpSprockets,
        revSprockets,
        thriftySprockets,
        andyMarkSprockets,
        lastAnvilSprockets,
        customSprockets,
      ]) => [
        ...wcpSprockets,
        ...revSprockets,
        ...thriftySprockets,
        ...andyMarkSprockets,
        ...lastAnvilSprockets,
        ...customSprockets,
      ],
    )
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
            vendor: s.vendor as Vendor,
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

  // Teeth-indexed SKU buckets per transmission variant, split by whether the
  // part can sit on the starting (motor) shaft or any non-motor shaft. Matching
  // a stage then becomes O(1) lookups instead of scanning the full parts list
  // for every candidate, which dominated runtime on large searches.
  const skuSorter = (a: SkuInfo, b: SkuInfo) =>
    a.family.localeCompare(b.family) ||
    a.vendor.localeCompare(b.vendor) ||
    a.pitch.localeCompare(b.pitch) ||
    a.bore.localeCompare(b.bore) ||
    a.sku.localeCompare(b.sku);

  interface VariantBucket {
    first: Map<number, SkuInfo[]>;
    nonMotor: Map<number, SkuInfo[]>;
  }
  const newBucket = (): VariantBucket => ({
    first: new Map(),
    nonMotor: new Map(),
  });
  const pushInto = (
    map: Map<number, SkuInfo[]>,
    teeth: number,
    sku: SkuInfo,
  ) => {
    const arr = map.get(teeth);
    if (arr) arr.push(sku);
    else map.set(teeth, [sku]);
  };
  const addToBucket = (
    bucket: VariantBucket,
    teeth: number,
    bore: Bore,
    sku: SkuInfo,
  ) => {
    if (bore === startingBore) pushInto(bucket.first, teeth, sku);
    if (!MOTOR_BORES.includes(bore)) pushInto(bucket.nonMotor, teeth, sku);
  };

  const gear20 = newBucket();
  const gear32 = newBucket();
  const gt2 = newBucket();
  const htd = newBucket();
  const chain25 = newBucket();
  const chain35 = newBucket();
  for (const g of allGears) {
    const sku = skuInfoMap.get(g.sku ?? '');
    if (!sku) continue;
    // Only 20DP and 32DP gears mesh in the families the finder supports; any
    // other diametral pitch is ignored (matching the original matchers).
    if (g.dp === 20) addToBucket(gear20, g.teeth, g.bore, sku);
    else if (g.dp === 32) addToBucket(gear32, g.teeth, g.bore, sku);
  }
  const mm3 = new Measurement(3, 'mm');
  const mm5 = new Measurement(5, 'mm');
  for (const p of allPulleys) {
    const sku = skuInfoMap.get(p.sku ?? '');
    if (!sku) continue;
    if (p.pitch.eq(mm3)) addToBucket(gt2, p.teeth, p.bore, sku);
    else if (p.pitch.eq(mm5)) addToBucket(htd, p.teeth, p.bore, sku);
  }
  for (const s of allSprockets) {
    const sku = skuInfoMap.get(s.sku ?? '');
    if (!sku) continue;
    if (s.chainType === '#25') addToBucket(chain25, s.teeth, s.bore, sku);
    else if (s.chainType === '#35') addToBucket(chain35, s.teeth, s.bore, sku);
  }

  const planetaryFirst = new Map<number, { from: SkuInfo; to: SkuInfo }[]>();
  const planetaryInner = new Map<number, { from: SkuInfo; to: SkuInfo }[]>();
  const pushPlanet = (
    map: Map<number, { from: SkuInfo; to: SkuInfo }[]>,
    ratio: number,
    pair: { from: SkuInfo; to: SkuInfo },
  ) => {
    const arr = map.get(ratio);
    if (arr) arr.push(pair);
    else map.set(ratio, [pair]);
  };
  for (const p of allPlanetaries) {
    const slices = p.slices.join(':');
    const from = skuInfoMap.get(`${p.sku}-${p.inputBore}-${slices}`);
    const to = skuInfoMap.get(`${p.sku}-${p.outputBore}-${slices}`);
    if (!from || !to) continue;
    // A first-stage planetary bolts directly onto the motor, so its input must
    // match the motor's own bore. Its output is allowed to be a motor bore too
    // (e.g. Thrifty's cycloidal gearbox re-cuts a SplineXS on its output stage
    // so downstream SplineXS-bore parts can still mount to it).
    if (p.inputBore === startingBore)
      pushPlanet(planetaryFirst, p.ratio, { from, to });
    // An inner-stage planetary's input already came from a prior reduction, so
    // neither its input nor output should still look like a raw motor bore.
    if (
      !MOTOR_BORES.includes(p.inputBore) &&
      !MOTOR_BORES.includes(p.outputBore)
    )
      pushPlanet(planetaryInner, p.ratio, { from, to });
  }

  const toothedVariants: [VariantBucket, StageFamily][] = [
    [gear20, 'Gear'],
    [gear32, 'Gear'],
    [gt2, 'Belt'],
    [htd, 'Belt'],
    [chain25, 'Chain'],
    [chain35, 'Chain'],
  ];

  // Build a fully-matched stage for a [from, to] tooth pair at a given stage
  // position (0 == on the motor shaft), or null when no real parts realize it.
  const matchStageAt = (
    fromTeeth: number,
    toTeeth: number,
    position: number,
  ): GearboxSolution['stages'][number] | null => {
    const isFirst = position === 0;
    const fromSkus: SkuInfo[] = [];
    const toSkus: SkuInfo[] = [];
    for (const [bucket, family] of toothedVariants) {
      if (!stageAllowsFamily(position, family)) continue;
      const driving = (isFirst ? bucket.first : bucket.nonMotor).get(fromTeeth);
      const driven = bucket.nonMotor.get(toTeeth);
      if (driving && driven) {
        fromSkus.push(...driving);
        toSkus.push(...driven);
      }
    }
    if (stageAllowsFamily(position, 'Planetary') && fromTeeth === 1) {
      const pairs = (isFirst ? planetaryFirst : planetaryInner).get(toTeeth);
      if (pairs)
        for (const pair of pairs) {
          fromSkus.push(pair.from);
          toSkus.push(pair.to);
        }
    }
    if (fromSkus.length === 0 || toSkus.length === 0) return null;
    fromSkus.sort(skuSorter);
    toSkus.sort(skuSorter);
    return {
      from: { teeth: fromTeeth, skus: fromSkus },
      to: { teeth: toTeeth, skus: toSkus },
    };
  };

  // Build each stage position's buildable candidates once (each already carries
  // its matched SKUs), then enumerate combinations over only those candidates.
  // Iterating buildable stages instead of the full tooth grid is what keeps
  // every stage count fast — most tooth pairs have no real parts.
  interface Candidate {
    ratio: number;
    stage: GearboxSolution['stages'][number];
  }
  const candidatesAt = (position: number): Candidate[] => {
    const out: Candidate[] = [];
    for (const [t1, t2, ratio] of allValidStagesWithRatios) {
      const stage = matchStageAt(t1, t2, position);
      if (stage) out.push({ ratio, stage });
    }
    return out;
  };

  // A sorted-ratio view of a candidate list, for binary-searching the narrow
  // window of last-stage ratios that bring a combination onto the target.
  const sortedIndex = (candidates: Candidate[]) => {
    const sorted = [...candidates].sort((a, b) => a.ratio - b.ratio);
    const ratios = sorted.map((c) => c.ratio);
    const lowerBound = (value: number) => {
      let lo = 0;
      let hi = ratios.length;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (ratios[mid] < value) lo = mid + 1;
        else hi = mid;
      }
      return lo;
    };
    return { sorted, ratios, lowerBound };
  };

  const target = targetReduction.asNumber();
  const solutions: GearboxSolution[] = [];

  const stage0 = candidatesAt(0);
  const stage1 = maxStages >= 2 ? candidatesAt(1) : [];

  // Single-stage solutions.
  for (const a of stage0) {
    if (withinErrorThreshold(a.ratio, target)) {
      solutions.push({ ratio: a.ratio, stages: [a.stage] });
    }
  }

  // Two-stage solutions. The full set is collected; it is naturally bounded.
  if (stage0.length > 0 && stage1.length > 0) {
    const { sorted, ratios, lowerBound } = sortedIndex(stage1);
    const min = ratios[0];
    const max = ratios[ratios.length - 1];
    for (const a of stage0) {
      const needLo = (target - targetReductionErrorThreshold) / a.ratio;
      const needHi = (target + targetReductionErrorThreshold) / a.ratio;
      if (needHi < min || needLo > max) continue;
      for (
        let k = lowerBound(needLo - 1e-9);
        k < sorted.length && ratios[k] <= needHi + 1e-9;
        k++
      ) {
        const b = sorted[k];
        const ratio = a.ratio * b.ratio;
        if (withinErrorThreshold(ratio, target)) {
          solutions.push({ ratio, stages: [a.stage, b.stage] });
        }
      }
    }
  }

  // Three-stage solutions are an automatic fallback: we only search them when no
  // one- or two-stage gearbox can reach the target. This keeps normal searches
  // fast (the third stage is never built) and means the user never has to ask
  // for three stages — they appear exactly when they are the only option. The
  // first two stages are enumerated and the third is resolved by binary search,
  // keeping only a bounded best-by-error set so memory stays flat for high
  // ratios.
  let autoExpandedToThreeStage = false;
  const stage2 =
    maxStages >= 3 && solutions.length === 0 ? candidatesAt(2) : [];
  if (stage0.length > 0 && stage1.length > 0 && stage2.length > 0) {
    const { sorted, ratios, lowerBound } = sortedIndex(stage2);
    const min = ratios[0];
    const max = ratios[ratios.length - 1];
    const THREE_STAGE_CAP = 500;
    const kept: { error: number; solution: GearboxSolution }[] = [];
    const consider = (solution: GearboxSolution, error: number) => {
      if (
        kept.length >= THREE_STAGE_CAP &&
        error >= kept[kept.length - 1].error
      )
        return;
      let lo = 0;
      let hi = kept.length;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (kept[mid].error <= error) lo = mid + 1;
        else hi = mid;
      }
      kept.splice(lo, 0, { error, solution });
      if (kept.length > THREE_STAGE_CAP) kept.pop();
    };

    for (const a of stage0) {
      for (const b of stage1) {
        const ratio12 = a.ratio * b.ratio;
        const needLo = (target - targetReductionErrorThreshold) / ratio12;
        const needHi = (target + targetReductionErrorThreshold) / ratio12;
        if (needHi < min || needLo > max) continue;
        for (
          let k = lowerBound(needLo - 1e-9);
          k < sorted.length && ratios[k] <= needHi + 1e-9;
          k++
        ) {
          const c = sorted[k];
          const ratio = ratio12 * c.ratio;
          if (withinErrorThreshold(ratio, target)) {
            consider(
              { ratio, stages: [a.stage, b.stage, c.stage] },
              Math.abs(ratio - target),
            );
          }
        }
      }
    }

    for (const entry of kept) solutions.push(entry.solution);
    autoExpandedToThreeStage = solutions.length > 0;
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
    autoExpandedToThreeStage,
  });
}

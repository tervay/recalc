import { beforeAll, describe, expect, it } from 'vitest';

import {
  type FindGearboxesFilters,
  findGearboxes,
  type GearboxSolution,
} from '~/lib/math/ratioFinder.worker';
import Ratio, { RatioType } from '~/lib/models/Ratio';

const filters: FindGearboxesFilters = {
  enableREV: true,
  enableWCP: true,
  enableAM: true,
  enableTTB: true,
  enableLastAnvil: true,
  enableSDS: true,
  enablePlanetaries: true,
  enable20DP: true,
  enable32DP: true,
  enableGT2: true,
  enableHTD: true,
  enableRT25: true,
  enable25Chain: true,
  enable35Chain: true,
  enableBore12Hex: true,
  enableBore38Hex: true,
  enableBore1125: true,
  enableBoreMAXSpline: true,
  enableBoreSplineXL: true,
  enableBore5mmHex: true,
  enableBore14Round: true,
  enableCustomGears: false,
  enableCustomPulleys: false,
  enableCustomSprockets: false,
  minGearTeeth: 8,
  maxGearTeeth: 72,
  minPulleyTeeth: 12,
  maxPulleyTeeth: 60,
  minSprocketTeeth: 10,
  maxSprocketTeeth: 60,
};

const searches = [
  {
    target: new Ratio(3.7, RatioType.REDUCTION),
    threshold: 0.05,
    bore: 'SplineXS',
  },
  {
    target: new Ratio(12, RatioType.REDUCTION),
    threshold: 0.25,
    bore: 'Falcon',
  },
  {
    target: new Ratio(27.3, RatioType.REDUCTION),
    threshold: 0.5,
    bore: 'Vortex',
  },
  { target: new Ratio(64, RatioType.REDUCTION), threshold: 1, bore: '8mm' },
  {
    target: new Ratio(1.6, RatioType.STEP_UP),
    threshold: 0.02,
    bore: 'SplineXS',
  },
] as const;

let results: {
  target: number;
  threshold: number;
  bore: string;
  solutions: GearboxSolution[];
}[];

beforeAll(async () => {
  results = [];
  for (const { target, threshold, bore } of searches) {
    const { solutions } = await findGearboxes(
      target.toDict(),
      threshold,
      bore,
      filters,
    );
    results.push({ target: target.asNumber(), threshold, bore, solutions });
  }
}, 120_000);

describe('ratio finder invariants', () => {
  it('finds solutions for every search', () => {
    expect(results.filter((r) => r.solutions.length === 0)).toEqual([]);
  });

  it('reports each solution ratio as the product of its stages', () => {
    const violations = results.flatMap(({ solutions }) =>
      solutions.filter((s) => {
        const product = s.stages.reduce(
          (ratio, stage) => ratio * (stage.to.teeth / stage.from.teeth),
          1,
        );
        return Math.abs(product - s.ratio) > 1e-9 * Math.max(1, product);
      }),
    );

    expect(violations).toEqual([]);
  });

  it('keeps every solution within the error threshold', () => {
    const violations = results.flatMap(({ target, threshold, solutions }) =>
      solutions.filter((s) => Math.abs(s.ratio - target) > threshold + 1e-12),
    );

    expect(violations).toEqual([]);
  });

  it('sorts solutions from smallest to largest error', () => {
    const violations = results.filter(({ target, solutions }) =>
      solutions.some(
        (s, i) =>
          i > 0 &&
          Math.abs(s.ratio - target) <
            Math.abs(solutions[i - 1].ratio - target) - 1e-12,
      ),
    );

    expect(violations).toEqual([]);
  });

  it('mounts the first stage on the motor bore', () => {
    const violations = results.flatMap(({ bore, solutions }) =>
      solutions.filter(
        (s) => !s.stages[0].from.skus.some((sku) => sku.bore === bore),
      ),
    );

    expect(violations).toEqual([]);
  });

  it('never repeats a part number within a stage side', () => {
    const violations = results.flatMap(({ solutions }) =>
      solutions.flatMap((s) =>
        s.stages.flatMap((stage) =>
          [stage.from.skus, stage.to.skus].filter(
            (skus) =>
              new Set(
                skus.map(
                  (sku) => `${sku.sku}|${sku.url}|${sku.bore}|${sku.pitch}`,
                ),
              ).size !== skus.length,
          ),
        ),
      ),
    );

    expect(violations).toEqual([]);
  });
});

describe('ratio finder vendor filters', () => {
  const vendors = [
    ['REV', 'enableREV'],
    ['WCP', 'enableWCP'],
    ['AndyMark', 'enableAM'],
    ['Thrifty', 'enableTTB'],
    ['LastAnvil', 'enableLastAnvil'],
    ['SDS', 'enableSDS'],
  ] as const;

  it.each(vendors)(
    'never offers %s parts when that vendor is disabled',
    async (vendor, flag) => {
      const { solutions } = await findGearboxes(
        new Ratio(12, RatioType.REDUCTION).toDict(),
        0.5,
        'Falcon',
        { ...filters, [flag]: false },
      );
      const offered = solutions.flatMap((s) =>
        s.stages.flatMap((stage) =>
          [...stage.from.skus, ...stage.to.skus].filter(
            (sku) => sku.vendor === vendor,
          ),
        ),
      );

      expect(offered).toEqual([]);
    },
    30_000,
  );
});

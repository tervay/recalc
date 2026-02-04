import { isEqual, some } from 'lodash-es';
import type { CacheEntry, VendorName } from 'scripts/downloadProducts/types';
import { createSyntheticProduct } from 'scripts/downloadProducts/types';

import type {
  JSONPlanetary,
  JSONPlanetaryInstance,
} from '~/lib/types/planetary';
import type { ShopifyProduct } from '~/lib/types/shopify';

interface PlanetaryReductionOption {
  slices: number[];
  ratio: number;
}

function getAllPossibleReductions(
  planetary: JSONPlanetary,
): PlanetaryReductionOption[] {
  const results: PlanetaryReductionOption[] = [];
  const maxSlices = planetary.maxSlices;
  const slices = planetary.slices;

  const backtrack = (startIndex: number, current: number[]) => {
    if (current.length > 0) {
      const ratio = current.reduce((a, b) => a * b, 1);
      results.push({ slices: [...current], ratio });
    }

    if (current.length === maxSlices) return;

    for (let i = startIndex; i < slices.length; i++) {
      current.push(slices[i]);
      backtrack(i, current);
      current.pop();
    }
  };

  backtrack(0, []);
  return results;
}

export function parseREVPlanetaries(): CacheEntry[] {
  const planetaries: JSONPlanetary[] = [
    {
      slices: [3, 4, 5, 9],
      maxSlices: 3,
      inputBores: ['8mm', '1/2" Hex', 'Vortex', 'SplineXS', 'RS550', 'RS775'],
      outputBores: ['1/2" Hex'],
      sku: 'REV-25-2109',
      url: 'https://www.revrobotics.com/maxplanetary-system-kit/',
      vendor: 'REV',
    },
    {
      slices: [3, 4, 5],
      maxSlices: 3,
      inputBores: ['RS550'],
      outputBores: ['5mm Hex'],
      sku: 'REV-41-1600',
      url: 'https://www.revrobotics.com/rev-41-1600',
      vendor: 'REV',
    },
  ];

  const overloadedSlices: number[][] = [
    [9, 4, 5],
    [9, 5, 5],
    [9, 9, 3],
    [9, 9, 4],
    [9, 9, 5],
    [9, 9, 9],
  ];

  function containsPermutation(arrays: number[][], target: number[]): boolean {
    const sortedTarget = [...target].sort((a, b) => a - b);
    return some(arrays, (inner) =>
      isEqual(
        [...inner].sort((a, b) => a - b),
        sortedTarget,
      ),
    );
  }

  const instances: CacheEntry[] = [];
  const now = new Date().toISOString();

  for (const planetary of planetaries) {
    for (const reduction of getAllPossibleReductions(planetary)) {
      if (containsPermutation(overloadedSlices, reduction.slices)) {
        continue;
      }

      for (const inputBore of planetary.inputBores) {
        for (const outputBore of planetary.outputBores) {
          const parsedData: JSONPlanetaryInstance = {
            slices: reduction.slices,
            ratio: reduction.ratio,
            inputBore,
            outputBore,
            sku: planetary.sku,
            url: planetary.url,
            vendor: planetary.vendor,
          };

          // Create a unique synthetic ID based on configuration
          const syntheticId =
            -9000 -
            instances.length -
            reduction.ratio * 1000 -
            planetary.inputBores.indexOf(inputBore) * 100;

          instances.push({
            productId: syntheticId,
            variantId: syntheticId,
            rawProduct: createSyntheticProduct(
              syntheticId,
              `REV Planetary ${reduction.slices.join('x')} (${reduction.ratio}:1) ${inputBore} to ${outputBore}`,
              'REV',
              'Planetary',
              planetary.sku,
            ),
            parsedData,
            firstSeen: now,
          });
        }
      }
    }
  }

  return instances;
}

export function parseVendorPlanetaries(
  vendor: VendorName,
  _products: ShopifyProduct[],
): CacheEntry[] {
  switch (vendor) {
    case 'REV':
      return parseREVPlanetaries();
    default:
      return [];
  }
}

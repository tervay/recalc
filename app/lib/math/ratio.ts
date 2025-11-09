import type { RatioPair } from '~/lib/types/queryParams';

export function calculateNetRatio(pairs: RatioPair[]): number {
  if (pairs.length === 0) return 1;

  return pairs.reduce((acc, [driving, driven]) => {
    if (driven === 0) return 0;
    return acc * (driving / driven);
  }, 1);
}

export function calculateInverseRatio(netRatio: number): number {
  if (netRatio === 0) return 0;
  return 1 / netRatio;
}


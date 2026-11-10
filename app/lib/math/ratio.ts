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

export function formatStageRatioLabel(driving: number, driven: number): string {
  if (!(driving > 0 && driven > 0)) return '—';
  return driving < driven
    ? `${(driven / driving).toFixed(2)}:1`
    : `1:${(driving / driven).toFixed(2)}`;
}

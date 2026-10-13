import { dedupeParts } from 'scripts/ingest/validation/dedupe';
import { describe, expect, it } from 'vitest';

describe('dedupeParts', () => {
  it('keeps the first part for a repeated vendor and sku', () => {
    const parts = [
      { sku: 'A', vendor: 'WCP', variantId: 1 },
      { sku: 'A', vendor: 'WCP', variantId: 2 },
    ];
    expect(dedupeParts(parts)).toEqual([parts[0]]);
  });

  it('keeps parts that share a sku across vendors', () => {
    const parts = [
      { sku: 'A', vendor: 'WCP', variantId: 1 },
      { sku: 'A', vendor: 'SDS', variantId: 2 },
    ];
    expect(dedupeParts(parts)).toEqual(parts);
  });

  it('drops sku-less parts that differ only by variant id', () => {
    const parts = [
      { sku: null, vendor: 'Thrifty', bore: '5mm Hex', variantId: 1 },
      { sku: null, vendor: 'Thrifty', bore: '5mm Hex', variantId: 2 },
    ];
    expect(dedupeParts(parts)).toEqual([parts[0]]);
  });

  it('keeps sku-less parts that differ in specs', () => {
    const parts = [
      { sku: null, vendor: 'Thrifty', bore: '5mm Hex', variantId: 1 },
      { sku: null, vendor: 'Thrifty', bore: '7mm Hex', variantId: 2 },
    ];
    expect(dedupeParts(parts)).toEqual(parts);
  });
});

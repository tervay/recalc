import { describe, expect, it } from 'vitest';

import { compareWheelBores, zWheelBoreSchema } from '~/lib/types/wheels';
import type { WheelBore } from '~/lib/types/wheels';

function sorted(bores: WheelBore[]): WheelBore[] {
  return [...bores].sort(compareWheelBores);
}

describe('compareWheelBores', () => {
  it('sorts every metric bore after every imperial one', () => {
    expect(
      sorted([
        '5mm Hex',
        '1/2" Hex',
        '8mm',
        'Nub Bore',
        '14mm Hex',
        '3/8" Hex',
      ]),
    ).toEqual([
      '1/2" Hex',
      '3/8" Hex',
      'Nub Bore',
      '14mm Hex',
      '5mm Hex',
      '8mm',
    ]);
  });

  it('orders imperial bores alphabetically among themselves', () => {
    expect(sorted(['MAXSpline', '1.25" Round', '1.125" Round'])).toEqual([
      '1.125" Round',
      '1.25" Round',
      'MAXSpline',
    ]);
  });

  it('orders metric bores alphabetically among themselves', () => {
    expect(sorted(['8mm', '5mm Hex', '7mm Hex'])).toEqual([
      '5mm Hex',
      '7mm Hex',
      '8mm',
    ]);
  });

  it('returns 0 for the same bore', () => {
    expect(compareWheelBores('1/2" Hex', '1/2" Hex')).toBe(0);
  });

  it('is symmetric across the metric boundary', () => {
    expect(compareWheelBores('5mm Hex', '1/2" Hex')).toBeGreaterThan(0);
    expect(compareWheelBores('1/2" Hex', '5mm Hex')).toBeLessThan(0);
  });

  it('puts 8mm last across the full bore vocabulary', () => {
    expect(sorted([...zWheelBoreSchema.options]).at(-1)).toBe('8mm');
  });
});

import { describe, expect, it } from 'vitest';

import revPlanetaries from '~/genData/REV/planetaries.json';
import thriftyPlanetaries from '~/genData/Thrifty/planetaries.json';
import { zJSONPlanetaryInstanceSchema } from '~/lib/types/planetary';

describe('planetary genData integrity', () => {
  describe.each([
    ['REV', revPlanetaries],
    ['Thrifty', thriftyPlanetaries],
  ])('%s/planetaries.json', (_vendorName, entries) => {
    it('is non-empty', () => {
      expect(entries.length).toBeGreaterThan(0);
    });

    it('every entry conforms to zJSONPlanetaryInstanceSchema', () => {
      for (const entry of entries) {
        const result = zJSONPlanetaryInstanceSchema.safeParse(entry);
        expect(result.success).toBe(true);
      }
    });

    it('the product of slices equals ratio for every entry', () => {
      for (const entry of entries) {
        const product = entry.slices.reduce((acc, s) => acc * s, 1);
        expect(product).toBeCloseTo(entry.ratio, 6);
      }
    });
  });

  describe('REV UltraPlanetary (REV-41-1600)', () => {
    const entries = revPlanetaries.filter((p) => p.sku === 'REV-41-1600');
    const cartridgeRatios = [2.89, 3.61, 5.23];
    const outputBores = ['1/2" Hex', '5mm Hex'];

    // Every non-decreasing 1-, 2-, and 3-cartridge stack, matching how
    // multi-stage combinations are enumerated for every other planetary.
    const expectedCombos: number[][] = [];
    for (const a of cartridgeRatios) {
      expectedCombos.push([a]);
      for (const b of cartridgeRatios) {
        if (b < a) continue;
        expectedCombos.push([a, b]);
        for (const c of cartridgeRatios) {
          if (c < b) continue;
          expectedCombos.push([a, b, c]);
        }
      }
    }

    it('has one entry per cartridge stack per output bore', () => {
      expect(entries.length).toBe(expectedCombos.length * outputBores.length);
    });

    it('only uses RS550 as the input bore', () => {
      for (const entry of entries) {
        expect(entry.inputBore).toBe('RS550');
      }
    });

    it('offers both 1/2" Hex and 5mm Hex output bores for every cartridge stack', () => {
      for (const combo of expectedCombos) {
        for (const outputBore of outputBores) {
          const match = entries.find(
            (entry) =>
              entry.outputBore === outputBore &&
              entry.slices.length === combo.length &&
              entry.slices.every((s, i) => s === combo[i]),
          );
          expect(match).toBeDefined();
          expect(match?.ratio).toBeCloseTo(
            combo.reduce((acc, s) => acc * s, 1),
            6,
          );
        }
      }
    });
  });
});

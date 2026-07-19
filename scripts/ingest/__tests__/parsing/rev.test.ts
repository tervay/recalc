import { readFileSync } from 'fs';
import { join } from 'path';

import { parseREVBelts } from 'scripts/ingest/parsing/rev/belts';
import { parseREVGears } from 'scripts/ingest/parsing/rev/gears';
import { parseREVPulleys } from 'scripts/ingest/parsing/rev/pulleys';
import { parseREVSprockets } from 'scripts/ingest/parsing/rev/sprockets';
import type { REVFeedProduct } from 'scripts/ingest/retrieval/rev';
import { feedEntryToShopifyProduct } from 'scripts/ingest/retrieval/rev';
import { describe, expect, it } from 'vitest';

import type { ShopifyProduct } from '~/lib/types/shopify';

// Real entries pulled from https://dashboard.revrobotics.com/feeds/usa/products.json
// on 2026-07-19, covering every REV product family the pipeline supports
// plus deliberately-unsupported ones (unsupported bore, missing width,
// non-part items, an upstream naming typo) to lock in "drop, don't guess"
// behavior.
const fixture: REVFeedProduct[] = JSON.parse(
  readFileSync(join(__dirname, '../fixtures/rev-products.json'), 'utf-8'),
) as REVFeedProduct[];

const products: ShopifyProduct[] = fixture.map(feedEntryToShopifyProduct);

function bySku(sku: string) {
  const found = products.find((p) => p.variants[0].sku === sku);
  if (!found) throw new Error(`fixture missing sku ${sku}`);
  return found;
}

describe('REV parsers (live feed)', () => {
  describe('parseREVGears', () => {
    const result = parseREVGears(products);

    it('parses a 20DP 1/2in Hex gear', () => {
      expect(result).toContainEqual({
        teeth: 18,
        dp: 20,
        bore: '1/2" Hex',
        url: 'https://www.revrobotics.com/20DP-Gears-0.5-Hex/',
        sku: 'REV-21-1920',
        vendor: 'REV',
      });
    });

    it('treats "Rounded Hex" as a 1/2in Hex bore', () => {
      expect(result).toContainEqual(
        expect.objectContaining({ sku: 'REV-21-2196', bore: '1/2" Hex' }),
      );
    });

    it('uses the leading tooth count when a C-C note follows', () => {
      expect(result).toContainEqual(
        expect.objectContaining({ sku: 'REV-21-3361', teeth: 14 }),
      );
    });

    it('parses a 20DP MAXSpline gear', () => {
      expect(result).toContainEqual({
        teeth: 32,
        dp: 20,
        bore: 'MAXSpline',
        url: 'https://www.revrobotics.com/20DP-Gears-Maxspline/',
        sku: 'REV-21-3010',
        vendor: 'REV',
      });
    });

    it('parses an 8mm-bore NEO pinion gear', () => {
      expect(result).toContainEqual({
        teeth: 10,
        dp: 20,
        bore: '8mm',
        url: 'https://www.revrobotics.com/neo-pinions/',
        sku: 'REV-21-1998',
        vendor: 'REV',
      });
    });

    it('parses the 32DP RS550 pinion gear', () => {
      expect(result).toContainEqual({
        teeth: 12,
        dp: 32,
        bore: 'RS550',
        url: 'https://www.revrobotics.com/550-motor-pinions/',
        sku: 'REV-41-1660-PK2',
        vendor: 'REV',
      });
    });

    it('drops a 15T Spline gear (unsupported bore)', () => {
      expect(result.some((g) => g.sku === 'REV-21-4008')).toBe(false);
      expect(result.some((g) => g.sku === 'REV-21-4014')).toBe(false);
    });

    it('drops the UltraPlanetary pinion gear (no DP stated)', () => {
      expect(result.some((g) => g.sku === 'REV-41-1608-PK2')).toBe(false);
    });

    it('ignores non-gear products entirely', () => {
      expect(result.some((g) => g.sku === 'REV-11-1107')).toBe(false);
    });
  });

  describe('parseREVBelts', () => {
    const result = parseREVBelts(products);

    it('parses an RT25 belt with the family-standard width/pitch', () => {
      expect(result).toContainEqual({
        teeth: 32,
        width: 12.7,
        profile: 'RT25',
        pitch: 6.35,
        sku: 'REV-21-4032',
        url: 'https://www.revrobotics.com/RT25-Belts-1/2in-Width/',
        vendor: 'REV',
      });
    });

    it('parses every fixture RT25 belt', () => {
      expect(result.map((b) => b.teeth).sort((a, b) => a - b)).toEqual([
        32, 216,
      ]);
    });

    it('drops GT2 belts (width not present in the name)', () => {
      expect(result.some((b) => b.sku === 'REV-41-1797')).toBe(false);
    });
  });

  describe('parseREVPulleys', () => {
    const result = parseREVPulleys(products);

    it('defaults the RT25 Plastic Pulley Kit width to the family standard', () => {
      expect(result).toContainEqual({
        teeth: 24,
        width: 12.7,
        profile: 'RT25',
        pitch: 6.35,
        sku: 'REV-25-2224',
        url: 'https://www.revrobotics.com/RT25-Pulleys/',
        bore: 'MAXSpline',
        vendor: 'REV',
      });
    });

    it('parses an RT25 Aluminum Pulley with explicit bore and width', () => {
      expect(result).toContainEqual({
        teeth: 12,
        width: 12.7,
        profile: 'RT25',
        pitch: 6.35,
        sku: 'REV-21-2200',
        url: 'https://www.revrobotics.com/RT25-Pulleys/',
        bore: '8mm',
        vendor: 'REV',
      });
    });

    it('parses distinct widths for the same tooth/bore aluminum pulley', () => {
      expect(result).toContainEqual(
        expect.objectContaining({ sku: 'REV-21-2205', width: 12.7 }),
      );
      expect(result).toContainEqual(
        expect.objectContaining({ sku: 'REV-21-2206', width: 25.4 }),
      );
    });

    it('applies the fixed width for the 550 motor pinion GT2 pulley', () => {
      expect(result).toContainEqual({
        teeth: 12,
        width: 16,
        profile: 'GT2',
        pitch: 3,
        sku: 'REV-21-1908',
        url: 'https://www.revrobotics.com/550-motor-pinions/',
        bore: 'RS550',
        vendor: 'REV',
      });
    });

    it('applies the fixed width for the NEO pinion GT2 pulley', () => {
      expect(result).toContainEqual({
        teeth: 16,
        width: 25.4,
        profile: 'GT2',
        pitch: 3,
        sku: 'REV-21-1909',
        url: 'https://www.revrobotics.com/neo-pinions/',
        bore: '8mm',
        vendor: 'REV',
      });
    });

    it('drops a 15T Spline pulley (unsupported bore)', () => {
      expect(result.some((p) => p.sku === 'REV-21-4485')).toBe(false);
    });
  });

  describe('parseREVSprockets', () => {
    const result = parseREVSprockets(products);

    it('parses a #25 Hub Sprocket with explicit hex bore', () => {
      expect(result).toContainEqual({
        teeth: 16,
        bore: '1/2" Hex',
        chainType: '#25',
        url: 'https://www.revrobotics.com/ION-25-Sprockets/',
        sku: 'REV-21-2012',
        vendor: 'REV',
      });
    });

    it('parses a #25 Hub Sprocket with explicit MAXSpline bore', () => {
      expect(result).toContainEqual(
        expect.objectContaining({ sku: 'REV-21-2015', bore: 'MAXSpline' }),
      );
    });

    it('defaults Billet Sprockets to MAXSpline bore', () => {
      expect(result).toContainEqual({
        teeth: 40,
        bore: 'MAXSpline',
        chainType: '#25',
        url: 'https://www.revrobotics.com/ION-25-Sprockets/',
        sku: 'REV-21-3370',
        vendor: 'REV',
      });
      expect(result).toContainEqual(
        expect.objectContaining({ sku: 'REV-21-3718', bore: 'MAXSpline' }),
      );
    });

    it('parses a #35 sprocket family', () => {
      expect(result).toContainEqual(
        expect.objectContaining({
          sku: 'REV-21-3706',
          chainType: '#35',
          bore: '1/2" Hex',
          teeth: 9,
        }),
      );
    });

    it('parses an 8mm-bore NEO pinion sprocket', () => {
      expect(result).toContainEqual({
        teeth: 10,
        bore: '8mm',
        chainType: '#25',
        url: 'https://www.revrobotics.com/neo-pinions/',
        sku: 'REV-21-2020',
        vendor: 'REV',
      });
    });

    it('applies the known teeth override for a SKU missing its "T" suffix', () => {
      // REV-21-3495's upstream name omits the "T" unit ("... - 12 (REV-...")
      // instead of "... - 12T ..."; confirmed against the live shop listing
      // as a 12-tooth sprocket, so it's recorded as a per-SKU override
      // rather than guessed at via a broadened regex.
      expect(bySku('REV-21-3495').title).toContain(' - 12 (');
      expect(result).toContainEqual({
        teeth: 12,
        bore: '8mm',
        chainType: '#25',
        url: 'https://www.revrobotics.com/neo-pinions/',
        sku: 'REV-21-3495',
        vendor: 'REV',
      });
    });
  });

  describe('cross-cutting', () => {
    it('DUO and 5mm-hex-bore-gear families are not yet supported and stay excluded', () => {
      const allSkus = new Set([
        ...parseREVGears(products).map((g) => g.sku),
        ...parseREVBelts(products).map((b) => b.sku),
        ...parseREVPulleys(products).map((p) => p.sku),
        ...parseREVSprockets(products).map((s) => s.sku),
      ]);
      expect(allSkus.has('REV-41-1717')).toBe(false);
      expect(allSkus.has('REV-41-1331-PK8')).toBe(false);
    });
  });
});

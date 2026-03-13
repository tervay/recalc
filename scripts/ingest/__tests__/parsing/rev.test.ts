import { parseREVBelts } from 'scripts/ingest/parsing/rev/belts';
import { parseREVGears } from 'scripts/ingest/parsing/rev/gears';
import { parseREVPulleys } from 'scripts/ingest/parsing/rev/pulleys';
import { parseREVSprockets } from 'scripts/ingest/parsing/rev/sprockets';
import { describe, expect, it } from 'vitest';

describe('REV Parsers', () => {
  describe('parseREVPulleys', () => {
    it('should return expected number of pulleys', () => {
      const result = parseREVPulleys();
      // 9 RT25 + 2 GT2 = 11
      expect(result).toHaveLength(11);
    });

    it('should have valid bore types', () => {
      const result = parseREVPulleys();
      const validBores = ['8mm', '1/2" Hex', 'MAXSpline', 'RS550'];
      for (const pulley of result) {
        expect(validBores).toContain(pulley.bore);
        expect(pulley.vendor).toBe('REV');
      }
    });

    it('should have RT25 profile for non-GT2 pulleys', () => {
      const result = parseREVPulleys();
      const rt25Pulleys = result.filter((p) => p.profile === 'RT25');
      expect(rt25Pulleys.length).toBeGreaterThan(0);
    });

    it('should have GT2 profile for GT2 pulleys', () => {
      const result = parseREVPulleys();
      const gt2Pulleys = result.filter((p) => p.profile === 'GT2');
      expect(gt2Pulleys).toHaveLength(2);
    });
  });

  describe('parseREVBelts', () => {
    it('should return 25 RT25 belts', () => {
      const result = parseREVBelts();
      expect(result).toHaveLength(25);
    });

    it('should all have RT25 profile', () => {
      const result = parseREVBelts();
      for (const belt of result) {
        expect(belt.profile).toBe('RT25');
        expect(belt.vendor).toBe('REV');
      }
    });

    it('should have valid tooth counts', () => {
      const result = parseREVBelts();
      const toothCounts = result.map((b) => b.teeth);
      expect(toothCounts).toContain(32);
      expect(toothCounts).toContain(216);
    });

    it('should have correct width in mm (0.5in)', () => {
      const result = parseREVBelts();
      const expectedWidth = 0.5 * 25.4;
      for (const belt of result) {
        expect(belt.width).toBeCloseTo(expectedWidth, 1);
      }
    });
  });

  describe('parseREVSprockets', () => {
    it('should return expected total sprockets', () => {
      const result = parseREVSprockets();
      // ION 35: 8 (1/2" Hex) + 18 (MAXSpline) = 26
      // ION 25: 14 entries
      // NEO pinions: 2
      expect(result).toHaveLength(42);
    });

    it('should have valid vendor', () => {
      const result = parseREVSprockets();
      for (const sprocket of result) {
        expect(sprocket.vendor).toBe('REV');
        expect(['#25', '#35']).toContain(sprocket.chainType);
      }
    });
  });

  describe('parseREVGears', () => {
    it('should return expected number of gears', () => {
      const result = parseREVGears();
      // 20DP MAXSpline: 19 + 2 = 21
      // 20DP 1/2" Hex: 26 + 3 = 29
      // 20DP 8mm: 5
      // 32DP RS550: 1
      expect(result).toHaveLength(56);
    });

    it('should have valid bore types', () => {
      const result = parseREVGears();
      const validBores = ['MAXSpline', '1/2" Hex', '8mm', 'RS550'];
      for (const gear of result) {
        expect(validBores).toContain(gear.bore);
        expect(gear.vendor).toBe('REV');
      }
    });
  });
});

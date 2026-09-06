import { describe, expect, it } from 'vitest';

import Measurement from '~/lib/models/Measurement';
import Model from '~/lib/models/Model';
import Wheel from '~/lib/models/Wheel';
import type { JSONWheel } from '~/lib/types/wheels';

function json(overrides: Partial<JSONWheel> = {}): JSONWheel {
  return {
    name: 'Compliant Wheels',
    diameter: 50.8,
    bore: '1/2" Hex',
    type: 'Compliant',
    durometer: '35A',
    url: 'https://example.com/wheel',
    sku: 'am-3462_green',
    vendor: 'AndyMark',
    ...overrides,
  };
}

describe('Wheel', () => {
  describe('fromJson', () => {
    it('maps every field from valid json', () => {
      const wheel = Wheel.fromJson(json());
      expect(wheel.name).toBe('Compliant Wheels');
      expect(wheel.diameter).toEqual(new Measurement(50.8, 'mm'));
      expect(wheel.bore).toBe('1/2" Hex');
      expect(wheel.type).toBe('Compliant');
      expect(wheel.durometer).toBe('35A');
      expect(wheel.url).toBe('https://example.com/wheel');
      expect(wheel.sku).toBe('am-3462_green');
      expect(wheel.vendor).toBe('AndyMark');
    });

    it('interprets diameter as millimeters', () => {
      const wheel = Wheel.fromJson(json({ diameter: 50.8 }));
      expect(wheel.diameter.to('in').scalar).toBeCloseTo(2, 10);
    });

    it('handles sku: null', () => {
      expect(Wheel.fromJson(json({ sku: null })).sku).toBeNull();
    });

    it('preserves a wheel-only bore', () => {
      expect(Wheel.fromJson(json({ bore: '7mm Hex' })).bore).toBe('7mm Hex');
    });
  });

  describe('toDict', () => {
    it('serializes diameter, bore, and type', () => {
      expect(Wheel.fromJson(json()).toDict()).toEqual({
        name: 'Compliant Wheels',
        diameter: new Measurement(50.8, 'mm').toDict(),
        bore: '1/2" Hex',
        type: 'Compliant',
        durometer: '35A',
      });
    });
  });

  describe('eq', () => {
    it('is true for two wheels built from the same json', () => {
      expect(Wheel.fromJson(json()).eq(Wheel.fromJson(json()))).toBe(true);
    });

    it('is true across equivalent diameter units', () => {
      const mm = Wheel.fromJson(json({ diameter: 50.8 }));
      const inches = new Wheel(
        'Compliant Wheels',
        new Measurement(2, 'in'),
        '1/2" Hex',
        'Compliant',
        '35A',
        'https://example.com/wheel',
        'am-3462_green',
        'AndyMark',
      );
      expect(mm.eq(inches)).toBe(true);
    });

    it('is false when diameter differs', () => {
      expect(
        Wheel.fromJson(json()).eq(Wheel.fromJson(json({ diameter: 76.2 }))),
      ).toBe(false);
    });

    it('is false when name differs', () => {
      expect(
        Wheel.fromJson(json()).eq(
          Wheel.fromJson(json({ name: 'Grip Wheels' })),
        ),
      ).toBe(false);
    });

    it('is false when bore differs', () => {
      expect(
        Wheel.fromJson(json()).eq(Wheel.fromJson(json({ bore: '3/8" Hex' }))),
      ).toBe(false);
    });

    it('is false when type differs', () => {
      expect(
        Wheel.fromJson(json()).eq(Wheel.fromJson(json({ type: 'Grip' }))),
      ).toBe(false);
    });

    it('is false when durometer differs', () => {
      expect(
        Wheel.fromJson(json()).eq(Wheel.fromJson(json({ durometer: '60A' }))),
      ).toBe(false);
    });

    it('is false when durometer is null on one side', () => {
      expect(
        Wheel.fromJson(json()).eq(Wheel.fromJson(json({ durometer: null }))),
      ).toBe(false);
    });

    it('is false when url differs', () => {
      expect(
        Wheel.fromJson(json()).eq(
          Wheel.fromJson(json({ url: 'https://example.com/other' })),
        ),
      ).toBe(false);
    });

    it('is false when sku differs', () => {
      expect(
        Wheel.fromJson(json()).eq(Wheel.fromJson(json({ sku: 'am-0001' }))),
      ).toBe(false);
    });

    it('is false when vendor differs', () => {
      expect(
        Wheel.fromJson(json()).eq(Wheel.fromJson(json({ vendor: 'REV' }))),
      ).toBe(false);
    });

    it('is false for a non-Wheel model', () => {
      expect(Wheel.fromJson(json()).eq(new Measurement(1, 'in'))).toBe(false);
    });
  });

  it('is a Model', () => {
    expect(Wheel.fromJson(json())).toBeInstanceOf(Model);
    expect(Wheel.fromJson(json()).identifier).toBe('Wheel');
  });
});

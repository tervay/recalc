import {
  boreForWheel,
  normalizeWheelBore,
  parseDiameterMm,
  parseDurometer,
  skuOrNull,
  wheelNameFromTitle,
} from 'scripts/ingest/parsing/wheels/helpers';
import { describe, expect, it } from 'vitest';

describe('normalizeWheelBore', () => {
  it.each([
    ['1/2" Hex', '1/2" Hex'],
    ['1/2 in Hex', '1/2" Hex'],
    ['1/2 in. Hex Bore', '1/2" Hex'],
    ['0.5 in. Hex Bore', '1/2" Hex'],
    ['0.500 in. Hex', '1/2" Hex'],
    ['1/2in Hex', '1/2" Hex'],
    ['1/2" Hex Stretch', '1/2" Hex'],
    ['3/8" Hex', '3/8" Hex'],
    ['3/8 in Hex', '3/8" Hex'],
    ['0.375 in. Hex Bore', '3/8" Hex'],
    ['5 mm Hex', '5mm Hex'],
    ['5mm Hex Bore', '5mm Hex'],
    ['7mm Hex', '7mm Hex'],
    ['14 mm Hex', '14mm Hex'],
    ['8 mm Round', '8mm'],
    ['Bearing Bore', '1.125" Round'],
    ['1.125 in. Bearing Bore', '1.125" Round'],
    ['1.125" Bearing Bore', '1.125" Round'],
    ['1-1/4" Round Stretch', '1.25" Round'],
    ['Nub Bore', 'Nub Bore'],
    ['MAXSpline', 'MAXSpline'],
  ])('normalizes %s to %s', (input, expected) => {
    expect(normalizeWheelBore(input)).toBe(expected);
  });

  it('returns null for text with no bore', () => {
    expect(normalizeWheelBore('Set of Four')).toBeNull();
  });

  it('returns null for an empty string', () => {
    expect(normalizeWheelBore('')).toBeNull();
  });

  it('prefers 14mm over 5mm when both digits appear', () => {
    expect(normalizeWheelBore('14 mm Hex')).not.toBe('5mm Hex');
  });

  it('does not read 0.500 as a 5mm bore', () => {
    expect(normalizeWheelBore('0.500 in. Hex')).toBe('1/2" Hex');
  });
});

describe('parseDiameterMm', () => {
  it.each([
    ['3" OD x 1" Wide Straight Flex Wheel', 76.2],
    ['1.625" OD x 1/2" Wide Straight Flex Wheel', 41.275],
    ['4 in.', 101.6],
    ['4 inch', 101.6],
    ['2 1/4 inch', 57.15],
    ['2.25 in', 57.15],
    ['35 mm Dualie Omni Wheel', 35],
    ['90mm Grip Wheel', 90],
    ['1.5" (Pack of 4)', 38.1],
    ['ION Grip Wheels (2in - MAXSpline - Medium)', 50.8],
  ])('parses %s as %d mm', (input, expected) => {
    expect(parseDiameterMm(input)).toBeCloseTo(expected, 6);
  });

  it('returns null when no dimension is present', () => {
    expect(parseDiameterMm('Colson Wheels')).toBeNull();
  });

  it('rounds away inch-to-mm float noise', () => {
    expect(parseDiameterMm('1.5"')).toBe(38.1);
    expect(parseDiameterMm('3 in.')).toBe(76.2);
    expect(parseDiameterMm('6 inch')).toBe(152.4);
  });

  it('ignores a bare number with no unit', () => {
    expect(parseDiameterMm('Wheel 4 Pack')).toBeNull();
  });

  it('reads the OD when a width also appears', () => {
    expect(parseDiameterMm('4" OD x 1" Wide Flex Wheel')).toBeCloseTo(101.6, 6);
  });
});

describe('boreForWheel', () => {
  const ids = (sku: string | null, handle = 'a-handle') => ({ sku, handle });

  it('returns the parsed bore when one is present', () => {
    expect(
      boreForWheel('REV', ids('REV-0001'), 'Wheel (1/2in Hex)', '1/2in Hex'),
    ).toBe('1/2" Hex');
  });

  it('falls back to a sku override when parsing fails', () => {
    expect(
      boreForWheel('REV', ids('REV-41-1354-PK2'), 'DUO Traction', null),
    ).toBe('5mm Hex');
  });

  it('falls back to a handle override when the sku is not listed', () => {
    expect(
      boreForWheel(
        'AndyMark',
        ids('am-2256', 'higrip-wheels'),
        'HiGrip Wheels',
        null,
      ),
    ).toBe('AndyMark Hub');
  });

  it('resolves a handle override even when the sku is null', () => {
    expect(
      boreForWheel('AndyMark', ids(null, 'plaction-wheels'), 'Plaction', null),
    ).toBe('1.125" Round');
  });

  it('returns null when nothing resolves a bore', () => {
    expect(
      boreForWheel('AndyMark', ids('am-9999', 'mystery'), 'Mystery', null),
    ).toBeNull();
  });

  it('uses the vendor default before giving up', () => {
    expect(
      boreForWheel(
        'Thrifty',
        ids('TTB-0032', 'squish'),
        'Squish',
        null,
        '1/2" Hex',
      ),
    ).toBe('1/2" Hex');
  });

  it('prefers a sku override over the vendor default', () => {
    expect(
      boreForWheel(
        'REV',
        ids('REV-41-1354-PK2'),
        'DUO Traction',
        null,
        '1/2" Hex',
      ),
    ).toBe('5mm Hex');
  });

  it('prefers the parsed bore over an override', () => {
    expect(
      boreForWheel('REV', ids('REV-41-1354-PK2'), 'DUO Traction', '1/2in Hex'),
    ).toBe('1/2" Hex');
  });
});

describe('skuOrNull', () => {
  it('passes a real sku through', () => {
    expect(skuOrNull('WCP-1299')).toBe('WCP-1299');
  });

  it('normalizes an empty-string sku to null', () => {
    expect(skuOrNull('')).toBeNull();
  });

  it('leaves a null sku as null', () => {
    expect(skuOrNull(null)).toBeNull();
  });
});

describe('wheelNameFromTitle', () => {
  it.each([
    [
      '3" OD x 1" Wide Straight Flex Wheel (1/2" Hex, 30A)',
      'Straight Flex Wheel',
    ],
    [
      '9T x 5" OD x 1/2" Wide Star Flex Wheel (1-1/4" Round Stretch, 45A)',
      'Star Flex Wheel',
    ],
    ['2T x 5" OD x 1/2" Wide Flex Wheel (1/2" Hex, 30A)', 'Flex Wheel'],
    ['4" OD x 1.5" WD Aluminum Wheel (1/2" Hex Bore)', 'Aluminum Wheel'],
    [
      '2" Omni-Directional Intake Wheel (1/2" Hex Bore, 90A)',
      'Omni-Directional Intake Wheel',
    ],
    [
      '2" Vector Intake Wheel (Left Hand, 1/2" Hex Bore)',
      'Vector Intake Wheel',
    ],
    [
      'ION Grip Wheels (2in - MAXSpline - Medium - Grip Wheel (REV-21-2437-PK4))',
      'ION Grip Wheels',
    ],
    ['90mm Grip Wheel', 'Grip Wheel'],
    ['75mm Mecanum Wheel Set', 'Mecanum Wheel Set'],
    ['Compliant Wheels', 'Compliant Wheels'],
    ['2 in. Dualie Omni Wheel', 'Dualie Omni Wheel'],
    ['35 mm Dualie Omni Wheel', 'Dualie Omni Wheel'],
    ['8 in. HD Pneumatic Wheels', 'HD Pneumatic Wheels'],
    ['QTY 4 - 2 Inch Vectored Intake Wheel', 'Vectored Intake Wheel'],
    [
      'QTY 10 - Hard Durometer 60A - 2 Inch Thrifty Squish Wheels',
      'Thrifty Squish Wheels',
    ],
    [
      'QTY 4 - 60A Harder Durometer - 4 Inch Thrifty Squish Wheels',
      'Thrifty Squish Wheels',
    ],
    [
      '4" Solid Urethane Wheel 1/2" Hex Bore - 45A Durometer',
      'Solid Urethane Wheel',
    ],
    ['3 in. Aluminum Omni Wheel With 3/8 Hex Bore', 'Aluminum Omni Wheel'],
    ['SWYFT Intake Wheels', 'SWYFT Intake Wheels'],
  ])('turns %s into %s', (title, expected) => {
    expect(wheelNameFromTitle(title)).toBe(expected);
  });

  it('falls back to the parenthetical-stripped title when no Wheel token exists', () => {
    expect(wheelNameFromTitle('Colson Tread (4 in.)')).toBe('Colson Tread');
  });
});

describe('parseDurometer', () => {
  it.each([
    ['2" OD x 1/2" Wide Straight Flex Wheel (1/2" Hex, 30A)', '30A'],
    [
      '9T x 5" OD x 1/2" Wide Star Flex Wheel (1-1/4" Round Stretch, 45A)',
      '45A',
    ],
    ['35A', '35A'],
    ['80a', '80A'],
    ['QTY 10 - Hard Durometer 60A - 2 Inch Thrifty Squish Wheels', '60A'],
    ['ION Grip Wheels (2in - MAXSpline - Medium - Grip Wheel)', 'Medium'],
    [
      'ION Traction Wheels (4in - MAXSpline - Hard - Traction Wheel V2)',
      'Hard',
    ],
    ['DUO Flap Wheels (5mm Hex Bore - Soft - Flap Wheel)', 'Soft'],
  ])('reads %s as %s', (input, expected) => {
    expect(parseDurometer(input)).toBe(expected);
  });

  it('returns null when no durometer is stated', () => {
    expect(
      parseDurometer('4" OD x 1.5" WD Aluminum Wheel (1/2" Hex Bore)'),
    ).toBeNull();
  });

  it('does not read a REV part number as a durometer', () => {
    expect(
      parseDurometer('ION Omni Wheels (2in - MAXSpline - Omni (REV-21-2476))'),
    ).toBeNull();
  });

  it('does not read "Harder" as the Hard rating', () => {
    expect(parseDurometer('Harder Durometer Squish Wheels')).toBeNull();
  });

  it('prefers a numeric rating over a word rating', () => {
    expect(parseDurometer('Hard Durometer 60A')).toBe('60A');
  });
});

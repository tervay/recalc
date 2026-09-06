import { parseAndyMarkWheels } from 'scripts/ingest/parsing/andymark/wheels';
import { parseREVWheels } from 'scripts/ingest/parsing/rev/wheels';
import { parseSwyftWheels } from 'scripts/ingest/parsing/swyft/wheels';
import { parseThriftyWheels } from 'scripts/ingest/parsing/thrifty/wheels';
import { parseWCPWheels } from 'scripts/ingest/parsing/wcp/wheels';
import { describe, expect, it, vi } from 'vitest';

import type { ShopifyProduct, ShopifyVariant } from '~/lib/types/shopify';

function makeVariant(
  overrides: Partial<ShopifyVariant> & { id: number },
): ShopifyVariant {
  return {
    title: 'Default Title',
    option1: 'Default Title',
    option2: null,
    option3: null,
    sku: 'SKU-001',
    available: true,
    price: '10.00',
    grams: 0,
    position: 1,
    product_id: 1,
    ...overrides,
  } as ShopifyVariant;
}

function makeProduct(
  overrides: Partial<ShopifyProduct> & { id: number },
): ShopifyProduct {
  return {
    title: 'Test Wheel',
    handle: 'test-wheel',
    vendor: 'Test',
    product_type: '',
    tags: [],
    images: [],
    options: [{ name: 'Title', position: 1, values: ['Default Title'] }],
    variants: [makeVariant({ id: overrides.id * 10 })],
    ...overrides,
  } as unknown as ShopifyProduct;
}

describe('parseWCPWheels', () => {
  it('parses a straight flex wheel', () => {
    const result = parseWCPWheels([
      makeProduct({
        id: 1,
        title: '3" OD x 1" Wide Straight Flex Wheel (1/2" Hex, 30A)',
        handle: 'wcp-1299',
        variants: [makeVariant({ id: 10, sku: 'WCP-1299' })],
      }),
    ]);
    expect(result).toEqual([
      {
        name: 'Straight Flex Wheel',
        diameter: 76.2,
        bore: '1/2" Hex',
        type: 'Flex',
        durometer: '30A',
        url: 'https://wcproducts.com/products/wcp-1299',
        sku: 'WCP-1299',
        vendor: 'WCP',
      },
    ]);
  });

  it('maps a 1-1/4" round stretch bore', () => {
    const result = parseWCPWheels([
      makeProduct({
        id: 2,
        title:
          '9T x 5" OD x 1/2" Wide Star Flex Wheel (1-1/4" Round Stretch, 45A)',
        handle: 'wcp-0406',
        variants: [makeVariant({ id: 20, sku: 'WCP-0406' })],
      }),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].bore).toBe('1.25" Round');
    expect(result[0].diameter).toBeCloseTo(127, 6);
  });

  it('classifies an aluminum wheel as Billet', () => {
    const result = parseWCPWheels([
      makeProduct({
        id: 3,
        title: '4" OD x 1.5" WD Aluminum Wheel (1/2" Hex Bore)',
        handle: 'wcp-0075',
        variants: [makeVariant({ id: 30, sku: 'WCP-0075' })],
      }),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('Billet');
  });

  it('skips collection stubs that carry no dimensions', () => {
    expect(
      parseWCPWheels([
        makeProduct({
          id: 4,
          title: 'Colson Wheels',
          handle: 'colson-wheels',
          variants: [makeVariant({ id: 40, sku: '' })],
        }),
      ]),
    ).toEqual([]);
  });

  it('skips hubs, forks, tires, and tread', () => {
    const titles = [
      'WCP Swerve X2 Colson Wheel Hub',
      'WCP Swerve X (Wheel Fork, 2-Pack)',
      'Pneumatic Wheel Tire (6" OD, Centipede)',
      '2" Wide Black Roughtop Tread, 10ft long',
    ];
    const products = titles.map((title, i) =>
      makeProduct({ id: 100 + i, title, handle: `h-${i}` }),
    );
    expect(parseWCPWheels(products)).toEqual([]);
  });

  it('skips swerve products', () => {
    expect(
      parseWCPWheels([
        makeProduct({
          id: 5,
          title: 'WCP Swerve X2 Colson Wheel (4" OD x 2" WD)',
          handle: 'wcp-1732',
          variants: [makeVariant({ id: 50, sku: 'WCP-1732' })],
        }),
      ]),
    ).toEqual([]);
  });
});

describe('parseREVWheels', () => {
  it('parses an ION grip wheel from its title', () => {
    const result = parseREVWheels([
      makeProduct({
        id: 1,
        title:
          'ION Grip Wheels (2in - MAXSpline - Medium - Grip Wheel (REV-21-2437-PK4))',
        handle: 'https://www.revrobotics.com/ION-Grip-Wheels/',
        variants: [
          makeVariant({ id: 10, sku: 'REV-21-2437-PK4', option1: null }),
        ],
      }),
    ]);
    expect(result).toEqual([
      {
        name: 'ION Grip Wheels',
        diameter: 50.8,
        bore: 'MAXSpline',
        type: 'Grip',
        durometer: 'Medium',
        url: 'https://www.revrobotics.com/ION-Grip-Wheels/',
        sku: 'REV-21-2437-PK4',
        vendor: 'REV',
      },
    ]);
  });

  it('parses a millimeter diameter', () => {
    const result = parseREVWheels([
      makeProduct({
        id: 2,
        title: 'DUO Traction Wheels (30mm Traction Wheel - 4 Pack)',
        handle: 'https://www.revrobotics.com/DUO-Traction-Wheels/',
        variants: [
          makeVariant({ id: 20, sku: 'REV-41-1353-PK4', option1: null }),
        ],
      }),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].diameter).toBe(30);
    expect(result[0].type).toBe('Traction');
  });

  it('resolves a bore-less DUO wheel through the override table', () => {
    const result = parseREVWheels([
      makeProduct({
        id: 3,
        title: 'DUO Omni Wheels (90mm Omni Wheel - 2 Pack)',
        handle: 'https://www.revrobotics.com/DUO-Omni-Wheels/',
        variants: [
          makeVariant({ id: 30, sku: 'REV-41-1190-PK2', option1: null }),
        ],
      }),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].bore).toBe('5mm Hex');
    expect(result[0].type).toBe('Omni');
  });

  it('drops and reports a wheel whose bore cannot be determined', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = parseREVWheels([
      makeProduct({
        id: 4,
        title: '4in Mystery Traction Wheel',
        handle: 'https://www.revrobotics.com/rev-99-9999/',
        variants: [makeVariant({ id: 40, sku: 'REV-99-9999', option1: null })],
      }),
    ]);
    expect(result).toEqual([]);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('REV-99-9999'));
    warn.mockRestore();
  });

  it('skips MAXSwerve wheels', () => {
    expect(
      parseREVWheels([
        makeProduct({
          id: 5,
          title: '3in MAXSwerve Wheel - Aluminum',
          handle: 'https://www.revrobotics.com/rev-21-3002/',
          variants: [makeVariant({ id: 50, sku: 'REV-21-3002' })],
        }),
      ]),
    ).toEqual([]);
  });
});

describe('parseAndyMarkWheels', () => {
  const compliant = makeProduct({
    id: 1,
    title: 'Compliant Wheels',
    handle: 'compliant-wheels',
    options: [
      { name: 'Bore', position: 1, values: ['3/8 in Hex', 'Nub Bore'] },
      { name: 'Diameter', position: 2, values: ['2 inch', '2 1/4 inch'] },
      { name: 'Durometer', position: 3, values: ['35A'] },
    ],
    variants: [
      makeVariant({
        id: 10,
        sku: 'am-3571_green',
        option1: '3/8 in Hex',
        option2: '2 inch',
        option3: '35A',
        title: '3/8 in Hex / 2 inch / 35A',
      }),
      makeVariant({
        id: 11,
        sku: 'am-3950_green',
        option1: '3/8 in Hex',
        option2: '2 1/4 inch',
        option3: '35A',
        title: '3/8 in Hex / 2 1/4 inch / 35A',
      }),
    ],
  });

  it('reads bore and diameter from named option axes', () => {
    expect(parseAndyMarkWheels([compliant])).toEqual([
      {
        name: 'Compliant Wheels',
        diameter: 50.8,
        bore: '3/8" Hex',
        type: 'Compliant',
        durometer: '35A',
        url: 'https://www.andymark.com/products/compliant-wheels',
        sku: 'am-3571_green',
        vendor: 'AndyMark',
      },
      {
        name: 'Compliant Wheels',
        diameter: 57.15,
        bore: '3/8" Hex',
        type: 'Compliant',
        durometer: '35A',
        url: 'https://www.andymark.com/products/compliant-wheels',
        sku: 'am-3950_green',
        vendor: 'AndyMark',
      },
    ]);
  });

  it('does not depend on option axis order', () => {
    const reordered = makeProduct({
      id: 2,
      title: 'Performance Wheels',
      handle: 'performance-wheels',
      options: [
        { name: 'Bore', position: 1, values: ['1.125 in. Bearing Bore'] },
        { name: 'Diameter', position: 2, values: ['6 inch'] },
        { name: 'Tread Width', position: 3, values: ['1 inch'] },
      ],
      variants: [
        makeVariant({
          id: 20,
          sku: 'am-3868',
          option1: '1.125 in. Bearing Bore',
          option2: '6 inch',
          option3: '1 inch',
        }),
      ],
    });
    const result = parseAndyMarkWheels([reordered]);
    expect(result).toHaveLength(1);
    expect(result[0].bore).toBe('1.125" Round');
    expect(result[0].diameter).toBeCloseTo(152.4, 6);
  });

  it('falls back to the title when there is no diameter axis', () => {
    const result = parseAndyMarkWheels([
      makeProduct({
        id: 3,
        title: '2 in. Dualie Omni Wheel',
        handle: '2-in-dualie-omni-wheel',
        options: [
          { name: 'Bore', position: 1, values: ['14 mm Hex'] },
          { name: 'Durometer', position: 2, values: ['35A'] },
        ],
        variants: [
          makeVariant({
            id: 30,
            sku: 'am-3902_green',
            option1: '14 mm Hex',
            option2: '35A',
          }),
        ],
      }),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].diameter).toBe(50.8);
    expect(result[0].bore).toBe('14mm Hex');
    expect(result[0].type).toBe('Omni');
  });

  it('resolves a bore-less family through a handle override', () => {
    const result = parseAndyMarkWheels([
      makeProduct({
        id: 4,
        title: 'HiGrip Wheels',
        handle: 'higrip-wheels',
        options: [
          { name: 'Diameter', position: 1, values: ['4 in.'] },
          { name: 'Durometer', position: 2, values: ['80A'] },
        ],
        variants: [
          makeVariant({
            id: 40,
            sku: 'am-2256',
            option1: '4 in.',
            option2: '80A',
          }),
        ],
      }),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].bore).toBe('AndyMark Hub');
  });

  it('reports and drops a family with no bore and no override', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = parseAndyMarkWheels([
      makeProduct({
        id: 6,
        title: 'Mystery Traction Wheel',
        handle: 'mystery-traction-wheel',
        options: [{ name: 'Diameter', position: 1, values: ['4 in.'] }],
        variants: [makeVariant({ id: 60, sku: 'am-9999', option1: '4 in.' })],
      }),
    ]);
    expect(result).toEqual([]);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('am-9999'));
    warn.mockRestore();
  });

  it('skips Ships from Sydney duplicates', () => {
    expect(
      parseAndyMarkWheels([
        makeProduct({
          id: 5,
          title: 'Ships from Sydney - Compliant Wheels',
          handle: 'sydney-compliant-wheels',
          options: [
            { name: 'Bore', position: 1, values: ['1/2 in Hex'] },
            { name: 'Diameter', position: 2, values: ['2 inch'] },
          ],
          variants: [
            makeVariant({
              id: 50,
              sku: 'am-3462_greenAUS',
              option1: '1/2 in Hex',
              option2: '2 inch',
            }),
          ],
        }),
      ]),
    ).toEqual([]);
  });
});

describe('parseThriftyWheels', () => {
  it('reads bore from the Bore Size axis and diameter from the title', () => {
    const result = parseThriftyWheels([
      makeProduct({
        id: 1,
        title: 'QTY 4 - 2 Inch Vectored Intake Wheel',
        handle: 'qty-4-2-inch-vectored-intake-wheel',
        options: [
          { name: 'Color', position: 1, values: ['Black'] },
          { name: 'Bore Size', position: 2, values: ['7mm Hex'] },
        ],
        variants: [
          makeVariant({
            id: 10,
            sku: 'TTB-0010-BLACK-7MM',
            option1: 'Black',
            option2: '7mm Hex',
          }),
        ],
      }),
    ]);
    expect(result).toEqual([
      {
        name: 'Vectored Intake Wheel',
        diameter: 50.8,
        bore: '7mm Hex',
        type: 'Compliant',
        durometer: null,
        url: 'https://www.thethriftybot.com/products/qty-4-2-inch-vectored-intake-wheel',
        sku: 'TTB-0010-BLACK-7MM',
        vendor: 'Thrifty',
      },
    ]);
  });

  it('parses a bore stated in the title', () => {
    const result = parseThriftyWheels([
      makeProduct({
        id: 2,
        title: '4" Solid Urethane Wheel 1/2" Hex Bore - 45A Durometer',
        handle: '4-solid-urethane-wheel',
        variants: [makeVariant({ id: 20, sku: 'TTB-0106' })],
      }),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].bore).toBe('1/2" Hex');
    expect(result[0].type).toBe('Traction');
    expect(result[0].diameter).toBeCloseTo(101.6, 6);
  });

  it('ignores the leading quantity when reading diameter', () => {
    const result = parseThriftyWheels([
      makeProduct({
        id: 3,
        title: 'QTY 10 - 1 Inch Solid Urethane Wheel 1/2" Hex Bore - 60A',
        handle: 'qty-10-1-inch',
        variants: [makeVariant({ id: 30, sku: 'TTB-0371' })],
      }),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].diameter).toBeCloseTo(25.4, 6);
  });

  it('keeps a bore variant that has no sku of its own', () => {
    const result = parseThriftyWheels([
      makeProduct({
        id: 5,
        title: 'QTY 4 - 2 Inch Vectored Intake Wheel',
        handle: 'qty-4-2-inch-vectored-intake-wheel',
        options: [
          { name: 'Color', position: 1, values: ['Black'] },
          { name: 'Bore Size', position: 2, values: ['5mm Hex'] },
        ],
        variants: [
          makeVariant({
            id: 50,
            sku: null,
            option1: 'Black',
            option2: '5mm Hex',
          }),
        ],
      }),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].sku).toBeNull();
    expect(result[0].bore).toBe('5mm Hex');
  });

  it('defaults a Thrifty wheel with no stated bore to 1/2" Hex', () => {
    const result = parseThriftyWheels([
      makeProduct({
        id: 4,
        title: 'QTY 10 - 2 Inch Thrifty Squish Wheels',
        handle: 'qty-10-2-inch-thrifty-squish-wheels',
        variants: [makeVariant({ id: 40, sku: 'TTB-0032' })],
      }),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].bore).toBe('1/2" Hex');
  });

  it('does not report an unresolved bore for Thrifty wheels', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    parseThriftyWheels([
      makeProduct({
        id: 6,
        title: 'QTY 4 - 3 Inch Thrifty Squish Wheels',
        handle: 'qty-4-3-inch-thrifty-squish-wheels',
        variants: [makeVariant({ id: 60, sku: 'TTB-0066' })],
      }),
    ]);
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe('parseSwyftWheels', () => {
  const swyft = makeProduct({
    id: 1,
    title: 'SWYFT Intake Wheels',
    handle: 'swyft-intake-wheels',
    options: [
      {
        name: 'Size',
        position: 1,
        values: [
          'Bundle, 4 of Every Size, 16 Wheels Total',
          '1.5" (Pack of 4)',
        ],
      },
      { name: 'Bore', position: 2, values: ['1/2" Hex', '7mm Hex'] },
    ],
    variants: [
      makeVariant({
        id: 10,
        sku: 'SR-INTAKEWHEEL-BUNDLE-12',
        option1: 'Bundle, 4 of Every Size, 16 Wheels Total',
        option2: '1/2" Hex',
      }),
      makeVariant({
        id: 11,
        sku: 'SR-INTAKEWHEEL-15-7MM',
        option1: '1.5" (Pack of 4)',
        option2: '7mm Hex',
      }),
    ],
  });

  it('parses diameter and bore from the option axes', () => {
    expect(parseSwyftWheels([swyft])).toEqual([
      {
        name: 'SWYFT Intake Wheels',
        diameter: 38.1,
        bore: '7mm Hex',
        type: 'Compliant',
        durometer: null,
        url: 'https://shop.swyftrobotics.com/products/swyft-intake-wheels',
        sku: 'SR-INTAKEWHEEL-15-7MM',
        vendor: 'Swyft',
      },
    ]);
  });

  it('skips the bundle variant, which has no single diameter', () => {
    expect(parseSwyftWheels([swyft]).map((w) => w.sku)).not.toContain(
      'SR-INTAKEWHEEL-BUNDLE-12',
    );
  });
});

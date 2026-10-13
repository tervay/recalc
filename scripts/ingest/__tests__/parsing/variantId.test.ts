import { readFileSync } from 'fs';
import { join } from 'path';

import { parseAndyMarkBelts } from 'scripts/ingest/parsing/andymark/belts';
import { parseAndyMarkGears } from 'scripts/ingest/parsing/andymark/gears';
import { parseAndyMarkPulleys } from 'scripts/ingest/parsing/andymark/pulleys';
import { parseAndyMarkSprockets } from 'scripts/ingest/parsing/andymark/sprockets';
import { parseAndyMarkWheels } from 'scripts/ingest/parsing/andymark/wheels';
import { parseLastAnvilBelts } from 'scripts/ingest/parsing/lastanvil/belts';
import { parseLastAnvilPulleys } from 'scripts/ingest/parsing/lastanvil/pulleys';
import { parseLastAnvilSprockets } from 'scripts/ingest/parsing/lastanvil/sprockets';
import { parseREVBelts } from 'scripts/ingest/parsing/rev/belts';
import { parseREVGears } from 'scripts/ingest/parsing/rev/gears';
import { parseREVPulleys } from 'scripts/ingest/parsing/rev/pulleys';
import { parseREVSprockets } from 'scripts/ingest/parsing/rev/sprockets';
import { parseREVWheels } from 'scripts/ingest/parsing/rev/wheels';
import { parseSDSBelts } from 'scripts/ingest/parsing/sds/belts';
import { parseSDSGears } from 'scripts/ingest/parsing/sds/gears';
import { parseSwyftBelts } from 'scripts/ingest/parsing/swyft/belts';
import { parseSwyftWheels } from 'scripts/ingest/parsing/swyft/wheels';
import { parseThriftyBelts } from 'scripts/ingest/parsing/thrifty/belts';
import { parseThriftyPulleys } from 'scripts/ingest/parsing/thrifty/pulleys';
import { parseThriftySprockets } from 'scripts/ingest/parsing/thrifty/sprockets';
import { parseThriftyWheels } from 'scripts/ingest/parsing/thrifty/wheels';
import { parseVBeltGuysBelts } from 'scripts/ingest/parsing/vbeltguys/belts';
import { parseWCPBelts } from 'scripts/ingest/parsing/wcp/belts';
import { parseWCPGears } from 'scripts/ingest/parsing/wcp/gears';
import { parseWCPPulleys } from 'scripts/ingest/parsing/wcp/pulleys';
import { parseWCPSprockets } from 'scripts/ingest/parsing/wcp/sprockets';
import { parseWCPWheels } from 'scripts/ingest/parsing/wcp/wheels';
import type { REVFeedProduct } from 'scripts/ingest/retrieval/rev';
import { feedEntryToShopifyProduct } from 'scripts/ingest/retrieval/rev';
import { describe, expect, it } from 'vitest';

import type {
  ShopifyOption,
  ShopifyProduct,
  ShopifyVariant,
} from '~/lib/types/shopify';

function variant(
  id: number,
  title: string,
  overrides: Partial<ShopifyVariant> = {},
): ShopifyVariant {
  return {
    id,
    title,
    option1: title,
    option2: null,
    option3: null,
    sku: `SKU-${id}`,
    requires_shipping: true,
    taxable: true,
    featured_image: null,
    available: true,
    price: '10.00',
    grams: 0,
    compare_at_price: null,
    position: 1,
    product_id: 1,
    created_at: '',
    updated_at: '',
    ...overrides,
  };
}

function product(
  title: string,
  variants: ShopifyVariant[],
  handle = 'test-handle',
  options: ShopifyOption[] = [],
): ShopifyProduct {
  return {
    id: 1,
    title,
    handle,
    body_html: '',
    published_at: '',
    created_at: '',
    updated_at: '',
    vendor: '',
    product_type: '',
    tags: [],
    variants,
    images: [],
    options,
  };
}

function variantIds(items: { variantId: number | null }[]) {
  return items.map((item) => item.variantId);
}

describe('variantId', () => {
  describe('WCP', () => {
    it('takes the first variant id for pulleys', () => {
      const result = parseWCPPulleys([
        product(
          'WCP-0432 20t x 9mm Wide Flanged HTD 5mm Pulley (HTD 5mm, 1/2" Hex Bore)',
          [variant(101, 'Default Title')],
        ),
      ]);
      expect(variantIds(result)).toEqual([101]);
    });

    it('takes the first variant id for belts', () => {
      const result = parseWCPBelts([
        product('WCP-0001 100t x 15mm Timing Belt (HTD 5mm)', [
          variant(102, 'Default Title'),
        ]),
      ]);
      expect(variantIds(result)).toEqual([102]);
    });

    it('takes the first variant id for sprockets', () => {
      const result = parseWCPSprockets([
        product('WCP-0200 16t Sprocket (#25 Chain, 1/2" Hex Bore)', [
          variant(103, 'Default Title'),
        ]),
      ]);
      expect(variantIds(result)).toEqual([103]);
    });

    it('takes the first variant id for gears', () => {
      const result = parseWCPGears([
        product('WCP-0300 20t Gear (20 DP, 1/2" Hex Bore)', [
          variant(104, 'Default Title'),
        ]),
      ]);
      expect(variantIds(result)).toEqual([104]);
    });

    it('takes the first variant id for wheels', () => {
      const result = parseWCPWheels([
        product(
          '3" OD x 1" Wide Straight Flex Wheel (1/2" Hex, 30A)',
          [variant(105, 'Default Title', { sku: 'WCP-1299' })],
          'wcp-1299',
        ),
      ]);
      expect(variantIds(result)).toEqual([105]);
    });
  });

  describe('Swyft', () => {
    it('takes each variant id for belts', () => {
      const result = parseSwyftBelts([
        product('HTD 5mm Pitch Timing Belts', [
          variant(201, '40 Tooth / 15mm Width'),
          variant(202, '50 Tooth / 9mm Width'),
        ]),
      ]);
      expect(variantIds(result)).toEqual([201, 202]);
    });

    it('takes each variant id for wheels', () => {
      const result = parseSwyftWheels([
        product(
          'SWYFT Intake Wheels',
          [
            variant(203, '1.5" (Pack of 4) / 7mm Hex', {
              option1: '1.5" (Pack of 4)',
              option2: '7mm Hex',
            }),
            variant(204, '2" (Pack of 4) / 1/2" Hex', {
              option1: '2" (Pack of 4)',
              option2: '1/2" Hex',
            }),
          ],
          'swyft-intake-wheels',
          [
            {
              name: 'Size',
              position: 1,
              values: ['1.5" (Pack of 4)', '2" (Pack of 4)'],
            },
            { name: 'Bore', position: 2, values: ['7mm Hex', '1/2" Hex'] },
          ],
        ),
      ]);
      expect(variantIds(result)).toEqual([203, 204]);
    });
  });

  describe('Thrifty', () => {
    it('takes each variant id for belts', () => {
      const result = parseThriftyBelts([
        product('Single Sided 9mm Wide HTD Timing Belts', [
          variant(301, '60 Tooth'),
          variant(302, '70 Tooth'),
        ]),
      ]);
      expect(variantIds(result)).toEqual([301, 302]);
    });

    it('takes each variant id for multi-variant pulleys', () => {
      const result = parseThriftyPulleys([
        product('1/2" Hex Bore Aluminum HTD Pulleys', [
          variant(303, '9.5mm Wide 24 Tooth 1/2" Hex'),
          variant(304, '18.5mm Wide 36 Tooth 1/2" Hex'),
        ]),
      ]);
      expect(variantIds(result)).toEqual([303, 304]);
    });

    it('takes the first variant id for motor output pulleys', () => {
      const result = parseThriftyPulleys([
        product('QTY 1 - 11 Tooth HTD Falcon Motor Output Pulley', [
          variant(305, 'Default Title'),
        ]),
      ]);
      expect(variantIds(result)).toEqual([305]);
    });

    it('takes the first variant id for bore pulleys', () => {
      const result = parseThriftyPulleys([
        product('QTY 1 - 48 Tooth HTD Pulley - Bearing / Hub Bore', [
          variant(306, 'Default Title'),
        ]),
      ]);
      expect(variantIds(result)).toEqual([306]);
    });

    it('takes each variant id for plate sprockets', () => {
      const result = parseThriftySprockets([
        product('#35 Flat Plate Sprockets', [
          variant(307, '18 Tooth'),
          variant(308, '22 Tooth'),
        ]),
      ]);
      expect(variantIds(result)).toEqual([307, 308]);
    });

    it('takes the variant id for the 22 tooth hex sprocket', () => {
      const result = parseThriftySprockets([
        product('QTY 2 - Half Inch Hex 22 Tooth #25 Sprocket', [
          variant(309, 'Default Title'),
        ]),
      ]);
      expect(variantIds(result)).toEqual([309]);
    });

    it('takes the inner variant id for titled sprockets', () => {
      const result = parseThriftySprockets([
        product('#25 Sprockets', [
          variant(310, '16 Tooth 1/2" Hex Bore Sprocket'),
        ]),
      ]);
      expect(variantIds(result)).toEqual([310]);
    });

    it('takes each variant id for wheels', () => {
      const result = parseThriftyWheels([
        product(
          '4" Solid Urethane Wheel 1/2" Hex Bore - 45A Durometer',
          [variant(311, 'Default Title')],
          '4-solid-urethane-wheel',
        ),
      ]);
      expect(variantIds(result)).toEqual([311]);
    });
  });

  describe('AndyMark', () => {
    it('takes each variant id for belts', () => {
      const result = parseAndyMarkBelts([
        product('9 mm Wide 5 mm Pitch HTD Timing Belts', [
          variant(401, '60'),
          variant(402, '70'),
        ]),
      ]);
      expect(variantIds(result)).toEqual([401, 402]);
    });

    it('takes the only variant id for single gears', () => {
      const result = parseAndyMarkGears([
        product('40 Tooth 20 DP 0.375 in. Hex Bore Steel Gear', [
          variant(403, 'Default Title'),
        ]),
      ]);
      expect(variantIds(result)).toEqual([403]);
    });

    it('takes each variant id for gear families', () => {
      const result = parseAndyMarkGears([
        product('20 DP Gears', [
          variant(404, '0.5 in. Hex / 30'),
          variant(405, '0.5 in. Hex / 40'),
        ]),
      ]);
      expect(variantIds(result)).toEqual([404, 405]);
    });

    it('takes the only variant id for single pulleys', () => {
      const result = parseAndyMarkPulleys([
        product('42 Tooth 5 mm HTD 15 mm Wide Bearing Bore Plastic Pulley', [
          variant(406, 'Default Title'),
        ]),
      ]);
      expect(variantIds(result)).toEqual([406]);
    });

    it('takes each variant id for pulley families', () => {
      const result = parseAndyMarkPulleys([
        product('24 Tooth 5 mm HTD 15 mm Wide Pulley', [
          variant(407, 'Bore = 0.5 in. Hex'),
          variant(408, 'Bore = 8 mm'),
        ]),
      ]);
      expect(variantIds(result)).toEqual([407, 408]);
    });

    it('takes the only variant id for single sprockets', () => {
      const result = parseAndyMarkSprockets([
        product('35 Series 22 Tooth 0.5 in. Hex Bore Sprocket', [
          variant(409, 'Default Title'),
        ]),
      ]);
      expect(variantIds(result)).toEqual([409]);
    });

    it('takes each variant id for sprocket families', () => {
      const result = parseAndyMarkSprockets([
        product('25 Series Plate Sprockets', [
          variant(410, '16 Tooth'),
          variant(411, '22 Tooth'),
        ]),
      ]);
      expect(variantIds(result)).toEqual([410, 411]);
    });

    it('takes each variant id for wheels', () => {
      const result = parseAndyMarkWheels([
        product(
          'Compliant Wheels',
          [
            variant(412, '3/8 in Hex / 2 inch / 35A', {
              option1: '3/8 in Hex',
              option2: '2 inch',
              option3: '35A',
            }),
            variant(413, '3/8 in Hex / 2 1/4 inch / 35A', {
              option1: '3/8 in Hex',
              option2: '2 1/4 inch',
              option3: '35A',
            }),
          ],
          'compliant-wheels',
          [
            { name: 'Bore', position: 1, values: ['3/8 in Hex'] },
            { name: 'Diameter', position: 2, values: ['2 inch', '2 1/4 inch'] },
            { name: 'Durometer', position: 3, values: ['35A'] },
          ],
        ),
      ]);
      expect(variantIds(result)).toEqual([412, 413]);
    });
  });

  describe('LastAnvil', () => {
    it('takes each variant id for belts', () => {
      const result = parseLastAnvilBelts([
        product('HTD Timing Belt (9mm)', [
          variant(501, '60T'),
          variant(502, '70T'),
        ]),
      ]);
      expect(variantIds(result)).toEqual([501, 502]);
    });

    it('takes each variant id for pulleys', () => {
      const result = parseLastAnvilPulleys([
        product('HTD Pulley', [
          variant(503, '18T / 9mm'),
          variant(504, '24T / 9mm'),
        ]),
      ]);
      expect(variantIds(result)).toEqual([503, 504]);
    });

    it('uses the live variant id for the idler sprocket', () => {
      expect(variantIds(parseLastAnvilSprockets())).toEqual([43296203997390]);
    });
  });

  describe('SDS', () => {
    it('takes the first variant id for belts', () => {
      const result = parseSDSBelts([
        product('Belt, Timing, HTD 400-5M-15', [variant(601, 'Default Title')]),
      ]);
      expect(variantIds(result)).toEqual([601]);
    });

    it('takes the first variant id for gears', () => {
      const result = parseSDSGears([
        product('Gear, 32DP, 15T, 8mm Bore', [variant(602, 'Default Title')]),
      ]);
      expect(variantIds(result)).toEqual([602]);
    });
  });

  describe('VBeltGuys', () => {
    it('takes the first variant id for belts', () => {
      const result = parseVBeltGuysBelts([
        product(
          '120-3m-09',
          [variant(701, 'Default Title')],
          '120-3m-09-synchronous-timing-belt',
        ),
      ]);
      expect(variantIds(result)).toEqual([701]);
    });
  });

  describe('REV', () => {
    const fixture = JSON.parse(
      readFileSync(join(__dirname, '../fixtures/rev-products.json'), 'utf-8'),
    ) as REVFeedProduct[];
    const revProducts = [
      ...fixture.map(feedEntryToShopifyProduct),
      product(
        'ION Grip Wheels (2in - MAXSpline - Medium - Grip Wheel (REV-21-2437-PK4))',
        [variant(801, 'Default Title', { sku: 'REV-21-2437-PK4' })],
        'https://www.revrobotics.com/ION-Grip-Wheels/',
      ),
    ];

    it.each([
      ['belts', parseREVBelts],
      ['gears', parseREVGears],
      ['pulleys', parseREVPulleys],
      ['sprockets', parseREVSprockets],
      ['wheels', parseREVWheels],
    ])('leaves %s without a Shopify variant id', (_, parse) => {
      const ids = new Set(variantIds(parse(revProducts)));
      expect(ids).toEqual(new Set([null]));
    });
  });
});

import { program } from 'commander';
import { mkdir, writeFile } from 'fs/promises';
import { isEqual, some } from 'lodash-es';
import { FileSystemCache, NodeFetchCache } from 'node-fetch-cache';
import { join } from 'path';
import { format } from 'prettier';

import { SimpleBelt } from '~/lib/models/Belt';
import Measurement from '~/lib/models/Measurement';
import {
  type JSONBelt,
  andyMarkBeltToJsonBelt,
  wcpBeltToJsonBelt,
  zAndyMarkBelt,
  zWCPBelt,
} from '~/lib/types/belts';
import { type JSONGear, wcpGearToJsonGear, zWCPGear } from '~/lib/types/gears';
import type {
  JSONPlanetary,
  JSONPlanetaryInstance,
} from '~/lib/types/planetary';
import {
  type AndyMarkPulley,
  type JSONPulley,
  andyMarkPulleyToJsonPulley,
  revPulleyToJsonPulley,
  thriftyPulleyToJsonPulley,
  wcpPulleyToJsonPulley,
  zAndyMarkPulley,
  zREVPulley,
  zThriftyPulley,
  zWCPPulley,
} from '~/lib/types/pulleys';
import type {
  ShopifyConfig,
  ShopifyProduct,
  ShopifyResponse,
} from '~/lib/types/shopify';
import {
  type ChainType,
  type JSONSprocket,
  type ThriftySprocketBore,
  thriftySprocketToJsonSprocket,
  wcpSprocketToJsonSprocket,
  zThriftySprocket,
  zWCPSprocket,
} from '~/lib/types/sprockets';

function urlForHandle(handle: string, vendor: string) {
  const conf = CONFIGS.find((c) => c.vendorName === vendor);
  if (!conf) {
    throw new Error(`Config not found for vendor: ${vendor}`);
  }
  return `${conf.rootDomain}/products/${handle}`;
}

const CONFIGS: ShopifyConfig[] = [
  {
    vendorName: 'WCP',
    rootDomain: 'https://wcproducts.com',
  },
  {
    vendorName: 'Swyft',
    rootDomain: 'https://swyftrobotics.com',
  },
  {
    vendorName: 'TheThriftyBot',
    rootDomain: 'https://www.thethriftybot.com',
  },
  {
    vendorName: 'VBeltGuys',
    rootDomain: 'https://www.vbeltguys.com',
  },
  {
    vendorName: 'AndyMark',
    rootDomain: 'https://www.andymark.com',
  },
];

const fetch = NodeFetchCache.create({
  cache: new FileSystemCache({
    cacheDirectory: join(process.cwd(), '.cache'),
  }),
  shouldCacheResponse: (response) => [200, 404].includes(response.status),
});

async function getAllProducts(vendor: string): Promise<ShopifyProduct[]> {
  const config = CONFIGS.find((c) => c.vendorName === vendor);
  if (!config) {
    throw new Error(`Config not found for vendor: ${vendor}`);
  }

  let pageNum = 1;
  const products: ShopifyProduct[] = [];

  while (true) {
    const response = await fetch(
      `${config.rootDomain}/products.json?page=${pageNum}&limit=250`,
    );
    const data = (await response.json()) as ShopifyResponse;
    if (data.products.length === 0) {
      break;
    }
    products.push(...data.products);
    pageNum++;
  }

  return products;
}

async function writeJson(
  data: (
    | JSONBelt
    | JSONPulley
    | JSONGear
    | JSONSprocket
    | JSONPlanetaryInstance
  )[],
  vendor: string,
  productType: string,
) {
  const outdir = join(process.cwd(), 'app/genData', vendor);
  const outFile = join(outdir, `${productType}.json`);

  await mkdir(outdir, { recursive: true });
  const jsonString = JSON.stringify(data, null, 2);
  const formatted = await format(jsonString, {
    filepath: outFile,
  });
  await writeFile(outFile, formatted);
}

async function wcpBelts() {
  const regex =
    /(?<teeth>\d+)t\s*x\s*(?<width>\d+)mm.*\((?<profile>HTD|GT2)\s*(?<pitch>\d+)mm\)/;
  const allProducts = await getAllProducts('WCP');
  const belts: JSONBelt[] = [];

  for (const product of allProducts) {
    if (product.title.includes('Timing Belt')) {
      const match = product.title.match(regex);
      if (match?.groups) {
        const { teeth, width, profile, pitch } = match.groups;
        const wcpBelt = zWCPBelt.parse({
          teeth: parseInt(teeth),
          width: parseInt(width),
          profile,
          pitch: parseInt(pitch),
          url: urlForHandle(product.handle, 'WCP'),
          sku: product.variants[0].sku,
          vendor: 'WCP',
        });
        belts.push(wcpBeltToJsonBelt(wcpBelt));
      }
    }
  }

  await writeJson(belts, 'WCP', 'belts');
}

async function wcpPulleys() {
  const regex =
    /(?<teeth>\d+)t\s*x\s*(?<width>\d+)mm\s*Wide\s*(?<flangeType>.*)\s*(?<profile>GT2|HTD)\s*(?<pitch>\d+)mm(?:.*,\s*(?<bore>.*?) Bore\))?/;
  const allProducts = await getAllProducts('WCP');
  const pulleys: JSONPulley[] = [];

  for (const product of allProducts) {
    if (product.title.includes('Pulley')) {
      const match = product.title.match(regex);
      if (match?.groups) {
        const { teeth, width, profile, pitch, bore } = match.groups;
        if (bore === undefined) {
          continue;
        }

        const wcpPulley = zWCPPulley.parse({
          teeth: parseInt(teeth),
          width: parseInt(width),
          profile,
          pitch: parseInt(pitch),
          bore,
          url: urlForHandle(product.handle, 'WCP'),
          sku: product.variants[0].sku,
        });
        pulleys.push(wcpPulleyToJsonPulley(wcpPulley));
      }
    }
  }

  await writeJson(pulleys, 'WCP', 'pulleys');
}

async function wcpGears() {
  const allProducts = await getAllProducts('WCP');
  const gears: JSONGear[] = [];
  const regex =
    /(?<toothCount>\d+)t.*?\(\s*(?<dp>\d+)\s*DP(?:,\s*[^,]+)?,\s*(?<bore>[^)]+)\)/;

  for (const product of allProducts) {
    if (product.title.includes('Gear')) {
      const match = product.title.match(regex);
      if (match?.groups) {
        const { toothCount, dp, bore } = match.groups;
        try {
          const wcpGear = zWCPGear.parse({
            teeth: parseInt(toothCount),
            dp: parseInt(dp),
            bore,
            url: urlForHandle(product.handle, 'WCP'),
            sku: product.variants[0].sku,
          });
          gears.push(wcpGearToJsonGear(wcpGear));
        } catch {
          console.error(`Error parsing gear: ${product.title}`);
        }
      }
    }
  }

  await writeJson(gears, 'WCP', 'gears');
}

async function wcpSprockets() {
  const allProducts = await getAllProducts('WCP');
  const sprockets: JSONSprocket[] = [];
  const regex = /(?<tooth>\d+)t.*?\((?<chain>#\d+)[^)]+,\s*(?<bore>[^)]+)\)/;

  for (const product of allProducts) {
    if (product.title.includes('Sprocket')) {
      const match = product.title.match(regex);
      if (match?.groups) {
        const { tooth, chain, bore } = match.groups;

        const wcpSprocket = zWCPSprocket.parse({
          teeth: parseInt(tooth),
          chainType: chain,
          bore,
          url: urlForHandle(product.handle, 'WCP'),
          sku: product.variants[0].sku,
        });
        sprockets.push(wcpSprocketToJsonSprocket(wcpSprocket));
      }
    }
  }

  await writeJson(sprockets, 'WCP', 'sprockets');
}

async function swyftBelts() {
  const allProducts = await getAllProducts('Swyft');

  const belts: JSONBelt[] = [];

  for (const product of allProducts) {
    if (product.title.includes('Timing Belt')) {
      const width = product.title.includes('9mm Width') ? 9 : 15;

      for (const variant of product.variants) {
        const teeth = Number(variant.title.split(' ')[0]);
        if (!isNaN(teeth) && teeth > 0) {
          belts.push({
            teeth,
            width,
            profile: 'HTD',
            pitch: 5,
            sku: variant.sku,
            url: urlForHandle(product.handle, 'Swyft'),
            vendor: 'Swyft',
          });
        }
      }
    }
  }

  await writeJson(belts, 'Swyft', 'belts');
}

async function vbeltGuysBelts() {
  const belts: JSONBelt[] = [];
  const toothIncrement = 5;

  for (const pitchMm of [3, 5]) {
    for (const widthMm of [9, 15]) {
      let toothCount = 5;

      while (toothCount <= 1000) {
        const simpleBelt = new SimpleBelt(
          toothCount,
          new Measurement(pitchMm, 'mm'),
        );
        const beltLength = Math.round(simpleBelt.length.to('mm').scalar);
        const pitchStr = simpleBelt.pitch.format().replace(' mm', 'm');
        const widthStr = new Measurement(widthMm, 'mm')
          .format()
          .replace(' mm', '')
          .padStart(2, '0');

        const url = `https://www.vbeltguys.com/products/${beltLength}-${pitchStr}-${widthStr}-synchronous-timing-belt`;

        const response = await fetch(url);
        if (response.status === 200) {
          belts.push({
            teeth: toothCount,
            width: widthMm,
            profile: pitchMm === 3 ? 'GT2' : 'HTD',
            pitch: pitchMm,
            sku: `${beltLength}-${pitchStr}-${widthStr}`,
            url: url,
            vendor: 'VBeltGuys',
          });
        }

        toothCount += toothIncrement;
        console.log(`${url} // ${response.status}`);
      }
    }
  }

  await writeJson(belts, 'VBeltGuys', 'belts');
}

async function thriftyPulleys() {
  const allProducts = await getAllProducts('TheThriftyBot');
  const pulleys: JSONPulley[] = [];

  for (const product of allProducts) {
    if (product.title.includes('Pulley')) {
      /* 2 cases:
      QTY 1 - 48 Tooth HTD Pulley - Bearing / Hub Bore
      QTY 1 - 36 Tooth HTD Pulley 1/2" Hex Bore
      QTY 1 - 24 Tooth HTD Pulley 1/2" Hex Bore

      or

      QTY 1 - 11 Tooth HTD Falcon Motor Output Pulley
      QTY 1 - 11 Tooth HTD 8mm Keyed Motor Output Pulley
      */

      if (product.title.endsWith('Pulley')) {
        const regex =
          /QTY \d+ - (?<tooth>\d+) Tooth (?<profile>\w+) (?<bore>[\w\s]+) Motor Output Pulley/i;

        const match = product.title.match(regex);
        if (match?.groups) {
          const { tooth, profile, bore } = match.groups;
          try {
            const thriftyPulley = zThriftyPulley.parse({
              teeth: parseInt(tooth),
              profile,
              bore,
              sku: product.variants[0].sku,
              url: urlForHandle(product.handle, 'TheThriftyBot'),
            });
            pulleys.push(thriftyPulleyToJsonPulley(thriftyPulley));
          } catch {
            console.log(`Error parsing pulley: ${product.title}`);
          }
        }
      } else {
        const regex =
          /QTY \d+ - (?<tooth>\d+) Tooth (?<profile>\w+) Pulley(?: - (?<bore1>.+?)| (?<bore2>.+?)) Bore/i;

        const match = product.title.match(regex);
        if (match?.groups) {
          const { tooth, profile, bore1, bore2 } = match.groups;
          const bore = bore1 ?? bore2;
          try {
            const thriftyPulley = zThriftyPulley.parse({
              teeth: parseInt(tooth),
              profile,
              bore,
              sku: product.variants[0].sku,
              url: urlForHandle(product.handle, 'TheThriftyBot'),
            });
            pulleys.push(thriftyPulleyToJsonPulley(thriftyPulley));
          } catch {
            console.log(`Error parsing pulley: ${product.title}`);
          }
        }
      }
    }
  }

  await writeJson(pulleys, 'Thrifty', 'pulleys');
}

async function thriftySprockets() {
  const allProducts = await getAllProducts('TheThriftyBot');
  const sprockets: JSONSprocket[] = [];

  for (const product of allProducts) {
    for (const variant of product.variants) {
      if (
        product.title === '#35 Chain Billet Sprockets' ||
        product.title === '#35 Flat Plate Sprockets'
      ) {
        sprockets.push({
          teeth: parseInt(variant.title.split(' ')[0]),
          bore: '1.125" Round',
          chainType: '#35',
          sku: variant.sku,
          url: urlForHandle(product.handle, 'TheThriftyBot'),
          vendor: 'Thrifty',
        });
      } else if (
        product.title === '#25 Chain Billet Sprockets' ||
        product.title === '#25 Flat Plate Sprockets'
      ) {
        sprockets.push({
          teeth: parseInt(variant.title.split(' ')[0]),
          bore: '1.125" Round',
          chainType: '#25',
          sku: variant.sku,
          url: urlForHandle(product.handle, 'TheThriftyBot'),
          vendor: 'Thrifty',
        });
      } else {
        const regex =
          /(?<chainType>#\d+).*?(?<toothCount>\d+)\s+Tooth\s+(?<boreType>.+? Bore)/;
        if (variant.title.includes('Sprocket')) {
          for (const variant of product.variants) {
            const match = `${product.title} // ${variant.title}`.match(regex);
            if (match?.groups) {
              const { chainType, toothCount, boreType } = match.groups;
              const thriftySprocket = zThriftySprocket.parse({
                chainType: chainType as ChainType,
                teeth: Number(toothCount),
                bore: boreType as ThriftySprocketBore,
                sku: variant.sku,
                url: urlForHandle(product.handle, 'TheThriftyBot'),
              });
              sprockets.push(thriftySprocketToJsonSprocket(thriftySprocket));
            }
          }
        }
      }
    }
  }

  await writeJson(sprockets, 'Thrifty', 'sprockets');
}

async function revBelts() {
  const toothCounts: number[] = [
    32, 36, 40, 48, 56, 64, 72, 80, 88, 96, 104, 112, 120, 128, 136, 144, 152,
    160, 168, 176, 184, 192, 200, 208, 216,
  ];

  const belts: JSONBelt[] = [];

  for (const toothCount of toothCounts) {
    belts.push({
      teeth: toothCount,
      width: new Measurement(0.5, 'in').to('mm').scalar,
      profile: 'RT25',
      pitch: new Measurement(0.25, 'in').to('mm').scalar,
      sku: `REV-21-${toothCount + 4000}`,
      url: 'https://www.revrobotics.com/RT25-Belts-1/2in-Width',
      vendor: 'REV',
    });
  }

  await writeJson(belts, 'REV', 'belts');
}

async function revPulleys() {
  const data: {
    teeth: number;
    bore: '8mm' | '1/2" Hex' | 'MAXSpline';
    width: number;
    sku: string;
  }[] = [
    {
      teeth: 12,
      bore: '8mm',
      width: 0.5,
      sku: 'REV-21-2200',
    },
    {
      teeth: 16,
      bore: '1/2" Hex',
      width: 0.5,
      sku: 'REV-21-2205',
    },
    {
      teeth: 16,
      bore: '1/2" Hex',
      width: 1,
      sku: 'REV-21-2206',
    },
    {
      teeth: 24,
      bore: 'MAXSpline',
      width: 0.5,
      sku: 'REV-21-2224',
    },
    {
      teeth: 32,
      bore: 'MAXSpline',
      width: 0.5,
      sku: 'REV-21-2236',
    },
    {
      teeth: 40,
      bore: 'MAXSpline',
      width: 0.5,
      sku: 'REV-21-2248',
    },
    {
      teeth: 48,
      bore: 'MAXSpline',
      width: 0.5,
      sku: 'REV-21-2260',
    },
    {
      teeth: 56,
      bore: 'MAXSpline',
      width: 0.5,
      sku: 'REV-21-2272',
    },
    {
      teeth: 64,
      bore: 'MAXSpline',
      width: 0.5,
      sku: 'REV-21-2284',
    },
  ];

  const pulleys: JSONPulley[] = [];

  for (const item of data) {
    const revPulley = zREVPulley.parse({
      teeth: item.teeth,
      width: item.width,
      bore: item.bore,
      sku: item.sku,
      url: 'https://www.revrobotics.com/RT25-Pulleys/',
    });
    pulleys.push(revPulleyToJsonPulley(revPulley));
  }

  pulleys.push({
    teeth: 16,
    width: 25.4,
    profile: 'GT2',
    pitch: 3,
    sku: 'REV-21-1909',
    url: 'https://www.revrobotics.com/neo-pinions/',
    bore: '8mm',
    vendor: 'REV',
  });

  pulleys.push({
    teeth: 12,
    width: 16,
    profile: 'GT2',
    pitch: 3,
    sku: 'REV-21-1908',
    url: 'https://www.revrobotics.com/550-motor-pinions/',
    bore: 'RS550',
    vendor: 'REV',
  });

  await writeJson(pulleys, 'REV', 'pulleys');
}

async function revSprockets() {
  const sprockets: JSONSprocket[] = [];

  for (const [index, toothCount] of [9, 10, 11, 12, 16, 18, 20, 24].entries()) {
    sprockets.push({
      teeth: toothCount,
      bore: '1/2" Hex',
      chainType: '#35',
      sku: `REV-21-${3706 + index}`,
      url: 'https://www.revrobotics.com/ION-35-Sprockets/',
      vendor: 'REV',
    });
  }

  for (const [index, toothCount] of [
    16, 18, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 68, 72, 76, 80,
  ].entries()) {
    sprockets.push({
      teeth: toothCount,
      bore: 'MAXSpline',
      chainType: '#35',
      sku: `REV-21-${3718 + index}`,
      url: 'https://www.revrobotics.com/ION-35-Sprockets/',
      vendor: 'REV',
    });
  }

  const ion25Sprockets: Pick<JSONSprocket, 'teeth' | 'bore' | 'sku'>[] = [
    {
      teeth: 12,
      bore: '1/2" Hex',
      sku: 'REV-21-2014',
    },
    {
      teeth: 16,
      bore: '1/2" Hex',
      sku: 'REV-21-2012',
    },
    {
      teeth: 16,
      bore: '1/2" Hex',
      sku: 'REV-21-2016',
    },
    {
      teeth: 24,
      bore: '1/2" Hex',
      sku: 'REV-21-2017',
    },
    {
      teeth: 32,
      bore: '1/2" Hex',
      sku: 'REV-21-2018',
    },
    {
      teeth: 24,
      bore: 'MAXSpline',
      sku: 'REV-21-2015',
    },
    {
      teeth: 32,
      bore: 'MAXSpline',
      sku: 'REV-21-2019',
    },
    {
      teeth: 48,
      bore: 'MAXSpline',
      sku: 'REV-21-1964',
    },
    {
      teeth: 64,
      bore: 'MAXSpline',
      sku: 'REV-21-1972',
    },
    {
      teeth: 40,
      bore: 'MAXSpline',
      sku: 'REV-21-3370',
    },
    {
      teeth: 48,
      bore: 'MAXSpline',
      sku: 'REV-21-3374',
    },
    {
      teeth: 56,
      bore: 'MAXSpline',
      sku: 'REV-21-3378',
    },
    {
      teeth: 64,
      bore: 'MAXSpline',
      sku: 'REV-21-3382',
    },
    {
      teeth: 72,
      bore: 'MAXSpline',
      sku: 'REV-21-3386',
    },
  ];

  sprockets.push(
    ...ion25Sprockets.map((sprocket) => ({
      ...sprocket,
      chainType: '#25' as const,
      url: 'https://www.revrobotics.com/ION-25-Sprockets/',
      vendor: 'REV',
    })),
  );

  sprockets.push({
    teeth: 10,
    bore: '8mm',
    chainType: '#25',
    sku: 'REV-21-2020',
    url: 'https://www.revrobotics.com/neo-pinions/',
    vendor: 'REV',
  });
  sprockets.push({
    teeth: 12,
    bore: '8mm',
    chainType: '#25',
    sku: 'REV-21-3495',
    url: 'https://www.revrobotics.com/neo-pinions/',
    vendor: 'REV',
  });

  await writeJson(sprockets, 'REV', 'sprockets');
}

async function revGears() {
  const gears: JSONGear[] = [];

  for (const [index, toothCount] of [
    32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60, 62, 64, 66, 68,
  ].entries()) {
    gears.push({
      teeth: toothCount,
      dp: 20,
      bore: 'MAXSpline',
      url: 'https://www.revrobotics.com/20DP-Gears-Maxspline/',
      sku: `REV-21-${3010 + index}`,
      vendor: 'REV',
    });
  }

  gears.push({
    teeth: 72,
    dp: 20,
    bore: 'MAXSpline',
    url: 'https://www.revrobotics.com/20DP-Gears-Maxspline/',
    sku: 'REV-21-3030',
    vendor: 'REV',
  });
  gears.push({
    teeth: 80,
    dp: 20,
    bore: 'MAXSpline',
    url: 'https://www.revrobotics.com/20DP-Gears-Maxspline/',
    sku: 'REV-21-3034',
    vendor: 'REV',
  });

  for (const [index, toothCount] of [
    18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54,
    56, 58, 60, 62, 64, 66, 68,
  ].entries()) {
    gears.push({
      teeth: toothCount,
      dp: 20,
      bore: '1/2" Hex',
      url: 'https://www.revrobotics.com/20DP-Gears-0.5-Hex/',
      sku: `REV-21-${1920 + index}`,
      vendor: 'REV',
    });
  }

  gears.push({
    teeth: 16,
    dp: 20,
    bore: '1/2" Hex',
    url: 'https://www.revrobotics.com/20DP-Gears-0.5-Hex/',
    sku: 'REV-21-2196',
    vendor: 'REV',
  });
  gears.push({
    teeth: 72,
    dp: 20,
    bore: '1/2" Hex',
    url: 'https://www.revrobotics.com/20DP-Gears-0.5-Hex/',
    sku: 'REV-21-1947',
    vendor: 'REV',
  });
  gears.push({
    teeth: 80,
    dp: 20,
    bore: '1/2" Hex',
    url: 'https://www.revrobotics.com/20DP-Gears-0.5-Hex/',
    sku: 'REV-21-1951',
    vendor: 'REV',
  });

  for (const [index, toothCount] of [10, 11, 12, 13, 14].entries()) {
    gears.push({
      teeth: toothCount,
      dp: 20,
      bore: '8mm',
      url: 'https://www.revrobotics.com/neo-pinions/',
      sku: `REV-21-${1998 + index}`,
      vendor: 'REV',
    });
  }

  gears.push({
    teeth: 12,
    dp: 32,
    bore: 'RS550',
    url: 'https://www.revrobotics.com/550-motor-pinions/',
    sku: 'REV-41-1660-PK2',
    vendor: 'REV',
  });

  await writeJson(gears, 'REV', 'gears');
}

interface PlanetaryReductionOption {
  slices: number[];
  ratio: number;
}
function getAllPossibleReductions(
  planetary: JSONPlanetary,
): PlanetaryReductionOption[] {
  const results: PlanetaryReductionOption[] = [];
  const maxSlices = planetary.maxSlices;
  const slices = planetary.slices;

  const backtrack = (startIndex: number, current: number[]) => {
    if (current.length > 0) {
      const ratio = current.reduce((a, b) => a * b, 1);
      results.push({ slices: [...current], ratio });
    }

    if (current.length === maxSlices) return;

    for (let i = startIndex; i < slices.length; i++) {
      current.push(slices[i]);
      backtrack(i, current);
      current.pop();
    }
  };

  backtrack(0, []);
  return results;
}

async function revPlanetaries() {
  const planetaries: JSONPlanetary[] = [
    {
      slices: [3, 4, 5, 9],
      maxSlices: 3,
      inputBores: ['8mm', '1/2" Hex', 'Vortex', 'SplineXS', 'RS550', 'RS775'],
      outputBores: ['1/2" Hex'],
      sku: 'REV-25-2109',
      url: 'https://www.revrobotics.com/maxplanetary-system-kit/',
      vendor: 'REV',
    },
    {
      slices: [3, 4, 5],
      maxSlices: 3,
      inputBores: ['RS550'],
      outputBores: ['5mm Hex'],
      sku: 'REV-41-1600',
      url: 'https://www.revrobotics.com/rev-41-1600',
      vendor: 'REV',
    },
  ];

  const overloadedSlices: number[][] = [
    [9, 4, 5],
    [9, 5, 5],
    [9, 9, 3],
    [9, 9, 4],
    [9, 9, 5],
    [9, 9, 9],
  ];

  function containsPermutation(arrays: number[][], target: number[]): boolean {
    const sortedTarget = [...target].sort((a, b) => a - b);
    return some(arrays, (inner) =>
      isEqual(
        [...inner].sort((a, b) => a - b),
        sortedTarget,
      ),
    );
  }

  const instances: JSONPlanetaryInstance[] = [];
  for (const planetary of planetaries) {
    for (const reduction of getAllPossibleReductions(planetary)) {
      if (containsPermutation(overloadedSlices, reduction.slices)) {
        continue;
      }

      for (const inputBore of planetary.inputBores) {
        for (const outputBore of planetary.outputBores) {
          instances.push({
            slices: reduction.slices,
            ratio: reduction.ratio,
            inputBore,
            outputBore,
            sku: planetary.sku,
            url: planetary.url,
            vendor: planetary.vendor,
          });
        }
      }
    }
  }

  await writeJson(instances, 'REV', 'planetaries');
}

async function andyMarkPulleys() {
  const pulleys: JSONPulley[] = [];

  const data: AndyMarkPulley[] = [
    {
      teeth: 24,
      width: 9,
      profile: 'HTD',
      pitch: 5,
      sku: 'AM-3402',
      url: 'https://andymark.com/collections/pulleys/products/24t-plastic-htd-pulleys',
      bore: '3/8" Hex',
    },
    {
      teeth: 24,
      width: 9,
      profile: 'HTD',
      pitch: 5,
      sku: 'AM-3403',
      url: 'https://andymark.com/collections/pulleys/products/24t-plastic-htd-pulleys',
      bore: '1/2" Hex',
    },
    {
      teeth: 42,
      width: 15,
      profile: 'HTD',
      pitch: 5,
      sku: 'AM-2234a',
      url: 'https://andymark.com/collections/pulleys/products/42-tooth-5-mm-htd-15-mm-wide-bearing-bore-plastic-pulley',
      bore: '1.125" Round',
    },
    {
      teeth: 24,
      width: 18,
      profile: 'HTD',
      pitch: 5,
      sku: 'AM-2234b',
      url: 'https://andymark.com/collections/pulleys/products/24-tooth-0-5-in-hex-bore-5-mm-htd-18-mm-wide-aluminum-pulley',
      bore: '1/2" Hex',
    },
    {
      teeth: 24,
      width: 9,
      profile: 'HTD',
      pitch: 5,
      sku: 'AM-4625',
      url: 'https://andymark.com/collections/pulleys/products/24-tooth-0-5-in-hex-bore-5-mm-htd-9-mm-wide-aluminum-pulley',
      bore: '1/2" Hex',
    },
    {
      teeth: 14,
      width: 9,
      profile: 'HTD',
      pitch: 5,
      sku: 'AM-4960',
      url: 'https://andymark.com/collections/pulleys/products/14-tooth-0-375-in-hex-bore-htd-pulley',
      bore: '3/8" Hex',
    },
  ];

  for (const item of data) {
    const andyMarkPulley = zAndyMarkPulley.parse({
      teeth: item.teeth,
      width: item.width,
      profile: item.profile,
      pitch: item.pitch,
      sku: item.sku,
      url: item.url,
      bore: item.bore,
    });
    pulleys.push(andyMarkPulleyToJsonPulley(andyMarkPulley));
  }

  await writeJson(pulleys, 'AndyMark', 'pulleys');
}

async function andyMarkBelts() {
  const belts: JSONBelt[] = [];

  const toothCounts9mm: number[] = [
    30, 35, 40, 45, 48, 50, 55, 60, 64, 65, 70, 75, 80, 85, 90, 91, 93, 95, 100,
    105, 106, 110, 115, 120, 121, 125, 130, 135, 136, 140, 145, 150, 152, 160,
    167, 170, 180, 190, 200, 225, 250,
  ];

  for (const toothCount of toothCounts9mm) {
    belts.push(
      andyMarkBeltToJsonBelt(
        zAndyMarkBelt.parse({
          teeth: toothCount,
          width: 9,
          profile: 'HTD',
          pitch: 5,
          sku: `AM-5209_${toothCount}T`,
          url: `https://andymark.com/collections/belts/products/9-mm-wide-5-mm-pitch-htd-timing-belts`,
        }),
      ),
    );
  }

  const toothCounts15mm: number[] = [
    30, 35, 40, 45, 50, 55, 60, 64, 65, 70, 75, 78, 80, 85, 90, 95, 100, 104,
    105, 107, 110, 115, 117, 120, 125, 130, 131, 135, 140, 145, 150, 151, 160,
    170, 180, 190, 200, 210, 220, 225, 230, 250,
  ];

  for (const toothCount of toothCounts15mm) {
    belts.push(
      andyMarkBeltToJsonBelt(
        zAndyMarkBelt.parse({
          teeth: toothCount,
          width: 15,
          profile: 'HTD',
          pitch: 5,
          sku: `AM-5215_${toothCount}T`,
          url: `https://andymark.com/collections/belts/products/15-mm-wide-5-mm-pitch-htd-timing-belts`,
        }),
      ),
    );
  }

  await writeJson(belts, 'AndyMark', 'belts');
}

async function dispatch(vendor: string, productType: string) {
  if (vendor === 'wcp') {
    if (productType === 'belts') {
      await wcpBelts();
    }
    if (productType === 'pulleys') {
      await wcpPulleys();
    }
    if (productType === 'gears') {
      await wcpGears();
    }
    if (productType === 'sprockets') {
      await wcpSprockets();
    }
  }
  if (vendor === 'swyft') {
    if (productType === 'belts') {
      await swyftBelts();
    }
  }
  if (vendor === 'vbg') {
    if (productType === 'belts') {
      await vbeltGuysBelts();
    }
  }
  if (vendor === 'thrifty') {
    if (productType === 'pulleys') {
      await thriftyPulleys();
    }
    if (productType === 'sprockets') {
      await thriftySprockets();
    }
  }
  if (vendor === 'rev') {
    if (productType === 'belts') {
      await revBelts();
    }
    if (productType === 'pulleys') {
      await revPulleys();
    }
    if (productType === 'sprockets') {
      await revSprockets();
    }
    if (productType === 'gears') {
      await revGears();
    }
    if (productType === 'planetaries') {
      await revPlanetaries();
    }
  }
  if (vendor === 'andymark') {
    if (productType === 'pulleys') {
      await andyMarkPulleys();
    }
    if (productType === 'belts') {
      await andyMarkBelts();
    }
  }

  if (vendor === 'all' && productType === 'all') {
    await Promise.all([
      wcpBelts(),
      wcpPulleys(),
      wcpGears(),
      wcpSprockets(),
      swyftBelts(),
      thriftyPulleys(),
      thriftySprockets(),
      vbeltGuysBelts(),
      revBelts(),
      revPulleys(),
      revSprockets(),
      revGears(),
      andyMarkPulleys(),
      andyMarkBelts(),
      revPlanetaries(),
    ]);
  }
}

program
  .name('download-products')
  .description('Download products from Shopify')
  .argument('<vendor>', 'Vendor name (e.g. WCP, TTB, SDS')
  .argument('<productType>', 'Product type (e.g. belts)')
  .action(async (vendor: string, productType: string) => {
    await dispatch(vendor.toLowerCase(), productType.toLowerCase());
  });

program.parse();

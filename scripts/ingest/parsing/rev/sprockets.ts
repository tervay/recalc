import type { JSONSprocket } from '~/lib/types/sprockets';

export function parseREVSprockets(): JSONSprocket[] {
  const sprockets: JSONSprocket[] = [];

  // ION 35 Sprockets with 1/2" Hex bore
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

  // ION 35 Sprockets with MAXSpline bore
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

  // ION 25 Sprockets
  const ion25Sprockets: Pick<JSONSprocket, 'teeth' | 'bore' | 'sku'>[] = [
    { teeth: 12, bore: '1/2" Hex', sku: 'REV-21-2014' },
    { teeth: 16, bore: '1/2" Hex', sku: 'REV-21-2012' },
    { teeth: 16, bore: '1/2" Hex', sku: 'REV-21-2016' },
    { teeth: 24, bore: '1/2" Hex', sku: 'REV-21-2017' },
    { teeth: 32, bore: '1/2" Hex', sku: 'REV-21-2018' },
    { teeth: 24, bore: 'MAXSpline', sku: 'REV-21-2015' },
    { teeth: 32, bore: 'MAXSpline', sku: 'REV-21-2019' },
    { teeth: 48, bore: 'MAXSpline', sku: 'REV-21-1964' },
    { teeth: 64, bore: 'MAXSpline', sku: 'REV-21-1972' },
    { teeth: 40, bore: 'MAXSpline', sku: 'REV-21-3370' },
    { teeth: 48, bore: 'MAXSpline', sku: 'REV-21-3374' },
    { teeth: 56, bore: 'MAXSpline', sku: 'REV-21-3378' },
    { teeth: 64, bore: 'MAXSpline', sku: 'REV-21-3382' },
    { teeth: 72, bore: 'MAXSpline', sku: 'REV-21-3386' },
  ];

  for (const sprocket of ion25Sprockets) {
    sprockets.push({
      ...sprocket,
      chainType: '#25',
      url: 'https://www.revrobotics.com/ION-25-Sprockets/',
      vendor: 'REV',
    });
  }

  // NEO pinion sprockets
  const neoPinions: Pick<JSONSprocket, 'teeth' | 'bore' | 'sku'>[] = [
    { teeth: 10, bore: '8mm', sku: 'REV-21-2020' },
    { teeth: 12, bore: '8mm', sku: 'REV-21-3495' },
  ];

  for (const sprocket of neoPinions) {
    sprockets.push({
      ...sprocket,
      chainType: '#25',
      url: 'https://www.revrobotics.com/neo-pinions/',
      vendor: 'REV',
    });
  }

  return sprockets;
}

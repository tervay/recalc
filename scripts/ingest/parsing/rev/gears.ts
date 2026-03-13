import type { JSONGear } from '~/lib/types/gears';

export function parseREVGears(): JSONGear[] {
  const gears: JSONGear[] = [];

  // 20DP MAXSpline gears
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

  // Additional 20DP MAXSpline gears
  for (const [toothCount, sku] of [
    [72, 'REV-21-3030'],
    [80, 'REV-21-3034'],
  ] as const) {
    gears.push({
      teeth: toothCount,
      dp: 20,
      bore: 'MAXSpline',
      url: 'https://www.revrobotics.com/20DP-Gears-Maxspline/',
      sku,
      vendor: 'REV',
    });
  }

  // 20DP 1/2" Hex gears
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

  // Additional 20DP 1/2" Hex gears
  for (const [toothCount, sku] of [
    [16, 'REV-21-2196'],
    [72, 'REV-21-1947'],
    [80, 'REV-21-1951'],
  ] as const) {
    gears.push({
      teeth: toothCount,
      dp: 20,
      bore: '1/2" Hex',
      url: 'https://www.revrobotics.com/20DP-Gears-0.5-Hex/',
      sku,
      vendor: 'REV',
    });
  }

  // 20DP 8mm bore gears (NEO pinions)
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

  // 32DP RS550 pinion
  gears.push({
    teeth: 12,
    dp: 32,
    bore: 'RS550',
    url: 'https://www.revrobotics.com/550-motor-pinions/',
    sku: 'REV-41-1660-PK2',
    vendor: 'REV',
  });

  return gears;
}

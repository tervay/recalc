import Measurement from '~/lib/models/Measurement';
import type { JSONBelt } from '~/lib/types/belts';

export function parseREVBelts(): JSONBelt[] {
  const toothCounts: number[] = [
    32, 36, 40, 48, 56, 64, 72, 80, 88, 96, 104, 112, 120, 128, 136, 144, 152,
    160, 168, 176, 184, 192, 200, 208, 216,
  ];

  return toothCounts.map((toothCount) => ({
    teeth: toothCount,
    width: new Measurement(0.5, 'in').to('mm').scalar,
    profile: 'RT25',
    pitch: new Measurement(0.25, 'in').to('mm').scalar,
    sku: `REV-21-${toothCount + 4000}`,
    url: 'https://www.revrobotics.com/RT25-Belts-1/2in-Width',
    vendor: 'REV',
  }));
}

import { describe, expect, it } from 'vitest';

import { findGearboxes } from '~/lib/math/ratioFinder.worker';
import Ratio, { RatioType } from '~/lib/models/Ratio';

describe('ratioFinderWorker', () => {
  it('should find gearboxes with default settings', async () => {
    const result = await findGearboxes(
      new Ratio(20, RatioType.REDUCTION),
      0.25,
      'SplineXS',
      {
        enableREV: true,
        enableWCP: true,
        enableAM: true,
        enableTTB: true,
        enableLastAnvil: true,
        enablePlanetaries: true,
        enable20DP: true,
        enable32DP: true,
        enableGT2: true,
        enableHTD: true,
        enableRT25: true,
        enable25Chain: true,
        enable35Chain: true,
        enableBore12Hex: true,
        enableBore38Hex: true,
        enableBore1125: true,
        enableBoreMAXSpline: true,
        enableBoreSplineXL: true,
        enableBore5mmHex: true,
        enableBore14Round: true,
        enableCustomGears: false,
        enableCustomPulleys: false,
        enableCustomSprockets: false,
        minGearTeeth: 6,
        maxGearTeeth: 84,
        minPulleyTeeth: 8,
        maxPulleyTeeth: 84,
        minSprocketTeeth: 8,
        maxSprocketTeeth: 84,
      },
    );

    expect(result).toMatchSnapshot();
  });
});

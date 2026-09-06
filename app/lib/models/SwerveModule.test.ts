import { describe, expect, it } from 'vitest';

import Measurement from '~/lib/models/Measurement';
import { ALL_SWERVE_MODULES } from '~/lib/models/SwerveModule';
import { VENDOR_NAMES } from '~/lib/types/common';

describe('ALL_SWERVE_MODULES', () => {
  it('contains 11 modules with unique names', () => {
    expect(ALL_SWERVE_MODULES).toHaveLength(11);
    const names = ALL_SWERVE_MODULES.map((m) => m.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('every module has a valid vendor and positive wheel diameter', () => {
    for (const module of ALL_SWERVE_MODULES) {
      expect(VENDOR_NAMES).toContain(module.vendor);
      expect(module.wheelDiameter.gt(new Measurement(0, 'in'))).toBe(true);
    }
  });

  it('every module has at least one drive ratio option, all positive', () => {
    for (const module of ALL_SWERVE_MODULES) {
      expect(module.driveRatioOptions.length).toBeGreaterThan(0);
      for (const option of module.driveRatioOptions) {
        expect(option.ratio.asNumber()).toBeGreaterThan(0);
      }
    }
  });

  it('exposes the SDS MK4i L2 option as a 6.75:1 reduction on a 4 in wheel', () => {
    const mk4i = ALL_SWERVE_MODULES.find((m) => m.name === 'MK4i');
    expect(mk4i?.vendor).toBe('SDS');
    expect(mk4i?.wheelDiameter).toEqual(new Measurement(4, 'in'));
    const l2 = mk4i?.driveRatioOptions.find((o) => o.name === 'L2');
    expect(l2?.ratio.asNumber()).toBeCloseTo(6.75, 10);
  });
});

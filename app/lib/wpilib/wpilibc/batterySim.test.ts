import { beforeAll, describe, expect, it } from 'vitest';

import type { MainModule } from '~/lib/generated/wpilibc/wpilibc_wasm';
import { arrayToVectorDouble } from '~/lib/wpilib/util';
import { getWpilibcModule } from '~/lib/wpilib/wpilibc';

describe('BatterySim', () => {
  let _module: MainModule;

  beforeAll(async () => {
    _module = await getWpilibcModule();
  });

  it('should calculate loaded voltage with no current draw', () => {
    const loadedVoltage =
      _module.BatterySim_calculateDefaultBatteryLoadedVoltage(
        arrayToVectorDouble([]),
      );
    // With no current draw, voltage should be close to nominal (12V default)
    expect(loadedVoltage).toBeCloseTo(12.0, 1);
  });

  it('should calculate loaded voltage with single current draw', () => {
    const loadedVoltage =
      _module.BatterySim_calculateDefaultBatteryLoadedVoltage(
        arrayToVectorDouble([10.0]),
      );
    // With current draw, voltage should sag below nominal
    expect(loadedVoltage).toBeLessThan(12.0);
    expect(loadedVoltage).toBeGreaterThan(0);
  });

  it('should calculate loaded voltage with multiple current draws', () => {
    const loadedVoltage =
      _module.BatterySim_calculateDefaultBatteryLoadedVoltage(
        arrayToVectorDouble([5.0, 10.0, 15.0]),
      );
    // With multiple current draws, voltage should sag more
    expect(loadedVoltage).toBeLessThan(12.0);
    expect(loadedVoltage).toBeGreaterThan(0);
    // More current should result in lower voltage
    const singleDrawVoltage =
      _module.BatterySim_calculateDefaultBatteryLoadedVoltage(
        arrayToVectorDouble([5.0]),
      );
    expect(loadedVoltage).toBeLessThan(singleDrawVoltage);
  });

  it('should handle high current draws', () => {
    const loadedVoltage =
      _module.BatterySim_calculateDefaultBatteryLoadedVoltage(
        arrayToVectorDouble([100.0]),
      );
    // Even with high current, voltage should be positive
    expect(loadedVoltage).toBeGreaterThan(0);
    expect(loadedVoltage).toBeLessThan(12.0);
  });

  it('should calculate loaded voltage with custom parameters', () => {
    const loadedVoltage = _module.BatterySim_calculateLoadedBatteryVoltage(
      12.0,
      0.02,
      arrayToVectorDouble([10.0]),
    );
    // With current draw, voltage should sag below nominal
    expect(loadedVoltage).toBeLessThan(12.0);
    expect(loadedVoltage).toBeGreaterThan(0);
  });

  it('should calculate loaded voltage with different nominal voltage', () => {
    const loadedVoltage = _module.BatterySim_calculateLoadedBatteryVoltage(
      24.0,
      0.02,
      arrayToVectorDouble([10.0]),
    );
    // With 24V nominal, voltage should be higher than 12V default
    expect(loadedVoltage).toBeLessThan(24.0);
    expect(loadedVoltage).toBeGreaterThan(12.0);
  });

  it('should calculate loaded voltage with different resistance', () => {
    const lowResistanceVoltage =
      _module.BatterySim_calculateLoadedBatteryVoltage(
        12.0,
        0.01,
        arrayToVectorDouble([10.0]),
      );
    const highResistanceVoltage =
      _module.BatterySim_calculateLoadedBatteryVoltage(
        12.0,
        0.03,
        arrayToVectorDouble([10.0]),
      );
    // Lower resistance should result in higher voltage
    expect(lowResistanceVoltage).toBeGreaterThan(highResistanceVoltage);
  });
});

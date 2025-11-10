import { type Page, expect, test } from '@playwright/test';

async function assertInputs(
  page: Page,
  params: {
    motorQuantity: string;
    motorName: string;
    ratioMagnitude: string;
    ratioType: string;
    statorLimit: string;
    statorLimitUnit: string;
    supplyLimit: string;
    supplyLimitUnit: string;
    supplyVoltage: string;
    supplyVoltageUnit: string;
    batteryResistance: string;
    batteryResistanceUnit: string;
    efficiency: string;
    shooterDiameter: string;
    shooterDiameterUnit: string;
    shooterWeight: string;
    shooterWeightUnit: string;
    shooterTargetSpeed: string;
    shooterTargetSpeedUnit: string;
    customShooterMoi: string;
    customShooterMoiUnit: string;
    useCustomShooterMoi: boolean;
    flywheelDiameter: string;
    flywheelDiameterUnit: string;
    flywheelWeight: string;
    flywheelWeightUnit: string;
    flywheelToShooterRatio: string;
    flywheelToShooterRatioUnit: string;
    useCustomFlywheelMoi: boolean;
    customFlywheelMoi: string;
    customFlywheelMoiUnit: string;
    projectileWeight: string;
    projectileWeightUnit: string;
  },
) {
  await expect(page.getByTestId('motor')).toHaveValue(params.motorQuantity);
  await expect(page.getByTestId('selectmotor')).toHaveText(params.motorName);
  await expect(page.getByTestId('ratio')).toHaveValue(params.ratioMagnitude);
  await expect(page.getByTestId('selectratio')).toHaveText(params.ratioType);
  await expect(page.getByTestId('statorLimit')).toHaveValue(params.statorLimit);
  await expect(page.getByTestId('selectstatorLimit')).toHaveText(
    params.statorLimitUnit,
  );
  await expect(page.getByTestId('supplyLimit')).toHaveValue(params.supplyLimit);
  await expect(page.getByTestId('selectsupplyLimit')).toHaveText(
    params.supplyLimitUnit,
  );
  await expect(page.getByTestId('supplyVoltage')).toHaveValue(
    params.supplyVoltage,
  );
  await expect(page.getByTestId('selectsupplyVoltage')).toHaveText(
    params.supplyVoltageUnit,
  );
  await expect(page.getByTestId('batteryResistance')).toHaveValue(
    params.batteryResistance,
  );
  await expect(page.getByTestId('selectbatteryResistance')).toHaveText(
    params.batteryResistanceUnit,
  );
  await expect(page.getByTestId('efficiency')).toHaveValue(params.efficiency);
  await expect(page.getByTestId('shooterDiameter')).toHaveValue(
    params.shooterDiameter,
  );
  await expect(page.getByTestId('selectshooterDiameter')).toHaveText(
    params.shooterDiameterUnit,
  );
  await expect(page.getByTestId('shooterWeight')).toHaveValue(
    params.shooterWeight,
  );
  await expect(page.getByTestId('selectshooterWeight')).toHaveText(
    params.shooterWeightUnit,
  );
  await expect(page.getByTestId('shooterTargetSpeed')).toHaveValue(
    params.shooterTargetSpeed,
  );
  await expect(page.getByTestId('selectshooterTargetSpeed')).toHaveText(
    params.shooterTargetSpeedUnit,
  );
  if (params.useCustomShooterMoi) {
    await expect(page.getByTestId('useCustomShooterMoi')).toBeChecked();
    await expect(page.getByTestId('customShooterMoi')).toBeEnabled();
  } else {
    await expect(page.getByTestId('useCustomShooterMoi')).not.toBeChecked();
    await expect(page.getByTestId('customShooterMoi')).toBeDisabled();
  }
  await expect(page.getByTestId('customShooterMoi')).toHaveValue(
    params.customShooterMoi,
  );
  await expect(page.getByTestId('selectcustomShooterMoi')).toHaveText(
    params.customShooterMoiUnit,
  );
  await expect(page.getByTestId('flywheelDiameter')).toHaveValue(
    params.flywheelDiameter,
  );
  await expect(page.getByTestId('selectflywheelDiameter')).toHaveText(
    params.flywheelDiameterUnit,
  );
  await expect(page.getByTestId('flywheelWeight')).toHaveValue(
    params.flywheelWeight,
  );
  await expect(page.getByTestId('selectflywheelWeight')).toHaveText(
    params.flywheelWeightUnit,
  );
  await expect(page.getByTestId('flywheelToShooterRatio')).toHaveValue(
    params.flywheelToShooterRatio,
  );
  await expect(page.getByTestId('selectflywheelToShooterRatio')).toHaveText(
    params.flywheelToShooterRatioUnit,
  );
  if (params.useCustomFlywheelMoi) {
    await expect(page.getByTestId('useCustomFlywheelMoi')).toBeChecked();
    await expect(page.getByTestId('customFlywheelMoi')).toBeEnabled();
  } else {
    await expect(page.getByTestId('useCustomFlywheelMoi')).not.toBeChecked();
    await expect(page.getByTestId('customFlywheelMoi')).toBeDisabled();
  }
  await expect(page.getByTestId('customFlywheelMoi')).toHaveValue(
    params.customFlywheelMoi,
  );
  await expect(page.getByTestId('selectcustomFlywheelMoi')).toHaveText(
    params.customFlywheelMoiUnit,
  );
  await expect(page.getByTestId('projectileWeight')).toHaveValue(
    params.projectileWeight,
  );
  await expect(page.getByTestId('selectprojectileWeight')).toHaveText(
    params.projectileWeightUnit,
  );
}

async function assertOutputs(
  page: Page,
  params: {
    maxAchievableShooterRpm: string;
    maxAchievableShooterRpmUnit: string;
    kV: string;
    kVUnit: string;
    kA: string;
    kAUnit: string;
    spinupTime: string;
    spinupTimeUnit: string;
    minimumBatteryVoltage: string;
    minimumBatteryVoltageUnit: string;
    effectiveMoi: string;
    effectiveMoiUnit: string;
  },
) {
  await expect(page.getByTestId('maxAchievableShooterRpm')).toHaveValue(
    params.maxAchievableShooterRpm,
  );
  await expect(page.getByTestId('selectmaxAchievableShooterRpm')).toHaveText(
    params.maxAchievableShooterRpmUnit,
  );
  await expect(page.getByTestId('kV')).toHaveValue(params.kV);
  await expect(page.getByTestId('selectkV')).toHaveText(params.kVUnit);
  await expect(page.getByTestId('kA')).toHaveValue(params.kA);
  await expect(page.getByTestId('selectkA')).toHaveText(params.kAUnit);
  await expect(page.getByTestId('spinupTime')).toHaveValue(params.spinupTime);
  await expect(page.getByTestId('selectspinupTime')).toHaveText(
    params.spinupTimeUnit,
  );
  await expect(page.getByTestId('minimumBatteryVoltage')).toHaveValue(
    params.minimumBatteryVoltage,
  );
  await expect(page.getByTestId('selectminimumBatteryVoltage')).toHaveText(
    params.minimumBatteryVoltageUnit,
  );
  await expect(page.getByTestId('effectiveMoi')).toHaveValue(
    params.effectiveMoi,
  );
  await expect(page.getByTestId('selecteffectiveMoi')).toHaveText(
    params.effectiveMoiUnit,
  );
}

test.describe('Flywheel Calculator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/flywheel');
  });

  test('Default page', async ({ page }) => {
    await assertInputs(page, {
      motorQuantity: '2',
      motorName: 'Kraken X60 (FOC)',
      ratioMagnitude: '1',
      ratioType: 'Reduction',
      statorLimit: '30',
      statorLimitUnit: 'A',
      supplyLimit: '90',
      supplyLimitUnit: 'A',
      supplyVoltage: '12.6',
      supplyVoltageUnit: 'V',
      batteryResistance: '0.015',
      batteryResistanceUnit: 'Ohm',
      efficiency: '100',
      shooterDiameter: '6',
      shooterDiameterUnit: 'in',
      shooterWeight: '1',
      shooterWeightUnit: 'lbs',
      shooterTargetSpeed: '3000',
      shooterTargetSpeedUnit: 'rpm',
      useCustomShooterMoi: false,
      customShooterMoi: '4.5',
      customShooterMoiUnit: 'in2*lbs',
      flywheelDiameter: '4',
      flywheelDiameterUnit: 'in',
      flywheelWeight: '1.5',
      flywheelWeightUnit: 'lbs',
      flywheelToShooterRatio: '1',
      flywheelToShooterRatioUnit: 'Reduction',
      useCustomFlywheelMoi: false,
      customFlywheelMoi: '3',
      customFlywheelMoiUnit: 'in2*lbs',
      projectileWeight: '0.5',
      projectileWeightUnit: 'lbs',
    });

    await assertOutputs(page, {
      maxAchievableShooterRpm: '5784',
      maxAchievableShooterRpmUnit: 'rpm',
      kV: '0.260',
      kVUnit: 'V*s/m',
      kA: '0.995',
      kAUnit: 'V*s^2/m',
      spinupTime: '1.320',
      spinupTimeUnit: 's',
      minimumBatteryVoltage: '11.70',
      minimumBatteryVoltageUnit: 'V',
      effectiveMoi: '15.000',
      effectiveMoiUnit: 'in2*lbs',
    });
  });

  test('Changing motor quantity is reflected in io', async ({ page }) => {
    await page.getByTestId('motor').fill('4');
    await assertInputs(page, {
      motorQuantity: '4',
      motorName: 'Kraken X60 (FOC)',
      ratioMagnitude: '1',
      ratioType: 'Reduction',
      statorLimit: '30',
      statorLimitUnit: 'A',
      supplyLimit: '90',
      supplyLimitUnit: 'A',
      supplyVoltage: '12.6',
      supplyVoltageUnit: 'V',
      batteryResistance: '0.015',
      batteryResistanceUnit: 'Ohm',
      efficiency: '100',
      shooterDiameter: '6',
      shooterDiameterUnit: 'in',
      shooterWeight: '1',
      shooterWeightUnit: 'lbs',
      shooterTargetSpeed: '3000',
      shooterTargetSpeedUnit: 'rpm',
      useCustomShooterMoi: false,
      customShooterMoi: '4.5',
      customShooterMoiUnit: 'in2*lbs',
      flywheelDiameter: '4',
      flywheelDiameterUnit: 'in',
      flywheelWeight: '1.5',
      flywheelWeightUnit: 'lbs',
      flywheelToShooterRatio: '1',
      flywheelToShooterRatioUnit: 'Reduction',
      useCustomFlywheelMoi: false,
      customFlywheelMoi: '3',
      customFlywheelMoiUnit: 'in2*lbs',
      projectileWeight: '0.5',
      projectileWeightUnit: 'lbs',
    });

    await assertOutputs(page, {
      maxAchievableShooterRpm: '5784',
      maxAchievableShooterRpmUnit: 'rpm',
      kV: '0.260',
      kVUnit: 'V*s/m',
      kA: '0.497',
      kAUnit: 'V*s^2/m',
      spinupTime: '0.660',
      spinupTimeUnit: 's',
      minimumBatteryVoltage: '10.80',
      minimumBatteryVoltageUnit: 'V',
      effectiveMoi: '15.000',
      effectiveMoiUnit: 'in2*lbs',
    });
  });
});

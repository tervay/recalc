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
      kA: '0.663',
      kAUnit: 'V*s^2/m',
      spinupTime: '1.320',
      spinupTimeUnit: 's',
      minimumBatteryVoltage: '11.70',
      minimumBatteryVoltageUnit: 'V',
      effectiveMoi: '15.000',
      effectiveMoiUnit: 'in2*lbs',
    });
  });

  test.describe('Motor input', () => {
    test('Change motor quantity to 4', async ({ page }) => {
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
        kA: '0.332',
        kAUnit: 'V*s^2/m',
        spinupTime: '0.660',
        spinupTimeUnit: 's',
        minimumBatteryVoltage: '10.80',
        minimumBatteryVoltageUnit: 'V',
        effectiveMoi: '15.000',
        effectiveMoiUnit: 'in2*lbs',
      });
    });

    test('Change motor quantity to 0', async ({ page }) => {
      await page.getByTestId('motor').fill('0');

      await assertInputs(page, {
        motorQuantity: '0',
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
        kA: '0.000',
        kAUnit: 'V*s^2/m',
        spinupTime: '0.000',
        spinupTimeUnit: 's',
        minimumBatteryVoltage: '12.60',
        minimumBatteryVoltageUnit: 'V',
        effectiveMoi: '15.000',
        effectiveMoiUnit: 'in2*lbs',
      });
    });

    test('Change motor select to Kraken X44', async ({ page }) => {
      await page.getByTestId('selectmotor').click();
      await page
        .getByRole('option', { name: 'Kraken X44', exact: true })
        .click();
      await assertInputs(page, {
        motorQuantity: '2',
        motorName: 'Kraken X44',
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
        maxAchievableShooterRpm: '7757',
        maxAchievableShooterRpmUnit: 'rpm',
        kV: '0.194',
        kVUnit: 'V*s/m',
        kA: '0.874',
        kAUnit: 'V*s^2/m',
        spinupTime: '1.730',
        spinupTimeUnit: 's',
        minimumBatteryVoltage: '11.70',
        minimumBatteryVoltageUnit: 'V',
        effectiveMoi: '15.000',
        effectiveMoiUnit: 'in2*lbs',
      });
    });
  });

  test.describe('Ratio input', () => {
    test('Change ratio to 0', async ({ page }) => {
      await page.getByTestId('ratio').fill('0');
      await assertInputs(page, {
        motorQuantity: '2',
        motorName: 'Kraken X60 (FOC)',
        ratioMagnitude: '0',
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
        maxAchievableShooterRpm: '0',
        maxAchievableShooterRpmUnit: 'rpm',
        kV: '0.000',
        kVUnit: 'V*s/m',
        kA: '0.000',
        kAUnit: 'V*s^2/m',
        spinupTime: '0.000',
        spinupTimeUnit: 's',
        minimumBatteryVoltage: '12.60',
        minimumBatteryVoltageUnit: 'V',
        effectiveMoi: '0.000',
        effectiveMoiUnit: 'in2*lbs',
      });
    });
    test('Change ratio to 2 (reduction)', async ({ page }) => {
      await page.getByTestId('ratio').fill('2');
      await assertInputs(page, {
        motorQuantity: '2',
        motorName: 'Kraken X60 (FOC)',
        ratioMagnitude: '2',
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
        maxAchievableShooterRpm: '2892',
        maxAchievableShooterRpmUnit: 'rpm',
        kV: '0.520',
        kVUnit: 'V*s/m',
        kA: '0.166',
        kAUnit: 'V*s^2/m',
        spinupTime: '0.430',
        spinupTimeUnit: 's',
        minimumBatteryVoltage: '11.70',
        minimumBatteryVoltageUnit: 'V',
        effectiveMoi: '7.500',
        effectiveMoiUnit: 'in2*lbs',
      });
    });
    test('Change ratio to 2 (step-up)', async ({ page }) => {
      await page.getByTestId('ratio').fill('2');
      await page.getByTestId('selectratio').click();
      await page.getByRole('option', { name: 'Step-up', exact: true }).click();

      await assertInputs(page, {
        motorQuantity: '2',
        motorName: 'Kraken X60 (FOC)',
        ratioMagnitude: '2',
        ratioType: 'Step-up',
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
        maxAchievableShooterRpm: '11568',
        maxAchievableShooterRpmUnit: 'rpm',
        kV: '0.130',
        kVUnit: 'V*s/m',
        kA: '2.653',
        kAUnit: 'V*s^2/m',
        spinupTime: '5.260',
        spinupTimeUnit: 's',
        minimumBatteryVoltage: '11.70',
        minimumBatteryVoltageUnit: 'V',
        effectiveMoi: '30.000',
        effectiveMoiUnit: 'in2*lbs',
      });
    });
  });

  test.describe('Stator limit input', () => {
    test('Change stator limit from 30 to 5', async ({ page }) => {
      await page.getByTestId('statorLimit').fill('5');
      await assertInputs(page, {
        motorQuantity: '2',
        motorName: 'Kraken X60 (FOC)',
        ratioMagnitude: '1',
        ratioType: 'Reduction',
        statorLimit: '5',
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
        kA: '11.687',
        kAUnit: 'V*s^2/m',
        spinupTime: '10.010',
        spinupTimeUnit: 's',
        minimumBatteryVoltage: '12.45',
        minimumBatteryVoltageUnit: 'V',
        effectiveMoi: '15.000',
        effectiveMoiUnit: 'in2*lbs',
      });
    });

    test('Change stator limit from 30 to 50', async ({ page }) => {
      await page.getByTestId('statorLimit').fill('50');
      await assertInputs(page, {
        motorQuantity: '2',
        motorName: 'Kraken X60 (FOC)',
        ratioMagnitude: '1',
        ratioType: 'Reduction',
        statorLimit: '50',
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
        kA: '0.378',
        kAUnit: 'V*s^2/m',
        spinupTime: '0.750',
        spinupTimeUnit: 's',
        minimumBatteryVoltage: '11.10',
        minimumBatteryVoltageUnit: 'V',
        effectiveMoi: '15.000',
        effectiveMoiUnit: 'in2*lbs',
      });
    });

    test('Change stator limit from 30 to 0', async ({ page }) => {
      await page.getByTestId('statorLimit').fill('0');
      await assertInputs(page, {
        motorQuantity: '2',
        motorName: 'Kraken X60 (FOC)',
        ratioMagnitude: '1',
        ratioType: 'Reduction',
        statorLimit: '0',
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
        kA: '0.000',
        kAUnit: 'V*s^2/m',
        spinupTime: '0.000',
        spinupTimeUnit: 's',
        minimumBatteryVoltage: '12.60',
        minimumBatteryVoltageUnit: 'V',
        effectiveMoi: '15.000',
        effectiveMoiUnit: 'in2*lbs',
      });
    });
  });

  test.describe('Supply limit input', () => {
    test('Change supply limit from 90 to 5', async ({ page }) => {
      await page.getByTestId('supplyLimit').fill('5');
      await assertInputs(page, {
        motorQuantity: '2',
        motorName: 'Kraken X60 (FOC)',
        ratioMagnitude: '1',
        ratioType: 'Reduction',
        statorLimit: '30',
        statorLimitUnit: 'A',
        supplyLimit: '5',
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
        kA: '11.687',
        kAUnit: 'V*s^2/m',
        spinupTime: '10.010',
        spinupTimeUnit: 's',
        minimumBatteryVoltage: '12.45',
        minimumBatteryVoltageUnit: 'V',
        effectiveMoi: '15.000',
        effectiveMoiUnit: 'in2*lbs',
      });
    });

    test('Change supply limit from 90 to 0', async ({ page }) => {
      await page.getByTestId('supplyLimit').fill('0');
      await assertInputs(page, {
        motorQuantity: '2',
        motorName: 'Kraken X60 (FOC)',
        ratioMagnitude: '1',
        ratioType: 'Reduction',
        statorLimit: '30',
        statorLimitUnit: 'A',
        supplyLimit: '0',
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
        kA: '0.000',
        kAUnit: 'V*s^2/m',
        spinupTime: '0.000',
        spinupTimeUnit: 's',
        minimumBatteryVoltage: '12.60',
        minimumBatteryVoltageUnit: 'V',
        effectiveMoi: '15.000',
        effectiveMoiUnit: 'in2*lbs',
      });
    });
  });

  test.describe('Supply voltage input', () => {
    test('Change supply voltage from 12.6 to 10', async ({ page }) => {
      await page.getByTestId('supplyVoltage').fill('10');
      await assertInputs(page, {
        motorQuantity: '2',
        motorName: 'Kraken X60 (FOC)',
        ratioMagnitude: '1',
        ratioType: 'Reduction',
        statorLimit: '30',
        statorLimitUnit: 'A',
        supplyLimit: '90',
        supplyLimitUnit: 'A',
        supplyVoltage: '10',
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
        kA: '0.663',
        kAUnit: 'V*s^2/m',
        spinupTime: '1.320',
        spinupTimeUnit: 's',
        minimumBatteryVoltage: '9.10',
        minimumBatteryVoltageUnit: 'V',
        effectiveMoi: '15.000',
        effectiveMoiUnit: 'in2*lbs',
      });
    });

    test('Change supply voltage from 12.6 to 0', async ({ page }) => {
      await page.getByTestId('supplyVoltage').fill('0');
      await assertInputs(page, {
        motorQuantity: '2',
        motorName: 'Kraken X60 (FOC)',
        ratioMagnitude: '1',
        ratioType: 'Reduction',
        statorLimit: '30',
        statorLimitUnit: 'A',
        supplyLimit: '90',
        supplyLimitUnit: 'A',
        supplyVoltage: '0',
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
        kA: '0.663',
        kAUnit: 'V*s^2/m',
        spinupTime: '1.320',
        spinupTimeUnit: 's',
        minimumBatteryVoltage: '-0.90',
        minimumBatteryVoltageUnit: 'V',
        effectiveMoi: '15.000',
        effectiveMoiUnit: 'in2*lbs',
      });
    });
  });

  test.describe('Battery resistance input', () => {
    test('Change battery resistance from 0.015 to 0.02', async ({ page }) => {
      await page.getByTestId('batteryResistance').fill('0.02');
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
        batteryResistance: '0.02',
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
        kA: '0.663',
        kAUnit: 'V*s^2/m',
        spinupTime: '1.320',
        spinupTimeUnit: 's',
        minimumBatteryVoltage: '11.40',
        minimumBatteryVoltageUnit: 'V',
        effectiveMoi: '15.000',
        effectiveMoiUnit: 'in2*lbs',
      });
    });

    test('Change battery resistance from 0.015 to 0', async ({ page }) => {
      await page.getByTestId('batteryResistance').fill('0');
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
        batteryResistance: '0',
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
        kA: '0.663',
        kAUnit: 'V*s^2/m',
        spinupTime: '1.320',
        spinupTimeUnit: 's',
        minimumBatteryVoltage: '12.60',
        minimumBatteryVoltageUnit: 'V',
        effectiveMoi: '15.000',
        effectiveMoiUnit: 'in2*lbs',
      });
    });
  });

  test.describe('Efficiency input', () => {
    test('Change efficiency from 100 to 90', async ({ page }) => {
      await page.getByTestId('efficiency').fill('90');
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
        efficiency: '90',
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
        kA: '0.737',
        kAUnit: 'V*s^2/m',
        spinupTime: '1.460',
        spinupTimeUnit: 's',
        minimumBatteryVoltage: '11.70',
        minimumBatteryVoltageUnit: 'V',
        effectiveMoi: '15.000',
        effectiveMoiUnit: 'in2*lbs',
      });
    });

    test('Change efficiency from 100 to 0', async ({ page }) => {
      await page.getByTestId('efficiency').fill('0');
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
        efficiency: '0',
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
        kA: '0.000',
        kAUnit: 'V*s^2/m',
        spinupTime: '0.000',
        spinupTimeUnit: 's',
        minimumBatteryVoltage: '12.60',
        minimumBatteryVoltageUnit: 'V',
        effectiveMoi: '15.000',
        effectiveMoiUnit: 'in2*lbs',
      });
    });
  });

  test.describe('Shooter diameter input', () => {
    test('Change shooter diameter from 6 in to 4 in', async ({ page }) => {
      await page.getByTestId('shooterDiameter').fill('4');
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
        shooterDiameter: '4',
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
        kV: '0.390',
        kVUnit: 'V*s/m',
        kA: '0.663',
        kAUnit: 'V*s^2/m',
        spinupTime: '0.880',
        spinupTimeUnit: 's',
        minimumBatteryVoltage: '11.70',
        minimumBatteryVoltageUnit: 'V',
        effectiveMoi: '10.000',
        effectiveMoiUnit: 'in2*lbs',
      });
    });

    test('Change shooter diameter from 6 in to 6 cm', async ({ page }) => {
      await page.getByTestId('selectshooterDiameter').click();
      await page.getByRole('option', { name: 'cm', exact: true }).click();
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
        shooterDiameterUnit: 'cm',
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
        kV: '0.660',
        kVUnit: 'V*s/m',
        kA: '0.830',
        kAUnit: 'V*s^2/m',
        spinupTime: '0.650',
        spinupTimeUnit: 's',
        minimumBatteryVoltage: '11.70',
        minimumBatteryVoltageUnit: 'V',
        effectiveMoi: '7.395',
        effectiveMoiUnit: 'in2*lbs',
      });
    });

    test('Change shooter diameter from 6 in to 0', async ({ page }) => {
      await page.getByTestId('shooterDiameter').fill('0');
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
        shooterDiameter: '0',
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
        kV: '0.000',
        kVUnit: 'V*s/m',
        kA: '0.000',
        kAUnit: 'V*s^2/m',
        spinupTime: '0.000',
        spinupTimeUnit: 's',
        minimumBatteryVoltage: '12.60',
        minimumBatteryVoltageUnit: 'V',
        effectiveMoi: '6.000',
        effectiveMoiUnit: 'in2*lbs',
      });
    });
  });

  test.describe('Shooter weight input', () => {
    test('Change shooter weight from 1 lbs to 3 lbs', async ({ page }) => {
      await page.getByTestId('shooterWeight').fill('3');
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
        shooterWeight: '3',
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
        kA: '1.459',
        kAUnit: 'V*s^2/m',
        spinupTime: '2.890',
        spinupTimeUnit: 's',
        minimumBatteryVoltage: '11.70',
        minimumBatteryVoltageUnit: 'V',
        effectiveMoi: '33.000',
        effectiveMoiUnit: 'in2*lbs',
      });
    });

    test('Change shooter weight from 1 lbs to 1 kg', async ({ page }) => {
      await page.getByTestId('selectshooterWeight').click();
      await page.getByRole('option', { name: 'kg', exact: true }).click();
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
        shooterWeightUnit: 'kg',
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
        kA: '1.143',
        kAUnit: 'V*s^2/m',
        spinupTime: '2.270',
        spinupTimeUnit: 's',
        minimumBatteryVoltage: '11.70',
        minimumBatteryVoltageUnit: 'V',
        effectiveMoi: '25.842',
        effectiveMoiUnit: 'in2*lbs',
      });
    });

    test('Change shooter weight from 1 lbs to 0', async ({ page }) => {
      await page.getByTestId('shooterWeight').fill('0');
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
        shooterWeight: '0',
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
        kA: '0.265',
        kAUnit: 'V*s^2/m',
        spinupTime: '0.530',
        spinupTimeUnit: 's',
        minimumBatteryVoltage: '11.70',
        minimumBatteryVoltageUnit: 'V',
        effectiveMoi: '6.000',
        effectiveMoiUnit: 'in2*lbs',
      });
    });
  });

  test.describe('Shooter target speed input', () => {
    test('Change shooter target speed from 3000 rpm to 4000 rpm', async ({
      page,
    }) => {
      await page.getByTestId('shooterTargetSpeed').fill('4000');
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
        shooterTargetSpeed: '4000',
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
        kA: '0.663',
        kAUnit: 'V*s^2/m',
        spinupTime: '1.760',
        spinupTimeUnit: 's',
        minimumBatteryVoltage: '11.70',
        minimumBatteryVoltageUnit: 'V',
        effectiveMoi: '15.000',
        effectiveMoiUnit: 'in2*lbs',
      });
    });

    test('Change shooter target speed from 3000 rpm to 0', async ({ page }) => {
      await page.getByTestId('shooterTargetSpeed').fill('0');
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
        shooterTargetSpeed: '0',
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
        kA: '0.663',
        kAUnit: 'V*s^2/m',
        spinupTime: '0.000',
        spinupTimeUnit: 's',
        minimumBatteryVoltage: '11.70',
        minimumBatteryVoltageUnit: 'V',
        effectiveMoi: '15.000',
        effectiveMoiUnit: 'in2*lbs',
      });
    });
  });

  test.describe('Flywheel diameter input', () => {
    test('Change flywheel diameter from 4 in to 6 in', async ({ page }) => {
      await page.getByTestId('flywheelDiameter').fill('6');
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
        flywheelDiameter: '6',
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
        spinupTime: '1.970',
        spinupTimeUnit: 's',
        minimumBatteryVoltage: '11.70',
        minimumBatteryVoltageUnit: 'V',
        effectiveMoi: '22.500',
        effectiveMoiUnit: 'in2*lbs',
      });
    });

    test('Change flywheel diameter from 4 in to 4 cm', async ({ page }) => {
      await page.getByTestId('selectflywheelDiameter').click();
      await page.getByRole('option', { name: 'cm', exact: true }).click();
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
        flywheelDiameterUnit: 'cm',
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
        kA: '0.439',
        kAUnit: 'V*s^2/m',
        spinupTime: '0.870',
        spinupTimeUnit: 's',
        minimumBatteryVoltage: '11.70',
        minimumBatteryVoltageUnit: 'V',
        effectiveMoi: '9.930',
        effectiveMoiUnit: 'in2*lbs',
      });
    });

    test('Change flywheel diameter from 4 in to 0', async ({ page }) => {
      await page.getByTestId('flywheelDiameter').fill('0');
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
        flywheelDiameter: '0',
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
        kA: '0.398',
        kAUnit: 'V*s^2/m',
        spinupTime: '0.790',
        spinupTimeUnit: 's',
        minimumBatteryVoltage: '11.70',
        minimumBatteryVoltageUnit: 'V',
        effectiveMoi: '9.000',
        effectiveMoiUnit: 'in2*lbs',
      });
    });
  });

  test.describe('Flywheel weight input', () => {
    test('Change flywheel weight from 1.5 lbs to 3 lbs', async ({ page }) => {
      await page.getByTestId('flywheelWeight').fill('3');
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
        flywheelWeight: '3',
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
        kA: '0.928',
        kAUnit: 'V*s^2/m',
        spinupTime: '1.840',
        spinupTimeUnit: 's',
        minimumBatteryVoltage: '11.70',
        minimumBatteryVoltageUnit: 'V',
        effectiveMoi: '21.000',
        effectiveMoiUnit: 'in2*lbs',
      });
    });

    test('Change flywheel weight from 1.5 lbs to 1.5 kg', async ({ page }) => {
      await page.getByTestId('selectflywheelWeight').click();
      await page.getByRole('option', { name: 'kg', exact: true }).click();
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
        flywheelWeightUnit: 'kg',
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
        kA: '0.983',
        kAUnit: 'V*s^2/m',
        spinupTime: '1.950',
        spinupTimeUnit: 's',
        minimumBatteryVoltage: '11.70',
        minimumBatteryVoltageUnit: 'V',
        effectiveMoi: '22.228',
        effectiveMoiUnit: 'in2*lbs',
      });
    });

    test('Change flywheel weight from 1.5 lbs to 0', async ({ page }) => {
      await page.getByTestId('flywheelWeight').fill('0');
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
        flywheelWeight: '0',
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
        kA: '0.398',
        kAUnit: 'V*s^2/m',
        spinupTime: '0.790',
        spinupTimeUnit: 's',
        minimumBatteryVoltage: '11.70',
        minimumBatteryVoltageUnit: 'V',
        effectiveMoi: '9.000',
        effectiveMoiUnit: 'in2*lbs',
      });
    });
  });

  test.describe('Flywheel ratio input', () => {
    test('Change flywheel ratio from 1 Reduction to 2 Reduction', async ({
      page,
    }) => {
      await page.getByTestId('flywheelToShooterRatio').fill('2');
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
        flywheelToShooterRatio: '2',
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
        kA: '0.464',
        kAUnit: 'V*s^2/m',
        spinupTime: '0.920',
        spinupTimeUnit: 's',
        minimumBatteryVoltage: '11.70',
        minimumBatteryVoltageUnit: 'V',
        effectiveMoi: '10.500',
        effectiveMoiUnit: 'in2*lbs',
      });
    });

    test('Change flywheel ratio from 1 Reduction to 2 Step-up', async ({
      page,
    }) => {
      await page.getByTestId('flywheelToShooterRatio').fill('2');
      await page.getByTestId('selectflywheelToShooterRatio').click();
      await page.getByRole('option', { name: 'Step-up', exact: true }).click();
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
        flywheelToShooterRatio: '2',
        flywheelToShooterRatioUnit: 'Step-up',
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
        kA: '1.459',
        kAUnit: 'V*s^2/m',
        spinupTime: '2.890',
        spinupTimeUnit: 's',
        minimumBatteryVoltage: '11.70',
        minimumBatteryVoltageUnit: 'V',
        effectiveMoi: '33.000',
        effectiveMoiUnit: 'in2*lbs',
      });
    });

    test('Change flywheel ratio from 1 Reduction to 0', async ({ page }) => {
      await page.getByTestId('flywheelToShooterRatio').fill('0');
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
        flywheelToShooterRatio: '0',
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
        kA: '0.663',
        kAUnit: 'V*s^2/m',
        spinupTime: '1.320',
        spinupTimeUnit: 's',
        minimumBatteryVoltage: '11.70',
        minimumBatteryVoltageUnit: 'V',
        effectiveMoi: '15.000',
        effectiveMoiUnit: 'in2*lbs',
      });
    });
  });

  test.describe('Copy link button', () => {
    test('Copy link with default values', async ({ page, browserName }) => {
      test.skip(browserName === 'webkit');

      await page.getByRole('button', { name: 'Copy Link' }).click();
      const clipboardValue = await page.evaluate<string>(() =>
        navigator.clipboard.readText(),
      );
      const url = new URL(clipboardValue);
      expect(url.pathname).toBe('/flywheel');
      const params = new URLSearchParams(url.search);
      expect(params.get('motor')).toBeTruthy();
      expect(params.get('ratio')).toBeTruthy();
      expect(params.get('statorLimit')).toBeTruthy();
      expect(params.get('supplyLimit')).toBeTruthy();
      expect(params.get('supplyVoltage')).toBeTruthy();
      expect(params.get('batteryResistance')).toBeTruthy();
      expect(params.get('shooterDiameter')).toBeTruthy();
      expect(params.get('shooterWeight')).toBeTruthy();
      expect(params.get('shooterTargetSpeed')).toBeTruthy();
      expect(params.get('customShooterMoi')).toBeTruthy();
      expect(params.get('useCustomShooterMoi')).toBe('false');
      expect(params.get('flywheelDiameter')).toBeTruthy();
      expect(params.get('flywheelWeight')).toBeTruthy();
      expect(params.get('customFlywheelMoi')).toBeTruthy();
      expect(params.get('useCustomFlywheelMoi')).toBe('false');
      expect(params.get('flywhweelToShooterRatio')).toBeTruthy();
      expect(params.get('projectileDiameter')).toBeTruthy();
      expect(params.get('projectileWeight')).toBeTruthy();
      expect(params.get('efficiency')).toBe('100');
    });

    test('Copy link with modified values', async ({ page, browserName }) => {
      test.skip(browserName === 'webkit');

      await page.getByTestId('motor').fill('4');
      await page.getByTestId('ratio').fill('2');
      await page.getByTestId('statorLimit').fill('50');
      await page.getByTestId('supplyLimit').fill('100');
      await page.getByTestId('supplyVoltage').fill('11');
      await page.getByTestId('batteryResistance').fill('0.02');
      await page.getByTestId('efficiency').fill('90');
      await page.getByTestId('shooterDiameter').fill('5');
      await page.getByTestId('shooterWeight').fill('2');
      await page.getByTestId('shooterTargetSpeed').fill('4000');
      await page.getByTestId('useCustomShooterMoi').click();
      await page.getByTestId('customShooterMoi').fill('5');
      await page.getByTestId('flywheelDiameter').fill('5');
      await page.getByTestId('flywheelWeight').fill('2');
      await page.getByTestId('flywheelToShooterRatio').fill('2');
      await page.getByTestId('useCustomFlywheelMoi').click();
      await page.getByTestId('customFlywheelMoi').fill('4');
      await page.getByTestId('projectileWeight').fill('1');

      await page.getByRole('button', { name: 'Copy Link' }).click();
      const clipboardValue = await page.evaluate<string>(() =>
        navigator.clipboard.readText(),
      );
      const url = new URL(clipboardValue);
      expect(url.pathname).toBe('/flywheel');
      const params = new URLSearchParams(url.search);
      expect(params.get('motor')).toBeTruthy();
      expect(params.get('ratio')).toBeTruthy();
      const statorLimitValue = decodeURIComponent(
        params.get('statorLimit') ?? '',
      );
      expect(statorLimitValue).toContain('s=50');
      expect(statorLimitValue).toContain('u=A');
      const supplyLimitValue = decodeURIComponent(
        params.get('supplyLimit') ?? '',
      );
      expect(supplyLimitValue).toContain('s=100');
      expect(supplyLimitValue).toContain('u=A');
      const supplyVoltageValue = decodeURIComponent(
        params.get('supplyVoltage') ?? '',
      );
      expect(supplyVoltageValue).toContain('s=11');
      expect(supplyVoltageValue).toContain('u=V');
      const batteryResistanceValue = decodeURIComponent(
        params.get('batteryResistance') ?? '',
      );
      expect(batteryResistanceValue).toContain('s=0.02');
      expect(batteryResistanceValue).toContain('u=Ohm');
      expect(params.get('efficiency')).toBe('90');
      const shooterDiameterValue = decodeURIComponent(
        params.get('shooterDiameter') ?? '',
      );
      expect(shooterDiameterValue).toContain('s=5');
      expect(shooterDiameterValue).toContain('u=in');
      const shooterWeightValue = decodeURIComponent(
        params.get('shooterWeight') ?? '',
      );
      expect(shooterWeightValue).toContain('s=2');
      expect(shooterWeightValue).toContain('u=lbs');
      const shooterTargetSpeedValue = decodeURIComponent(
        params.get('shooterTargetSpeed') ?? '',
      );
      expect(shooterTargetSpeedValue).toContain('s=4000');
      expect(shooterTargetSpeedValue).toContain('u=rpm');
      expect(params.get('useCustomShooterMoi')).toBe('true');
      const customShooterMoiValue = decodeURIComponent(
        params.get('customShooterMoi') ?? '',
      );
      expect(customShooterMoiValue).toContain('s=5');
      const flywheelDiameterValue = decodeURIComponent(
        params.get('flywheelDiameter') ?? '',
      );
      expect(flywheelDiameterValue).toContain('s=5');
      expect(flywheelDiameterValue).toContain('u=in');
      const flywheelWeightValue = decodeURIComponent(
        params.get('flywheelWeight') ?? '',
      );
      expect(flywheelWeightValue).toContain('s=2');
      expect(flywheelWeightValue).toContain('u=lbs');
      const flywheelToShooterRatioValue = decodeURIComponent(
        params.get('flywhweelToShooterRatio') ?? '',
      );
      expect(flywheelToShooterRatioValue).toContain('magnitude=2');
      expect(params.get('useCustomFlywheelMoi')).toBe('true');
      const customFlywheelMoiValue = decodeURIComponent(
        params.get('customFlywheelMoi') ?? '',
      );
      expect(customFlywheelMoiValue).toContain('s=4');
      const projectileWeightValue = decodeURIComponent(
        params.get('projectileWeight') ?? '',
      );
      expect(projectileWeightValue).toContain('s=1');
      expect(projectileWeightValue).toContain('u=lbs');
    });

    test('Copy link URL can be navigated to restore state', async ({
      page,
      browserName,
    }) => {
      test.skip(browserName === 'webkit');

      await page.getByTestId('motor').fill('4');
      await page.getByTestId('ratio').fill('2');
      await page.getByTestId('statorLimit').fill('50');
      await page.getByTestId('efficiency').fill('90');
      await page.getByTestId('shooterDiameter').fill('5');
      await page.getByTestId('shooterWeight').fill('2');
      await page.getByTestId('shooterTargetSpeed').fill('4000');
      await page.getByTestId('flywheelDiameter').fill('5');
      await page.getByTestId('flywheelWeight').fill('2');

      await page.getByRole('button', { name: 'Copy Link' }).click();
      const clipboardValue = await page.evaluate<string>(() =>
        navigator.clipboard.readText(),
      );

      await page.goto(clipboardValue);

      await assertInputs(page, {
        motorQuantity: '4',
        motorName: 'Kraken X60 (FOC)',
        ratioMagnitude: '2',
        ratioType: 'Reduction',
        statorLimit: '50',
        statorLimitUnit: 'A',
        supplyLimit: '90',
        supplyLimitUnit: 'A',
        supplyVoltage: '12.6',
        supplyVoltageUnit: 'V',
        batteryResistance: '0.015',
        batteryResistanceUnit: 'Ohm',
        efficiency: '90',
        shooterDiameter: '5',
        shooterDiameterUnit: 'in',
        shooterWeight: '2',
        shooterWeightUnit: 'lbs',
        shooterTargetSpeed: '4000',
        shooterTargetSpeedUnit: 'rpm',
        useCustomShooterMoi: false,
        customShooterMoi: '4.5',
        customShooterMoiUnit: 'in2*lbs',
        flywheelDiameter: '5',
        flywheelDiameterUnit: 'in',
        flywheelWeight: '2',
        flywheelWeightUnit: 'lbs',
        flywheelToShooterRatio: '1',
        flywheelToShooterRatioUnit: 'Reduction',
        useCustomFlywheelMoi: false,
        customFlywheelMoi: '3',
        customFlywheelMoiUnit: 'in2*lbs',
        projectileWeight: '0.5',
        projectileWeightUnit: 'lbs',
      });
    });
  });
});

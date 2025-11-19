import { expect, test } from '@playwright/test';

const CHART_DELAY_MS = 750;

test.describe('Flywheel Calculator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/flywheel');
    await page.waitForLoadState('networkidle');
  });

  test('should match snapshot with statorLimit magnitude changed', async ({
    page,
  }) => {
    await page.getByTestId('statorLimit').fill('50');
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(await page.getByRole('main').ariaSnapshot()).toMatchSnapshot({
      name: 'statorLimit-magnitude-changed.yaml',
    });
  });

  test('should match snapshot with statorLimit unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectstatorLimit').click();
    await page.getByRole('option', { name: 'A' }).click();
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(await page.getByRole('main').ariaSnapshot()).toMatchSnapshot({
      name: 'statorLimit-unit-changed.yaml',
    });
  });

  test('should match snapshot with supplyLimit magnitude changed', async ({
    page,
  }) => {
    await page.getByTestId('supplyLimit').fill('10');
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(await page.getByRole('main').ariaSnapshot()).toMatchSnapshot({
      name: 'supplyLimit-magnitude-changed.yaml',
    });
  });

  test('should match snapshot with supplyLimit unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectsupplyLimit').click();
    await page.getByRole('option', { name: 'A' }).click();
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(await page.getByRole('main').ariaSnapshot()).toMatchSnapshot({
      name: 'supplyLimit-unit-changed.yaml',
    });
  });

  test('should match snapshot with supplyVoltage magnitude changed', async ({
    page,
  }) => {
    await page.getByTestId('supplyVoltage').fill('10');
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(await page.getByRole('main').ariaSnapshot()).toMatchSnapshot({
      name: 'supplyVoltage-magnitude-changed.yaml',
    });
  });

  test('should match snapshot with supplyVoltage unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectsupplyVoltage').click();
    await page.getByRole('option', { name: 'V' }).click();
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(await page.getByRole('main').ariaSnapshot()).toMatchSnapshot({
      name: 'supplyVoltage-unit-changed.yaml',
    });
  });

  test('should match snapshot with batteryResistance magnitude changed', async ({
    page,
  }) => {
    await page.getByTestId('batteryResistance').fill('0.03');
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(await page.getByRole('main').ariaSnapshot()).toMatchSnapshot({
      name: 'batteryResistance-magnitude-changed.yaml',
    });
  });

  test('should match snapshot with batteryResistance unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectbatteryResistance').click();
    await page.getByRole('option', { name: 'Ohm' }).click();
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(await page.getByRole('main').ariaSnapshot()).toMatchSnapshot({
      name: 'batteryResistance-unit-changed.yaml',
    });
  });

  test('should match snapshot with shooterDiameter magnitude changed', async ({
    page,
  }) => {
    await page.getByTestId('shooterDiameter').fill('4');
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(await page.getByRole('main').ariaSnapshot()).toMatchSnapshot({
      name: 'shooterDiameter-magnitude-changed.yaml',
    });
  });

  test('should match snapshot with shooterDiameter unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectshooterDiameter').click();
    await page.getByRole('option', { name: 'cm' }).click();
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(await page.getByRole('main').ariaSnapshot()).toMatchSnapshot({
      name: 'shooterDiameter-unit-changed.yaml',
    });
  });

  test('should match snapshot with shooterWeight magnitude changed', async ({
    page,
  }) => {
    await page.getByTestId('shooterWeight').fill('2');
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(await page.getByRole('main').ariaSnapshot()).toMatchSnapshot({
      name: 'shooterWeight-magnitude-changed.yaml',
    });
  });

  test('should match snapshot with shooterWeight unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectshooterWeight').click();
    await page.getByRole('option', { name: 'kg' }).click();
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(await page.getByRole('main').ariaSnapshot()).toMatchSnapshot({
      name: 'shooterWeight-unit-changed.yaml',
    });
  });

  test('should match snapshot with shooterTargetSpeed magnitude changed', async ({
    page,
  }) => {
    await page.getByTestId('shooterTargetSpeed').fill('2000');
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(await page.getByRole('main').ariaSnapshot()).toMatchSnapshot({
      name: 'shooterTargetSpeed-magnitude-changed.yaml',
    });
  });

  test('should match snapshot with shooterTargetSpeed unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectshooterTargetSpeed').click();
    await page.getByRole('option', { name: 'rpm' }).click();
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(await page.getByRole('main').ariaSnapshot()).toMatchSnapshot({
      name: 'shooterTargetSpeed-unit-changed.yaml',
    });
  });

  test('should match snapshot with flywheelDiameter magnitude changed', async ({
    page,
  }) => {
    await page.getByTestId('flywheelDiameter').fill('6');
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(await page.getByRole('main').ariaSnapshot()).toMatchSnapshot({
      name: 'flywheelDiameter-magnitude-changed.yaml',
    });
  });

  test('should match snapshot with flywheelDiameter unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectflywheelDiameter').click();
    await page.getByRole('option', { name: 'cm' }).click();
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(await page.getByRole('main').ariaSnapshot()).toMatchSnapshot({
      name: 'flywheelDiameter-unit-changed.yaml',
    });
  });

  test('should match snapshot with flywheelWeight magnitude changed', async ({
    page,
  }) => {
    await page.getByTestId('flywheelWeight').fill('3');
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(await page.getByRole('main').ariaSnapshot()).toMatchSnapshot({
      name: 'flywheelWeight-magnitude-changed.yaml',
    });
  });

  test('should match snapshot with flywheelWeight unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectflywheelWeight').click();
    await page.getByRole('option', { name: 'kg' }).click();
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(await page.getByRole('main').ariaSnapshot()).toMatchSnapshot({
      name: 'flywheelWeight-unit-changed.yaml',
    });
  });

  //   test('should match snapshot with projectileDiameter magnitude changed', async ({
  //     page,
  //   }) => {
  //     await page.getByTestId('projectileDiameter').fill('2');
  //     expect(await page.getByRole('main').ariaSnapshot()).toMatchSnapshot({
  //       name: 'projectileDiameter-magnitude-changed.yaml',
  //     });
  //   });

  //   test('should match snapshot with projectileDiameter unit changed', async ({
  //     page,
  //   }) => {
  //     await page.getByTestId('selectprojectileDiameter').click();
  //     await page.getByRole('option', { name: 'cm' }).click();
  //     expect(await page.getByRole('main').ariaSnapshot()).toMatchSnapshot({
  //       name: 'projectileDiameter-unit-changed.yaml',
  //     });
  //   });

  //   test('should match snapshot with projectileWeight magnitude changed', async ({
  //     page,
  //   }) => {
  //     await page.getByTestId('projectileWeight').fill('1');
  //     expect(await page.getByRole('main').ariaSnapshot()).toMatchSnapshot({
  //       name: 'projectileWeight-magnitude-changed.yaml',
  //     });
  //   });

  //   test('should match snapshot with projectileWeight unit changed', async ({
  //     page,
  //   }) => {
  //     await page.getByTestId('selectprojectileWeight').click();
  //     await page.getByRole('option', { name: 'kg' }).click();
  //     expect(await page.getByRole('main').ariaSnapshot()).toMatchSnapshot({
  //       name: 'projectileWeight-unit-changed.yaml',
  //     });
  //   });

  test('should match snapshot with motor magnitude changed', async ({
    page,
  }) => {
    await page.getByTestId('motor').fill('1');
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(await page.getByRole('main').ariaSnapshot()).toMatchSnapshot({
      name: 'motor-magnitude-changed.yaml',
    });
  });

  test('should match snapshot with motor unit changed', async ({ page }) => {
    await page.getByTestId('selectmotor').click();
    await page.getByRole('option', { name: 'NEO', exact: true }).click();
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(await page.getByRole('main').ariaSnapshot()).toMatchSnapshot({
      name: 'motor-unit-changed.yaml',
    });
  });

  test('should match snapshot with ratio magnitude changed', async ({
    page,
  }) => {
    await page.getByTestId('shooterTargetSpeed').fill('1000');
    await page.getByTestId('ratio').fill('2');

    await page.waitForTimeout(CHART_DELAY_MS);

    expect(await page.getByRole('main').ariaSnapshot()).toMatchSnapshot({
      name: 'ratio-magnitude-changed.yaml',
    });
  });

  test('should match snapshot with ratio unit changed', async ({ page }) => {
    await page.getByTestId('selectratio').click();
    await page.getByRole('option', { name: 'Step-up' }).click();
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(await page.getByRole('main').ariaSnapshot()).toMatchSnapshot({
      name: 'ratio-unit-changed.yaml',
    });
  });

  test('should match snapshot with flywheelToShooterRatio magnitude changed', async ({
    page,
  }) => {
    await page.getByTestId('flywheelToShooterRatio').fill('2');
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(await page.getByRole('main').ariaSnapshot()).toMatchSnapshot({
      name: 'flywheelToShooterRatio-magnitude-changed.yaml',
    });
  });

  test('should match snapshot with flywheelToShooterRatio unit changed', async ({
    page,
  }) => {
    await page.getByTestId('flywheelToShooterRatio').fill('2');
    await page.getByTestId('selectflywheelToShooterRatio').click();
    await page.getByRole('option', { name: 'Step-up' }).click();
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(await page.getByRole('main').ariaSnapshot()).toMatchSnapshot({
      name: 'flywheelToShooterRatio-unit-changed.yaml',
    });
  });

  test('should match snapshot with efficiency changed', async ({ page }) => {
    await page.getByTestId('efficiency').fill('90');
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(await page.getByRole('main').ariaSnapshot()).toMatchSnapshot({
      name: 'efficiency-changed.yaml',
    });
  });

  test('should match snapshot with maxAchievableShooterRpm unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectmaxAchievableShooterRpm').click();
    await page.getByRole('option', { name: 'rpm' }).click();
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(await page.getByRole('main').ariaSnapshot()).toMatchSnapshot({
      name: 'maxAchievableShooterRpm-changed.yaml',
    });
  });

  test('should match snapshot with derivedShooterMoi unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectderivedShooterMoi').click();
    await page.getByRole('option', { name: 'kg*m2' }).click();
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(await page.getByRole('main').ariaSnapshot()).toMatchSnapshot({
      name: 'derivedShooterMoi-changed.yaml',
    });
  });

  test('should match snapshot with derivedFlywheelMoi unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectderivedFlywheelMoi').click();
    await page.getByRole('option', { name: 'kg*m2' }).click();
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(await page.getByRole('main').ariaSnapshot()).toMatchSnapshot({
      name: 'derivedFlywheelMoi-changed.yaml',
    });
  });

  test('should match snapshot with kV unit changed', async ({ page }) => {
    await page.getByTestId('selectkV').click();
    await page.getByRole('option', { name: 'V*s/in' }).click();
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(await page.getByRole('main').ariaSnapshot()).toMatchSnapshot({
      name: 'kV-changed.yaml',
    });
  });

  test('should match snapshot with kA unit changed', async ({ page }) => {
    await page.getByTestId('selectkA').click();
    await page.getByRole('option', { name: 'V*s^2/in' }).click();
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(await page.getByRole('main').ariaSnapshot()).toMatchSnapshot({
      name: 'kA-changed.yaml',
    });
  });

  test('should match snapshot with spinupTime unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectspinupTime').click();
    await page.getByRole('option', { name: 's' }).click();
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(await page.getByRole('main').ariaSnapshot()).toMatchSnapshot({
      name: 'spinupTime-changed.yaml',
    });
  });

  test('should match snapshot with effectiveMoi unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selecteffectiveMoi').click();
    await page.getByRole('option', { name: 'kg*m2' }).click();
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(await page.getByRole('main').ariaSnapshot()).toMatchSnapshot({
      name: 'effectiveMoi-changed.yaml',
    });
  });
});

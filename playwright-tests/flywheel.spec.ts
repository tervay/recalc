import { type Page, expect, test } from '@playwright/test';

async function waitForCalc(page: Page) {
  await page.waitForTimeout(100);
  await expect(page.getByTestId('flywheel-main')).toHaveAttribute(
    'data-calculating',
    'false',
    { timeout: 30000 },
  );
}

test.describe('Flywheel Calculator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/flywheel');
    await page.waitForLoadState('networkidle');
  });

  test('should match snapshot with statorLimit magnitude changed', async ({
    page,
  }) => {
    await page.getByTestId('statorLimit').fill('50');
    await waitForCalc(page);
    expect(
      await page.getByTestId('flywheel-main').ariaSnapshot(),
    ).toMatchSnapshot({
      name: 'statorLimit-magnitude-changed.yaml',
    });
  });

  test('should match snapshot with statorLimit unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectstatorLimit').click();
    await page.getByRole('option', { name: 'A' }).click();
    await waitForCalc(page);
    expect(
      await page.getByTestId('flywheel-main').ariaSnapshot(),
    ).toMatchSnapshot({
      name: 'statorLimit-unit-changed.yaml',
    });
  });

  test('should match snapshot with supplyLimit magnitude changed', async ({
    page,
  }) => {
    await page.getByTestId('supplyLimit').fill('10');
    await waitForCalc(page);
    expect(
      await page.getByTestId('flywheel-main').ariaSnapshot(),
    ).toMatchSnapshot({
      name: 'supplyLimit-magnitude-changed.yaml',
    });
  });

  test('should match snapshot with supplyLimit unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectsupplyLimit').click();
    await page.getByRole('option', { name: 'A' }).click();
    await waitForCalc(page);
    expect(
      await page.getByTestId('flywheel-main').ariaSnapshot(),
    ).toMatchSnapshot({
      name: 'supplyLimit-unit-changed.yaml',
    });
  });

  test('should match snapshot with supplyVoltage magnitude changed', async ({
    page,
  }) => {
    await page.getByTestId('supplyVoltage').fill('10');
    await waitForCalc(page);
    expect(
      await page.getByTestId('flywheel-main').ariaSnapshot(),
    ).toMatchSnapshot({
      name: 'supplyVoltage-magnitude-changed.yaml',
    });
  });

  test('should match snapshot with supplyVoltage unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectsupplyVoltage').click();
    await page.getByRole('option', { name: 'V' }).click();
    await waitForCalc(page);
    expect(
      await page.getByTestId('flywheel-main').ariaSnapshot(),
    ).toMatchSnapshot({
      name: 'supplyVoltage-unit-changed.yaml',
    });
  });

  test('should match snapshot with batteryResistance magnitude changed', async ({
    page,
  }) => {
    await page.getByTestId('batteryResistance').fill('0.03');
    await waitForCalc(page);
    expect(
      await page.getByTestId('flywheel-main').ariaSnapshot(),
    ).toMatchSnapshot({
      name: 'batteryResistance-magnitude-changed.yaml',
    });
  });

  test('should match snapshot with batteryResistance unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectbatteryResistance').click();
    await page.getByRole('option', { name: 'Ohm' }).click();
    await waitForCalc(page);
    expect(
      await page.getByTestId('flywheel-main').ariaSnapshot(),
    ).toMatchSnapshot({
      name: 'batteryResistance-unit-changed.yaml',
    });
  });

  test('should match snapshot with shooterDiameter magnitude changed', async ({
    page,
  }) => {
    await page.getByTestId('shooterDiameter').fill('4');
    await waitForCalc(page);
    expect(
      await page.getByTestId('flywheel-main').ariaSnapshot(),
    ).toMatchSnapshot({
      name: 'shooterDiameter-magnitude-changed.yaml',
    });
  });

  test('should match snapshot with shooterDiameter unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectshooterDiameter').click();
    await page.getByRole('option', { name: 'cm' }).click();
    await waitForCalc(page);
    expect(
      await page.getByTestId('flywheel-main').ariaSnapshot(),
    ).toMatchSnapshot({
      name: 'shooterDiameter-unit-changed.yaml',
    });
  });

  test('should match snapshot with shooterWeight magnitude changed', async ({
    page,
  }) => {
    await page.getByTestId('shooterWeight').fill('2');
    await waitForCalc(page);
    expect(
      await page.getByTestId('flywheel-main').ariaSnapshot(),
    ).toMatchSnapshot({
      name: 'shooterWeight-magnitude-changed.yaml',
    });
  });

  test('should match snapshot with shooterWeight unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectshooterWeight').click();
    await page.getByRole('option', { name: 'kg' }).click();
    await waitForCalc(page);
    expect(
      await page.getByTestId('flywheel-main').ariaSnapshot(),
    ).toMatchSnapshot({
      name: 'shooterWeight-unit-changed.yaml',
    });
  });

  test('should match snapshot with shooterTargetSpeed magnitude changed', async ({
    page,
  }) => {
    await page.getByTestId('shooterTargetSpeed').fill('2000');
    await waitForCalc(page);
    expect(
      await page.getByTestId('flywheel-main').ariaSnapshot(),
    ).toMatchSnapshot({
      name: 'shooterTargetSpeed-magnitude-changed.yaml',
    });
  });

  test('should match snapshot with shooterTargetSpeed unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectshooterTargetSpeed').click();
    await page.getByRole('option', { name: 'rpm' }).click();
    await waitForCalc(page);
    expect(
      await page.getByTestId('flywheel-main').ariaSnapshot(),
    ).toMatchSnapshot({
      name: 'shooterTargetSpeed-unit-changed.yaml',
    });
  });

  test('should match snapshot with flywheelDiameter magnitude changed', async ({
    page,
  }) => {
    await page.getByTestId('flywheelEnabled').click();
    await page.getByTestId('flywheelDiameter').fill('6');
    await waitForCalc(page);
    expect(
      await page.getByTestId('flywheel-main').ariaSnapshot(),
    ).toMatchSnapshot({
      name: 'flywheelDiameter-magnitude-changed.yaml',
    });
  });

  test('should match snapshot with flywheelDiameter unit changed', async ({
    page,
  }) => {
    await page.getByTestId('flywheelEnabled').click();
    await page.getByTestId('selectflywheelDiameter').click();
    await page.getByRole('option', { name: 'cm' }).click();
    await waitForCalc(page);
    expect(
      await page.getByTestId('flywheel-main').ariaSnapshot(),
    ).toMatchSnapshot({
      name: 'flywheelDiameter-unit-changed.yaml',
    });
  });

  test('should match snapshot with flywheelWeight magnitude changed', async ({
    page,
  }) => {
    await page.getByTestId('flywheelEnabled').click();
    await page.getByTestId('flywheelWeight').fill('3');
    await waitForCalc(page);
    expect(
      await page.getByTestId('flywheel-main').ariaSnapshot(),
    ).toMatchSnapshot({
      name: 'flywheelWeight-magnitude-changed.yaml',
    });
  });

  test('should match snapshot with flywheelWeight unit changed', async ({
    page,
  }) => {
    await page.getByTestId('flywheelEnabled').click();
    await page.getByTestId('selectflywheelWeight').click();
    await page.getByRole('option', { name: 'kg' }).click();
    await waitForCalc(page);
    expect(
      await page.getByTestId('flywheel-main').ariaSnapshot(),
    ).toMatchSnapshot({
      name: 'flywheelWeight-unit-changed.yaml',
    });
  });

  test('should match snapshot with projectileDiameter magnitude changed', async ({
    page,
  }) => {
    await page.getByTestId('projectileDiameter').fill('2');
    await waitForCalc(page);
    expect(
      await page.getByTestId('flywheel-main').ariaSnapshot(),
    ).toMatchSnapshot({
      name: 'projectileDiameter-magnitude-changed.yaml',
    });
  });

  test('should match snapshot with projectileDiameter unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectprojectileDiameter').click();
    await page.getByRole('option', { name: 'cm' }).click();
    await waitForCalc(page);
    expect(
      await page.getByTestId('flywheel-main').ariaSnapshot(),
    ).toMatchSnapshot({
      name: 'projectileDiameter-unit-changed.yaml',
    });
  });

  test('should match snapshot with projectileWeight magnitude changed', async ({
    page,
  }) => {
    await page.getByTestId('projectileWeight').fill('1');
    await waitForCalc(page);
    expect(
      await page.getByTestId('flywheel-main').ariaSnapshot(),
    ).toMatchSnapshot({
      name: 'projectileWeight-magnitude-changed.yaml',
    });
  });

  test('should match snapshot with projectileWeight unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectprojectileWeight').click();
    await page.getByRole('option', { name: 'kg' }).click();
    await waitForCalc(page);
    expect(
      await page.getByTestId('flywheel-main').ariaSnapshot(),
    ).toMatchSnapshot({
      name: 'projectileWeight-unit-changed.yaml',
    });
  });

  test('should match snapshot with ballExitVelocity unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectballExitVelocity').click();
    await page.getByRole('option', { name: 'm/s' }).click();
    await waitForCalc(page);
    expect(
      await page.getByTestId('flywheel-main').ariaSnapshot(),
    ).toMatchSnapshot({
      name: 'ballExitVelocity-unit-changed.yaml',
    });
  });

  test('should match snapshot with recoveryTime unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectrecoveryTime').click();
    await page.getByRole('option', { name: 's', exact: true }).click();
    await waitForCalc(page);
    expect(
      await page.getByTestId('flywheel-main').ariaSnapshot(),
    ).toMatchSnapshot({
      name: 'recoveryTime-unit-changed.yaml',
    });
  });

  test('should match snapshot with motor magnitude changed', async ({
    page,
  }) => {
    await page.getByTestId('motor').fill('1');
    await waitForCalc(page);
    expect(
      await page.getByTestId('flywheel-main').ariaSnapshot(),
    ).toMatchSnapshot({
      name: 'motor-magnitude-changed.yaml',
    });
  });

  test('should match snapshot with motor unit changed', async ({ page }) => {
    await page.getByTestId('selectmotor').click();
    await page.getByRole('option', { name: 'NEO', exact: true }).click();
    await waitForCalc(page);
    expect(
      await page.getByTestId('flywheel-main').ariaSnapshot(),
    ).toMatchSnapshot({
      name: 'motor-unit-changed.yaml',
    });
  });

  test('should match snapshot with ratio magnitude changed', async ({
    page,
  }) => {
    await page.getByTestId('shooterTargetSpeed').fill('1000');
    await page.getByTestId('ratio').fill('2');

    await waitForCalc(page);

    expect(
      await page.getByTestId('flywheel-main').ariaSnapshot(),
    ).toMatchSnapshot({
      name: 'ratio-magnitude-changed.yaml',
    });
  });

  test('should match snapshot with ratio unit changed', async ({ page }) => {
    await page.getByTestId('selectratio').click();
    await page.getByRole('option', { name: 'Step-up' }).click();
    await waitForCalc(page);
    expect(
      await page.getByTestId('flywheel-main').ariaSnapshot(),
    ).toMatchSnapshot({
      name: 'ratio-unit-changed.yaml',
    });
  });

  test('should match snapshot with flywheelToShooterRatio magnitude changed', async ({
    page,
  }) => {
    await page.getByTestId('flywheelEnabled').click();
    await page.getByTestId('flywheelToShooterRatio').fill('2');
    await waitForCalc(page);
    expect(
      await page.getByTestId('flywheel-main').ariaSnapshot(),
    ).toMatchSnapshot({
      name: 'flywheelToShooterRatio-magnitude-changed.yaml',
    });
  });

  test('should match snapshot with flywheelToShooterRatio unit changed', async ({
    page,
  }) => {
    await page.getByTestId('flywheelEnabled').click();
    await page.getByTestId('flywheelToShooterRatio').fill('2');
    await page.getByTestId('selectflywheelToShooterRatio').click();
    await page.getByRole('option', { name: 'Step-up' }).click();
    await waitForCalc(page);
    expect(
      await page.getByTestId('flywheel-main').ariaSnapshot(),
    ).toMatchSnapshot({
      name: 'flywheelToShooterRatio-unit-changed.yaml',
    });
  });

  test('should match snapshot with efficiency changed', async ({ page }) => {
    await page.getByTestId('efficiency').fill('90');
    await waitForCalc(page);
    expect(
      await page.getByTestId('flywheel-main').ariaSnapshot(),
    ).toMatchSnapshot({
      name: 'efficiency-changed.yaml',
    });
  });

  test('should match snapshot with maxAchievableShooterRpm unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectmaxAchievableShooterRpm').click();
    await page.getByRole('option', { name: 'rpm' }).click();
    await waitForCalc(page);
    expect(
      await page.getByTestId('flywheel-main').ariaSnapshot(),
    ).toMatchSnapshot({
      name: 'maxAchievableShooterRpm-changed.yaml',
    });
  });

  test('should match snapshot with derivedShooterMoi unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectderivedShooterMoi').click();
    await page.getByRole('option', { name: 'kg*m2' }).click();
    await waitForCalc(page);
    expect(
      await page.getByTestId('flywheel-main').ariaSnapshot(),
    ).toMatchSnapshot({
      name: 'derivedShooterMoi-changed.yaml',
    });
  });

  test('should match snapshot with derivedFlywheelMoi unit changed', async ({
    page,
  }) => {
    await page.getByTestId('flywheelEnabled').click();
    await page.getByTestId('selectderivedFlywheelMoi').click();
    await page.getByRole('option', { name: 'kg*m2' }).click();
    await waitForCalc(page);
    expect(
      await page.getByTestId('flywheel-main').ariaSnapshot(),
    ).toMatchSnapshot({
      name: 'derivedFlywheelMoi-changed.yaml',
    });
  });

  test('should match snapshot with kV unit changed', async ({ page }) => {
    await page.getByTestId('selectkV').click();
    await page.getByRole('option', { name: 'V*s/in' }).click();
    await waitForCalc(page);
    expect(
      await page.getByTestId('flywheel-main').ariaSnapshot(),
    ).toMatchSnapshot({
      name: 'kV-changed.yaml',
    });
  });

  test('should match snapshot with kA unit changed', async ({ page }) => {
    await page.getByTestId('selectkA').click();
    await page.getByRole('option', { name: 'V*s^2/in' }).click();
    await waitForCalc(page);
    expect(
      await page.getByTestId('flywheel-main').ariaSnapshot(),
    ).toMatchSnapshot({
      name: 'kA-changed.yaml',
    });
  });

  test('should match snapshot with spinupTime unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectspinupTime').click();
    await page.getByRole('option', { name: 's', exact: true }).click();
    await waitForCalc(page);
    expect(
      await page.getByTestId('flywheel-main').ariaSnapshot(),
    ).toMatchSnapshot({
      name: 'spinupTime-changed.yaml',
    });
  });

  test('should match snapshot with effectiveMoi unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selecteffectiveMoi').click();
    await page.getByRole('option', { name: 'kg*m2' }).click();
    await waitForCalc(page);
    expect(
      await page.getByTestId('flywheel-main').ariaSnapshot(),
    ).toMatchSnapshot({
      name: 'effectiveMoi-changed.yaml',
    });
  });

  test('should match snapshot with compound mode selected', async ({
    page,
  }) => {
    await page.getByTestId('shooterMode').click();
    await page
      .getByRole('option', { name: 'Compound (Single + Dual)' })
      .click();
    await waitForCalc(page);
    expect(
      await page.getByTestId('flywheel-main').ariaSnapshot(),
    ).toMatchSnapshot({
      name: 'shooterMode-compound.yaml',
    });
  });

  test('should match snapshot with ballInitialVelocity changed', async ({
    page,
  }) => {
    await page.getByTestId('ballInitialVelocity').fill('5');
    await waitForCalc(page);
    expect(
      await page.getByTestId('flywheel-main').ariaSnapshot(),
    ).toMatchSnapshot({
      name: 'ballInitialVelocity-changed.yaml',
    });
  });

  test('should match snapshot with ballInitialSpin changed', async ({
    page,
  }) => {
    await page.getByTestId('ballInitialSpin').fill('100');
    await waitForCalc(page);
    expect(
      await page.getByTestId('flywheel-main').ariaSnapshot(),
    ).toMatchSnapshot({
      name: 'ballInitialSpin-changed.yaml',
    });
  });

  test('mechanism optimization grid renders and selected config panel appears', async ({
    page,
  }) => {
    // The optimization toggle defaults to enabled; assert it is present.
    const toggle = page.getByTestId('optimizationEnabled');
    await expect(toggle).toBeVisible();

    // The grid heading should be visible immediately while loading.
    await expect(page.getByText('Optimal Configuration Grid')).toBeVisible();

    // Wait for the optimizer worker to finish — the Badge switches from "— configs"
    // to "N configs" (a number) once results arrive.
    const configsBadge = page
      .locator('[data-slot="badge"]')
      .filter({ hasText: /\d+ configs/ });
    await expect(configsBadge).toBeVisible({ timeout: 30000 });

    // The optimizer auto-selects the recommended config, so the Selected Config
    // panel should already be visible.
    await expect(page.getByText('Selected Config')).toBeVisible();
    await expect(page.getByText('Optimal Ratio')).toBeVisible();

    // Click a grid cell button (ratio label format: "N.NN:1") to verify
    // selection is interactive.
    const firstCell = page
      .getByRole('button')
      .filter({ hasText: /\d+\.\d+:1/ })
      .first();
    await expect(firstCell).toBeVisible();
    await firstCell.click();

    // Selected Config panel remains visible after clicking a cell.
    await expect(page.getByText('Selected Config')).toBeVisible();
  });
});

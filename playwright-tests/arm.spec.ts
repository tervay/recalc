import { type Page, expect, test } from '@playwright/test';

async function waitForCalc(page: Page) {
  await page.waitForTimeout(100);
  await expect(page.getByTestId('arm-main')).toHaveAttribute(
    'data-calculating',
    'false',
    { timeout: 30000 },
  );
}

test.describe('Arm Calculator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/arm');
    await page.waitForLoadState('networkidle');
  });

  test('should match snapshot with motor magnitude changed', async ({
    page,
  }) => {
    await page.getByTestId('motor').fill('2');
    await waitForCalc(page);
    expect(await page.getByTestId('arm-main').ariaSnapshot()).toMatchSnapshot({
      name: 'motor-magnitude-changed.yaml',
    });
  });

  test('should match snapshot with motor unit changed', async ({ page }) => {
    await page.getByTestId('selectmotor').click();
    await page.getByRole('option', { name: 'NEO', exact: true }).click();
    await waitForCalc(page);
    expect(await page.getByTestId('arm-main').ariaSnapshot()).toMatchSnapshot({
      name: 'motor-unit-changed.yaml',
    });
  });

  test('should match snapshot with ratio magnitude changed', async ({
    page,
  }) => {
    await page.getByTestId('ratio').fill('200');
    await waitForCalc(page);
    expect(await page.getByTestId('arm-main').ariaSnapshot()).toMatchSnapshot({
      name: 'ratio-magnitude-changed.yaml',
    });
  });

  test('should match snapshot with ratio unit changed', async ({ page }) => {
    await page.getByTestId('selectratio').click();
    await page.getByRole('option', { name: 'Step-up' }).click();
    await waitForCalc(page);
    expect(await page.getByTestId('arm-main').ariaSnapshot()).toMatchSnapshot({
      name: 'ratio-unit-changed.yaml',
    });
  });

  test('should match snapshot with armLength magnitude changed', async ({
    page,
  }) => {
    await page.getByTestId('armLength').fill('12');
    await waitForCalc(page);
    expect(await page.getByTestId('arm-main').ariaSnapshot()).toMatchSnapshot({
      name: 'armLength-magnitude-changed.yaml',
    });
  });

  test('should match snapshot with armLength unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectarmLength').click();
    await page.getByRole('option', { name: 'cm' }).click();
    await waitForCalc(page);
    expect(await page.getByTestId('arm-main').ariaSnapshot()).toMatchSnapshot({
      name: 'armLength-unit-changed.yaml',
    });
  });

  test('should match snapshot with load magnitude changed', async ({
    page,
  }) => {
    await page.getByTestId('load').fill('15');
    await waitForCalc(page);
    expect(await page.getByTestId('arm-main').ariaSnapshot()).toMatchSnapshot({
      name: 'load-magnitude-changed.yaml',
    });
  });

  test('should match snapshot with load unit changed', async ({ page }) => {
    await page.getByTestId('selectload').click();
    await page.getByRole('option', { name: 'kg' }).click();
    await waitForCalc(page);
    expect(await page.getByTestId('arm-main').ariaSnapshot()).toMatchSnapshot({
      name: 'load-unit-changed.yaml',
    });
  });

  test('should match snapshot with minAngle magnitude changed', async ({
    page,
  }) => {
    await page.getByTestId('minAngle').fill('45');
    await waitForCalc(page);
    expect(await page.getByTestId('arm-main').ariaSnapshot()).toMatchSnapshot({
      name: 'minAngle-magnitude-changed.yaml',
    });
  });

  test('should match snapshot with minAngle unit changed', async ({ page }) => {
    await page.getByTestId('selectminAngle').click();
    await page.getByRole('option', { name: 'rad' }).click();
    await waitForCalc(page);
    expect(await page.getByTestId('arm-main').ariaSnapshot()).toMatchSnapshot({
      name: 'minAngle-unit-changed.yaml',
    });
  });

  test('should match snapshot with maxAngle magnitude changed', async ({
    page,
  }) => {
    await page.getByTestId('maxAngle').fill('135');
    await waitForCalc(page);
    expect(await page.getByTestId('arm-main').ariaSnapshot()).toMatchSnapshot({
      name: 'maxAngle-magnitude-changed.yaml',
    });
  });

  test('should match snapshot with maxAngle unit changed', async ({ page }) => {
    await page.getByTestId('selectmaxAngle').click();
    await page.getByRole('option', { name: 'rad' }).click();
    await waitForCalc(page);
    expect(await page.getByTestId('arm-main').ariaSnapshot()).toMatchSnapshot({
      name: 'maxAngle-unit-changed.yaml',
    });
  });

  test('should match snapshot with statorLimit magnitude changed', async ({
    page,
  }) => {
    await page.getByTestId('statorLimit').fill('80');
    await waitForCalc(page);
    expect(await page.getByTestId('arm-main').ariaSnapshot()).toMatchSnapshot({
      name: 'statorLimit-magnitude-changed.yaml',
    });
  });

  test('should match snapshot with statorLimit unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectstatorLimit').click();
    await page.getByRole('option', { name: 'A' }).click();
    await waitForCalc(page);
    expect(await page.getByTestId('arm-main').ariaSnapshot()).toMatchSnapshot({
      name: 'statorLimit-unit-changed.yaml',
    });
  });

  test('should match snapshot with supplyLimit magnitude changed', async ({
    page,
  }) => {
    await page.getByTestId('supplyLimit').fill('40');
    await waitForCalc(page);
    expect(await page.getByTestId('arm-main').ariaSnapshot()).toMatchSnapshot({
      name: 'supplyLimit-magnitude-changed.yaml',
    });
  });

  test('should match snapshot with supplyLimit unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectsupplyLimit').click();
    await page.getByRole('option', { name: 'A' }).click();
    await waitForCalc(page);
    expect(await page.getByTestId('arm-main').ariaSnapshot()).toMatchSnapshot({
      name: 'supplyLimit-unit-changed.yaml',
    });
  });

  test('should match snapshot with statorVoltage magnitude changed', async ({
    page,
  }) => {
    await page.getByTestId('statorVoltage').fill('10');
    await waitForCalc(page);
    expect(await page.getByTestId('arm-main').ariaSnapshot()).toMatchSnapshot({
      name: 'statorVoltage-magnitude-changed.yaml',
    });
  });

  test('should match snapshot with statorVoltage unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectstatorVoltage').click();
    await page.getByRole('option', { name: 'V' }).click();
    await waitForCalc(page);
    expect(await page.getByTestId('arm-main').ariaSnapshot()).toMatchSnapshot({
      name: 'statorVoltage-unit-changed.yaml',
    });
  });

  test('should match snapshot with supplyVoltage magnitude changed', async ({
    page,
  }) => {
    await page.getByTestId('supplyVoltage').fill('10');
    await waitForCalc(page);
    expect(await page.getByTestId('arm-main').ariaSnapshot()).toMatchSnapshot({
      name: 'supplyVoltage-magnitude-changed.yaml',
    });
  });

  test('should match snapshot with supplyVoltage unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectsupplyVoltage').click();
    await page.getByRole('option', { name: 'V' }).click();
    await waitForCalc(page);
    expect(await page.getByTestId('arm-main').ariaSnapshot()).toMatchSnapshot({
      name: 'supplyVoltage-unit-changed.yaml',
    });
  });

  test('should match snapshot with batteryResistance magnitude changed', async ({
    page,
  }) => {
    await page.getByTestId('batteryResistance').fill('0.03');
    await waitForCalc(page);
    expect(await page.getByTestId('arm-main').ariaSnapshot()).toMatchSnapshot({
      name: 'batteryResistance-magnitude-changed.yaml',
    });
  });

  test('should match snapshot with batteryResistance unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectbatteryResistance').click();
    await page.getByRole('option', { name: 'Ohm' }).click();
    await waitForCalc(page);
    expect(await page.getByTestId('arm-main').ariaSnapshot()).toMatchSnapshot({
      name: 'batteryResistance-unit-changed.yaml',
    });
  });

  test('should match snapshot with efficiency changed', async ({ page }) => {
    await page.getByTestId('efficiency').fill('90');
    await waitForCalc(page);
    expect(await page.getByTestId('arm-main').ariaSnapshot()).toMatchSnapshot({
      name: 'efficiency-changed.yaml',
    });
  });

  test('should match snapshot with goingUpTimeToGoal unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectgoingUpTimeToGoal').click();
    await page.getByRole('option', { name: 'min' }).click();
    await waitForCalc(page);
    expect(await page.getByTestId('arm-main').ariaSnapshot()).toMatchSnapshot({
      name: 'goingUpTimeToGoal-changed.yaml',
    });
  });

  test('should match snapshot with goingDownTimeToGoal unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectgoingDownTimeToGoal').click();
    await page.getByRole('option', { name: 'min' }).click();
    await waitForCalc(page);
    expect(await page.getByTestId('arm-main').ariaSnapshot()).toMatchSnapshot({
      name: 'goingDownTimeToGoal-changed.yaml',
    });
  });

  test('should match snapshot with qPosition magnitude changed', async ({
    page,
  }) => {
    await page.getByText('LQR Tuning').click();
    await page.waitForTimeout(300);
    await page.getByTestId('qPosition').fill('5');
    await waitForCalc(page);
    expect(await page.getByTestId('arm-main').ariaSnapshot()).toMatchSnapshot({
      name: 'qPosition-magnitude-changed.yaml',
    });
  });

  test('should match snapshot with feedbackDt magnitude changed', async ({
    page,
  }) => {
    await page.getByText('LQR Tuning').click();
    await page.waitForTimeout(300);
    await page.getByTestId('feedbackDt').fill('40');
    await waitForCalc(page);
    expect(await page.getByTestId('arm-main').ariaSnapshot()).toMatchSnapshot({
      name: 'feedbackDt-magnitude-changed.yaml',
    });
  });

  test('should match snapshot with feedbackDt unit changed', async ({
    page,
  }) => {
    await page.getByText('LQR Tuning').click();
    await page.waitForTimeout(300);
    await page.getByTestId('selectfeedbackDt').click();
    await page.getByRole('option', { name: 's', exact: true }).click();
    await waitForCalc(page);
    expect(await page.getByTestId('arm-main').ariaSnapshot()).toMatchSnapshot({
      name: 'feedbackDt-unit-changed.yaml',
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

    // Wait for the optimizer worker to finish — the Badge switches from
    // "— configs" to "N configs" (a number) once results arrive.
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

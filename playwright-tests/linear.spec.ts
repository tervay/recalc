import { expect, test } from '@playwright/test';

const CHART_DELAY_MS = 4500;

test.describe('Linear Mechanism Calculator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/linear');
    await page.waitForLoadState('networkidle');
  });

  test('should match snapshot with motor magnitude changed', async ({
    page,
  }) => {
    await page.getByTestId('motor').fill('2');
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(
      await page.getByTestId('linear-main').ariaSnapshot(),
    ).toMatchSnapshot({
      name: 'motor-magnitude-changed.yaml',
    });
  });

  test('should match snapshot with motor unit changed', async ({ page }) => {
    await page.getByTestId('selectmotor').click();
    await page.getByRole('option', { name: 'NEO', exact: true }).click();
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(
      await page.getByTestId('linear-main').ariaSnapshot(),
    ).toMatchSnapshot({
      name: 'motor-unit-changed.yaml',
    });
  });

  test('should match snapshot with ratio magnitude changed', async ({
    page,
  }) => {
    await page.getByTestId('ratio').fill('5');
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(
      await page.getByTestId('linear-main').ariaSnapshot(),
    ).toMatchSnapshot({
      name: 'ratio-magnitude-changed.yaml',
    });
  });

  test('should match snapshot with ratio unit changed', async ({ page }) => {
    await page.getByTestId('selectratio').click();
    await page.getByRole('option', { name: 'Step-up' }).click();
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(
      await page.getByTestId('linear-main').ariaSnapshot(),
    ).toMatchSnapshot({
      name: 'ratio-unit-changed.yaml',
    });
  });

  test('should match snapshot with travelDistance magnitude changed', async ({
    page,
  }) => {
    await page.getByTestId('travelDistance').fill('10');
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(
      await page.getByTestId('linear-main').ariaSnapshot(),
    ).toMatchSnapshot({
      name: 'travelDistance-magnitude-changed.yaml',
    });
  });

  test('should match snapshot with travelDistance unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selecttravelDistance').click();
    await page.getByRole('option', { name: 'ft' }).click();
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(
      await page.getByTestId('linear-main').ariaSnapshot(),
    ).toMatchSnapshot({
      name: 'travelDistance-unit-changed.yaml',
    });
  });

  test('should match snapshot with spoolDiameter magnitude changed', async ({
    page,
  }) => {
    await page.getByTestId('spoolDiameter').fill('2');
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(
      await page.getByTestId('linear-main').ariaSnapshot(),
    ).toMatchSnapshot({
      name: 'spoolDiameter-magnitude-changed.yaml',
    });
  });

  test('should match snapshot with spoolDiameter unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectspoolDiameter').click();
    await page.getByRole('option', { name: 'cm' }).click();
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(
      await page.getByTestId('linear-main').ariaSnapshot(),
    ).toMatchSnapshot({
      name: 'spoolDiameter-unit-changed.yaml',
    });
  });

  test('should match snapshot with load magnitude changed', async ({
    page,
  }) => {
    await page.getByTestId('load').fill('50');
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(
      await page.getByTestId('linear-main').ariaSnapshot(),
    ).toMatchSnapshot({
      name: 'load-magnitude-changed.yaml',
    });
  });

  test('should match snapshot with load unit changed', async ({ page }) => {
    await page.getByTestId('selectload').click();
    await page.getByRole('option', { name: 'kg' }).click();
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(
      await page.getByTestId('linear-main').ariaSnapshot(),
    ).toMatchSnapshot({
      name: 'load-unit-changed.yaml',
    });
  });

  test('should match snapshot with statorLimit magnitude changed', async ({
    page,
  }) => {
    await page.getByTestId('statorLimit').fill('80');
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(
      await page.getByTestId('linear-main').ariaSnapshot(),
    ).toMatchSnapshot({
      name: 'statorLimit-magnitude-changed.yaml',
    });
  });

  test('should match snapshot with statorLimit unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectstatorLimit').click();
    await page.getByRole('option', { name: 'A' }).click();
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(
      await page.getByTestId('linear-main').ariaSnapshot(),
    ).toMatchSnapshot({
      name: 'statorLimit-unit-changed.yaml',
    });
  });

  test('should match snapshot with supplyLimit magnitude changed', async ({
    page,
  }) => {
    await page.getByTestId('supplyLimit').fill('30');
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(
      await page.getByTestId('linear-main').ariaSnapshot(),
    ).toMatchSnapshot({
      name: 'supplyLimit-magnitude-changed.yaml',
    });
  });

  test('should match snapshot with supplyLimit unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectsupplyLimit').click();
    await page.getByRole('option', { name: 'A' }).click();
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(
      await page.getByTestId('linear-main').ariaSnapshot(),
    ).toMatchSnapshot({
      name: 'supplyLimit-unit-changed.yaml',
    });
  });

  test('should match snapshot with supplyVoltage magnitude changed', async ({
    page,
  }) => {
    await page.getByTestId('supplyVoltage').fill('10');
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(
      await page.getByTestId('linear-main').ariaSnapshot(),
    ).toMatchSnapshot({
      name: 'supplyVoltage-magnitude-changed.yaml',
    });
  });

  test('should match snapshot with supplyVoltage unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectsupplyVoltage').click();
    await page.getByRole('option', { name: 'V' }).click();
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(
      await page.getByTestId('linear-main').ariaSnapshot(),
    ).toMatchSnapshot({
      name: 'supplyVoltage-unit-changed.yaml',
    });
  });

  test('should match snapshot with statorVoltage magnitude changed', async ({
    page,
  }) => {
    await page.getByTestId('statorVoltage').fill('10');
    await page.waitForTimeout(CHART_DELAY_MS * 2);
    expect(
      await page.getByTestId('linear-main').ariaSnapshot(),
    ).toMatchSnapshot({
      name: 'statorVoltage-magnitude-changed.yaml',
    });
  });

  test('should match snapshot with statorVoltage unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectstatorVoltage').click();
    await page.getByRole('option', { name: 'V' }).click();
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(
      await page.getByTestId('linear-main').ariaSnapshot(),
    ).toMatchSnapshot({
      name: 'statorVoltage-unit-changed.yaml',
    });
  });

  test('should match snapshot with angle magnitude changed', async ({
    page,
  }) => {
    await page.getByTestId('angle').fill('45');
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(
      await page.getByTestId('linear-main').ariaSnapshot(),
    ).toMatchSnapshot({
      name: 'angle-magnitude-changed.yaml',
    });
  });

  test('should match snapshot with angle unit changed', async ({ page }) => {
    await page.getByTestId('selectangle').click();
    await page.getByRole('option', { name: 'rad' }).click();
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(
      await page.getByTestId('linear-main').ariaSnapshot(),
    ).toMatchSnapshot({
      name: 'angle-unit-changed.yaml',
    });
  });

  test('should match snapshot with batteryResistance magnitude changed', async ({
    page,
  }) => {
    await page.getByTestId('batteryResistance').fill('0.025');
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(
      await page.getByTestId('linear-main').ariaSnapshot(),
    ).toMatchSnapshot({
      name: 'batteryResistance-magnitude-changed.yaml',
    });
  });

  test('should match snapshot with batteryResistance unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectbatteryResistance').click();
    await page.getByRole('option', { name: 'Ohm' }).click();
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(
      await page.getByTestId('linear-main').ariaSnapshot(),
    ).toMatchSnapshot({
      name: 'batteryResistance-unit-changed.yaml',
    });
  });

  test('should match snapshot with efficiency changed', async ({ page }) => {
    await page.getByTestId('efficiency').fill('90');
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(
      await page.getByTestId('linear-main').ariaSnapshot(),
    ).toMatchSnapshot({
      name: 'efficiency-changed.yaml',
    });
  });

  test('should match snapshot with cascade toggled', async ({ page }) => {
    await page.getByTestId('cascade').click();
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(
      await page.getByTestId('linear-main').ariaSnapshot(),
    ).toMatchSnapshot({
      name: 'cascade-toggled.yaml',
    });
  });

  test('should match snapshot with kV unit changed', async ({ page }) => {
    await page.getByTestId('selectkV').click();
    await page.getByRole('option', { name: 'V*s/in' }).click();
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(
      await page.getByTestId('linear-main').ariaSnapshot(),
    ).toMatchSnapshot({
      name: 'kV-changed.yaml',
    });
  });

  test('should match snapshot with kA unit changed', async ({ page }) => {
    await page.getByTestId('selectkA').click();
    await page.getByRole('option', { name: 'V*s^2/in' }).click();
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(
      await page.getByTestId('linear-main').ariaSnapshot(),
    ).toMatchSnapshot({
      name: 'kA-changed.yaml',
    });
  });

  test('should match snapshot with kG unit changed', async ({ page }) => {
    await page.getByTestId('selectkG').click();
    await page.getByRole('option', { name: 'V' }).click();
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(
      await page.getByTestId('linear-main').ariaSnapshot(),
    ).toMatchSnapshot({
      name: 'kG-changed.yaml',
    });
  });

  test('should match snapshot with stallLoad unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectstallLoad').click();
    await page.getByRole('option', { name: 'kg' }).click();
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(
      await page.getByTestId('linear-main').ariaSnapshot(),
    ).toMatchSnapshot({
      name: 'stallLoad-changed.yaml',
    });
  });

  test('should match snapshot with timeToGoal unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selecttimeToGoal').click();
    await page.getByRole('option', { name: 'min' }).click();
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(
      await page.getByTestId('linear-main').ariaSnapshot(),
    ).toMatchSnapshot({
      name: 'timeToGoal-changed.yaml',
    });
  });
});

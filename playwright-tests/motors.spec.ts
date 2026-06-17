import { expect, test } from '@playwright/test';

test.describe('Motor Calculator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/motors');
    await page.waitForLoadState('networkidle');
  });

  test('renders the restyled, sectioned input group', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Motor', exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Current Limits' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Voltage', exact: true }),
    ).toBeVisible();

    await expect(page.getByTestId('motor')).toBeVisible();
    await expect(page.getByTestId('statorLimit')).toBeVisible();
    await expect(page.getByTestId('supplyLimit')).toBeVisible();
    await expect(page.getByTestId('statorVoltage')).toBeVisible();
    await expect(page.getByTestId('supplyVoltage')).toBeVisible();
  });

  test('chart shows a legend with all three labeled series', async ({
    page,
  }) => {
    // Wait for the worker to compute the curve so the chart renders.
    await page.waitForTimeout(1000);

    await expect(page.getByText('Current (A)').first()).toBeVisible();
    await expect(page.getByText('Torque (N·m)').first()).toBeVisible();
    await expect(page.getByText('Efficiency (%)').first()).toBeVisible();
  });

  test('copied URL restores motor and limit state', async ({ page }) => {
    await page.getByTestId('motor').click();
    await page.getByRole('option', { name: 'NEO', exact: true }).click();
    await page.getByTestId('statorLimit').fill('45');
    await page.getByTestId('supplyLimit').fill('35');
    await page.getByRole('button', { name: 'Copy Link' }).click();

    const url = await page.evaluate(() => navigator.clipboard.readText());
    expect(url).toContain('/motors');
    // StringParam serializes the motor name verbatim.
    expect(url).toContain('motor=NEO');

    await page.goto(url);
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('motor')).toContainText('NEO');
    await expect(page.getByTestId('statorLimit')).toHaveValue('45');
    await expect(page.getByTestId('supplyLimit')).toHaveValue('35');
  });
});

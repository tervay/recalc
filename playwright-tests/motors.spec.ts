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

  test('current and torque are straight lines when no current limit binds', async ({
    page,
  }) => {
    // Rendered as exponential decay while the XAxis defaulted to
    // type="category", which spaces points by array index rather than RPM.
    await page.goto(
      '/motors?motor=Kraken+X60' +
        '&statorLimit=%7B%22s%22%3A1000%2C%22u%22%3A%22A%22%7D' +
        '&supplyLimit=%7B%22s%22%3A1000%2C%22u%22%3A%22A%22%7D' +
        '&supplyVoltage=%7B%22s%22%3A12%2C%22u%22%3A%22V%22%7D' +
        '&statorVoltage=%7B%22s%22%3A12%2C%22u%22%3A%22V%22%7D',
    );
    await page.waitForLoadState('networkidle');

    for (const seriesIndex of [0, 1]) {
      const d = await page
        .locator('path.recharts-line-curve')
        .nth(seriesIndex)
        .getAttribute('d');
      expect(d, `series ${seriesIndex} has no path`).toBeTruthy();

      const points = parsePathPoints(d!);
      expect(points.length).toBeGreaterThan(50);

      const first = points[0];
      const last = points[points.length - 1];
      const yRange =
        Math.max(...points.map((p) => p.y)) -
        Math.min(...points.map((p) => p.y));
      expect(yRange).toBeGreaterThan(0);

      const slope = (last.y - first.y) / (last.x - first.x);
      const maxDeviation = Math.max(
        ...points.map((p) =>
          Math.abs(p.y - (first.y + slope * (p.x - first.x))),
        ),
      );

      expect(
        maxDeviation / yRange,
        `series ${seriesIndex} deviates from a straight line`,
      ).toBeLessThan(0.01);
    }
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

  test('max efficiency in the comparison table follows the current draw', async ({
    page,
  }) => {
    // The name cell renders the identifier in its own span ahead of the vendor
    // badges, so an exact span match separates CIM from MiniCIM.
    const cimEfficiency = page
      .getByRole('row')
      .filter({
        has: page.locator('td:first-child span', { hasText: /^CIM$/ }),
      })
      .getByRole('cell')
      .nth(6);

    await expect(
      page.getByRole('button', { name: 'Max Efficiency' }),
    ).toBeVisible();
    // CIM peaks at 18.8 A, comfortably under the default 60 A draw.
    await expect(cimEfficiency).toHaveText('65.4%');

    await page.getByTestId('currentDraw').fill('10');

    await expect(cimEfficiency).toHaveText('60.2%');
  });
});

/** Pulls the vertices out of a recharts `M x,y L x,y ...` line path. */
function parsePathPoints(d: string): { x: number; y: number }[] {
  return [...d.matchAll(/([-\d.]+),([-\d.]+)/g)].map((m) => ({
    x: parseFloat(m[1]),
    y: parseFloat(m[2]),
  }));
}

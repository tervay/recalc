import { expect, test } from '@playwright/test';

test.describe('Gears Calculator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/gears');
    await page.waitForLoadState('networkidle');
  });

  test('should match snapshot with gear1Teeth changed', async ({ page }) => {
    await page.getByTestId('gear1Teeth').fill('40');
    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      {
        name: 'gear1Teeth-changed.yaml',
      },
    );
  });

  test('should match snapshot with gear2Teeth changed', async ({ page }) => {
    await page.getByTestId('gear2Teeth').fill('60');
    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      {
        name: 'gear2Teeth-changed.yaml',
      },
    );
  });

  test('should match snapshot with gearDP changed', async ({ page }) => {
    await page.getByTestId('gearDP').fill('32');
    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      {
        name: 'gearDP-changed.yaml',
      },
    );
  });

  test('should match snapshot with spacing unit changed', async ({ page }) => {
    await page.getByTestId('selectspacing').click();
    await page.getByRole('option', { name: 'mm' }).click();
    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      {
        name: 'spacing-changed.yaml',
      },
    );
  });
});

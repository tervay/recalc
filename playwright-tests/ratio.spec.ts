import { expect, test } from '@playwright/test';

test.describe('Ratio Calculator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ratio');
    await page.waitForLoadState('networkidle');
  });

  test('should match snapshot with driving0 changed', async ({ page }) => {
    await page.getByTestId('driving0').fill('10');
    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      {
        name: 'driving0-changed.yaml',
      },
    );
  });

  test('should match snapshot with driven0 changed', async ({ page }) => {
    await page.getByTestId('driven0').fill('40');
    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      {
        name: 'driven0-changed.yaml',
      },
    );
  });

  test('should match snapshot with driving1 changed', async ({ page }) => {
    await page.getByTestId('driving1').fill('15');
    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      {
        name: 'driving1-changed.yaml',
      },
    );
  });

  test('should match snapshot with driven1 changed', async ({ page }) => {
    await page.getByTestId('driven1').fill('56');
    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      {
        name: 'driven1-changed.yaml',
      },
    );
  });

  test('should match snapshot with add stage clicked', async ({ page }) => {
    await expect(page.getByTestId('driving2')).not.toBeVisible();
    await expect(page.getByTestId('driven2')).not.toBeVisible();

    await page.getByTestId('addStage').click();
    await page.getByTestId('driving2').fill('15');
    await page.getByTestId('driven2').fill('45');

    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      {
        name: 'add-stage-clicked.yaml',
      },
    );
  });

  test('should match snapshot with remove stage clicked', async ({ page }) => {
    await expect(page.getByTestId('driving0')).toBeVisible();
    await expect(page.getByTestId('driving1')).toBeVisible();

    await page.getByTestId('removeStage1').click();

    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      {
        name: 'remove-stage-clicked.yaml',
      },
    );
  });
});

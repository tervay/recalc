import { expect, test } from '@playwright/test';

test.describe('Intake Calculator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/intake');
    await page.waitForLoadState('networkidle');
  });

  test('should match snapshot with motor magnitude changed', async ({
    page,
  }) => {
    await page.getByTestId('motor').fill('2');
    await page.waitForTimeout(100);
    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      {
        name: 'motor-magnitude-changed.yaml',
      },
    );
  });

  test('should match snapshot with motor unit changed', async ({ page }) => {
    await page.getByTestId('selectmotor').click();
    await page.getByRole('option', { name: 'NEO', exact: true }).click();
    await page.waitForTimeout(100);
    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      {
        name: 'motor-unit-changed.yaml',
      },
    );
  });

  test('should match snapshot with ratio magnitude changed', async ({
    page,
  }) => {
    await page.getByTestId('ratio').fill('5');
    await page.waitForTimeout(100);
    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      {
        name: 'ratio-magnitude-changed.yaml',
      },
    );
  });

  test('should match snapshot with ratio unit changed', async ({ page }) => {
    await page.getByTestId('selectratio').click();
    await page.getByRole('option', { name: 'Step-up' }).click();
    await page.waitForTimeout(100);
    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      {
        name: 'ratio-unit-changed.yaml',
      },
    );
  });

  test('should match snapshot with rollerDiameter magnitude changed', async ({
    page,
  }) => {
    await page.getByTestId('rollerDiameter').fill('1');
    await page.waitForTimeout(100);
    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      {
        name: 'rollerDiameter-magnitude-changed.yaml',
      },
    );
  });

  test('should match snapshot with rollerDiameter unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectrollerDiameter').click();
    await page.getByRole('option', { name: 'cm' }).click();
    await page.waitForTimeout(100);
    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      {
        name: 'rollerDiameter-unit-changed.yaml',
      },
    );
  });

  test('should match snapshot with travelDistance magnitude changed', async ({
    page,
  }) => {
    await page.getByTestId('travelDistance').fill('10');
    await page.waitForTimeout(100);
    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      {
        name: 'travelDistance-magnitude-changed.yaml',
      },
    );
  });

  test('should match snapshot with travelDistance unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selecttravelDistance').click();
    await page.getByRole('option', { name: 'ft' }).click();
    await page.waitForTimeout(100);
    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      {
        name: 'travelDistance-unit-changed.yaml',
      },
    );
  });

  test('should match snapshot with drivetrainSpeed magnitude changed', async ({
    page,
  }) => {
    await page.getByTestId('drivetrainSpeed').fill('20');
    await page.waitForTimeout(100);
    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      {
        name: 'drivetrainSpeed-magnitude-changed.yaml',
      },
    );
  });

  test('should match snapshot with drivetrainSpeed unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectdrivetrainSpeed').click();
    await page.getByRole('option', { name: 'm/s' }).click();
    await page.waitForTimeout(100);
    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      {
        name: 'drivetrainSpeed-unit-changed.yaml',
      },
    );
  });

  test('should match snapshot with surfaceSpeed unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectsurfaceSpeed').click();
    await page.getByRole('option', { name: 'm/s' }).click();
    await page.waitForTimeout(100);
    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      {
        name: 'surfaceSpeed-changed.yaml',
      },
    );
  });

  test('should match snapshot with timeToGoal unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selecttimeToGoal').click();
    await page.getByRole('option', { name: 'min' }).click();
    await page.waitForTimeout(100);
    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      {
        name: 'timeToGoal-changed.yaml',
      },
    );
  });
});

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

  test('should list only wheels matching the roller diameter', async ({
    page,
  }) => {
    const wheelRows = page
      .getByRole('row')
      .filter({ has: page.getByRole('link') });

    await expect(wheelRows.first()).toBeVisible();
    for (const cell of await page.getByRole('cell').allInnerTexts()) {
      if (cell.endsWith('"')) expect(cell).toBe('2.00"');
    }

    const twoInchCount = await wheelRows.count();
    expect(twoInchCount).toBeGreaterThan(0);

    await page.getByTestId('rollerDiameter').fill('4');
    await page.waitForTimeout(100);

    for (const cell of await page.getByRole('cell').allInnerTexts()) {
      if (cell.endsWith('"')) expect(cell).toBe('4.00"');
    }
    expect(await wheelRows.count()).not.toBe(twoInchCount);
  });

  test('should narrow the wheel table to a single selected bore', async ({
    page,
  }) => {
    const boreCells = page.getByRole('cell').filter({ hasText: 'Hex' });

    await page.getByRole('button', { name: '1/2" Hex', exact: true }).click();
    await page.waitForTimeout(100);

    const bores = await boreCells.allInnerTexts();
    expect(bores.length).toBeGreaterThan(0);
    expect(new Set(bores)).toEqual(new Set(['1/2" Hex']));
  });

  test('should show wheels for every selected bore', async ({ page }) => {
    await page.getByRole('button', { name: '1/2" Hex', exact: true }).click();
    await page.waitForTimeout(100);
    const halfHexOnly = await page
      .getByRole('cell')
      .filter({ hasText: 'Hex' })
      .allInnerTexts();

    await page.getByRole('button', { name: '3/8" Hex', exact: true }).click();
    await page.waitForTimeout(100);
    const both = await page
      .getByRole('cell')
      .filter({ hasText: 'Hex' })
      .allInnerTexts();

    expect(new Set(both)).toEqual(new Set(['1/2" Hex', '3/8" Hex']));
    expect(both.length).toBeGreaterThan(halfHexOnly.length);
  });

  test('should restore every wheel when all bores are deselected', async ({
    page,
  }) => {
    const rows = page.getByRole('row').filter({ has: page.getByRole('link') });
    const unfiltered = await rows.count();

    const halfHex = page.getByRole('button', { name: '1/2" Hex', exact: true });
    await halfHex.click();
    await page.waitForTimeout(100);
    expect(await rows.count()).toBeLessThan(unfiltered);

    await halfHex.click();
    await page.waitForTimeout(100);
    expect(await rows.count()).toBe(unfiltered);
  });

  test('should show an empty state when no wheel matches', async ({ page }) => {
    await page.getByTestId('rollerDiameter').fill('7.3');
    await page.waitForTimeout(100);
    await expect(page.getByText('No matching wheels found')).toBeVisible();
  });

  test('should set drivetrain speed from a swerve module drive ratio', async ({
    page,
  }) => {
    const speedInput = page.getByTestId('drivetrainSpeed');
    await expect(speedInput).toHaveValue('17.6');

    await page.getByTestId('selectSwerveModule').click();
    await page.getByRole('option', { name: 'MK5n', exact: true }).click();
    await page.getByTestId('swerveRatio-R1').click();
    await page.waitForTimeout(100);

    expect(Number(await speedInput.inputValue())).toBeCloseTo(15.1, 1);

    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      {
        name: 'swerve-quickset-applied.yaml',
      },
    );
  });

  test('should apply a recommended ratio and motor via its Set button', async ({
    page,
  }) => {
    const setButton = page.getByRole('button', { name: 'Set', exact: true });
    await setButton.first().click();
    await page.waitForTimeout(100);

    expect(await page.getByTestId('ratio').inputValue()).toMatch(
      /^\d+(\.\d{1,2})?$/,
    );
    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      {
        name: 'recommended-ratio-set.yaml',
      },
    );
  });
});

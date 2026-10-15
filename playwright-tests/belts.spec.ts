import type { Page } from '@playwright/test';
import { expect, test } from 'playwright-tests/helpers';

test.describe('Belt Calculator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/belts');
    await page.waitForLoadState('networkidle');
  });

  test('should match snapshot with pitch magnitude changed', async ({
    page,
  }) => {
    await page.getByTestId('pitch').fill('3');
    await page.waitForTimeout(100);
    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      {
        name: 'pitch-magnitude-changed.yaml',
      },
    );
  });

  test('should match snapshot with pitch unit changed', async ({ page }) => {
    await page.getByTestId('selectpitch').click();
    await page.getByRole('option', { name: 'in' }).click();
    await page.waitForTimeout(100);
    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      {
        name: 'pitch-unit-changed.yaml',
      },
    );
  });

  test('should match snapshot with desiredCenter magnitude changed', async ({
    page,
  }) => {
    await page.getByTestId('desiredCenter').fill('10');
    await page.waitForTimeout(100);
    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      {
        name: 'desiredCenter-magnitude-changed.yaml',
      },
    );
  });

  test('should match snapshot with desiredCenter unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectdesiredCenter').click();
    await page.getByRole('option', { name: 'cm' }).click();
    await page.waitForTimeout(100);
    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      {
        name: 'desiredCenter-unit-changed.yaml',
      },
    );
  });

  test('should match snapshot with extraCenter magnitude changed', async ({
    page,
  }) => {
    await page.getByTestId('extraCenter').fill('1');
    await page.waitForTimeout(100);
    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      {
        name: 'extraCenter-magnitude-changed.yaml',
      },
    );
  });

  test('should match snapshot with extraCenter unit changed', async ({
    page,
  }) => {
    await page.getByTestId('extraCenter').fill('1');
    await page.getByTestId('selectextraCenter').click();
    await page.getByRole('option', { name: 'in' }).click();
    await page.waitForTimeout(100);
    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      {
        name: 'extraCenter-unit-changed.yaml',
      },
    );
  });

  test('should match snapshot with beltToothIncrement changed', async ({
    page,
  }) => {
    await page.getByTestId('beltToothIncrement').fill('10');
    await page.waitForTimeout(100);
    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      {
        name: 'beltToothIncrement-changed.yaml',
      },
    );
  });

  test('should match snapshot with specificBeltTeeth changed', async ({
    page,
  }) => {
    await page.getByTestId('enableCustomBelt').click();
    await page.getByTestId('specificBeltTeeth').fill('100');
    await page.waitForTimeout(100);
    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      {
        name: 'specificBeltTeeth-changed.yaml',
      },
    );
  });

  test('should match snapshot with p1Teeth changed', async ({ page }) => {
    await page.getByTestId('p1Teeth').fill('20');
    await page.waitForTimeout(100);
    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      {
        name: 'p1Teeth-changed.yaml',
      },
    );
  });

  test('should match snapshot with p2Teeth changed', async ({ page }) => {
    await page.getByTestId('p2Teeth').fill('40');
    await page.waitForTimeout(100);
    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      {
        name: 'p2Teeth-changed.yaml',
      },
    );
  });

  test('should match snapshot with p1PitchDiameter unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectp1PitchDiameter').click();
    await page.getByRole('option', { name: 'mm' }).click();
    await page.waitForTimeout(100);
    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      {
        name: 'p1PitchDiameter-unit-changed.yaml',
      },
    );
  });

  test('should match snapshot with p2PitchDiameter unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectp2PitchDiameter').click();
    await page.getByRole('option', { name: 'mm' }).click();
    await page.waitForTimeout(100);
    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      {
        name: 'p2PitchDiameter-unit-changed.yaml',
      },
    );
  });

  test('should match snapshot with smallerCenter unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectsmallerCenter').click();
    await page.getByRole('option', { name: 'cm' }).click();
    await page.waitForTimeout(100);
    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      {
        name: 'smallerCenter-unit-changed.yaml',
      },
    );
  });

  test('should match snapshot with smallerPulleyGap unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectsmallerPulleyGap').click();
    await page.getByRole('option', { name: 'cm' }).click();
    await page.waitForTimeout(100);
    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      {
        name: 'smallerPulleyGap-unit-changed.yaml',
      },
    );
  });

  test('should match snapshot with smallerDiffFromTarget unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectsmallerDiffFromTarget').click();
    await page.getByRole('option', { name: 'cm' }).click();
    await page.waitForTimeout(100);
    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      {
        name: 'smallerDiffFromTarget-unit-changed.yaml',
      },
    );
  });

  test('should match snapshot with largerCenter unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectlargerCenter').click();
    await page.getByRole('option', { name: 'cm' }).click();
    await page.waitForTimeout(100);
    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      {
        name: 'largerCenter-unit-changed.yaml',
      },
    );
  });

  test('should match snapshot with largerPulleyGap unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectlargerPulleyGap').click();
    await page.getByRole('option', { name: 'cm' }).click();
    await page.waitForTimeout(100);
    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      {
        name: 'largerPulleyGap-unit-changed.yaml',
      },
    );
  });

  test('should match snapshot with largerDiffFromTarget unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectlargerDiffFromTarget').click();
    await page.getByRole('option', { name: 'cm' }).click();
    await page.waitForTimeout(100);
    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      {
        name: 'largerDiffFromTarget-unit-changed.yaml',
      },
    );
  });
});

test.describe('Belt Calculator Onshape import/export', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/belts');
    await page.waitForLoadState('networkidle');
    await page.getByTestId('onshapeImportToggle').click();
  });

  test('toggle hides the import box', async ({ page }) => {
    await page.getByTestId('onshapeImportToggle').click();
    await expect(page.getByTestId('onshapeImport')).toHaveCount(0);
  });

  async function importExpression(page: Page, expression: string) {
    await page.getByTestId('onshapeImport').fill(expression);
    await page.getByTestId('onshapeImportButton').click();
  }

  test('import enables custom belt mode', async ({ page }) => {
    await importExpression(page, '#BeltCTC_5mm(70, 24, 16)');
    await expect(page.getByTestId('specificBeltTeeth')).toBeVisible();
  });

  test('import sets custom belt teeth', async ({ page }) => {
    await importExpression(page, '#BeltCTC_5mm(70, 24, 16)');
    await expect(page.getByTestId('specificBeltTeeth')).toHaveValue('70');
  });

  test('import sets pulley 1 teeth', async ({ page }) => {
    await importExpression(page, '#BeltCTC_5mm(70, 24, 16)');
    await expect(page.getByTestId('p1Teeth')).toHaveValue('24');
  });

  test('import sets pulley 2 teeth', async ({ page }) => {
    await importExpression(page, '#BeltCTC_5mm(70, 16, 18)');
    await expect(page.getByTestId('p2Teeth')).toHaveValue('18');
  });

  test('import submits on Enter', async ({ page }) => {
    await page.getByTestId('onshapeImport').fill('#BeltCTC_5mm(70, 24, 16)');
    await page.getByTestId('onshapeImport').press('Enter');
    await expect(page.getByTestId('specificBeltTeeth')).toHaveValue('70');
  });

  test('import sets RT25 pitch', async ({ page }) => {
    await importExpression(page, '#BeltCTC_RT25(80, 18, 36)');
    await expect(page.getByTestId('pitch')).toHaveValue('0.25');
  });

  test('import sets RT25 tooth increment', async ({ page }) => {
    await importExpression(page, '#BeltCTC_RT25(80, 18, 36)');
    await expect(page.getByTestId('beltToothIncrement')).toHaveValue('8');
  });

  test('import sets extra center', async ({ page }) => {
    await importExpression(page, '#BeltCTC_5mm(70, 24, 16) + 0.5 mm');
    await expect(page.getByTestId('extraCenter')).toHaveValue('0.5');
  });

  test('import clears the input on success', async ({ page }) => {
    await importExpression(page, '#BeltCTC_5mm(70, 24, 16)');
    await expect(page.getByTestId('onshapeImport')).toHaveValue('');
  });

  test('invalid import shows an error', async ({ page }) => {
    await importExpression(page, '#BeltCTC_2mm(70, 24, 16)');
    await expect(page.getByTestId('onshapeImportError')).toBeVisible();
  });

  test('invalid import leaves inputs unchanged', async ({ page }) => {
    await importExpression(page, '#BeltCTC_5mm(70, 24)');
    await expect(page.getByTestId('p1Teeth')).toHaveValue('16');
  });

  test('copies the larger belt as an Onshape expression', async ({ page }) => {
    const teeth = await page.getByTestId('largerBeltTeeth').textContent();
    await page.getByTestId('largerCopyOnshape').click();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toBe(`#BeltCTC_5mm(${teeth}, 16, 24)`);
  });

  test('copies the custom belt with extra center', async ({ page }) => {
    await importExpression(page, '#BeltCTC_3mm(100, 20, 30) - 0.1 in');
    await page.getByTestId('customCopyOnshape').click();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toBe('#BeltCTC_3mm(100, 20, 30) - 0.1 in');
  });

  test('links to the FRCDesign belt guide', async ({ page }) => {
    await expect(
      page.getByRole('link', { name: 'FRCDesign belt guide' }),
    ).toHaveAttribute(
      'href',
      'https://frcdesign.org/learning-course/stage1/1b/belts/',
    );
  });

  test('copy help links to the FRCDesign belt guide', async ({ page }) => {
    await page.getByTestId('largerOnshapeHelp').click();
    await expect(
      page
        .getByRole('dialog')
        .getByRole('link', { name: 'FRCDesign belt guide' }),
    ).toHaveAttribute(
      'href',
      'https://frcdesign.org/learning-course/stage1/1b/belts/',
    );
  });

  test('hides the copy button for unsupported pitches', async ({ page }) => {
    await page.getByTestId('pitch').fill('2');
    await expect(page.getByTestId('largerCopyOnshape')).toHaveCount(0);
  });
});

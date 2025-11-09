import { expect, test } from '@playwright/test';

test.describe('Belts Calculator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/belts');
  });

  test('Default page', async ({ page }) => {
    await expect(page.getByTestId('pitch')).toHaveValue('5');
    await expect(page.getByTestId('selectpitch')).toHaveText('mm');
    await expect(page.getByTestId('beltToothIncrement')).toHaveValue('5');
    await expect(page.getByTestId('desiredCenter')).toHaveValue('5');
    await expect(page.getByTestId('selectdesiredCenter')).toHaveText('in');
    await expect(page.getByTestId('extraCenter')).toHaveValue('0');
    await expect(page.getByTestId('selectextraCenter')).toHaveText('mm');
    await expect(page.getByTestId('enableCustomBelt')).not.toBeChecked();
    await expect(page.getByTestId('specificBeltTeeth')).toHaveValue('125');
    await expect(page.getByTestId('p1Teeth')).toHaveValue('16');
    await expect(page.getByTestId('p1PitchDiameter')).toHaveValue('1.003');
    await expect(page.getByTestId('selectp1PitchDiameter')).toHaveText('in');
    await expect(page.getByTestId('p2Teeth')).toHaveValue('24');
    await expect(page.getByTestId('p2PitchDiameter')).toHaveValue('1.504');
    await expect(page.getByTestId('selectp2PitchDiameter')).toHaveText('in');
    await expect(page.getByTestId('smallerBeltTeeth')).toHaveValue('70');
    await expect(page.getByTestId('smallerCenter')).toHaveValue('4.915');
    await expect(page.getByTestId('selectsmallerCenter')).toHaveText('in');
    await expect(page.getByTestId('smallerP1TeethInMesh')).toHaveValue('8');
    await expect(page.getByTestId('smallerP2TeethInMesh')).toHaveValue('11');
    await expect(page.getByTestId('smallerPulleyGap')).toHaveValue('3.662');
    await expect(page.getByTestId('selectsmallerPulleyGap')).toHaveText('in');
    await expect(page.getByTestId('smallerDiffFromTarget')).toHaveValue(
      '0.085',
    );
    await expect(page.getByTestId('selectsmallerDiffFromTarget')).toHaveText(
      'in',
    );
    await expect(page.getByTestId('largerBeltTeeth')).toHaveValue('75');
    await expect(page.getByTestId('largerCenter')).toHaveValue('5.408');
    await expect(page.getByTestId('selectlargerCenter')).toHaveText('in');
    await expect(page.getByTestId('largerP1TeethInMesh')).toHaveValue('8');
    await expect(page.getByTestId('largerP2TeethInMesh')).toHaveValue('11');
    await expect(page.getByTestId('largerPulleyGap')).toHaveValue('4.154');
    await expect(page.getByTestId('selectlargerPulleyGap')).toHaveText('in');
    await expect(page.getByTestId('largerDiffFromTarget')).toHaveValue(
      '-0.408',
    );
    await expect(page.getByTestId('selectlargerDiffFromTarget')).toHaveText(
      'in',
    );
  });

  test('Change pitch value', async ({ page }) => {
    await page.getByTestId('pitch').fill('5');
    await expect(page.getByTestId('beltToothIncrement')).toHaveValue('5');
    await expect(page.getByTestId('desiredCenter')).toHaveValue('5');
    await expect(page.getByTestId('extraCenter')).toHaveValue('0');
    await expect(page.getByTestId('enableCustomBelt')).not.toBeChecked();
    await expect(page.getByTestId('p1Teeth')).toHaveValue('16');
    await expect(page.getByTestId('p1PitchDiameter')).toHaveValue('1.003');
    await expect(page.getByTestId('selectp1PitchDiameter')).toHaveText('in');
    await expect(page.getByTestId('p2Teeth')).toHaveValue('24');
    await expect(page.getByTestId('p2PitchDiameter')).toHaveValue('1.504');
    await expect(page.getByTestId('selectp2PitchDiameter')).toHaveText('in');
    await expect(page.getByTestId('smallerBeltTeeth')).toHaveValue('70');
    await expect(page.getByTestId('smallerCenter')).toHaveValue('4.915');
    await expect(page.getByTestId('selectsmallerCenter')).toHaveText('in');
    await expect(page.getByTestId('smallerP1TeethInMesh')).toHaveValue('8');
    await expect(page.getByTestId('smallerP2TeethInMesh')).toHaveValue('11');
    await expect(page.getByTestId('smallerPulleyGap')).toHaveValue('3.662');
    await expect(page.getByTestId('selectsmallerPulleyGap')).toHaveText('in');
    await expect(page.getByTestId('smallerDiffFromTarget')).toHaveValue(
      '0.085',
    );
    await expect(page.getByTestId('selectsmallerDiffFromTarget')).toHaveText(
      'in',
    );
    await expect(page.getByTestId('largerBeltTeeth')).toHaveValue('75');
    await expect(page.getByTestId('largerCenter')).toHaveValue('5.408');
    await expect(page.getByTestId('selectlargerCenter')).toHaveText('in');
    await expect(page.getByTestId('largerP1TeethInMesh')).toHaveValue('8');
    await expect(page.getByTestId('largerP2TeethInMesh')).toHaveValue('11');
    await expect(page.getByTestId('largerPulleyGap')).toHaveValue('4.154');
    await expect(page.getByTestId('selectlargerPulleyGap')).toHaveText('in');
    await expect(page.getByTestId('largerDiffFromTarget')).toHaveValue(
      '-0.408',
    );
    await expect(page.getByTestId('selectlargerDiffFromTarget')).toHaveText(
      'in',
    );
  });

  test('Change pitch value and units', async ({ page }) => {
    await page.getByTestId('selectpitch').click();
    await page.getByRole('option', { name: 'in' }).click();
    await page.getByTestId('pitch').fill('0.25');
    await expect(page.getByTestId('desiredCenter')).toHaveValue('5');
    await expect(page.getByTestId('selectdesiredCenter')).toHaveText('in');
    await expect(page.getByTestId('pitch')).toHaveValue('0.25');
    await expect(page.getByTestId('selectpitch')).toHaveText('in');
    await expect(page.getByTestId('p1Teeth')).toHaveValue('16');
    await expect(page.getByTestId('p1PitchDiameter')).toHaveValue('1.273');
    await expect(page.getByTestId('selectp1PitchDiameter')).toHaveText('in');
    await expect(page.getByTestId('p2Teeth')).toHaveValue('24');
    await expect(page.getByTestId('p2PitchDiameter')).toHaveValue('1.910');
    await expect(page.getByTestId('selectp2PitchDiameter')).toHaveText('in');
    await expect(page.getByTestId('smallerBeltTeeth')).toHaveValue('56');
    await expect(page.getByTestId('smallerCenter')).toHaveValue('4.489');
    await expect(page.getByTestId('selectsmallerCenter')).toHaveText('in');
    await expect(page.getByTestId('smallerP1TeethInMesh')).toHaveValue('8');
    await expect(page.getByTestId('smallerP2TeethInMesh')).toHaveValue('11');
    await expect(page.getByTestId('smallerPulleyGap')).toHaveValue('2.897');
    await expect(page.getByTestId('selectsmallerPulleyGap')).toHaveText('in');
    await expect(page.getByTestId('smallerDiffFromTarget')).toHaveValue(
      '0.511',
    );
    await expect(page.getByTestId('selectsmallerDiffFromTarget')).toHaveText(
      'in',
    );
    await expect(page.getByTestId('largerBeltTeeth')).toHaveValue('64');
    await expect(page.getByTestId('largerCenter')).toHaveValue('5.491');
    await expect(page.getByTestId('selectlargerCenter')).toHaveText('in');
    await expect(page.getByTestId('largerP1TeethInMesh')).toHaveValue('8');
    await expect(page.getByTestId('largerP2TeethInMesh')).toHaveValue('11');
    await expect(page.getByTestId('largerPulleyGap')).toHaveValue('3.899');
    await expect(page.getByTestId('selectlargerPulleyGap')).toHaveText('in');
    await expect(page.getByTestId('largerDiffFromTarget')).toHaveValue(
      '-0.491',
    );
    await expect(page.getByTestId('selectlargerDiffFromTarget')).toHaveText(
      'in',
    );
  });

  test('GT2 quick set button changes pitch and tooth increment', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'GT2 (3mm)' }).click();
    await expect(page.getByTestId('pitch')).toHaveValue('3');
    await expect(page.getByTestId('selectpitch')).toHaveText('mm');
    await expect(page.getByTestId('beltToothIncrement')).toHaveValue('5');
  });

  test('HTD quick set button changes pitch and tooth increment', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'HTD (5mm)' }).click();
    await expect(page.getByTestId('pitch')).toHaveValue('5');
    await expect(page.getByTestId('selectpitch')).toHaveText('mm');
    await expect(page.getByTestId('beltToothIncrement')).toHaveValue('5');
  });

  test('RT25 quick set button changes pitch and tooth increment', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'RT25 (0.25in)' }).click();
    await expect(page.getByTestId('pitch')).toHaveValue('0.25');
    await expect(page.getByTestId('selectpitch')).toHaveText('in');
    await expect(page.getByTestId('beltToothIncrement')).toHaveValue('8');
  });

  test('3mm pitch shows matching COTS pulleys from WCP', async ({ page }) => {
    await page.getByRole('button', { name: 'GT2 (3mm)' }).click();
    await page.getByTestId('p1Teeth').fill('16');
    const pulleyTable = page
      .getByRole('cell', { name: 'Matching COTS Pulleys' })
      .locator('xpath=ancestor::table');
    await expect(
      pulleyTable.getByRole('cell', { name: /WCP/ }).first(),
    ).toBeVisible();
  });

  test('3mm pitch shows matching COTS belts from WCP and VBeltGuys', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'GT2 (3mm)' }).click();
    await page.getByTestId('p1Teeth').fill('16');
    await page.getByTestId('p2Teeth').fill('20');
    await page.getByTestId('desiredCenter').fill('3');
    const beltTable = page
      .getByRole('cell', { name: 'Matching COTS Belts' })
      .locator('xpath=ancestor::table');
    await expect(
      beltTable.getByRole('cell', { name: /WCP/ }).first(),
    ).toBeVisible();
    await expect(
      beltTable.getByRole('cell', { name: /VBeltGuys/ }).first(),
    ).toBeVisible();
  });

  test('5mm pitch shows matching COTS pulleys from WCP and Thrifty', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'HTD (5mm)' }).click();
    await page.getByTestId('p1Teeth').fill('20');
    await page.getByTestId('p2Teeth').fill('24');
    const pulleyTable = page
      .getByRole('cell', { name: 'Matching COTS Pulleys' })
      .locator('xpath=ancestor::table');
    await expect(
      pulleyTable.getByRole('cell', { name: /WCP/ }).first(),
    ).toBeVisible();
    await expect(
      pulleyTable.getByRole('cell', { name: /Thrifty/ }).first(),
    ).toBeVisible();
  });

  test('5mm pitch shows matching COTS belts from Swyft, WCP, and VBeltGuys', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'HTD (5mm)' }).click();
    await page.getByTestId('p1Teeth').fill('20');
    await page.getByTestId('p2Teeth').fill('24');
    await page.getByTestId('desiredCenter').fill('3');
    const beltTable = page
      .getByRole('cell', { name: 'Matching COTS Belts' })
      .locator('xpath=ancestor::table');
    await expect(
      beltTable.getByRole('cell', { name: /Swyft/ }).first(),
    ).toBeVisible();
    await expect(
      beltTable.getByRole('cell', { name: /WCP/ }).first(),
    ).toBeVisible();
    await expect(
      beltTable.getByRole('cell', { name: /VBeltGuys/ }).first(),
    ).toBeVisible();
  });

  test('0.25in pitch with 8 tooth increment shows matching COTS pulleys and belts from REV', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'RT25 (0.25in)' }).click();
    await page.getByTestId('p1Teeth').fill('16');
    await page.getByTestId('p2Teeth').fill('24');
    await page.getByTestId('desiredCenter').fill('5');
    const pulleyTable = page
      .getByRole('cell', { name: 'Matching COTS Pulleys' })
      .locator('xpath=ancestor::table');
    await expect(
      pulleyTable.getByRole('cell', { name: /REV/ }).first(),
    ).toBeVisible();
    const beltTable = page
      .getByRole('cell', { name: 'Matching COTS Belts' })
      .locator('xpath=ancestor::table');
    await expect(
      beltTable.getByRole('cell', { name: /REV/ }).first(),
    ).toBeVisible();
  });
});

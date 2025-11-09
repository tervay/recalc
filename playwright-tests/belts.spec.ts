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
    await expect(page.getByTestId('smallerP1TeethInMesh')).toHaveValue('7');
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
    await expect(page.getByTestId('largerP1TeethInMesh')).toHaveValue('7');
    await expect(page.getByTestId('largerP2TeethInMesh')).toHaveValue('11');
    await expect(page.getByTestId('largerPulleyGap')).toHaveValue('4.154');
    await expect(page.getByTestId('selectlargerPulleyGap')).toHaveText('in');
    await expect(page.getByTestId('largerDiffFromTarget')).toHaveValue('-0.408');
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
    await expect(page.getByTestId('smallerP1TeethInMesh')).toHaveValue('7');
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
    await expect(page.getByTestId('largerP1TeethInMesh')).toHaveValue('7');
    await expect(page.getByTestId('largerP2TeethInMesh')).toHaveValue('11');
    await expect(page.getByTestId('largerPulleyGap')).toHaveValue('4.154');
    await expect(page.getByTestId('selectlargerPulleyGap')).toHaveText('in');
    await expect(page.getByTestId('largerDiffFromTarget')).toHaveValue('-0.408');
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
    await expect(page.getByTestId('smallerBeltTeeth')).toHaveValue('60');
    await expect(page.getByTestId('smallerCenter')).toHaveValue('4.990');
    await expect(page.getByTestId('selectsmallerCenter')).toHaveText('in');
    await expect(page.getByTestId('smallerP1TeethInMesh')).toHaveValue('7');
    await expect(page.getByTestId('smallerP2TeethInMesh')).toHaveValue('11');
    await expect(page.getByTestId('smallerPulleyGap')).toHaveValue('3.398');
    await expect(page.getByTestId('selectsmallerPulleyGap')).toHaveText('in');
    await expect(page.getByTestId('smallerDiffFromTarget')).toHaveValue(
      '0.010',
    );
    await expect(page.getByTestId('selectsmallerDiffFromTarget')).toHaveText(
      'in',
    );
    await expect(page.getByTestId('largerBeltTeeth')).toHaveValue('65');
    await expect(page.getByTestId('largerCenter')).toHaveValue('5.616');
    await expect(page.getByTestId('selectlargerCenter')).toHaveText('in');
    await expect(page.getByTestId('largerP1TeethInMesh')).toHaveValue('7');
    await expect(page.getByTestId('largerP2TeethInMesh')).toHaveValue('11');
    await expect(page.getByTestId('largerPulleyGap')).toHaveValue('4.024');
    await expect(page.getByTestId('selectlargerPulleyGap')).toHaveText('in');
    await expect(page.getByTestId('largerDiffFromTarget')).toHaveValue('-0.616');
    await expect(page.getByTestId('selectlargerDiffFromTarget')).toHaveText(
      'in',
    );
  });
});


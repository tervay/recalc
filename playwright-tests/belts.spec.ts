import { type Page, expect, test } from '@playwright/test';

async function assertInputs(
  page: Page,
  params: {
    pitch: string;
    pitchUnit: string;
    beltToothIncrement: string;
    desiredCenter: string;
    desiredCenterUnit: string;
    extraCenter: string;
    extraCenterUnit: string;
    enableCustomBelt: boolean;
    specificBeltTeeth: string;
    p1Teeth: string;
    p2Teeth: string;
  },
) {
  await expect(page.getByTestId('pitch')).toHaveValue(params.pitch);
  await expect(page.getByTestId('selectpitch')).toHaveText(params.pitchUnit);
  await expect(page.getByTestId('beltToothIncrement')).toHaveValue(
    params.beltToothIncrement,
  );
  await expect(page.getByTestId('desiredCenter')).toHaveValue(
    params.desiredCenter,
  );
  await expect(page.getByTestId('selectdesiredCenter')).toHaveText(
    params.desiredCenterUnit,
  );
  await expect(page.getByTestId('extraCenter')).toHaveValue(params.extraCenter);
  await expect(page.getByTestId('selectextraCenter')).toHaveText(
    params.extraCenterUnit,
  );
  if (params.enableCustomBelt) {
    await expect(page.getByTestId('enableCustomBelt')).toBeChecked();
  } else {
    await expect(page.getByTestId('enableCustomBelt')).not.toBeChecked();
  }
  await expect(page.getByTestId('specificBeltTeeth')).toHaveValue(
    params.specificBeltTeeth,
  );
  await expect(page.getByTestId('p1Teeth')).toHaveValue(params.p1Teeth);
  await expect(page.getByTestId('p2Teeth')).toHaveValue(params.p2Teeth);
}

async function assertOutputs(
  page: Page,
  params: {
    p1PitchDiameter: string;
    p1PitchDiameterUnit: string;
    p2PitchDiameter: string;
    p2PitchDiameterUnit: string;
    smallerBeltTeeth: string;
    smallerCenter: string;
    smallerCenterUnit: string;
    smallerP1TeethInMesh: string;
    smallerP2TeethInMesh: string;
    smallerPulleyGap: string;
    smallerPulleyGapUnit: string;
    smallerDiffFromTarget: string;
    smallerDiffFromTargetUnit: string;
    largerBeltTeeth: string;
    largerCenter: string;
    largerCenterUnit: string;
    largerP1TeethInMesh: string;
    largerP2TeethInMesh: string;
    largerPulleyGap: string;
    largerPulleyGapUnit: string;
    largerDiffFromTarget: string;
    largerDiffFromTargetUnit: string;
  },
) {
  await expect(page.getByTestId('p1PitchDiameter')).toHaveValue(
    params.p1PitchDiameter,
  );
  await expect(page.getByTestId('selectp1PitchDiameter')).toHaveText(
    params.p1PitchDiameterUnit,
  );
  await expect(page.getByTestId('p2PitchDiameter')).toHaveValue(
    params.p2PitchDiameter,
  );
  await expect(page.getByTestId('selectp2PitchDiameter')).toHaveText(
    params.p2PitchDiameterUnit,
  );
  await expect(page.getByTestId('smallerBeltTeeth')).toHaveValue(
    params.smallerBeltTeeth,
  );
  await expect(page.getByTestId('smallerCenter')).toHaveValue(
    params.smallerCenter,
  );
  await expect(page.getByTestId('selectsmallerCenter')).toHaveText(
    params.smallerCenterUnit,
  );
  await expect(page.getByTestId('smallerP1TeethInMesh')).toHaveValue(
    params.smallerP1TeethInMesh,
  );
  await expect(page.getByTestId('smallerP2TeethInMesh')).toHaveValue(
    params.smallerP2TeethInMesh,
  );
  await expect(page.getByTestId('smallerPulleyGap')).toHaveValue(
    params.smallerPulleyGap,
  );
  await expect(page.getByTestId('selectsmallerPulleyGap')).toHaveText(
    params.smallerPulleyGapUnit,
  );
  await expect(page.getByTestId('smallerDiffFromTarget')).toHaveValue(
    params.smallerDiffFromTarget,
  );
  await expect(page.getByTestId('selectsmallerDiffFromTarget')).toHaveText(
    params.smallerDiffFromTargetUnit,
  );
  await expect(page.getByTestId('largerBeltTeeth')).toHaveValue(
    params.largerBeltTeeth,
  );
  await expect(page.getByTestId('largerCenter')).toHaveValue(
    params.largerCenter,
  );
  await expect(page.getByTestId('selectlargerCenter')).toHaveText(
    params.largerCenterUnit,
  );
  await expect(page.getByTestId('largerP1TeethInMesh')).toHaveValue(
    params.largerP1TeethInMesh,
  );
  await expect(page.getByTestId('largerP2TeethInMesh')).toHaveValue(
    params.largerP2TeethInMesh,
  );
  await expect(page.getByTestId('largerPulleyGap')).toHaveValue(
    params.largerPulleyGap,
  );
  await expect(page.getByTestId('selectlargerPulleyGap')).toHaveText(
    params.largerPulleyGapUnit,
  );
  await expect(page.getByTestId('largerDiffFromTarget')).toHaveValue(
    params.largerDiffFromTarget,
  );
  await expect(page.getByTestId('selectlargerDiffFromTarget')).toHaveText(
    params.largerDiffFromTargetUnit,
  );
}

test.describe('Belts Calculator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/belts');
  });

  test('Default page', async ({ page }) => {
    await assertInputs(page, {
      pitch: '5',
      pitchUnit: 'mm',
      beltToothIncrement: '5',
      desiredCenter: '5',
      desiredCenterUnit: 'in',
      extraCenter: '0',
      extraCenterUnit: 'mm',
      enableCustomBelt: false,
      specificBeltTeeth: '125',
      p1Teeth: '16',
      p2Teeth: '24',
    });

    await assertOutputs(page, {
      p1PitchDiameter: '1.003',
      p1PitchDiameterUnit: 'in',
      p2PitchDiameter: '1.504',
      p2PitchDiameterUnit: 'in',
      smallerBeltTeeth: '70',
      smallerCenter: '4.915',
      smallerCenterUnit: 'in',
      smallerP1TeethInMesh: '8',
      smallerP2TeethInMesh: '11',
      smallerPulleyGap: '3.662',
      smallerPulleyGapUnit: 'in',
      smallerDiffFromTarget: '0.085',
      smallerDiffFromTargetUnit: 'in',
      largerBeltTeeth: '75',
      largerCenter: '5.408',
      largerCenterUnit: 'in',
      largerP1TeethInMesh: '8',
      largerP2TeethInMesh: '11',
      largerPulleyGap: '4.154',
      largerPulleyGapUnit: 'in',
      largerDiffFromTarget: '-0.408',
      largerDiffFromTargetUnit: 'in',
    });
  });

  test.describe('Pitch input', () => {
    test('Change pitch from 5 mm to 3 mm', async ({ page }) => {
      await page.getByTestId('pitch').fill('3');
      await assertInputs(page, {
        pitch: '3',
        pitchUnit: 'mm',
        beltToothIncrement: '5',
        desiredCenter: '5',
        desiredCenterUnit: 'in',
        extraCenter: '0',
        extraCenterUnit: 'mm',
        enableCustomBelt: false,
        specificBeltTeeth: '125',
        p1Teeth: '16',
        p2Teeth: '24',
      });

      await assertOutputs(page, {
        p1PitchDiameter: '0.602',
        p1PitchDiameterUnit: 'in',
        p2PitchDiameter: '0.902',
        p2PitchDiameterUnit: 'in',
        smallerBeltTeeth: '100',
        smallerCenter: '4.722',
        smallerCenterUnit: 'in',
        smallerP1TeethInMesh: '8',
        smallerP2TeethInMesh: '11',
        smallerPulleyGap: '3.970',
        smallerPulleyGapUnit: 'in',
        smallerDiffFromTarget: '0.278',
        smallerDiffFromTargetUnit: 'in',
        largerBeltTeeth: '105',
        largerCenter: '5.017',
        largerCenterUnit: 'in',
        largerP1TeethInMesh: '8',
        largerP2TeethInMesh: '11',
        largerPulleyGap: '4.266',
        largerPulleyGapUnit: 'in',
        largerDiffFromTarget: '-0.017',
        largerDiffFromTargetUnit: 'in',
      });
    });

    test('Change pitch from 5 mm to 0', async ({ page }) => {
      await page.getByTestId('pitch').fill('0');
      await assertInputs(page, {
        pitch: '0',
        pitchUnit: 'mm',
        beltToothIncrement: '5',
        desiredCenter: '5',
        desiredCenterUnit: 'in',
        extraCenter: '0',
        extraCenterUnit: 'mm',
        enableCustomBelt: false,
        specificBeltTeeth: '125',
        p1Teeth: '16',
        p2Teeth: '24',
      });

      await assertOutputs(page, {
        p1PitchDiameter: '0.000',
        p1PitchDiameterUnit: 'in',
        p2PitchDiameter: '0.000',
        p2PitchDiameterUnit: 'in',
        smallerBeltTeeth: '0',
        smallerCenter: '0.000',
        smallerCenterUnit: 'in',
        smallerP1TeethInMesh: '0',
        smallerP2TeethInMesh: '0',
        smallerPulleyGap: '0.000',
        smallerPulleyGapUnit: 'in',
        smallerDiffFromTarget: '0.000',
        smallerDiffFromTargetUnit: 'in',
        largerBeltTeeth: '0',
        largerCenter: '0.000',
        largerCenterUnit: 'in',
        largerP1TeethInMesh: '0',
        largerP2TeethInMesh: '0',
        largerPulleyGap: '0.000',
        largerPulleyGapUnit: 'in',
        largerDiffFromTarget: '0.000',
        largerDiffFromTargetUnit: 'in',
      });
    });

    test('Change pitch from 5 mm to 0.25 in', async ({ page }) => {
      await page.getByTestId('selectpitch').click();
      await page.getByRole('option', { name: 'in' }).click();
      await page.getByTestId('pitch').fill('0.25');
      await assertInputs(page, {
        pitch: '0.25',
        pitchUnit: 'in',
        beltToothIncrement: '5',
        desiredCenter: '5',
        desiredCenterUnit: 'in',
        extraCenter: '0',
        extraCenterUnit: 'mm',
        enableCustomBelt: false,
        specificBeltTeeth: '125',
        p1Teeth: '16',
        p2Teeth: '24',
      });

      await assertOutputs(page, {
        p1PitchDiameter: '1.273',
        p1PitchDiameterUnit: 'in',
        p2PitchDiameter: '1.910',
        p2PitchDiameterUnit: 'in',
        smallerBeltTeeth: '60',
        smallerCenter: '4.990',
        smallerCenterUnit: 'in',
        smallerP1TeethInMesh: '8',
        smallerP2TeethInMesh: '11',
        smallerPulleyGap: '3.398',
        smallerPulleyGapUnit: 'in',
        smallerDiffFromTarget: '0.010',
        smallerDiffFromTargetUnit: 'in',
        largerBeltTeeth: '65',
        largerCenter: '5.616',
        largerCenterUnit: 'in',
        largerP1TeethInMesh: '8',
        largerP2TeethInMesh: '11',
        largerPulleyGap: '4.024',
        largerPulleyGapUnit: 'in',
        largerDiffFromTarget: '-0.616',
        largerDiffFromTargetUnit: 'in',
      });
    });
  });

  test.describe('Tooth increment input', () => {
    test('Change tooth increment from 5 to 10', async ({ page }) => {
      await page.getByTestId('beltToothIncrement').fill('10');
      await assertInputs(page, {
        pitch: '5',
        pitchUnit: 'mm',
        beltToothIncrement: '10',
        desiredCenter: '5',
        desiredCenterUnit: 'in',
        extraCenter: '0',
        extraCenterUnit: 'mm',
        enableCustomBelt: false,
        specificBeltTeeth: '125',
        p1Teeth: '16',
        p2Teeth: '24',
      });

      await assertOutputs(page, {
        p1PitchDiameter: '1.003',
        p1PitchDiameterUnit: 'in',
        p2PitchDiameter: '1.504',
        p2PitchDiameterUnit: 'in',
        smallerBeltTeeth: '70',
        smallerCenter: '4.915',
        smallerCenterUnit: 'in',
        smallerP1TeethInMesh: '8',
        smallerP2TeethInMesh: '11',
        smallerPulleyGap: '3.662',
        smallerPulleyGapUnit: 'in',
        smallerDiffFromTarget: '0.085',
        smallerDiffFromTargetUnit: 'in',
        largerBeltTeeth: '80',
        largerCenter: '5.900',
        largerCenterUnit: 'in',
        largerP1TeethInMesh: '8',
        largerP2TeethInMesh: '11',
        largerPulleyGap: '4.647',
        largerPulleyGapUnit: 'in',
        largerDiffFromTarget: '-0.900',
        largerDiffFromTargetUnit: 'in',
      });
    });

    test('Change tooth increment from 5 to 0', async ({ page }) => {
      await page.getByTestId('beltToothIncrement').fill('0');
      await assertInputs(page, {
        pitch: '5',
        pitchUnit: 'mm',
        beltToothIncrement: '0',
        desiredCenter: '5',
        desiredCenterUnit: 'in',
        extraCenter: '0',
        extraCenterUnit: 'mm',
        enableCustomBelt: false,
        specificBeltTeeth: '125',
        p1Teeth: '16',
        p2Teeth: '24',
      });

      await assertOutputs(page, {
        p1PitchDiameter: '1.003',
        p1PitchDiameterUnit: 'in',
        p2PitchDiameter: '1.504',
        p2PitchDiameterUnit: 'in',
        smallerBeltTeeth: '0',
        smallerCenter: '0.000',
        smallerCenterUnit: 'in',
        smallerP1TeethInMesh: '0',
        smallerP2TeethInMesh: '0',
        smallerPulleyGap: '0.000',
        smallerPulleyGapUnit: 'in',
        smallerDiffFromTarget: '0.000',
        smallerDiffFromTargetUnit: 'in',
        largerBeltTeeth: '0',
        largerCenter: '0.000',
        largerCenterUnit: 'in',
        largerP1TeethInMesh: '0',
        largerP2TeethInMesh: '0',
        largerPulleyGap: '0.000',
        largerPulleyGapUnit: 'in',
        largerDiffFromTarget: '0.000',
        largerDiffFromTargetUnit: 'in',
      });
    });
  });

  test.describe('Desired center input', () => {
    test('Change desired center from 5 in to 10 in', async ({ page }) => {
      await page.getByTestId('desiredCenter').fill('10');
      await assertInputs(page, {
        pitch: '5',
        pitchUnit: 'mm',
        beltToothIncrement: '5',
        desiredCenter: '10',
        desiredCenterUnit: 'in',
        extraCenter: '0',
        extraCenterUnit: 'mm',
        enableCustomBelt: false,
        specificBeltTeeth: '125',
        p1Teeth: '16',
        p2Teeth: '24',
      });

      await assertOutputs(page, {
        p1PitchDiameter: '1.003',
        p1PitchDiameterUnit: 'in',
        p2PitchDiameter: '1.504',
        p2PitchDiameterUnit: 'in',
        smallerBeltTeeth: '120',
        smallerCenter: '9.839',
        smallerCenterUnit: 'in',
        smallerP1TeethInMesh: '8',
        smallerP2TeethInMesh: '11',
        smallerPulleyGap: '8.586',
        smallerPulleyGapUnit: 'in',
        smallerDiffFromTarget: '0.161',
        smallerDiffFromTargetUnit: 'in',
        largerBeltTeeth: '125',
        largerCenter: '10.332',
        largerCenterUnit: 'in',
        largerP1TeethInMesh: '8',
        largerP2TeethInMesh: '11',
        largerPulleyGap: '9.078',
        largerPulleyGapUnit: 'in',
        largerDiffFromTarget: '-0.332',
        largerDiffFromTargetUnit: 'in',
      });
    });

    test('Change desired center from 5 in to 0', async ({ page }) => {
      await page.getByTestId('desiredCenter').fill('0');
      await assertInputs(page, {
        pitch: '5',
        pitchUnit: 'mm',
        beltToothIncrement: '5',
        desiredCenter: '0',
        desiredCenterUnit: 'in',
        extraCenter: '0',
        extraCenterUnit: 'mm',
        enableCustomBelt: false,
        specificBeltTeeth: '125',
        p1Teeth: '16',
        p2Teeth: '24',
      });

      await assertOutputs(page, {
        p1PitchDiameter: '1.003',
        p1PitchDiameterUnit: 'in',
        p2PitchDiameter: '1.504',
        p2PitchDiameterUnit: 'in',
        smallerBeltTeeth: '0',
        smallerCenter: '0.000',
        smallerCenterUnit: 'in',
        smallerP1TeethInMesh: '0',
        smallerP2TeethInMesh: '0',
        smallerPulleyGap: '0.000',
        smallerPulleyGapUnit: 'in',
        smallerDiffFromTarget: '0.000',
        smallerDiffFromTargetUnit: 'in',
        largerBeltTeeth: '0',
        largerCenter: '0.000',
        largerCenterUnit: 'in',
        largerP1TeethInMesh: '0',
        largerP2TeethInMesh: '0',
        largerPulleyGap: '0.000',
        largerPulleyGapUnit: 'in',
        largerDiffFromTarget: '0.000',
        largerDiffFromTargetUnit: 'in',
      });
    });

    test('Change desired center from 5 in to 100 mm', async ({ page }) => {
      await page.getByTestId('selectdesiredCenter').click();
      await page.getByRole('option', { name: 'mm' }).click();
      await page.getByTestId('desiredCenter').fill('100');
      await assertInputs(page, {
        pitch: '5',
        pitchUnit: 'mm',
        beltToothIncrement: '5',
        desiredCenter: '100',
        desiredCenterUnit: 'mm',
        extraCenter: '0',
        extraCenterUnit: 'mm',
        enableCustomBelt: false,
        specificBeltTeeth: '125',
        p1Teeth: '16',
        p2Teeth: '24',
      });

      await assertOutputs(page, {
        p1PitchDiameter: '1.003',
        p1PitchDiameterUnit: 'in',
        p2PitchDiameter: '1.504',
        p2PitchDiameterUnit: 'in',
        smallerBeltTeeth: '60',
        smallerCenter: '3.929',
        smallerCenterUnit: 'in',
        smallerP1TeethInMesh: '8',
        smallerP2TeethInMesh: '11',
        smallerPulleyGap: '2.676',
        smallerPulleyGapUnit: 'in',
        smallerDiffFromTarget: '0.008',
        smallerDiffFromTargetUnit: 'in',
        largerBeltTeeth: '65',
        largerCenter: '4.422',
        largerCenterUnit: 'in',
        largerP1TeethInMesh: '8',
        largerP2TeethInMesh: '11',
        largerPulleyGap: '3.169',
        largerPulleyGapUnit: 'in',
        largerDiffFromTarget: '-0.485',
        largerDiffFromTargetUnit: 'in',
      });
    });
  });

  test.describe('Extra center input', () => {
    test('Change extra center from 0 mm to 10 mm', async ({ page }) => {
      await page.getByTestId('extraCenter').fill('10');
      await assertInputs(page, {
        pitch: '5',
        pitchUnit: 'mm',
        beltToothIncrement: '5',
        desiredCenter: '5',
        desiredCenterUnit: 'in',
        extraCenter: '10',
        extraCenterUnit: 'mm',
        enableCustomBelt: false,
        specificBeltTeeth: '125',
        p1Teeth: '16',
        p2Teeth: '24',
      });

      await assertOutputs(page, {
        p1PitchDiameter: '1.003',
        p1PitchDiameterUnit: 'in',
        p2PitchDiameter: '1.504',
        p2PitchDiameterUnit: 'in',
        smallerBeltTeeth: '70',
        smallerCenter: '4.915',
        smallerCenterUnit: 'in',
        smallerP1TeethInMesh: '8',
        smallerP2TeethInMesh: '11',
        smallerPulleyGap: '3.662',
        smallerPulleyGapUnit: 'in',
        smallerDiffFromTarget: '0.085',
        smallerDiffFromTargetUnit: 'in',
        largerBeltTeeth: '75',
        largerCenter: '5.408',
        largerCenterUnit: 'in',
        largerP1TeethInMesh: '8',
        largerP2TeethInMesh: '11',
        largerPulleyGap: '4.154',
        largerPulleyGapUnit: 'in',
        largerDiffFromTarget: '-0.408',
        largerDiffFromTargetUnit: 'in',
      });
    });

    test('Change extra center from 0 mm to 0 in', async ({ page }) => {
      await page.getByTestId('selectextraCenter').click();
      await page.getByRole('option', { name: 'in' }).click();
      await assertInputs(page, {
        pitch: '5',
        pitchUnit: 'mm',
        beltToothIncrement: '5',
        desiredCenter: '5',
        desiredCenterUnit: 'in',
        extraCenter: '0',
        extraCenterUnit: 'in',
        enableCustomBelt: false,
        specificBeltTeeth: '125',
        p1Teeth: '16',
        p2Teeth: '24',
      });

      await assertOutputs(page, {
        p1PitchDiameter: '1.003',
        p1PitchDiameterUnit: 'in',
        p2PitchDiameter: '1.504',
        p2PitchDiameterUnit: 'in',
        smallerBeltTeeth: '70',
        smallerCenter: '4.915',
        smallerCenterUnit: 'in',
        smallerP1TeethInMesh: '8',
        smallerP2TeethInMesh: '11',
        smallerPulleyGap: '3.662',
        smallerPulleyGapUnit: 'in',
        smallerDiffFromTarget: '0.085',
        smallerDiffFromTargetUnit: 'in',
        largerBeltTeeth: '75',
        largerCenter: '5.408',
        largerCenterUnit: 'in',
        largerP1TeethInMesh: '8',
        largerP2TeethInMesh: '11',
        largerPulleyGap: '4.154',
        largerPulleyGapUnit: 'in',
        largerDiffFromTarget: '-0.408',
        largerDiffFromTargetUnit: 'in',
      });
    });
  });

  test.describe('Custom belt input', () => {
    test('Enable custom belt', async ({ page }) => {
      await page.getByTestId('enableCustomBelt').click();
      await assertInputs(page, {
        pitch: '5',
        pitchUnit: 'mm',
        beltToothIncrement: '5',
        desiredCenter: '5',
        desiredCenterUnit: 'in',
        extraCenter: '0',
        extraCenterUnit: 'mm',
        enableCustomBelt: true,
        specificBeltTeeth: '125',
        p1Teeth: '16',
        p2Teeth: '24',
      });

      await assertOutputs(page, {
        p1PitchDiameter: '1.003',
        p1PitchDiameterUnit: 'in',
        p2PitchDiameter: '1.504',
        p2PitchDiameterUnit: 'in',
        smallerBeltTeeth: '70',
        smallerCenter: '4.915',
        smallerCenterUnit: 'in',
        smallerP1TeethInMesh: '8',
        smallerP2TeethInMesh: '11',
        smallerPulleyGap: '3.662',
        smallerPulleyGapUnit: 'in',
        smallerDiffFromTarget: '0.085',
        smallerDiffFromTargetUnit: 'in',
        largerBeltTeeth: '75',
        largerCenter: '5.408',
        largerCenterUnit: 'in',
        largerP1TeethInMesh: '8',
        largerP2TeethInMesh: '11',
        largerPulleyGap: '4.154',
        largerPulleyGapUnit: 'in',
        largerDiffFromTarget: '-0.408',
        largerDiffFromTargetUnit: 'in',
      });
    });

    test('Change custom belt teeth from 125 to 150', async ({ page }) => {
      await page.getByTestId('specificBeltTeeth').fill('150');
      await assertInputs(page, {
        pitch: '5',
        pitchUnit: 'mm',
        beltToothIncrement: '5',
        desiredCenter: '5',
        desiredCenterUnit: 'in',
        extraCenter: '0',
        extraCenterUnit: 'mm',
        enableCustomBelt: false,
        specificBeltTeeth: '150',
        p1Teeth: '16',
        p2Teeth: '24',
      });

      await assertOutputs(page, {
        p1PitchDiameter: '1.003',
        p1PitchDiameterUnit: 'in',
        p2PitchDiameter: '1.504',
        p2PitchDiameterUnit: 'in',
        smallerBeltTeeth: '70',
        smallerCenter: '4.915',
        smallerCenterUnit: 'in',
        smallerP1TeethInMesh: '8',
        smallerP2TeethInMesh: '11',
        smallerPulleyGap: '3.662',
        smallerPulleyGapUnit: 'in',
        smallerDiffFromTarget: '0.085',
        smallerDiffFromTargetUnit: 'in',
        largerBeltTeeth: '75',
        largerCenter: '5.408',
        largerCenterUnit: 'in',
        largerP1TeethInMesh: '8',
        largerP2TeethInMesh: '11',
        largerPulleyGap: '4.154',
        largerPulleyGapUnit: 'in',
        largerDiffFromTarget: '-0.408',
        largerDiffFromTargetUnit: 'in',
      });
    });

    test('Change custom belt teeth from 125 to 0', async ({ page }) => {
      await page.getByTestId('specificBeltTeeth').fill('0');
      await assertInputs(page, {
        pitch: '5',
        pitchUnit: 'mm',
        beltToothIncrement: '5',
        desiredCenter: '5',
        desiredCenterUnit: 'in',
        extraCenter: '0',
        extraCenterUnit: 'mm',
        enableCustomBelt: false,
        specificBeltTeeth: '0',
        p1Teeth: '16',
        p2Teeth: '24',
      });

      await assertOutputs(page, {
        p1PitchDiameter: '1.003',
        p1PitchDiameterUnit: 'in',
        p2PitchDiameter: '1.504',
        p2PitchDiameterUnit: 'in',
        smallerBeltTeeth: '70',
        smallerCenter: '4.915',
        smallerCenterUnit: 'in',
        smallerP1TeethInMesh: '8',
        smallerP2TeethInMesh: '11',
        smallerPulleyGap: '3.662',
        smallerPulleyGapUnit: 'in',
        smallerDiffFromTarget: '0.085',
        smallerDiffFromTargetUnit: 'in',
        largerBeltTeeth: '75',
        largerCenter: '5.408',
        largerCenterUnit: 'in',
        largerP1TeethInMesh: '8',
        largerP2TeethInMesh: '11',
        largerPulleyGap: '4.154',
        largerPulleyGapUnit: 'in',
        largerDiffFromTarget: '-0.408',
        largerDiffFromTargetUnit: 'in',
      });
    });
  });

  test.describe('Pulley 1 teeth input', () => {
    test('Change p1 teeth from 16 to 20', async ({ page }) => {
      await page.getByTestId('p1Teeth').fill('20');
      await assertInputs(page, {
        pitch: '5',
        pitchUnit: 'mm',
        beltToothIncrement: '5',
        desiredCenter: '5',
        desiredCenterUnit: 'in',
        extraCenter: '0',
        extraCenterUnit: 'mm',
        enableCustomBelt: false,
        specificBeltTeeth: '125',
        p1Teeth: '20',
        p2Teeth: '24',
      });

      await assertOutputs(page, {
        p1PitchDiameter: '1.253',
        p1PitchDiameterUnit: 'in',
        p2PitchDiameter: '1.504',
        p2PitchDiameterUnit: 'in',
        smallerBeltTeeth: '70',
        smallerCenter: '4.723',
        smallerCenterUnit: 'in',
        smallerP1TeethInMesh: '10',
        smallerP2TeethInMesh: '11',
        smallerPulleyGap: '3.344',
        smallerPulleyGapUnit: 'in',
        smallerDiffFromTarget: '0.277',
        smallerDiffFromTargetUnit: 'in',
        largerBeltTeeth: '75',
        largerCenter: '5.215',
        largerCenterUnit: 'in',
        largerP1TeethInMesh: '10',
        largerP2TeethInMesh: '11',
        largerPulleyGap: '3.837',
        largerPulleyGapUnit: 'in',
        largerDiffFromTarget: '-0.215',
        largerDiffFromTargetUnit: 'in',
      });
    });

    test('Change p1 teeth from 16 to 0', async ({ page }) => {
      await page.getByTestId('p1Teeth').fill('0');
      await assertInputs(page, {
        pitch: '5',
        pitchUnit: 'mm',
        beltToothIncrement: '5',
        desiredCenter: '5',
        desiredCenterUnit: 'in',
        extraCenter: '0',
        extraCenterUnit: 'mm',
        enableCustomBelt: false,
        specificBeltTeeth: '125',
        p1Teeth: '0',
        p2Teeth: '24',
      });

      await assertOutputs(page, {
        p1PitchDiameter: '0.000',
        p1PitchDiameterUnit: 'in',
        p2PitchDiameter: '1.504',
        p2PitchDiameterUnit: 'in',
        smallerBeltTeeth: '0',
        smallerCenter: '0.000',
        smallerCenterUnit: 'in',
        smallerP1TeethInMesh: '0',
        smallerP2TeethInMesh: '0',
        smallerPulleyGap: '0.000',
        smallerPulleyGapUnit: 'in',
        smallerDiffFromTarget: '0.000',
        smallerDiffFromTargetUnit: 'in',
        largerBeltTeeth: '0',
        largerCenter: '0.000',
        largerCenterUnit: 'in',
        largerP1TeethInMesh: '0',
        largerP2TeethInMesh: '0',
        largerPulleyGap: '0.000',
        largerPulleyGapUnit: 'in',
        largerDiffFromTarget: '0.000',
        largerDiffFromTargetUnit: 'in',
      });
    });
  });

  test.describe('Pulley 2 teeth input', () => {
    test('Change p2 teeth from 24 to 30', async ({ page }) => {
      await page.getByTestId('p2Teeth').fill('30');
      await assertInputs(page, {
        pitch: '5',
        pitchUnit: 'mm',
        beltToothIncrement: '5',
        desiredCenter: '5',
        desiredCenterUnit: 'in',
        extraCenter: '0',
        extraCenterUnit: 'mm',
        enableCustomBelt: false,
        specificBeltTeeth: '125',
        p1Teeth: '16',
        p2Teeth: '30',
      });

      await assertOutputs(page, {
        p1PitchDiameter: '1.003',
        p1PitchDiameterUnit: 'in',
        p2PitchDiameter: '1.880',
        p2PitchDiameterUnit: 'in',
        smallerBeltTeeth: '70',
        smallerCenter: '4.605',
        smallerCenterUnit: 'in',
        smallerP1TeethInMesh: '8',
        smallerP2TeethInMesh: '14',
        smallerPulleyGap: '3.164',
        smallerPulleyGapUnit: 'in',
        smallerDiffFromTarget: '0.395',
        smallerDiffFromTargetUnit: 'in',
        largerBeltTeeth: '75',
        largerCenter: '5.099',
        largerCenterUnit: 'in',
        largerP1TeethInMesh: '8',
        largerP2TeethInMesh: '14',
        largerPulleyGap: '3.658',
        largerPulleyGapUnit: 'in',
        largerDiffFromTarget: '-0.099',
        largerDiffFromTargetUnit: 'in',
      });
    });

    test('Change p2 teeth from 24 to 0', async ({ page }) => {
      await page.getByTestId('p2Teeth').fill('0');
      await assertInputs(page, {
        pitch: '5',
        pitchUnit: 'mm',
        beltToothIncrement: '5',
        desiredCenter: '5',
        desiredCenterUnit: 'in',
        extraCenter: '0',
        extraCenterUnit: 'mm',
        enableCustomBelt: false,
        specificBeltTeeth: '125',
        p1Teeth: '16',
        p2Teeth: '0',
      });

      await assertOutputs(page, {
        p1PitchDiameter: '1.003',
        p1PitchDiameterUnit: 'in',
        p2PitchDiameter: '0.000',
        p2PitchDiameterUnit: 'in',
        smallerBeltTeeth: '0',
        smallerCenter: '0.000',
        smallerCenterUnit: 'in',
        smallerP1TeethInMesh: '0',
        smallerP2TeethInMesh: '0',
        smallerPulleyGap: '0.000',
        smallerPulleyGapUnit: 'in',
        smallerDiffFromTarget: '0.000',
        smallerDiffFromTargetUnit: 'in',
        largerBeltTeeth: '0',
        largerCenter: '0.000',
        largerCenterUnit: 'in',
        largerP1TeethInMesh: '0',
        largerP2TeethInMesh: '0',
        largerPulleyGap: '0.000',
        largerPulleyGapUnit: 'in',
        largerDiffFromTarget: '0.000',
        largerDiffFromTargetUnit: 'in',
      });
    });
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

  test.describe('Copy link button', () => {
    test('Copy link with default values', async ({ page, browserName }) => {
      test.skip(browserName === 'webkit');

      await page.getByRole('button', { name: 'Copy Link' }).click();
      const clipboardValue = await page.evaluate<string>(() =>
        navigator.clipboard.readText(),
      );
      const url = new URL(clipboardValue);
      expect(url.pathname).toBe('/belts');
      const params = new URLSearchParams(url.search);
      expect(params.get('customBeltTeeth')).toBe('125');
      expect(params.get('p1Teeth')).toBe('16');
      expect(params.get('p2Teeth')).toBe('24');
      const pitchValue = decodeURIComponent(params.get('pitch') ?? '');
      expect(pitchValue).toContain('s=5');
      expect(pitchValue).toContain('u=mm');
      const desiredCenterValue = decodeURIComponent(
        params.get('desiredCenter') ?? '',
      );
      expect(desiredCenterValue).toContain('s=5');
      expect(desiredCenterValue).toContain('u=in');
      const extraCenterValue = decodeURIComponent(
        params.get('extraCenter') ?? '',
      );
      expect(extraCenterValue).toContain('s=0');
      expect(extraCenterValue).toContain('u=mm');
      expect(params.get('toothIncrement')).toBe('5');
      expect(params.get('useCustomBelt')).toBe('false');
    });

    test('Copy link with modified values', async ({ page, browserName }) => {
      test.skip(browserName === 'webkit');

      await page.getByTestId('pitch').fill('3');
      await page.getByTestId('beltToothIncrement').fill('10');
      await page.getByTestId('desiredCenter').fill('10');
      await page.getByTestId('selectdesiredCenter').click();
      await page.getByRole('option', { name: 'mm' }).click();
      await page.getByTestId('extraCenter').fill('5');
      await page.getByTestId('enableCustomBelt').click();
      await page.getByTestId('specificBeltTeeth').fill('150');
      await page.getByTestId('p1Teeth').fill('20');
      await page.getByTestId('p2Teeth').fill('30');

      await page.getByRole('button', { name: 'Copy Link' }).click();
      const clipboardValue = await page.evaluate<string>(() =>
        navigator.clipboard.readText(),
      );
      const url = new URL(clipboardValue);
      expect(url.pathname).toBe('/belts');
      const params = new URLSearchParams(url.search);
      expect(params.get('customBeltTeeth')).toBe('150');
      expect(params.get('p1Teeth')).toBe('20');
      expect(params.get('p2Teeth')).toBe('30');
      const pitchValue = decodeURIComponent(params.get('pitch') ?? '');
      expect(pitchValue).toContain('s=3');
      expect(pitchValue).toContain('u=mm');
      const desiredCenterValue = decodeURIComponent(
        params.get('desiredCenter') ?? '',
      );
      expect(desiredCenterValue).toContain('s=10');
      expect(desiredCenterValue).toContain('u=mm');
      const extraCenterValue = decodeURIComponent(
        params.get('extraCenter') ?? '',
      );
      expect(extraCenterValue).toContain('s=5');
      expect(extraCenterValue).toContain('u=mm');
      expect(params.get('toothIncrement')).toBe('10');
      expect(params.get('useCustomBelt')).toBe('true');
    });

    test('Copy link URL can be navigated to restore state', async ({
      page,
      browserName,
    }) => {
      test.skip(browserName === 'webkit');

      await page.getByTestId('pitch').fill('3');
      await page.getByTestId('beltToothIncrement').fill('10');
      await page.getByTestId('desiredCenter').fill('10');
      await page.getByTestId('p1Teeth').fill('20');
      await page.getByTestId('p2Teeth').fill('30');

      await page.getByRole('button', { name: 'Copy Link' }).click();
      const clipboardValue = await page.evaluate<string>(() =>
        navigator.clipboard.readText(),
      );

      await page.goto(clipboardValue);

      await assertInputs(page, {
        pitch: '3',
        pitchUnit: 'mm',
        beltToothIncrement: '10',
        desiredCenter: '10',
        desiredCenterUnit: 'in',
        extraCenter: '0',
        extraCenterUnit: 'mm',
        enableCustomBelt: false,
        specificBeltTeeth: '125',
        p1Teeth: '20',
        p2Teeth: '30',
      });
    });
  });
});

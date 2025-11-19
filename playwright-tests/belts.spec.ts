import { expect, test } from '@playwright/test';

const CHART_DELAY_MS = 750;

test.describe('Belt Calculator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/belts');
    await page.waitForLoadState('networkidle');
  });

  test('should match snapshot with pitch magnitude changed', async ({
    page,
  }) => {
    await page.getByTestId('pitch').fill('3');
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(await page.getByRole('main').ariaSnapshot()).toMatchSnapshot({
      name: 'pitch-magnitude-changed.yaml',
    });
  });

  test('should match snapshot with pitch unit changed', async ({ page }) => {
    await page.getByTestId('selectpitch').click();
    await page.getByRole('option', { name: 'in' }).click();
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(await page.getByRole('main').ariaSnapshot()).toMatchSnapshot({
      name: 'pitch-unit-changed.yaml',
    });
  });

  test('should match snapshot with desiredCenter magnitude changed', async ({
    page,
  }) => {
    await page.getByTestId('desiredCenter').fill('10');
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(await page.getByRole('main').ariaSnapshot()).toMatchSnapshot({
      name: 'desiredCenter-magnitude-changed.yaml',
    });
  });

  test('should match snapshot with desiredCenter unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectdesiredCenter').click();
    await page.getByRole('option', { name: 'cm' }).click();
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(await page.getByRole('main').ariaSnapshot()).toMatchSnapshot({
      name: 'desiredCenter-unit-changed.yaml',
    });
  });

  test('should match snapshot with extraCenter magnitude changed', async ({
    page,
  }) => {
    await page.getByTestId('extraCenter').fill('1');
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(await page.getByRole('main').ariaSnapshot()).toMatchSnapshot({
      name: 'extraCenter-magnitude-changed.yaml',
    });
  });

  test('should match snapshot with extraCenter unit changed', async ({
    page,
  }) => {
    await page.getByTestId('extraCenter').fill('1');
    await page.getByTestId('selectextraCenter').click();
    await page.getByRole('option', { name: 'in' }).click();
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(await page.getByRole('main').ariaSnapshot()).toMatchSnapshot({
      name: 'extraCenter-unit-changed.yaml',
    });
  });

  test('should match snapshot with beltToothIncrement changed', async ({
    page,
  }) => {
    await page.getByTestId('beltToothIncrement').fill('10');
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(await page.getByRole('main').ariaSnapshot()).toMatchSnapshot({
      name: 'beltToothIncrement-changed.yaml',
    });
  });

  test('should match snapshot with specificBeltTeeth changed', async ({
    page,
  }) => {
    await page.getByTestId('specificBeltTeeth').fill('100');
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(await page.getByRole('main').ariaSnapshot()).toMatchSnapshot({
      name: 'specificBeltTeeth-changed.yaml',
    });
  });

  test('should match snapshot with p1Teeth changed', async ({ page }) => {
    await page.getByTestId('p1Teeth').fill('20');
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(await page.getByRole('main').ariaSnapshot()).toMatchSnapshot({
      name: 'p1Teeth-changed.yaml',
    });
  });

  test('should match snapshot with p2Teeth changed', async ({ page }) => {
    await page.getByTestId('p2Teeth').fill('40');
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(await page.getByRole('main').ariaSnapshot()).toMatchSnapshot({
      name: 'p2Teeth-changed.yaml',
    });
  });

  test('should match snapshot with p1PitchDiameter unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectp1PitchDiameter').click();
    await page.getByRole('option', { name: 'mm' }).click();
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(await page.getByRole('main').ariaSnapshot()).toMatchSnapshot({
      name: 'p1PitchDiameter-unit-changed.yaml',
    });
  });

  test('should match snapshot with p2PitchDiameter unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectp2PitchDiameter').click();
    await page.getByRole('option', { name: 'mm' }).click();
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(await page.getByRole('main').ariaSnapshot()).toMatchSnapshot({
      name: 'p2PitchDiameter-unit-changed.yaml',
    });
  });

  test('should match snapshot with smallerCenter unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectsmallerCenter').click();
    await page.getByRole('option', { name: 'cm' }).click();
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(await page.getByRole('main').ariaSnapshot()).toMatchSnapshot({
      name: 'smallerCenter-unit-changed.yaml',
    });
  });

  test('should match snapshot with smallerPulleyGap unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectsmallerPulleyGap').click();
    await page.getByRole('option', { name: 'cm' }).click();
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(await page.getByRole('main').ariaSnapshot()).toMatchSnapshot({
      name: 'smallerPulleyGap-unit-changed.yaml',
    });
  });

  test('should match snapshot with smallerDiffFromTarget unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectsmallerDiffFromTarget').click();
    await page.getByRole('option', { name: 'cm' }).click();
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(await page.getByRole('main').ariaSnapshot()).toMatchSnapshot({
      name: 'smallerDiffFromTarget-unit-changed.yaml',
    });
  });

  test('should match snapshot with largerCenter unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectlargerCenter').click();
    await page.getByRole('option', { name: 'cm' }).click();
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(await page.getByRole('main').ariaSnapshot()).toMatchSnapshot({
      name: 'largerCenter-unit-changed.yaml',
    });
  });

  test('should match snapshot with largerPulleyGap unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectlargerPulleyGap').click();
    await page.getByRole('option', { name: 'cm' }).click();
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(await page.getByRole('main').ariaSnapshot()).toMatchSnapshot({
      name: 'largerPulleyGap-unit-changed.yaml',
    });
  });

  test('should match snapshot with largerDiffFromTarget unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectlargerDiffFromTarget').click();
    await page.getByRole('option', { name: 'cm' }).click();
    await page.waitForTimeout(CHART_DELAY_MS);
    expect(await page.getByRole('main').ariaSnapshot()).toMatchSnapshot({
      name: 'largerDiffFromTarget-unit-changed.yaml',
    });
  });
});

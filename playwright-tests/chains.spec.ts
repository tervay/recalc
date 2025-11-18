import { expect, test } from '@playwright/test';

test.describe('Chain Calculator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/chains');
    await page.waitForLoadState('networkidle');
  });

  test('should match snapshot with desiredCenter magnitude changed', async ({
    page,
  }) => {
    await page.getByTestId('desiredCenter').fill('10');
    expect(await page.getByRole('main').ariaSnapshot()).toMatchSnapshot({
      name: 'desiredCenter-magnitude-changed.yaml',
    });
  });

  test('should match snapshot with desiredCenter unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectdesiredCenter').click();
    await page.getByRole('option', { name: 'ft' }).click();
    expect(await page.getByRole('main').ariaSnapshot()).toMatchSnapshot({
      name: 'desiredCenter-unit-changed.yaml',
    });
  });

  test('should match snapshot with extraCenter magnitude changed', async ({
    page,
  }) => {
    await page.getByTestId('extraCenter').fill('1');
    expect(await page.getByRole('main').ariaSnapshot()).toMatchSnapshot({
      name: 'extraCenter-magnitude-changed.yaml',
    });
  });

  test('should match snapshot with extraCenter unit changed', async ({
    page,
  }) => {
    await page.getByTestId('extraCenter').fill('1');
    await page.getByTestId('selectextraCenter').click();
    await page.getByRole('option', { name: 'cm' }).click();
    expect(await page.getByRole('main').ariaSnapshot()).toMatchSnapshot({
      name: 'extraCenter-unit-changed.yaml',
    });
  });

  test('should match snapshot with chain changed', async ({ page }) => {
    await page.getByTestId('chainType').click();
    await page.getByRole('option', { name: '#35' }).click();
    expect(await page.getByRole('main').ariaSnapshot()).toMatchSnapshot({
      name: 'chain-unit-changed.yaml',
    });
  });

  test('should match snapshot with p1Teeth changed', async ({ page }) => {
    await page.getByTestId('p1Teeth').fill('30');
    expect(await page.getByRole('main').ariaSnapshot()).toMatchSnapshot({
      name: 'p1Teeth-changed.yaml',
    });
  });

  test('should match snapshot with p2Teeth changed', async ({ page }) => {
    await page.getByTestId('p2Teeth').fill('60');
    expect(await page.getByRole('main').ariaSnapshot()).toMatchSnapshot({
      name: 'p2Teeth-changed.yaml',
    });
  });

  test('should match snapshot with p1PitchDiameter unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectp1PitchDiameter').click();
    await page.getByRole('option', { name: 'mm' }).click();
    expect(await page.getByRole('main').ariaSnapshot()).toMatchSnapshot({
      name: 'p1PitchDiameter-changed.yaml',
    });
  });

  test('should match snapshot with p2PitchDiameter unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectp2PitchDiameter').click();
    await page.getByRole('option', { name: 'mm' }).click();
    expect(await page.getByRole('main').ariaSnapshot()).toMatchSnapshot({
      name: 'p2PitchDiameter-changed.yaml',
    });
  });

  test('should match snapshot with smallerDistance unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectsmallerDistance').click();
    await page.getByRole('option', { name: 'cm' }).click();
    expect(await page.getByRole('main').ariaSnapshot()).toMatchSnapshot({
      name: 'smallerDistance-changed.yaml',
    });
  });

  test('should match snapshot with largerDistance unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectlargerDistance').click();
    await page.getByRole('option', { name: 'cm' }).click();
    expect(await page.getByRole('main').ariaSnapshot()).toMatchSnapshot({
      name: 'largerDistance-changed.yaml',
    });
  });
});

import { expect, test } from '@playwright/test';

test.describe('Copy Link', () => {
  test('gears: copied URL restores state', async ({ page }) => {
    await page.goto('/gears');
    await page.waitForLoadState('networkidle');

    await page.getByTestId('gear1Teeth').fill('40');
    await page.getByTestId('gear2Teeth').fill('60');
    await page.getByTestId('gearDP').fill('32');
    await page.getByRole('button', { name: 'Copy Link' }).click();

    const url = await page.evaluate(() => navigator.clipboard.readText());
    expect(url).toContain('/gears');

    await page.goto(url);
    await page.waitForLoadState('networkidle');

    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      { name: 'gears-restored.yaml' },
    );
  });

  test('belts: copied URL restores state', async ({ page }) => {
    await page.goto('/belts');
    await page.waitForLoadState('networkidle');

    await page.getByTestId('p1Teeth').fill('20');
    await page.getByTestId('p2Teeth').fill('40');
    await page.getByTestId('pitch').fill('3');
    await page.getByTestId('desiredCenter').fill('8');
    await page.getByTestId('extraCenter').fill('2');
    await page.getByTestId('beltToothIncrement').fill('10');
    // Toggle useCustomBelt to true so customBeltTeeth is visible and testable
    await page.getByTestId('enableCustomBelt').click();
    await page.getByTestId('specificBeltTeeth').fill('100');
    await page.getByRole('button', { name: 'Copy Link' }).click();

    const url = await page.evaluate(() => navigator.clipboard.readText());
    expect(url).toContain('/belts');

    await page.goto(url);
    await page.waitForLoadState('networkidle');

    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      { name: 'belts-restored.yaml' },
    );
  });

  test('chains: copied URL restores state', async ({ page }) => {
    await page.goto('/chains');
    await page.waitForLoadState('networkidle');

    await page.getByTestId('chainType').click();
    await page.getByRole('option', { name: '#35' }).click();
    await page.getByTestId('p1Teeth').fill('20');
    await page.getByTestId('p2Teeth').fill('40');
    await page.getByTestId('desiredCenter').fill('8');
    await page.getByTestId('extraCenter').fill('1');
    await page.getByLabel('Allow Half Links').click();
    await page.getByRole('button', { name: 'Copy Link' }).click();

    const url = await page.evaluate(() => navigator.clipboard.readText());
    expect(url).toContain('/chains');

    await page.goto(url);
    await page.waitForLoadState('networkidle');

    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      { name: 'chains-restored.yaml' },
    );
  });

  test('arm: copied URL restores state', async ({ page }) => {
    await page.goto('/arm');
    await page.waitForLoadState('networkidle');

    await page.getByTestId('selectmotor').click();
    await page.getByRole('option', { name: 'NEO', exact: true }).click();
    await page.getByTestId('ratio').fill('200');
    await page.getByTestId('armLength').fill('12');
    await page.getByTestId('load').fill('8');
    await page.getByTestId('minAngle').fill('10');
    await page.getByTestId('maxAngle').fill('80');
    await page.getByTestId('statorLimit').fill('50');
    await page.getByTestId('supplyLimit').fill('70');
    await page.getByTestId('supplyVoltage').fill('12.6');
    await page.getByTestId('statorVoltage').fill('11');
    await page.getByTestId('batteryResistance').fill('0.03');
    await page.getByTestId('efficiency').fill('90');
    await page.getByRole('button', { name: 'Copy Link' }).click();

    const url = await page.evaluate(() => navigator.clipboard.readText());
    expect(url).toContain('/arm');

    await page.goto(url);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(100);
    await expect(page.getByTestId('arm-page')).toHaveAttribute(
      'data-calculating',
      'false',
      { timeout: 30000 },
    );

    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      { name: 'arm-restored.yaml' },
    );
  });

  test('flywheel: copied URL restores state', async ({ page }) => {
    await page.goto('/flywheel');
    await page.waitForLoadState('networkidle');

    await page.getByTestId('selectmotor').click();
    await page.getByRole('option', { name: 'NEO', exact: true }).click();
    await page.getByTestId('ratio').fill('2');
    await page.getByTestId('statorLimit').fill('50');
    await page.getByTestId('supplyLimit').fill('70');
    await page.getByTestId('supplyVoltage').fill('12.6');
    await page.getByTestId('batteryResistance').fill('0.03');
    await page.getByTestId('efficiency').fill('85');
    await page.getByTestId('shooterDiameter').fill('4');
    await page.getByTestId('shooterWeight').fill('0.8');
    await page.getByTestId('shooterTargetSpeed').fill('2000');
    // Toggle useCustomShooterMoi so customShooterMoi is visible and testable
    await page.getByTestId('useCustomShooterMoi').click();
    await page.getByTestId('customShooterMoi').fill('3');
    await page.getByTestId('flywheelDiameter').fill('3');
    await page.getByTestId('flywheelWeight').fill('1');
    await page.getByTestId('flywheelToShooterRatio').fill('2');
    // Toggle useCustomFlywheelMoi so customFlywheelMoi is visible and testable
    await page.getByTestId('useCustomFlywheelMoi').click();
    await page.getByTestId('customFlywheelMoi').fill('2');
    await page.getByRole('button', { name: 'Copy Link' }).click();

    const url = await page.evaluate(() => navigator.clipboard.readText());
    expect(url).toContain('/flywheel');

    await page.goto(url);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(100);
    await expect(page.getByTestId('flywheel-main')).toHaveAttribute(
      'data-calculating',
      'false',
      { timeout: 30000 },
    );

    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      { name: 'flywheel-restored.yaml' },
    );
  });

  test('intake: copied URL restores state', async ({ page }) => {
    await page.goto('/intake');
    await page.waitForLoadState('networkidle');

    await page.getByTestId('selectmotor').click();
    await page.getByRole('option', { name: 'NEO', exact: true }).click();
    await page.getByTestId('ratio').fill('4');
    await page.getByTestId('rollerDiameter').fill('3');
    await page.getByTestId('travelDistance').fill('10');
    await page.getByTestId('statorCurrentLimit').fill('40');
    await page.getByTestId('drivetrainSpeed').fill('12');
    await page.getByRole('button', { name: 'Copy Link' }).click();

    const url = await page.evaluate(() => navigator.clipboard.readText());
    expect(url).toContain('/intake');

    await page.goto(url);
    await page.waitForLoadState('networkidle');

    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      { name: 'intake-restored.yaml' },
    );
  });

  test('linear: copied URL restores state', async ({ page }) => {
    await page.goto('/linear');
    await page.waitForLoadState('networkidle');

    await page.getByTestId('selectmotor').click();
    await page.getByRole('option', { name: 'NEO', exact: true }).click();
    await page.getByTestId('travelDistance').fill('48');
    await page.getByTestId('spoolDiameter').fill('2');
    await page.getByTestId('load').fill('10');
    await page.getByTestId('ratio').fill('5');
    await page.getByTestId('efficiency').fill('90');
    await page.getByTestId('statorLimit').fill('50');
    await page.getByTestId('supplyLimit').fill('70');
    await page.getByTestId('supplyVoltage').fill('12.6');
    await page.getByTestId('statorVoltage').fill('11');
    await page.getByTestId('angle').fill('45');
    await page.getByTestId('batteryResistance').fill('0.03');
    await page.getByTestId('cascade').click();
    await page.getByTestId('targetTimeToGoal').fill('0.75');
    await page.getByTestId('maximumComfortableStatorLimit').fill('80');
    await page.getByTestId('maximumComfortableSupplyLimit').fill('70');
    await page.getByRole('button', { name: 'Copy Link' }).click();

    const url = await page.evaluate(() => navigator.clipboard.readText());
    expect(url).toContain('/linear');

    await page.goto(url);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(100);
    await expect(page.getByTestId('linear-main')).toHaveAttribute(
      'data-calculating',
      'false',
      { timeout: 30000 },
    );

    expect(
      await page.getByTestId('linear-main').ariaSnapshot(),
    ).toMatchSnapshot({ name: 'linear-restored.yaml' });
  });

  test('ratio: copied URL restores state', async ({ page }) => {
    await page.goto('/ratio');
    await page.waitForLoadState('networkidle');

    await page.getByTestId('driving0').fill('10');
    await page.getByTestId('driven0').fill('50');
    await page.getByTestId('driving1').fill('15');
    await page.getByTestId('driven1').fill('45');
    await page.getByRole('button', { name: 'Copy Link' }).click();

    const url = await page.evaluate(() => navigator.clipboard.readText());
    expect(url).toContain('/ratio');

    await page.goto(url);
    await page.waitForLoadState('networkidle');

    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      { name: 'ratio-restored.yaml' },
    );
  });

  test('ratio-finder: copied URL restores state', async ({ page }) => {
    // ratio-finder inputs have no testIds, so seed state via URL params directly
    await page.goto(
      '/ratio-finder?minGearTeeth=10&maxGearTeeth=60&minPulleyTeeth=10&maxPulleyTeeth=50&minSprocketTeeth=10&maxSprocketTeeth=60&enable32DP=true&enableGT2=true&targetReductionErrorThreshold=0.1',
    );
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(100);
    await expect(page.getByTestId('ratio-finder-page')).toHaveAttribute(
      'data-calculating',
      'false',
      { timeout: 30000 },
    );
    await page.getByRole('button', { name: 'Copy Link' }).click();

    const url = await page.evaluate(() => navigator.clipboard.readText());
    expect(url).toContain('/ratio-finder');
    expect(url).toContain('minGearTeeth=10');
    expect(url).toContain('maxGearTeeth=60');
    expect(url).toContain('minPulleyTeeth=10');
    expect(url).toContain('maxPulleyTeeth=50');
    expect(url).toContain('minSprocketTeeth=10');
    expect(url).toContain('maxSprocketTeeth=60');
    expect(url).toContain('enable32DP=true');
    expect(url).toContain('enableGT2=true');
    expect(url).toContain('targetReductionErrorThreshold=0.1');

    await page.goto(url);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(100);
    await expect(page.getByTestId('ratio-finder-page')).toHaveAttribute(
      'data-calculating',
      'false',
      { timeout: 30000 },
    );

    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      { name: 'ratio-finder-restored.yaml' },
    );
  });

  test('Copy Link URL does not duplicate query string when already on a shared URL', async ({
    page,
  }) => {
    await page.goto('/gears');
    await page.waitForLoadState('networkidle');

    await page.getByTestId('gear1Teeth').fill('40');
    await page.getByRole('button', { name: 'Copy Link' }).click();

    const firstUrl = await page.evaluate(() => navigator.clipboard.readText());

    await page.goto(firstUrl);
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Copy Link' }).click();

    const secondUrl = await page.evaluate(() => navigator.clipboard.readText());

    expect(secondUrl.split('?')).toHaveLength(2);
    expect(secondUrl).toBe(firstUrl);
  });
});

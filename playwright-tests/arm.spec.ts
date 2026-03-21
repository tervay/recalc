import { type Page, expect, test } from '@playwright/test';

async function waitForCalc(page: Page) {
  await page.waitForTimeout(100);
  await expect(page.getByTestId('arm-page')).toHaveAttribute(
    'data-calculating',
    'false',
    { timeout: 30000 },
  );
}

test.describe('Arm Calculator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/arm');
    await page.waitForLoadState('networkidle');
  });

  test('should match snapshot with motor magnitude changed', async ({
    page,
  }) => {
    await page.getByTestId('motor').fill('2');
    await waitForCalc(page);
    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      {
        name: 'motor-magnitude-changed.yaml',
      },
    );
  });

  test('should match snapshot with motor unit changed', async ({ page }) => {
    await page.getByTestId('selectmotor').click();
    await page.getByRole('option', { name: 'NEO', exact: true }).click();
    await waitForCalc(page);
    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      {
        name: 'motor-unit-changed.yaml',
      },
    );
  });

  test('should match snapshot with ratio magnitude changed', async ({
    page,
  }) => {
    await page.getByTestId('ratio').fill('200');
    await waitForCalc(page);
    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      {
        name: 'ratio-magnitude-changed.yaml',
      },
    );
  });

  test('should match snapshot with ratio unit changed', async ({ page }) => {
    await page.getByTestId('selectratio').click();
    await page.getByRole('option', { name: 'Step-up' }).click();
    await waitForCalc(page);
    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      {
        name: 'ratio-unit-changed.yaml',
      },
    );
  });

  test('should match snapshot with armLength magnitude changed', async ({
    page,
  }) => {
    await page.getByTestId('armLength').fill('12');
    await waitForCalc(page);
    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      {
        name: 'armLength-magnitude-changed.yaml',
      },
    );
  });

  test('should match snapshot with armLength unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectarmLength').click();
    await page.getByRole('option', { name: 'cm' }).click();
    await waitForCalc(page);
    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      {
        name: 'armLength-unit-changed.yaml',
      },
    );
  });

  test('should match snapshot with load magnitude changed', async ({
    page,
  }) => {
    await page.getByTestId('load').fill('15');
    await waitForCalc(page);
    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      {
        name: 'load-magnitude-changed.yaml',
      },
    );
  });

  test('should match snapshot with load unit changed', async ({ page }) => {
    await page.getByTestId('selectload').click();
    await page.getByRole('option', { name: 'kg' }).click();
    await waitForCalc(page);
    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      {
        name: 'load-unit-changed.yaml',
      },
    );
  });

  test('should match snapshot with minAngle magnitude changed', async ({
    page,
  }) => {
    await page.getByTestId('minAngle').fill('45');
    await waitForCalc(page);
    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      {
        name: 'minAngle-magnitude-changed.yaml',
      },
    );
  });

  test('should match snapshot with minAngle unit changed', async ({ page }) => {
    await page.getByTestId('selectminAngle').click();
    await page.getByRole('option', { name: 'rad' }).click();
    await waitForCalc(page);
    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      {
        name: 'minAngle-unit-changed.yaml',
      },
    );
  });

  test('should match snapshot with maxAngle magnitude changed', async ({
    page,
  }) => {
    await page.getByTestId('maxAngle').fill('135');
    await waitForCalc(page);
    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      {
        name: 'maxAngle-magnitude-changed.yaml',
      },
    );
  });

  test('should match snapshot with maxAngle unit changed', async ({ page }) => {
    await page.getByTestId('selectmaxAngle').click();
    await page.getByRole('option', { name: 'rad' }).click();
    await waitForCalc(page);
    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      {
        name: 'maxAngle-unit-changed.yaml',
      },
    );
  });

  test('should match snapshot with statorLimit magnitude changed', async ({
    page,
  }) => {
    await page.getByTestId('statorLimit').fill('80');
    await waitForCalc(page);
    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      {
        name: 'statorLimit-magnitude-changed.yaml',
      },
    );
  });

  test('should match snapshot with statorLimit unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectstatorLimit').click();
    await page.getByRole('option', { name: 'A' }).click();
    await waitForCalc(page);
    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      {
        name: 'statorLimit-unit-changed.yaml',
      },
    );
  });

  test('should match snapshot with supplyLimit magnitude changed', async ({
    page,
  }) => {
    await page.getByTestId('supplyLimit').fill('40');
    await waitForCalc(page);
    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      {
        name: 'supplyLimit-magnitude-changed.yaml',
      },
    );
  });

  test('should match snapshot with supplyLimit unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectsupplyLimit').click();
    await page.getByRole('option', { name: 'A' }).click();
    await waitForCalc(page);
    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      {
        name: 'supplyLimit-unit-changed.yaml',
      },
    );
  });

  test('should match snapshot with statorVoltage magnitude changed', async ({
    page,
  }) => {
    await page.getByTestId('statorVoltage').fill('10');
    await waitForCalc(page);
    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      {
        name: 'statorVoltage-magnitude-changed.yaml',
      },
    );
  });

  test('should match snapshot with statorVoltage unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectstatorVoltage').click();
    await page.getByRole('option', { name: 'V' }).click();
    await waitForCalc(page);
    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      {
        name: 'statorVoltage-unit-changed.yaml',
      },
    );
  });

  test('should match snapshot with supplyVoltage magnitude changed', async ({
    page,
  }) => {
    await page.getByTestId('supplyVoltage').fill('10');
    await waitForCalc(page);
    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      {
        name: 'supplyVoltage-magnitude-changed.yaml',
      },
    );
  });

  test('should match snapshot with supplyVoltage unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectsupplyVoltage').click();
    await page.getByRole('option', { name: 'V' }).click();
    await waitForCalc(page);
    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      {
        name: 'supplyVoltage-unit-changed.yaml',
      },
    );
  });

  test('should match snapshot with batteryResistance magnitude changed', async ({
    page,
  }) => {
    await page.getByTestId('batteryResistance').fill('0.03');
    await waitForCalc(page);
    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      {
        name: 'batteryResistance-magnitude-changed.yaml',
      },
    );
  });

  test('should match snapshot with batteryResistance unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectbatteryResistance').click();
    await page.getByRole('option', { name: 'Ohm' }).click();
    await waitForCalc(page);
    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      {
        name: 'batteryResistance-unit-changed.yaml',
      },
    );
  });

  test('should match snapshot with efficiency changed', async ({ page }) => {
    await page.getByTestId('efficiency').fill('90');
    await waitForCalc(page);
    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      {
        name: 'efficiency-changed.yaml',
      },
    );
  });

  test('should match snapshot with statorPowerLimit unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectstatorPowerLimit').click();
    await page.getByRole('option', { name: 'hp' }).click();
    await waitForCalc(page);
    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      {
        name: 'statorPowerLimit-changed.yaml',
      },
    );
  });

  test('should match snapshot with supplyPowerLimit unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectsupplyPowerLimit').click();
    await page.getByRole('option', { name: 'hp' }).click();
    await waitForCalc(page);
    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      {
        name: 'supplyPowerLimit-changed.yaml',
      },
    );
  });

  test('should match snapshot with goingUpTimeToGoal unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectgoingUpTimeToGoal').click();
    await page.getByRole('option', { name: 'min' }).click();
    await waitForCalc(page);
    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      {
        name: 'goingUpTimeToGoal-changed.yaml',
      },
    );
  });

  test('should match snapshot with goingDownTimeToGoal unit changed', async ({
    page,
  }) => {
    await page.getByTestId('selectgoingDownTimeToGoal').click();
    await page.getByRole('option', { name: 'min' }).click();
    await waitForCalc(page);
    expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot(
      {
        name: 'goingDownTimeToGoal-changed.yaml',
      },
    );
  });
});

const MEASUREMENT_INPUTS: string[] = [
  'statorLimit',
  'supplyLimit',
  'supplyVoltage',
  'batteryResistance',
  'shooterDiameter',
  'shooterWeight',
  'shooterTargetSpeed',
  'customShooterMoi',
  'flywheelDiameter',
  'flywheelWeight',
  'customFlywheelMoi',
  'projectileDiameter',
  'projectileWeight',
  'motor',
  'ratio',
  'flywheelToShooterRatio',
];
const NUMBER_INPUTS: string[] = ['efficiency'];
const SELECT_INPUTS: string[] = [];

const MEASUREMENT_OUTPUTS: string[] = [
  'maxAchievableShooterRpm',
  'derivedShooterMoi',
  'derivedFlywheelMoi',
  'kV',
  'kA',
  'spinupTime',
  'totalMomentOfInertia',
];

function generateMeasurementInputChangeTest(dataTestId: string): string {
  return `
    test.skip('should match snapshot with ${dataTestId} magnitude changed', async ({ page }) => {
        await page.getByTestId('${dataTestId}').fill('FIXME');
        expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot({
          name: '${dataTestId}-magnitude-changed.yaml',
        });
    });

    test.skip('should match snapshot with ${dataTestId} unit changed', async ({ page }) => {
        await page.getByTestId('select${dataTestId}').click();
        await page.getByRole('option', { name: 'FIXME' }).click();
        expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot({
          name: '${dataTestId}-unit-changed.yaml',
        });
    });
    `;
}

function generateNumberInputChangeTest(dataTestId: string): string {
  return `
    test.skip('should match snapshot with ${dataTestId} changed', async ({ page }) => {
        await page.getByTestId('${dataTestId}').fill('FIXME');
        expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot({
          name: '${dataTestId}-changed.yaml',
        });
    });
    `;
}

function generateSelectInputChangeTest(dataTestId: string): string {
  return `
    test.skip('should match snapshot with ${dataTestId} changed', async ({ page }) => {
        await page.getByTestId('${dataTestId}').click();
        await page.getByRole('option', { name: 'FIXME' }).click();
        expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot({
          name: '${dataTestId}-unit-changed.yaml',
        });
    });
    `;
}

function generateMeasurementOutputChangeTest(dataTestId: string): string {
  return `
    test.skip('should match snapshot with ${dataTestId} unit changed', async ({ page }) => {
        await page.getByTestId('select${dataTestId}').click();
        await page.getByRole('option', { name: 'FIXME' }).click();
        expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot({
          name: '${dataTestId}-changed.yaml',
        });
    });
    `;
}

let output = '';

for (const measurementInput of MEASUREMENT_INPUTS) {
  output += generateMeasurementInputChangeTest(measurementInput);
}
for (const selectInput of SELECT_INPUTS) {
  output += generateSelectInputChangeTest(selectInput);
}
for (const numberInput of NUMBER_INPUTS) {
  output += generateNumberInputChangeTest(numberInput);
}
for (const measurementOutput of MEASUREMENT_OUTPUTS) {
  output += generateMeasurementOutputChangeTest(measurementOutput);
}

console.log(output);

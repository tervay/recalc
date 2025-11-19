const MEASUREMENT_INPUTS: string[] = ['desiredCenter', 'extraCenter'];
const NUMBER_INPUTS: string[] = ['p1Teeth', 'p2Teeth'];
const SELECT_INPUTS: string[] = ['chain'];

const MEASUREMENT_OUTPUTS: string[] = [
  'p1PitchDiameter',
  'p2PitchDiameter',
  'smallerDistance',
  'largerDistance',
];

function generateMeasurementInputChangeTest(dataTestId: string): string {
  return `
    test.skip('should match snapshot with ${dataTestId} magnitude changed', async ({ page }) => {
        await page.getByTestId('${dataTestId}').fill('FIXME');
        expect(await page.getByRole('main').ariaSnapshot()).toMatchSnapshot({
          name: '${dataTestId}-magnitude-changed.yaml',
        });
    });

    test.skip('should match snapshot with ${dataTestId} unit changed', async ({ page }) => {
        await page.getByTestId('select${dataTestId}').click();
        await page.getByRole('option', { name: 'FIXME' }).click();
        expect(await page.getByRole('main').ariaSnapshot()).toMatchSnapshot({
          name: '${dataTestId}-unit-changed.yaml',
        });
    });
    `;
}

function generateNumberInputChangeTest(dataTestId: string): string {
  return `
    test.skip('should match snapshot with ${dataTestId} changed', async ({ page }) => {
        await page.getByTestId('${dataTestId}').fill('FIXME');
        expect(await page.getByRole('main').ariaSnapshot()).toMatchSnapshot({
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
        expect(await page.getByRole('main').ariaSnapshot()).toMatchSnapshot({
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
        expect(await page.getByRole('main').ariaSnapshot()).toMatchSnapshot({
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

// Ratio calculator
const CHART_DELAY_MS = 1250;
const MEASUREMENT_INPUTS: string[] = [];
const NUMBER_INPUTS: string[] = ['driving0', 'driven0', 'driving1', 'driven1'];
const SELECT_INPUTS: string[] = [];
const BOOLEAN_INPUTS: string[] = [];

const MEASUREMENT_OUTPUTS: string[] = [];

function generateMeasurementInputChangeTest(dataTestId: string): string {
  return `
    test.skip('should match snapshot with ${dataTestId} magnitude changed', async ({ page }) => {
        await page.getByTestId('${dataTestId}').fill('FIXME');
        await page.waitForTimeout(CHART_DELAY_MS);
        expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot({
          name: '${dataTestId}-magnitude-changed.yaml',
        });
    });

    test.skip('should match snapshot with ${dataTestId} unit changed', async ({ page }) => {
        await page.getByTestId('select${dataTestId}').click();
        await page.getByRole('option', { name: 'FIXME' }).click();
        await page.waitForTimeout(CHART_DELAY_MS);
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
        await page.waitForTimeout(CHART_DELAY_MS);
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
        await page.waitForTimeout(CHART_DELAY_MS);
        expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot({
          name: '${dataTestId}-unit-changed.yaml',
        });
    });
    `;
}

function generateBooleanInputChangeTest(dataTestId: string): string {
  return `
    test.skip('should match snapshot with ${dataTestId} toggled', async ({ page }) => {
        await page.getByTestId('${dataTestId}').click();
        await page.waitForTimeout(CHART_DELAY_MS);
        expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot({
          name: '${dataTestId}-toggled.yaml',
        });
    });
    `;
}

function generateMeasurementOutputChangeTest(dataTestId: string): string {
  return `
    test.skip('should match snapshot with ${dataTestId} unit changed', async ({ page }) => {
        await page.getByTestId('select${dataTestId}').click();
        await page.getByRole('option', { name: 'FIXME' }).click();
        await page.waitForTimeout(CHART_DELAY_MS);
        expect(await page.getByTestId('entrypoint').ariaSnapshot()).toMatchSnapshot({
          name: '${dataTestId}-changed.yaml',
        });
    });
    `;
}

let output = `const CHART_DELAY_MS = ${CHART_DELAY_MS};\n\n`;

for (const measurementInput of MEASUREMENT_INPUTS) {
  output += generateMeasurementInputChangeTest(measurementInput);
}
for (const selectInput of SELECT_INPUTS) {
  output += generateSelectInputChangeTest(selectInput);
}
for (const numberInput of NUMBER_INPUTS) {
  output += generateNumberInputChangeTest(numberInput);
}
for (const booleanInput of BOOLEAN_INPUTS) {
  output += generateBooleanInputChangeTest(booleanInput);
}
for (const measurementOutput of MEASUREMENT_OUTPUTS) {
  output += generateMeasurementOutputChangeTest(measurementOutput);
}

console.log(output);

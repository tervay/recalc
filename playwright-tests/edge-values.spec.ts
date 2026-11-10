import { type Page, expect, test } from '@playwright/test';

type Field =
  | { kind: 'measurement'; param: string; unit: string }
  | { kind: 'number'; param: string };

type Route = { path: string; renderedTestId: string; fields: Field[] };

const m = (param: string, unit: string): Field => ({
  kind: 'measurement',
  param,
  unit,
});
const n = (param: string): Field => ({ kind: 'number', param });

const ROUTES: Route[] = [
  {
    path: '/belts',
    renderedTestId: 'desiredCenter',
    fields: [
      m('desiredCenter', 'in'),
      m('extraCenter', 'in'),
      m('pitch', 'mm'),
      n('p1Teeth'),
      n('toothIncrement'),
    ],
  },
  {
    path: '/chains',
    renderedTestId: 'desiredCenter',
    fields: [m('desiredCenter', 'in'), m('pitch', 'in'), n('p1Teeth')],
  },
  {
    path: '/gears',
    renderedTestId: 'gearDP',
    fields: [n('gearDP'), n('gear1Teeth')],
  },
  {
    path: '/intake',
    renderedTestId: 'rollerDiameter',
    fields: [
      m('rollerDiameter', 'in'),
      m('drivetrainSpeed', 'ft/s'),
      m('statorCurrentLimit', 'A'),
      m('travelDistance', 'in'),
    ],
  },
  {
    path: '/flywheel',
    renderedTestId: 'flywheel-main',
    fields: [
      m('shooterTargetSpeed', 'rpm'),
      m('shooterDiameter', 'in'),
      m('statorLimit', 'A'),
      m('batteryResistance', 'Ohm'),
      n('efficiency'),
    ],
  },
  {
    path: '/arm',
    renderedTestId: 'arm-main',
    fields: [
      m('armLength', 'in'),
      m('load', 'lb'),
      m('maxAngle', 'deg'),
      m('statorLimit', 'A'),
      n('efficiency'),
    ],
  },
  {
    path: '/linear',
    renderedTestId: 'linear-main',
    fields: [
      m('travelDistance', 'in'),
      m('spoolDiameter', 'in'),
      m('load', 'lb'),
      m('statorLimit', 'A'),
      n('efficiency'),
    ],
  },
  {
    path: '/motors',
    renderedTestId: 'motor',
    fields: [m('statorLimit', 'A'), m('statorVoltage', 'V')],
  },
];

const EDGE_VALUES = [0, -5, 1e6];

function urlFor(path: string, field: Field, value: number): string {
  const encoded =
    field.kind === 'measurement'
      ? encodeURIComponent(JSON.stringify({ s: value, u: field.unit }))
      : String(value);
  return `${path}?${field.param}=${encoded}`;
}

async function waitForCalculations(page: Page): Promise<void> {
  await expect(page.locator('[data-calculating="true"]')).toHaveCount(0, {
    timeout: 30_000,
  });
}

for (const route of ROUTES) {
  test.describe(`${route.path} edge values`, () => {
    for (const field of route.fields) {
      for (const value of EDGE_VALUES) {
        test(`${field.param} = ${value} renders without NaN or Infinity`, async ({
          page,
        }) => {
          await page.goto(urlFor(route.path, field, value));
          await page.waitForLoadState('networkidle');
          await waitForCalculations(page);

          await expect(page.getByTestId(route.renderedTestId)).toBeVisible();
          const text = await page.getByTestId('entrypoint').innerText();
          expect(text).not.toMatch(/NaN|Infinity/);
        });
      }
    }
  });
}

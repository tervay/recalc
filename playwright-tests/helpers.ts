import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

import { test as base, type Page, type Route } from '@playwright/test';
import * as z from 'zod';

import { REV_FEED_URL } from '~/lib/stock';

export { expect } from '@playwright/test';

export const STOREFRONT_API = '**/api/*/graphql.json';

export const IN_STOCK = { availableForSale: true, currentlyNotInStock: false };
export const BACKORDER = { availableForSale: true, currentlyNotInStock: true };
export const OUT_OF_STOCK = {
  availableForSale: false,
  currentlyNotInStock: false,
};

const zStockRequestSchema = z.object({
  variables: z.object({ ids: z.array(z.string()) }),
});

export async function fulfillStock(
  route: Route,
  node: typeof IN_STOCK | null,
): Promise<void> {
  const { ids } = zStockRequestSchema.parse(
    route.request().postDataJSON(),
  ).variables;
  await route.fulfill({ json: { data: { nodes: ids.map(() => node) } } });
}

const REV_DATA_DIR = 'app/genData/REV';
const zSkusSchema = z.array(z.object({ sku: z.string().nullable() }));
const REV_SKUS = readdirSync(REV_DATA_DIR).flatMap((file) =>
  zSkusSchema
    .parse(JSON.parse(readFileSync(join(REV_DATA_DIR, file), 'utf-8')))
    .flatMap(({ sku }) => (sku === null ? [] : [sku])),
);

export async function fulfillRevFeed(
  route: Route,
  availability: string,
): Promise<void> {
  await route.fulfill({
    json: REV_SKUS.map((sku) => ({ sku, availability_status: availability })),
  });
}

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.route(STOREFRONT_API, (route) => fulfillStock(route, IN_STOCK));
    await page.route(REV_FEED_URL, (route) =>
      fulfillRevFeed(route, 'Available'),
    );
    await use(page);
  },
});

/**
 * Waits for a Recharts chart inside the given container to finish settling
 * its layout before an aria snapshot is captured.
 *
 * Recharts renders its chart inside a `ResponsiveContainer`, which measures
 * its width asynchronously via `ResizeObserver` after mount. The X axis has
 * no explicit `type="number"`/`ticks`, so Recharts treats it as a category
 * axis and renders a *width-dependent subset* of the raw data-sample
 * timestamps as ticks. If an aria snapshot is captured before the
 * `ResizeObserver` settles the width, a different tick subset can be
 * captured on different runs, producing a flaky snapshot diff even though
 * all underlying values are deterministic.
 *
 * This waits until the chart's SVG surface has a measured (non-zero) width
 * and the number of rendered X-axis ticks is stable across two consecutive
 * animation frames.
 */
export async function waitForChartSettled(page: Page, mainTestId: string) {
  await page
    .locator(`[data-testid="${mainTestId}"] .recharts-surface`)
    .first()
    .waitFor({ state: 'attached', timeout: 30000 });

  await page.waitForFunction(
    (id: string) => {
      const root = document.querySelector(`[data-testid="${id}"]`);
      const svg = root?.querySelector('.recharts-surface');
      if (!svg) return false;
      if (Number(svg.getAttribute('width') ?? '0') <= 0) return false;

      const tickCount = root?.querySelectorAll(
        '.recharts-xAxis .recharts-cartesian-axis-tick',
      ).length;
      if (tickCount === undefined || tickCount <= 0) return false;

      const w = window as unknown as { __chartTickCount?: number };
      const stable = w.__chartTickCount === tickCount;
      w.__chartTickCount = tickCount;
      return stable;
    },
    mainTestId,
    { timeout: 30000, polling: 'raf' },
  );
}

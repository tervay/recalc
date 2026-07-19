import type { Page } from '@playwright/test';

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

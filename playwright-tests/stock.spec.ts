import type { Page } from '@playwright/test';
import {
  BACKORDER,
  expect,
  fulfillRevFeed,
  fulfillStock,
  OUT_OF_STOCK,
  STOREFRONT_API,
  test,
} from 'playwright-tests/helpers';

import { REV_FEED_URL } from '~/lib/stock';

function revRow(page: Page) {
  return page
    .getByRole('row')
    .filter({ has: page.getByRole('img', { name: 'REV' }) })
    .first();
}

test.describe('COTS stock status', () => {
  test('shows parts the store has as in stock', async ({ page }) => {
    await page.goto('/chains');
    await expect(page.getByText('In stock').first()).toBeVisible();
  });

  test('shows parts the store cannot sell as out of stock', async ({
    page,
  }) => {
    await page.route(STOREFRONT_API, (route) =>
      fulfillStock(route, OUT_OF_STOCK),
    );
    await page.goto('/chains');
    await expect(page.getByText('Out of stock').first()).toBeVisible();
  });

  test('shows parts sold without inventory as backorder', async ({ page }) => {
    await page.route(STOREFRONT_API, (route) => fulfillStock(route, BACKORDER));
    await page.goto('/chains');
    await expect(page.getByText('Backorder').first()).toBeVisible();
  });

  test('shows a dash for parts the store no longer lists', async ({ page }) => {
    await page.route(STOREFRONT_API, (route) => fulfillStock(route, null));
    await page.goto('/chains');
    await expect(page.getByLabel('Stock unknown').first()).toBeVisible();
  });

  test('shows a dash when the store request fails', async ({ page }) => {
    await page.route(STOREFRONT_API, (route) => route.abort());
    await page.goto('/chains');
    await expect(page.getByLabel('Stock unknown').first()).toBeVisible();
  });

  test('shows REV parts in stock from the REV feed', async ({ page }) => {
    await page.goto('/chains');
    await expect(revRow(page).getByText('In stock')).toBeVisible();
  });

  test('shows REV parts the feed lists as out of stock', async ({ page }) => {
    await page.route(REV_FEED_URL, (route) =>
      fulfillRevFeed(route, 'Out of Stock'),
    );
    await page.goto('/chains');
    await expect(revRow(page).getByText('Out of stock')).toBeVisible();
  });

  test('shows a dash for REV parts when the feed fails', async ({ page }) => {
    await page.route(REV_FEED_URL, (route) => route.abort());
    await page.goto('/chains');
    await expect(revRow(page).getByLabel('Stock unknown')).toBeVisible();
  });

  test('makes one stock request per vendor', async ({ page }) => {
    const hosts: string[] = [];
    page.on('request', (request) => {
      const url = request.url();
      if (url.endsWith('/graphql.json') || url === REV_FEED_URL) {
        hosts.push(new URL(url).host);
      }
    });
    await page.goto('/chains');
    await page.waitForLoadState('networkidle');
    await expect(revRow(page).getByText('In stock')).toBeVisible();
    expect(hosts.length).toBe(new Set(hosts).size);
  });
});

function inStockOnly(page: Page) {
  return page.getByRole('switch', { name: 'In stock only' });
}

test.describe('In stock only toggle', () => {
  for (const { route, tables } of [
    { route: '/chains', tables: 1 },
    { route: '/gears', tables: 1 },
    { route: '/belts', tables: 2 },
    { route: '/intake', tables: 1 },
  ]) {
    test(`shows one toggle per table on ${route}`, async ({ page }) => {
      await page.goto(route);
      await expect(inStockOnly(page)).toHaveCount(tables);
    });
  }

  test('starts off', async ({ page }) => {
    await page.goto('/chains');
    await expect(inStockOnly(page)).not.toBeChecked();
  });

  test('hides out of stock parts', async ({ page }) => {
    await page.route(STOREFRONT_API, (route) =>
      fulfillStock(route, OUT_OF_STOCK),
    );
    await page.goto('/chains');
    await expect(page.getByText('Out of stock').first()).toBeVisible();
    await inStockOnly(page).click();
    await expect(page.getByText('Out of stock')).toHaveCount(0);
  });

  test('hides backorder parts', async ({ page }) => {
    await page.route(STOREFRONT_API, (route) => fulfillStock(route, BACKORDER));
    await page.goto('/chains');
    await expect(page.getByText('Backorder').first()).toBeVisible();
    await inStockOnly(page).click();
    await expect(page.getByText('Backorder')).toHaveCount(0);
  });

  test('keeps in stock parts', async ({ page }) => {
    await page.route(STOREFRONT_API, (route) =>
      fulfillStock(route, OUT_OF_STOCK),
    );
    await page.goto('/chains');
    await expect(revRow(page).getByText('In stock')).toBeVisible();
    await inStockOnly(page).click();
    await expect(revRow(page).getByText('In stock')).toBeVisible();
  });

  test('keeps parts with unknown stock', async ({ page }) => {
    await page.route(STOREFRONT_API, (route) => route.abort());
    await page.goto('/chains');
    await expect(page.getByLabel('Stock unknown').first()).toBeVisible();
    await inStockOnly(page).click();
    await expect(page.getByLabel('Stock unknown').first()).toBeVisible();
  });

  test('shows hidden parts again when turned off', async ({ page }) => {
    await page.route(STOREFRONT_API, (route) =>
      fulfillStock(route, OUT_OF_STOCK),
    );
    await page.goto('/chains');
    await inStockOnly(page).click();
    await expect(page.getByText('Out of stock')).toHaveCount(0);
    await inStockOnly(page).click();
    await expect(page.getByText('Out of stock').first()).toBeVisible();
  });
});

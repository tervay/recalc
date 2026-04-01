import { expect, test } from '@playwright/test';

const UMAMI_SCRIPT_SELECTOR = 'script[src*="um.reca.lc"]';
const BOT_USER_AGENT =
  'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';

test.describe('Umami analytics bot filtering', () => {
  test('loads Umami script for real browsers', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator(UMAMI_SCRIPT_SELECTOR)).toHaveCount(1);
  });

  test('does not load Umami script for bots', async ({ browser }) => {
    const context = await browser.newContext({ userAgent: BOT_USER_AGENT });
    const page = await context.newPage();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Allow time for any pending useEffect callbacks to fire
    await page.waitForTimeout(500);
    await expect(page.locator(UMAMI_SCRIPT_SELECTOR)).toHaveCount(0);
    await context.close();
  });
});

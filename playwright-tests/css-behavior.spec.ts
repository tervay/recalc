import { type Page } from '@playwright/test';
import { expect, test } from 'playwright-tests/helpers';

async function freezeAnimations(page: Page) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Animation.enable');
  await cdp.send('Animation.setPlaybackRate', { playbackRate: 0 });
}

async function runningTransitionProperties(page: Page) {
  return page.evaluate(() =>
    document
      .getAnimations()
      .flatMap((animation) =>
        animation instanceof CSSTransition
          ? [animation.transitionProperty]
          : [],
      ),
  );
}

test.describe('Idle animation', () => {
  test('runs no infinite animation on the home page while idle', async ({
    page,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const infinite = await page.evaluate(
      () =>
        document
          .getAnimations()
          .filter((a) => a.effect?.getTiming().iterations === Infinity).length,
    );

    expect(infinite).toBe(0);
  });
});

test.describe('Color scheme', () => {
  test('stays light when the light theme is active on a dark OS', async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    await expect(page.locator('html')).toHaveClass(/\blight\b/);

    await expect(page.locator('html')).toHaveCSS('color-scheme', 'light');
  });

  test('turns dark when the dark theme is stored on a light OS', async ({
    page,
  }) => {
    await page.addInitScript(() =>
      localStorage.setItem('vite-ui-theme', 'dark'),
    );
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await expect(page.locator('html')).toHaveClass(/\bdark\b/);

    await expect(page.locator('html')).toHaveCSS('color-scheme', 'dark');
  });
});

test.describe('Focus in forced colors mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await page.goto('/flywheel');
    await page.waitForLoadState('networkidle');
  });

  test('keeps an outline on a focused button', async ({ page }) => {
    const button = page.getByRole('button', { name: 'Copy Link' });
    await button.focus();

    await expect(button).toHaveCSS('outline-style', 'solid');
  });

  test('keeps an outline on a focused input', async ({ page }) => {
    const input = page.getByRole('spinbutton', {
      name: 'Stator Limit',
      exact: true,
    });
    await input.focus();

    await expect(input).toHaveCSS('outline-style', 'solid');
  });
});

test.describe('Card lift motion', () => {
  const card = (page: Page) =>
    page
      .getByTestId('entrypoint')
      .getByRole('link', { name: 'Belt Calculator' })
      .locator('div')
      .first();

  test('animates the lift when motion is allowed', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await freezeAnimations(page);

    await card(page).hover();

    expect(await runningTransitionProperties(page)).toContain('translate');
  });

  test('does not animate the lift under reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await freezeAnimations(page);

    await card(page).hover();

    expect(await runningTransitionProperties(page)).not.toContain('translate');
  });
});

import { expect, test } from '@playwright/test';

/**
 * The inputs in `app/components/recalc/io` each render a `<Label>` paired with
 * an `<Input>`. Because a `<label for>` resolves to the *first* element in the
 * document carrying that id, every one of those labels must point at a unique
 * id — otherwise all of them collapse onto a single control, which then gets
 * announced with a run-on concatenation of every label on the page while the
 * remaining inputs are announced as anonymous spinbuttons.
 *
 * These assertions pin the association itself rather than the rendered aria
 * tree, so a future regression cannot be silently re-blessed by regenerating
 * the aria snapshots.
 */
test.describe('Input label association', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/flywheel');
    await page.waitForLoadState('networkidle');
  });

  test('labels a MeasurementInput with exactly its own text', async ({
    page,
  }) => {
    await expect(
      page.getByRole('spinbutton', { name: 'Stator Limit', exact: true }),
    ).toHaveCount(1);
  });

  test('labels a disabled MeasurementOutput with exactly its own text', async ({
    page,
  }) => {
    await expect(
      page.getByRole('spinbutton', { name: 'Max Achievable RPM', exact: true }),
    ).toHaveCount(1);
  });

  test('labels a NumberInput with exactly its own text', async ({ page }) => {
    await expect(
      page.getByRole('spinbutton', { name: 'Efficiency (%)', exact: true }),
    ).toHaveCount(1);
  });

  test('labels a RatioInput with exactly its own text', async ({ page }) => {
    await expect(
      page.getByRole('spinbutton', { name: 'Ratio', exact: true }),
    ).toHaveCount(1);
  });

  test('labels a MotorInput with exactly its own text', async ({ page }) => {
    await expect(
      page.getByRole('spinbutton', { name: 'Motor', exact: true }),
    ).toHaveCount(1);
  });

  test('does not concatenate multiple labels onto one spinbutton', async ({
    page,
  }) => {
    await expect(
      page.getByRole('spinbutton', { name: 'Stator Limit Supply Limit' }),
    ).toHaveCount(0);
  });

  test('renders no duplicate element ids', async ({ page }) => {
    const duplicates = await page.evaluate(() => {
      const counts = new Map<string, number>();
      for (const el of document.querySelectorAll('[id]')) {
        counts.set(el.id, (counts.get(el.id) ?? 0) + 1);
      }
      return [...counts.entries()]
        .filter(([, count]) => count > 1)
        .map(([id, count]) => `${id} (${count})`);
    });

    expect(duplicates).toEqual([]);
  });
});

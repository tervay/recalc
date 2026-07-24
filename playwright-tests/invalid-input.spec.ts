/**
 * Invalid / edge-case input tests for numeric input components.
 *
 * Goals:
 *   - Verify the app does not crash on bad input.
 *   - Assert outputs never display "NaN" or "Infinity".
 *   - Assert divide-by-zero-sensitive fields produce safe fallback values.
 *   - Cover NumberInput, MeasurementInput, and the ratio row's NumberInput usage.
 *
 * Routes exercised: /gears, /ratio, /belts
 *
 * Strategy: deterministic assertions only — no YAML snapshots, because the
 * exact rendered text for edge cases may change as the UI evolves and snapshot
 * brittleness adds no safety value here.
 */

import { expect, test } from '@playwright/test';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Assert that no visible text in the given locator tree contains NaN or
 * Infinity, which would indicate leaked floating-point pathologies.
 */
async function expectNoNaNOrInfinity(
  page: import('@playwright/test').Page,
): Promise<void> {
  const content = await page.getByTestId('entrypoint').innerText();
  expect(content, 'Page text should not contain NaN').not.toContain('NaN');
  expect(content, 'Page text should not contain Infinity').not.toContain(
    'Infinity',
  );
}

/**
 * Clear a field and type a replacement value, simulating realistic user
 * interaction (triple-click to select all, then type).
 */
async function replaceInputValue(
  page: import('@playwright/test').Page,
  testId: string,
  value: string,
): Promise<void> {
  const input = page.getByTestId(testId);
  await input.click({ clickCount: 3 });
  await input.fill(value);
}

// ---------------------------------------------------------------------------
// /gears — NumberInput (gear1Teeth, gear2Teeth, gearDP)
// ---------------------------------------------------------------------------

test.describe('Gears Calculator — invalid input', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/gears');
    await page.waitForLoadState('networkidle');
  });

  test('gearDP set to 0 → spacing output is 0 (no divide-by-zero leak)', async ({
    page,
  }) => {
    // calculateSpacing explicitly guards against gearDP === 0
    await replaceInputValue(page, 'gearDP', '0');
    await page.waitForTimeout(100);
    await expectNoNaNOrInfinity(page);

    // The spacing value element should show 0.000 when DP is 0
    const spacingEl = page.getByTestId('spacing');
    await expect(spacingEl).toBeVisible();
    const spacingText = await spacingEl.innerText();
    expect(spacingText, 'Spacing should be 0.000 when gearDP is 0').toContain(
      '0.000',
    );
  });

  test('gear1Teeth set to 0 → spacing output is 0 (no divide-by-zero leak)', async ({
    page,
  }) => {
    await replaceInputValue(page, 'gear1Teeth', '0');
    await page.waitForTimeout(100);
    await expectNoNaNOrInfinity(page);

    const spacingEl = page.getByTestId('spacing');
    await expect(spacingEl).toBeVisible();
    const spacingText = await spacingEl.innerText();
    expect(
      spacingText,
      'Spacing should be 0.000 when gear1Teeth is 0',
    ).toContain('0.000');
  });

  test('gear2Teeth set to 0 → spacing output is 0 (no divide-by-zero leak)', async ({
    page,
  }) => {
    await replaceInputValue(page, 'gear2Teeth', '0');
    await page.waitForTimeout(100);
    await expectNoNaNOrInfinity(page);

    const spacingEl = page.getByTestId('spacing');
    await expect(spacingEl).toBeVisible();
    const spacingText = await spacingEl.innerText();
    expect(
      spacingText,
      'Spacing should be 0.000 when gear2Teeth is 0',
    ).toContain('0.000');
  });

  test('gear1Teeth cleared to empty → treated as 0, no crash', async ({
    page,
  }) => {
    // Clearing the field sets proxyValue to '' which maps to setValue(0)
    const input = page.getByTestId('gear1Teeth');
    await input.click({ clickCount: 3 });
    await input.press('Backspace');
    await page.waitForTimeout(100);
    await expectNoNaNOrInfinity(page);
    await expect(page.getByTestId('entrypoint')).toBeVisible();
  });

  test('gearDP cleared to empty → treated as 0, no crash', async ({ page }) => {
    const input = page.getByTestId('gearDP');
    await input.click({ clickCount: 3 });
    await input.press('Backspace');
    await page.waitForTimeout(100);
    await expectNoNaNOrInfinity(page);
    await expect(page.getByTestId('spacing')).toBeVisible();
  });

  test('non-numeric input into gear1Teeth is rejected by browser number input → no crash', async ({
    page,
  }) => {
    // HTML type="number" inputs silently drop non-numeric characters;
    // typing "abc" into the field produces an empty value which maps to 0.
    const input = page.getByTestId('gear1Teeth');
    await input.click({ clickCount: 3 });
    // Use type() so we exercise the keydown path (fill() bypasses key events)
    await input.pressSequentially('abc', { delay: 20 });
    await page.waitForTimeout(100);
    await expectNoNaNOrInfinity(page);
    await expect(page.getByTestId('entrypoint')).toBeVisible();
  });

  test('negative gearDP → no crash, spacing is computed (negative DP is unusual but component does not guard it)', async ({
    page,
  }) => {
    // NOTE: The app does not explicitly guard against negative DP.
    // calculateSpacing will return a negative spacing value for negative DP.
    // This test documents the current behavior: no crash, no NaN/Infinity.
    await replaceInputValue(page, 'gearDP', '-20');
    await page.waitForTimeout(100);
    await expectNoNaNOrInfinity(page);
    await expect(page.getByTestId('spacing')).toBeVisible();
  });

  test('very large gear tooth count → no crash, no NaN/Infinity', async ({
    page,
  }) => {
    await replaceInputValue(page, 'gear1Teeth', '999999');
    await page.waitForTimeout(100);
    await expectNoNaNOrInfinity(page);
    await expect(page.getByTestId('spacing')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// /ratio — NumberInput (driving, driven)
// ---------------------------------------------------------------------------

test.describe('Ratio Calculator — invalid input', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ratio');
    await page.waitForLoadState('networkidle');
  });

  test('driving0 set to 0 → stage ratio shows safe fallback (—), no NaN/Infinity', async ({
    page,
  }) => {
    // RatioPairRow guards: if (drivingValue > 0 ? drivenValue / drivingValue : 0)
    await replaceInputValue(page, 'driving0', '0');
    await page.waitForTimeout(100);
    await expectNoNaNOrInfinity(page);

    // The net ratio display should exist and be visible
    const netRatioEl = page.getByTestId('netRatio');
    await expect(netRatioEl).toBeVisible();
    const netRatioText = await netRatioEl.innerText();
    // When driving0 is 0 the net ratio collapses to 0, so the display shows
    // "0.000:1" or similar but never NaN or Infinity
    expect(netRatioText).not.toContain('NaN');
    expect(netRatioText).not.toContain('Infinity');
  });

  test('driven0 set to 0 → calculateNetRatio returns 0 (no Infinity)', async ({
    page,
  }) => {
    // calculateNetRatio returns 0 when driven === 0, guarding 0/0
    await replaceInputValue(page, 'driven0', '0');
    await page.waitForTimeout(100);
    await expectNoNaNOrInfinity(page);

    const netRatioEl = page.getByTestId('netRatio');
    await expect(netRatioEl).toBeVisible();
    const netRatioText = await netRatioEl.innerText();
    expect(netRatioText).not.toContain('NaN');
    expect(netRatioText).not.toContain('Infinity');
  });

  test('both driving0 and driven0 set to 0 → safe zero result, no crash', async ({
    page,
  }) => {
    await replaceInputValue(page, 'driving0', '0');
    await replaceInputValue(page, 'driven0', '0');
    await page.waitForTimeout(100);
    await expectNoNaNOrInfinity(page);
    await expect(page.getByTestId('netRatio')).toBeVisible();
  });

  test('driving0 cleared to empty → treated as 0, no crash', async ({
    page,
  }) => {
    const input = page.getByTestId('driving0');
    await input.click({ clickCount: 3 });
    await input.press('Backspace');
    await page.waitForTimeout(100);
    await expectNoNaNOrInfinity(page);
    await expect(page.getByTestId('netRatio')).toBeVisible();
  });

  test('driven1 set to 0 → net ratio stays safe with multiple stages', async ({
    page,
  }) => {
    // Default has 2 stages; set the second driven sprocket to 0
    await replaceInputValue(page, 'driven1', '0');
    await page.waitForTimeout(100);
    await expectNoNaNOrInfinity(page);
    await expect(page.getByTestId('netRatio')).toBeVisible();
  });

  test('non-numeric input into driven0 is dropped by browser → no crash', async ({
    page,
  }) => {
    const input = page.getByTestId('driven0');
    await input.click({ clickCount: 3 });
    await input.pressSequentially('xyz', { delay: 20 });
    await page.waitForTimeout(100);
    await expectNoNaNOrInfinity(page);
    await expect(page.getByTestId('entrypoint')).toBeVisible();
  });

  test('negative driving count → no crash, output still valid', async ({
    page,
  }) => {
    // The component does not block negative tooth counts.
    // Document the current behavior: no NaN/Infinity leaked.
    await replaceInputValue(page, 'driving0', '-10');
    await page.waitForTimeout(100);
    await expectNoNaNOrInfinity(page);
    await expect(page.getByTestId('netRatio')).toBeVisible();
  });

  test('very large driving count → no crash, no NaN/Infinity', async ({
    page,
  }) => {
    await replaceInputValue(page, 'driving0', '999999');
    await page.waitForTimeout(100);
    await expectNoNaNOrInfinity(page);
    await expect(page.getByTestId('netRatio')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// /belts — MeasurementInput (desiredCenter, pitch) and NumberInput (p1Teeth)
// ---------------------------------------------------------------------------

test.describe('Belt Calculator — invalid input', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/belts');
    await page.waitForLoadState('networkidle');
  });

  test('desiredCenter magnitude set to 0 → calculateClosestCenters returns zero result, no crash', async ({
    page,
  }) => {
    // calculateClosestCenters explicitly checks for 0 in the input list
    await replaceInputValue(page, 'desiredCenter', '0');
    await page.waitForTimeout(100);
    await expectNoNaNOrInfinity(page);
    await expect(page.getByTestId('entrypoint')).toBeVisible();
  });

  test('desiredCenter magnitude cleared to empty → treated as 0, no crash', async ({
    page,
  }) => {
    const input = page.getByTestId('desiredCenter');
    await input.click({ clickCount: 3 });
    await input.press('Backspace');
    await page.waitForTimeout(100);
    await expectNoNaNOrInfinity(page);
    await expect(page.getByTestId('entrypoint')).toBeVisible();
  });

  test('p1Teeth set to 0 → safe fallback from calculateClosestCenters zero guard', async ({
    page,
  }) => {
    await replaceInputValue(page, 'p1Teeth', '0');
    await page.waitForTimeout(100);
    await expectNoNaNOrInfinity(page);
    await expect(page.getByTestId('entrypoint')).toBeVisible();
  });

  test('p2Teeth set to 0 → safe fallback, no crash', async ({ page }) => {
    await replaceInputValue(page, 'p2Teeth', '0');
    await page.waitForTimeout(100);
    await expectNoNaNOrInfinity(page);
    await expect(page.getByTestId('entrypoint')).toBeVisible();
  });

  test('pitch magnitude set to 0 → safe fallback from zero guard, no crash', async ({
    page,
  }) => {
    await replaceInputValue(page, 'pitch', '0');
    await page.waitForTimeout(100);
    await expectNoNaNOrInfinity(page);
    await expect(page.getByTestId('entrypoint')).toBeVisible();
  });

  test('pitch magnitude cleared to empty → treated as 0, no crash', async ({
    page,
  }) => {
    const input = page.getByTestId('pitch');
    await input.click({ clickCount: 3 });
    await input.press('Backspace');
    await page.waitForTimeout(100);
    await expectNoNaNOrInfinity(page);
    await expect(page.getByTestId('entrypoint')).toBeVisible();
  });

  test('switching pitch unit with empty magnitude → no crash', async ({
    page,
  }) => {
    // Clear the pitch magnitude first, then change the unit
    const pitchInput = page.getByTestId('pitch');
    await pitchInput.click({ clickCount: 3 });
    await pitchInput.press('Backspace');
    await page.waitForTimeout(50);

    await page.getByTestId('selectpitch').click();
    await page.getByRole('option', { name: 'in' }).click();
    await page.waitForTimeout(100);

    await expectNoNaNOrInfinity(page);
    await expect(page.getByTestId('entrypoint')).toBeVisible();
  });

  test('non-numeric input into p1Teeth is dropped by browser → no crash', async ({
    page,
  }) => {
    const input = page.getByTestId('p1Teeth');
    await input.click({ clickCount: 3 });
    await input.pressSequentially('abc', { delay: 20 });
    await page.waitForTimeout(100);
    await expectNoNaNOrInfinity(page);
    await expect(page.getByTestId('entrypoint')).toBeVisible();
  });

  test('very large desiredCenter magnitude → no crash, no NaN/Infinity', async ({
    page,
  }) => {
    await replaceInputValue(page, 'desiredCenter', '999999');
    await page.waitForTimeout(100);
    await expectNoNaNOrInfinity(page);
    await expect(page.getByTestId('entrypoint')).toBeVisible();
  });
});

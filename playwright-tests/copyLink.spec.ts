import { expect, test } from '@playwright/test';

async function setupTrackCapture(page: import('@playwright/test').Page) {
  const calls: Array<{ event: string; data: unknown }> = [];

  await page.exposeFunction(
    '__captureTrack',
    (event: string, data: unknown) => {
      calls.push({ event, data });
    },
  );

  await page.addInitScript(() => {
    window.umami = {
      track: (
        event: string,
        data?: Record<string, string | number | boolean>,
      ) => {
        (
          window as unknown as {
            __captureTrack: (e: string, d: unknown) => void;
          }
        ).__captureTrack(event, data);
      },
    };
  });

  return calls;
}

test.describe('copy-link tracking', () => {
  test('includes motor name when copying link on a motor calculator', async ({
    page,
  }) => {
    const calls = await setupTrackCapture(page);

    const motorParam = JSON.stringify({
      name: 'Kraken X60 (FOC)',
      quantity: 1,
    });
    await page.goto(`/arm?motor=${encodeURIComponent(motorParam)}`);
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Copy Link' }).click();

    await expect
      .poll(() => calls.find((c) => c.event === 'copy-link'))
      .toMatchObject({
        event: 'copy-link',
        data: { calculator: 'Arm Calculator', motor: 'Kraken X60 (FOC)' },
      });
  });

  test('does not include motor when copying link on a non-motor calculator', async ({
    page,
  }) => {
    const calls = await setupTrackCapture(page);

    await page.goto('/gears');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Copy Link' }).click();

    await expect
      .poll(() => calls.find((c) => c.event === 'copy-link'))
      .toMatchObject({
        event: 'copy-link',
        data: { calculator: 'Gears Calculator' },
      });

    const copyLinkCall = calls.find((c) => c.event === 'copy-link');
    expect(copyLinkCall?.data).not.toHaveProperty('motor');
  });
});

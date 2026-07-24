/**
 * Regenerates public/og-image.png, the Open Graph / Twitter card image used
 * site-wide (see app/lib/seo.ts's OG_IMAGE constant).
 *
 * This is a build-time asset generator, not part of the app bundle: it
 * renders a small branded HTML card with Playwright's headless Chromium and
 * screenshots it to a static PNG. Re-run with `tsx scripts/generateOgImage.ts`
 * whenever the branding changes.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.resolve(__dirname, '../public/og-image.png');
const LOGO_PATH = path.resolve(__dirname, '../public/logo/motor.svg');

const WIDTH = 1200;
const HEIGHT = 630;

// Matches app/app.css dark theme tokens so the card reads as part of ReCalc.
const BACKGROUND = '#050607';
const FOREGROUND = '#edeff0';
const PRIMARY = '#006eb6';
const MUTED_FOREGROUND = '#a8adb1';

function buildHtml(logoMarkup: string): string {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body {
        width: ${WIDTH}px;
        height: ${HEIGHT}px;
        background: ${BACKGROUND};
        font-family: -apple-system, "Segoe UI", Roboto, sans-serif;
        overflow: hidden;
      }
      .card {
        position: relative;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 28px;
      }
      .glow {
        position: absolute;
        inset: -20% -10% auto -10%;
        height: 480px;
        background: radial-gradient(ellipse 60% 55% at 50% 0%, rgb(0 110 182 / 0.28), transparent);
      }
      .dots {
        position: absolute;
        inset: 0;
        opacity: 0.06;
        background-image: radial-gradient(circle, ${FOREGROUND} 1.5px, transparent 1.5px);
        background-size: 30px 30px;
      }
      .logo {
        position: relative;
        width: 96px;
        height: 96px;
        color: ${PRIMARY};
      }
      .logo svg { width: 100%; height: 100%; }
      .wordmark {
        position: relative;
        font-size: 96px;
        font-weight: 700;
        letter-spacing: -0.03em;
        color: ${FOREGROUND};
      }
      .tagline {
        position: relative;
        font-size: 32px;
        font-weight: 500;
        color: ${MUTED_FOREGROUND};
        text-align: center;
      }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="dots"></div>
      <div class="glow"></div>
      <div class="logo">${logoMarkup}</div>
      <div class="wordmark">ReCalc</div>
      <div class="tagline">FRC &amp; FTC Robotics Design Calculator &amp; Simulator</div>
    </div>
  </body>
</html>`;
}

async function main() {
  const logoMarkup = readFileSync(LOGO_PATH, 'utf-8');
  const html = buildHtml(logoMarkup);

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({
      viewport: { width: WIDTH, height: HEIGHT },
    });
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.screenshot({ path: OUTPUT_PATH });
  } finally {
    await browser.close();
  }

  console.log(`Wrote ${path.relative(process.cwd(), OUTPUT_PATH)}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

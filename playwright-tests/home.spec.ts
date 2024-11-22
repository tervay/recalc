import { expect, test } from "@playwright/test";

test.describe("Home page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("localhost:3000");
  });

  [
    ["Belt Calculator", "/belts"],
    ["Chain Calculator", "/chains"],
    ["Pneumatics Calculator", "/pneumatics"],
    ["Flywheel Calculator", "/flywheel"],
    ["Arm Calculator", "/arm"],
    ["Linear Mechanism Calculator", "/linear"],
    ["Intake Calculator", "/intake"],
  ].forEach(([title, url]) => {
    test(`Links to ${title}`, async ({ page }) => {
      await page.click(`text=${title}`);
      expect(page.url()).toContain(url);
    });

    test(`${title} has a navbar that links home`, async ({ page }) => {
      await page.click(`text=${title}`);
      expect(page.url()).toContain(url);
    });
  });

  [
    ["Motor Playground", "/motors"],
    ["Compressor Playground", "/compressors"],
    ["About ReCalc", "/about"],
  ].forEach(([title, url]) => {
    test(`Links to ${title}`, async ({ page }) => {
      await page.click(`text=${title}`);
      expect(page.url()).toContain(url);
    });
  });
});

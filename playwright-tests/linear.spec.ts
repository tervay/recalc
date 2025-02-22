import { expect, test } from "@playwright/test";

test.describe("Linear Calculator", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("localhost:3000/linear");
  });

  test("Default page", async ({ page }) => {
    await expect(page.getByTestId("motor")).toHaveValue("2");
    await expect(page.getByTestId("selectmotor")).toHaveValue(
      "Kraken X60 (FOC)*",
    );
    await expect(page.getByTestId("efficiency")).toHaveValue("100");
    await expect(page.getByTestId("ratio")).toHaveValue("2");
    await expect(page.getByTestId("selectratio")).toHaveValue("Reduction");
    await expect(page.getByTestId("travelDistance")).toHaveValue("60");
    await expect(page.getByTestId("selecttravelDistance")).toHaveValue("in");
    await expect(page.getByTestId("spoolDiameter")).toHaveValue("1");
    await expect(page.getByTestId("selectspoolDiameter")).toHaveValue("in");
    await expect(page.getByTestId("load")).toHaveValue("15");
    await expect(page.getByTestId("selectload")).toHaveValue("lbs");
    await expect(page.getByTestId("currentLimit")).toHaveValue("40");
    await expect(page.getByTestId("selectcurrentLimit")).toHaveValue("A");
    await expect(page.getByTestId("angle")).toHaveValue("90");
    await expect(page.getByTestId("selectangle")).toHaveValue("deg");
    await expect(page.getByTestId("timeToGoal")).toHaveValue("0.38");
    await expect(page.getByTestId("selecttimeToGoal")).toHaveValue("s");
    await expect(page.getByTestId("maxVelocity")).toHaveValue("311.58");
    await expect(page.getByTestId("selectmaxVelocity")).toHaveValue("in/s");
    await expect(page.getByTestId("stallLoad")).toHaveValue("52.87");
    await expect(page.getByTestId("selectstallLoad")).toHaveValue("lbs");
    await expect(page.getByTestId("kG")).toHaveValue("0.27");
    await expect(page.getByTestId("selectkG")).toHaveValue("V");
    await expect(page.getByTestId("estimatedKV")).toHaveValue("3.11");
    await expect(page.getByTestId("selectestimatedKV")).toHaveValue("V*s/m");
    await expect(page.getByTestId("estimatedKA")).toHaveValue("0.03");
    await expect(page.getByTestId("selectestimatedKA")).toHaveValue("V*s^2/m");
    await expect(page.getByTestId("responseTime")).toHaveValue("0.01");
    await expect(page.getByTestId("selectresponseTime")).toHaveValue("s");
  });

  test("NEO", async ({ page }) => {
    await page.getByTestId("selectmotor").selectOption("NEO");
    await expect(page.getByTestId("timeToGoal")).toHaveValue("0.40");
    await expect(page.getByTestId("selecttimeToGoal")).toHaveValue("s");
    await expect(page.getByTestId("maxVelocity")).toHaveValue("297.79");
    await expect(page.getByTestId("selectmaxVelocity")).toHaveValue("in/s");
    await expect(page.getByTestId("stallLoad")).toHaveValue("49.64");
    await expect(page.getByTestId("selectstallLoad")).toHaveValue("lbs");
    await expect(page.getByTestId("kG")).toHaveValue("0.78");
    await expect(page.getByTestId("selectkG")).toHaveValue("V");
    await expect(page.getByTestId("estimatedKV")).toHaveValue("3.07");
    await expect(page.getByTestId("selectestimatedKV")).toHaveValue("V*s/m");
    await expect(page.getByTestId("estimatedKA")).toHaveValue("0.08");
    await expect(page.getByTestId("selectestimatedKA")).toHaveValue("V*s^2/m");
    await expect(page.getByTestId("responseTime")).toHaveValue("0.03");
    await expect(page.getByTestId("selectresponseTime")).toHaveValue("s");
  });

  test("CIM", async ({ page }) => {
    await page.getByTestId("selectmotor").selectOption("CIM");
    await expect(page.getByTestId("timeToGoal")).toHaveValue("0.40");
    await expect(page.getByTestId("selecttimeToGoal")).toHaveValue("s");
    await expect(page.getByTestId("maxVelocity")).toHaveValue("295.27");
    await expect(page.getByTestId("selectmaxVelocity")).toHaveValue("in/s");
    await expect(page.getByTestId("stallLoad")).toHaveValue("48.57");
    await expect(page.getByTestId("selectstallLoad")).toHaveValue("lbs");
    await expect(page.getByTestId("kG")).toHaveValue("1.05");
    await expect(page.getByTestId("selectkG")).toHaveValue("V");
    await expect(page.getByTestId("estimatedKV")).toHaveValue("3.39");
    await expect(page.getByTestId("selectestimatedKV")).toHaveValue("V*s/m");
    await expect(page.getByTestId("estimatedKA")).toHaveValue("0.11");
    await expect(page.getByTestId("selectestimatedKA")).toHaveValue("V*s^2/m");
    await expect(page.getByTestId("responseTime")).toHaveValue("0.03");
    await expect(page.getByTestId("selectresponseTime")).toHaveValue("s");
  });

  test("Copy link button works", async ({ page, browserName }) => {
    test.skip(browserName === "webkit");

    await page.getByRole("button", { name: "Copy Link" }).click();
    const value = await page.evaluate("navigator.clipboard.readText()");
    expect(value).toEqual(
      "http://localhost:3000/linear?angle=%7B%22s%22%3A90%2C%22u%22%3A%22deg%22%7D&currentLimit=%7B%22s%22%3A40%2C%22u%22%3A%22A%22%7D&efficiency=100&limitAcceleration=0&limitDeceleration=0&limitVelocity=0&limitedAcceleration=%7B%22s%22%3A400%2C%22u%22%3A%22in%2Fs2%22%7D&limitedDeceleration=%7B%22s%22%3A50%2C%22u%22%3A%22in%2Fs2%22%7D&limitedVelocity=%7B%22s%22%3A10%2C%22u%22%3A%22in%2Fs%22%7D&load=%7B%22s%22%3A15%2C%22u%22%3A%22lbs%22%7D&motor=%7B%22quantity%22%3A2%2C%22name%22%3A%22Kraken%20X60%20%28FOC%29%2A%22%7D&ratio=%7B%22magnitude%22%3A2%2C%22ratioType%22%3A%22Reduction%22%7D&spoolDiameter=%7B%22s%22%3A1%2C%22u%22%3A%22in%22%7D&travelDistance=%7B%22s%22%3A60%2C%22u%22%3A%22in%22%7D",
    );
  });
});

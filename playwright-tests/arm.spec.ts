import { expect, test } from "@playwright/test";

test.describe("Arm Calculator", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("localhost:3000/arm");
  });

  test("Default page", async ({ page }) => {
    await expect(page.getByTestId("motor")).toHaveValue("2");
    await expect(page.getByTestId("selectmotor")).toHaveValue(
      "Kraken X60 (FOC)",
    );
    await expect(page.getByTestId("ratio")).toHaveValue("100");
    await expect(page.getByTestId("selectratio")).toHaveValue("Reduction");
    await expect(page.getByTestId("efficiency")).toHaveValue("100");
    await expect(page.getByTestId("currentLimit")).toHaveValue("40");
    await expect(page.getByTestId("selectcurrentLimit")).toHaveValue("A");
    await expect(page.getByTestId("comLength")).toHaveValue("20");
    await expect(page.getByTestId("selectcomLength")).toHaveValue("in");
    await expect(page.getByTestId("armMass")).toHaveValue("15");
    await expect(page.getByTestId("selectarmMass")).toHaveValue("lbs");
    await expect(page.getByTestId("startAngle")).toHaveValue("0");
    await expect(page.getByTestId("selectstartAngle")).toHaveValue("deg");
    await expect(page.getByTestId("endAngle")).toHaveValue("90");
    await expect(page.getByTestId("selectendAngle")).toHaveValue("deg");
    await expect(page.getByTestId("iterationLimit")).toHaveValue("10000");
    await expect(page.getByTestId("timeToGoal")).toHaveValue("0.307");
    await expect(page.getByTestId("selecttimeToGoal")).toHaveValue("s");
    await expect(page.getByTestId("kG")).toHaveValue("0.22");
    await expect(page.getByTestId("selectkG")).toHaveValue("V");
    await expect(page.getByTestId("estimatedKV")).toHaveValue("1.98");
    await expect(page.getByTestId("selectestimatedKV")).toHaveValue("V*s/rad");
    await expect(page.getByTestId("estimatedKA")).toHaveValue("0.01");
    await expect(page.getByTestId("selectestimatedKA")).toHaveValue(
      "V*s^2/rad",
    );
    await expect(page.getByTestId("responseTime")).toHaveValue("0.01");
    await expect(page.getByTestId("selectresponseTime")).toHaveValue("s");
  });

  test("NEO", async ({ page }) => {
    await page.getByTestId("selectmotor").selectOption("NEO");
    await expect(page.getByTestId("timeToGoal")).toHaveValue("0.314");
    await expect(page.getByTestId("selecttimeToGoal")).toHaveValue("s");
    await expect(page.getByTestId("kG")).toHaveValue("0.62");
    await expect(page.getByTestId("selectkG")).toHaveValue("V");
    await expect(page.getByTestId("estimatedKV")).toHaveValue("1.95");
    await expect(page.getByTestId("selectestimatedKV")).toHaveValue("V*s/rad");
    await expect(page.getByTestId("estimatedKA")).toHaveValue("0.03");
    await expect(page.getByTestId("selectestimatedKA")).toHaveValue(
      "V*s^2/rad",
    );
    await expect(page.getByTestId("responseTime")).toHaveValue("0.02");
    await expect(page.getByTestId("selectresponseTime")).toHaveValue("s");
  });

  test("CIM", async ({ page }) => {
    await page.getByTestId("selectmotor").selectOption("CIM");
    await expect(page.getByTestId("timeToGoal")).toHaveValue("0.343");
    await expect(page.getByTestId("selecttimeToGoal")).toHaveValue("s");
    await expect(page.getByTestId("kG")).toHaveValue("0.84");
    await expect(page.getByTestId("selectkG")).toHaveValue("V");
    await expect(page.getByTestId("estimatedKV")).toHaveValue("2.15");
    await expect(page.getByTestId("selectestimatedKV")).toHaveValue("V*s/rad");
    await expect(page.getByTestId("estimatedKA")).toHaveValue("0.04");
    await expect(page.getByTestId("selectestimatedKA")).toHaveValue(
      "V*s^2/rad",
    );
    await expect(page.getByTestId("responseTime")).toHaveValue("0.02");
    await expect(page.getByTestId("selectresponseTime")).toHaveValue("s");
  });

  test("Copy link button works", async ({ page, browserName }) => {
    test.skip(browserName === "webkit");

    await page.getByRole("button", { name: "Copy Link" }).click();
    const value = await page.evaluate("navigator.clipboard.readText()");
    expect(value).toEqual(
      "http://localhost:3000/arm?armMass=%7B%22s%22%3A15%2C%22u%22%3A%22lbs%22%7D&comLength=%7B%22s%22%3A20%2C%22u%22%3A%22in%22%7D&currentLimit=%7B%22s%22%3A40%2C%22u%22%3A%22A%22%7D&efficiency=100&endAngle=%7B%22s%22%3A90%2C%22u%22%3A%22deg%22%7D&iterationLimit=10000&motor=%7B%22quantity%22%3A2%2C%22name%22%3A%22Kraken%20X60%20%28FOC%29%2A%22%7D&ratio=%7B%22magnitude%22%3A100%2C%22ratioType%22%3A%22Reduction%22%7D&startAngle=%7B%22s%22%3A0%2C%22u%22%3A%22deg%22%7D",
    );
  });
});

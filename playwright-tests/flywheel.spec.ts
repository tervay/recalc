import { expect, test } from "@playwright/test";

test.describe("Flywheel Calculator", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("localhost:3000/flywheel");
  });

  test("Default page", async ({ page }) => {
    await expect(page.getByTestId("motor")).toHaveValue("2");
    await expect(page.getByTestId("selectmotor")).toHaveValue(
      "Kraken X60 (FOC)*",
    );
    await expect(page.getByTestId("efficiency")).toHaveValue("100");
    await expect(page.getByTestId("currentLimit")).toHaveValue("40");
    await expect(page.getByTestId("selectcurrentLimit")).toHaveValue("A");
    await expect(page.getByTestId("shooterRatio")).toHaveValue("2");
    await expect(page.getByTestId("selectshooterRatio")).toHaveValue("Step-up");
    await expect(page.getByTestId("shooterMaxSpeed")).toHaveValue("11600");
    await expect(page.getByTestId("selectshooterMaxSpeed")).toHaveValue("rpm");
    await expect(page.getByTestId("shooterRPM")).toHaveValue("10000");
    await expect(page.getByTestId("selectshooterRPM")).toHaveValue("rpm");
    await expect(page.getByTestId("projectileWeight")).toHaveValue("5");
    await expect(page.getByTestId("selectprojectileWeight")).toHaveValue("lbs");
    await expect(page.getByTestId("shooterRadius")).toHaveValue("3");
    await expect(page.getByTestId("selectshooterRadius")).toHaveValue("in");
    await expect(page.getByTestId("shooterWeight")).toHaveValue("1");
    await expect(page.getByTestId("selectshooterWeight")).toHaveValue("lbs");
    await expect(page.getByTestId("useCustomShooterMOI")).not.toBeChecked();
    await expect(page.getByTestId("customShooterMOI")).toHaveValue("4.500");
    await expect(page.getByTestId("selectcustomShooterMOI")).toHaveValue(
      "in^2 lbs",
    );
    await expect(page.getByTestId("flywheelRadius")).toHaveValue("2");
    await expect(page.getByTestId("selectflywheelRadius")).toHaveValue("in");
    await expect(page.getByTestId("flywheelWeight")).toHaveValue("1.5");
    await expect(page.getByTestId("selectflywheelWeight")).toHaveValue("lbs");
    await expect(page.getByTestId("flywheelShooterRatio")).toHaveValue("1");
    await expect(page.getByTestId("selectflywheelShooterRatio")).toHaveValue(
      "Reduction",
    );
    await expect(page.getByTestId("useCustomFlywheelMOI")).not.toBeChecked();
    await expect(page.getByTestId("customFlywheelMOI")).toHaveValue("3.000");
    await expect(page.getByTestId("selectcustomFlywheelMOI")).toHaveValue(
      "in^2 lbs",
    );
    await expect(page.getByTestId("windupTime")).toHaveValue("3.54");
    await expect(page.getByTestId("selectwindupTime")).toHaveValue("s");
    await expect(page.getByTestId("recoveryTime")).toHaveValue("0.5733");
    await expect(page.getByTestId("selectrecoveryTime")).toHaveValue("s");
    await expect(page.getByTestId("surfaceSpeed")).toHaveValue("261.80");
    await expect(page.getByTestId("selectsurfaceSpeed")).toHaveValue("ft/s");
    await expect(page.getByTestId("projectileSpeed")).toHaveValue("25.17");
    await expect(page.getByTestId("selectprojectileSpeed")).toHaveValue("ft/s");
    await expect(page.getByTestId("speedAfterShot")).toHaveValue("9604");
    await expect(page.getByTestId("selectspeedAfterShot")).toHaveValue("rpm");
    await expect(page.getByTestId("flywheelEnergy")).toHaveValue("1203");
    await expect(page.getByTestId("selectflywheelEnergy")).toHaveValue("J");
    await expect(page.getByTestId("projectileEnergy")).toHaveValue("93");
    await expect(page.getByTestId("selectprojectileEnergy")).toHaveValue("J");
    await expect(page.getByTestId("kV")).toHaveValue("0.13");
    await expect(page.getByTestId("selectkV")).toHaveValue("V*s/m");
    await expect(page.getByTestId("kA")).toHaveValue("2.08");
    await expect(page.getByTestId("selectkA")).toHaveValue("V*s^2/m");
    await expect(page.getByTestId("responseTime")).toHaveValue("16.06");
    await expect(page.getByTestId("selectresponseTime")).toHaveValue("s");
  });

  test('Outputs change with 4x x44s on 4" wheel', async ({ page }) => {
    await page.getByTestId("motor").fill("4");
    await page.getByTestId("selectmotor").selectOption("Kraken X44*");
    await page.getByTestId("shooterRadius").fill("2");

    await expect(page.getByTestId("efficiency")).toHaveValue("100");
    await expect(page.getByTestId("currentLimit")).toHaveValue("40");
    await expect(page.getByTestId("selectcurrentLimit")).toHaveValue("A");
    await expect(page.getByTestId("shooterRatio")).toHaveValue("2");
    await expect(page.getByTestId("selectshooterRatio")).toHaveValue("Step-up");
    await expect(page.getByTestId("shooterMaxSpeed")).toHaveValue("15060");
    await expect(page.getByTestId("selectshooterMaxSpeed")).toHaveValue("rpm");
    await expect(page.getByTestId("shooterRPM")).toHaveValue("10000");
    await expect(page.getByTestId("selectshooterRPM")).toHaveValue("rpm");
    await expect(page.getByTestId("projectileWeight")).toHaveValue("5");
    await expect(page.getByTestId("selectprojectileWeight")).toHaveValue("lbs");
    await expect(page.getByTestId("selectshooterRadius")).toHaveValue("in");
    await expect(page.getByTestId("shooterWeight")).toHaveValue("1");
    await expect(page.getByTestId("selectshooterWeight")).toHaveValue("lbs");
    await expect(page.getByTestId("useCustomShooterMOI")).not.toBeChecked();
    await expect(page.getByTestId("customShooterMOI")).toHaveValue("2.000");
    await expect(page.getByTestId("selectcustomShooterMOI")).toHaveValue(
      "in^2 lbs",
    );
    await expect(page.getByTestId("flywheelRadius")).toHaveValue("2");
    await expect(page.getByTestId("selectflywheelRadius")).toHaveValue("in");
    await expect(page.getByTestId("flywheelWeight")).toHaveValue("1.5");
    await expect(page.getByTestId("selectflywheelWeight")).toHaveValue("lbs");
    await expect(page.getByTestId("flywheelShooterRatio")).toHaveValue("1");
    await expect(page.getByTestId("selectflywheelShooterRatio")).toHaveValue(
      "Reduction",
    );
    await expect(page.getByTestId("useCustomFlywheelMOI")).not.toBeChecked();
    await expect(page.getByTestId("customFlywheelMOI")).toHaveValue("3.000");
    await expect(page.getByTestId("selectcustomFlywheelMOI")).toHaveValue(
      "in^2 lbs",
    );
    await expect(page.getByTestId("windupTime")).toHaveValue("1.11");
    await expect(page.getByTestId("selectwindupTime")).toHaveValue("s");
    await expect(page.getByTestId("recoveryTime")).toHaveValue("0.1505");
    await expect(page.getByTestId("selectrecoveryTime")).toHaveValue("s");
    await expect(page.getByTestId("surfaceSpeed")).toHaveValue("174.53");
    await expect(page.getByTestId("selectsurfaceSpeed")).toHaveValue("ft/s");
    await expect(page.getByTestId("projectileSpeed")).toHaveValue("22.96");
    await expect(page.getByTestId("selectprojectileSpeed")).toHaveValue("ft/s");
    await expect(page.getByTestId("speedAfterShot")).toHaveValue("9503");
    await expect(page.getByTestId("selectspeedAfterShot")).toHaveValue("rpm");
    await expect(page.getByTestId("flywheelEnergy")).toHaveValue("802");
    await expect(page.getByTestId("selectflywheelEnergy")).toHaveValue("J");
    await expect(page.getByTestId("projectileEnergy")).toHaveValue("78");
    await expect(page.getByTestId("selectprojectileEnergy")).toHaveValue("J");
    await expect(page.getByTestId("kV")).toHaveValue("0.15");
    await expect(page.getByTestId("selectkV")).toHaveValue("V*s/m");
    await expect(page.getByTestId("kA")).toHaveValue("0.61");
    await expect(page.getByTestId("selectkA")).toHaveValue("V*s^2/m");
    await expect(page.getByTestId("responseTime")).toHaveValue("4.06");
    await expect(page.getByTestId("selectresponseTime")).toHaveValue("s");
  });

  test("Copy link button works", async ({ page, browserName }) => {
    test.skip(browserName === "webkit");

    await page.getByRole("button", { name: "Copy Link" }).click();
    const value = await page.evaluate("navigator.clipboard.readText()");
    expect(value).toEqual(
      "http://localhost:3000/flywheel?currentLimit=%7B%22s%22%3A40%2C%22u%22%3A%22A%22%7D&efficiency=100&flywheelMomentOfInertia=%7B%22s%22%3A3%2C%22u%22%3A%22in2%2Albs%22%7D&flywheelRadius=%7B%22s%22%3A2%2C%22u%22%3A%22in%22%7D&flywheelRatio=%7B%22magnitude%22%3A1%2C%22ratioType%22%3A%22Reduction%22%7D&flywheelWeight=%7B%22s%22%3A1.5%2C%22u%22%3A%22lbs%22%7D&motor=%7B%22quantity%22%3A2%2C%22name%22%3A%22Kraken%20X60%20%28FOC%29%2A%22%7D&motorRatio=%7B%22magnitude%22%3A2%2C%22ratioType%22%3A%22Step-up%22%7D&projectileRadius=%7B%22s%22%3A2%2C%22u%22%3A%22in%22%7D&projectileWeight=%7B%22s%22%3A5%2C%22u%22%3A%22lbs%22%7D&shooterMomentOfInertia=%7B%22s%22%3A4.5%2C%22u%22%3A%22in2%2Albs%22%7D&shooterRadius=%7B%22s%22%3A3%2C%22u%22%3A%22in%22%7D&shooterTargetSpeed=%7B%22s%22%3A10000%2C%22u%22%3A%22rpm%22%7D&shooterWeight=%7B%22s%22%3A1%2C%22u%22%3A%22lbs%22%7D&useCustomFlywheelMoi=0&useCustomShooterMoi=0",
    );
  });
});

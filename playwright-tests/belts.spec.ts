import { expect, test } from "@playwright/test";

test.describe("Belts Calculator", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("localhost:3000/belts");
  });

  test("Default page", async ({ page }) => {
    await expect(page.getByTestId("pitch")).toHaveValue("5");
    await expect(page.getByTestId("selectpitch")).toHaveValue("mm");
    await expect(page.getByTestId("beltToothIncrement")).toHaveValue("5");
    await expect(page.getByTestId("desiredCenter")).toHaveValue("5");
    await expect(page.getByTestId("selectdesiredCenter")).toHaveValue("in");
    await expect(page.getByTestId("extraCenter")).toHaveValue("0");
    await expect(page.getByTestId("selectextraCenter")).toHaveValue("mm");
    await expect(page.getByTestId("enableCustomBelt")).not.toBeChecked();
    await expect(page.getByTestId("specificBeltTeeth")).toHaveValue("125");
    await expect(page.getByTestId("p1Teeth")).toHaveValue("16");
    await expect(page.getByTestId("p1PitchDiameter")).toHaveValue("1.0026");
    await expect(page.getByTestId("selectp1PitchDiameter")).toHaveValue("in");
    await expect(page.getByTestId("p2Teeth")).toHaveValue("24");
    await expect(page.getByTestId("p2PitchDiameter")).toHaveValue("1.5038");
    await expect(page.getByTestId("selectp2PitchDiameter")).toHaveValue("in");
    await expect(page.getByTestId("smallerBeltTeeth")).toHaveValue("70");
    await expect(page.getByTestId("smallerCenter")).toHaveValue("4.9149");
    await expect(page.getByTestId("selectsmallerCenter")).toHaveValue("in");
    await expect(page.getByTestId("smallerP1TeethInMesh")).toHaveValue("8.0");
    await expect(page.getByTestId("smallerP2TeethInMesh")).toHaveValue("11.0");
    await expect(page.getByTestId("smallerPulleyGap")).toHaveValue("3.66");
    await expect(page.getByTestId("selectsmallerPulleyGap")).toHaveValue("in");
    await expect(page.getByTestId("smallerDiffFromTarget")).toHaveValue(
      "-0.085",
    );
    await expect(page.getByTestId("selectsmallerDiffFromTarget")).toHaveValue(
      "in",
    );
    await expect(page.getByTestId("largerBeltTeeth")).toHaveValue("75");
    await expect(page.getByTestId("largerCenter")).toHaveValue("5.4076");
    await expect(page.getByTestId("selectlargerCenter")).toHaveValue("in");
    await expect(page.getByTestId("largerP1TeethInMesh")).toHaveValue("8.0");
    await expect(page.getByTestId("largerP2TeethInMesh")).toHaveValue("11.0");
    await expect(page.getByTestId("largerPulleyGap")).toHaveValue("4.15");
    await expect(page.getByTestId("selectlargerPulleyGap")).toHaveValue("in");
    await expect(page.getByTestId("largerDiffFromTarget")).toHaveValue("0.408");
    await expect(page.getByTestId("selectlargerDiffFromTarget")).toHaveValue(
      "in",
    );
  });

  test("Change pitch value", async ({ page }) => {
    await page.getByTestId("pitch").fill("5");
    await expect(page.getByTestId("beltToothIncrement")).toHaveValue("5");
    await expect(page.getByTestId("desiredCenter")).toHaveValue("5");
    await expect(page.getByTestId("extraCenter")).toHaveValue("0");
    await expect(page.getByTestId("enableCustomBelt")).not.toBeChecked();
    await expect(page.getByTestId("p1Teeth")).toHaveValue("16");
    await expect(page.getByTestId("p1PitchDiameter")).toHaveValue("1.0026");
    await expect(page.getByTestId("selectp1PitchDiameter")).toHaveValue("in");
    await expect(page.getByTestId("p2Teeth")).toHaveValue("24");
    await expect(page.getByTestId("p2PitchDiameter")).toHaveValue("1.5038");
    await expect(page.getByTestId("selectp2PitchDiameter")).toHaveValue("in");
    await expect(page.getByTestId("smallerBeltTeeth")).toHaveValue("70");
    await expect(page.getByTestId("smallerCenter")).toHaveValue("4.9149");
    await expect(page.getByTestId("selectsmallerCenter")).toHaveValue("in");
    await expect(page.getByTestId("smallerP1TeethInMesh")).toHaveValue("8.0");
    await expect(page.getByTestId("smallerP2TeethInMesh")).toHaveValue("11.0");
    await expect(page.getByTestId("smallerPulleyGap")).toHaveValue("3.66");
    await expect(page.getByTestId("selectsmallerPulleyGap")).toHaveValue("in");
    await expect(page.getByTestId("smallerDiffFromTarget")).toHaveValue(
      "-0.085",
    );
    await expect(page.getByTestId("selectsmallerDiffFromTarget")).toHaveValue(
      "in",
    );
    await expect(page.getByTestId("largerBeltTeeth")).toHaveValue("75");
    await expect(page.getByTestId("largerCenter")).toHaveValue("5.4076");
    await expect(page.getByTestId("selectlargerCenter")).toHaveValue("in");
    await expect(page.getByTestId("largerP1TeethInMesh")).toHaveValue("8.0");
    await expect(page.getByTestId("largerP2TeethInMesh")).toHaveValue("11.0");
    await expect(page.getByTestId("largerPulleyGap")).toHaveValue("4.15");
    await expect(page.getByTestId("selectlargerPulleyGap")).toHaveValue("in");
    await expect(page.getByTestId("largerDiffFromTarget")).toHaveValue("0.408");
    await expect(page.getByTestId("selectlargerDiffFromTarget")).toHaveValue(
      "in",
    );
  });

  test("Change pitch value and units", async ({ page }) => {
    await page.getByTestId("selectpitch").selectOption("in");
    await page.getByTestId("pitch").fill("0.25");
    await expect(page.getByTestId("desiredCenter")).toHaveValue("5");
    await expect(page.getByTestId("selectdesiredCenter")).toHaveValue("in");
    await expect(page.getByTestId("pitch")).toHaveValue("0.25");
    await expect(page.getByTestId("selectpitch")).toHaveValue("in");
    await expect(page.getByTestId("p1Teeth")).toHaveValue("16");
    await expect(page.getByTestId("p1PitchDiameter")).toHaveValue("1.2732");
    await expect(page.getByTestId("selectp1PitchDiameter")).toHaveValue("in");
    await expect(page.getByTestId("p2Teeth")).toHaveValue("24");
    await expect(page.getByTestId("p2PitchDiameter")).toHaveValue("1.9099");
    await expect(page.getByTestId("selectp2PitchDiameter")).toHaveValue("in");
    await expect(page.getByTestId("smallerBeltTeeth")).toHaveValue("60");
    await expect(page.getByTestId("smallerCenter")).toHaveValue("4.9898");
    await expect(page.getByTestId("selectsmallerCenter")).toHaveValue("in");
    await expect(page.getByTestId("smallerP1TeethInMesh")).toHaveValue("8.0");
    await expect(page.getByTestId("smallerP2TeethInMesh")).toHaveValue("11.0");
    await expect(page.getByTestId("smallerPulleyGap")).toHaveValue("3.40");
    await expect(page.getByTestId("selectsmallerPulleyGap")).toHaveValue("in");
    await expect(page.getByTestId("smallerDiffFromTarget")).toHaveValue(
      "-0.010",
    );
    await expect(page.getByTestId("selectsmallerDiffFromTarget")).toHaveValue(
      "in",
    );
    await expect(page.getByTestId("largerBeltTeeth")).toHaveValue("65");
    await expect(page.getByTestId("largerCenter")).toHaveValue("5.6160");
    await expect(page.getByTestId("selectlargerCenter")).toHaveValue("in");
    await expect(page.getByTestId("largerP1TeethInMesh")).toHaveValue("8.0");
    await expect(page.getByTestId("largerP2TeethInMesh")).toHaveValue("11.0");
    await expect(page.getByTestId("largerPulleyGap")).toHaveValue("4.02");
    await expect(page.getByTestId("selectlargerPulleyGap")).toHaveValue("in");
    await expect(page.getByTestId("largerDiffFromTarget")).toHaveValue("0.616");
    await expect(page.getByTestId("selectlargerDiffFromTarget")).toHaveValue(
      "in",
    );
  });

  test("Copy link button works", async ({ page, browserName }) => {
    test.skip(browserName === "webkit");

    await page.getByRole("button", { name: "Copy Link" }).click();
    const value = await page.evaluate("navigator.clipboard.readText()");
    expect(value).toEqual(
      "http://localhost:3000/belts?customBeltTeeth=125&desiredCenter=%7B%22s%22%3A5%2C%22u%22%3A%22in%22%7D&extraCenter=%7B%22s%22%3A0%2C%22u%22%3A%22mm%22%7D&p1Teeth=16&p2Teeth=24&pitch=%7B%22s%22%3A5%2C%22u%22%3A%22mm%22%7D&toothIncrement=5&useCustomBelt=0",
    );
  });
});

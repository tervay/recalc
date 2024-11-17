import { expect, test } from "@playwright/test";

test.describe("Chain Calculator", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("localhost:3000/chains");
  });

  test("Default page", async ({ page }) => {
    await expect(page.getByTestId("p1PD")).toHaveValue("1.2815");
    await expect(page.getByTestId("selectp1PD")).toHaveValue("in");
    await expect(page.getByTestId("p2PD")).toHaveValue("2.8684");
    await expect(page.getByTestId("selectp2PD")).toHaveValue("in");
    await expect(page.getByTestId("smallerLinks")).toHaveValue("66");
    await expect(page.getByTestId("smallerCenter")).toHaveValue("4.9359");
    await expect(page.getByTestId("selectsmallerCenter")).toHaveValue("in");
    await expect(page.getByTestId("largerLinks")).toHaveValue("68");
    await expect(page.getByTestId("largerCenter")).toHaveValue("5.1890");
    await expect(page.getByTestId("selectlargerCenter")).toHaveValue("in");
    await expect(page.getByTestId("chain")).toHaveValue("#25");
    await expect(page.getByTestId("desiredCenter")).toHaveValue("5");
    await expect(page.getByTestId("selectdesiredCenter")).toHaveValue("in");
    await expect(page.getByTestId("extraCenter")).toHaveValue("0");
    await expect(page.getByTestId("selectextraCenter")).toHaveValue("mm");

    await expect(page.getByRole("button", { name: "Copy Link" })).toBeVisible();
    await expect(
      page.getByRole("cell", { name: "Matching COTS Sprockets" }),
    ).toBeVisible();
  });

  test("Change desired center units", async ({ page }) => {
    await page.getByTestId("selectdesiredCenter").selectOption("ft");
    await expect(page.getByTestId("desiredCenter")).toHaveValue("5");
    await expect(page.getByTestId("selectdesiredCenter")).toHaveValue("ft");
    await expect(page.getByTestId("smallerLinks")).toHaveValue("506");
    await expect(page.getByTestId("smallerCenter")).toHaveValue("59.9947");
    await expect(page.getByTestId("selectsmallerCenter")).toHaveValue("in");
    await expect(page.getByTestId("largerLinks")).toHaveValue("508");
    await expect(page.getByTestId("largerCenter")).toHaveValue("60.2447");
    await expect(page.getByTestId("selectlargerCenter")).toHaveValue("in");
  });

  test("Change desired center value", async ({ page }) => {
    await page.getByTestId("desiredCenter").fill("10");
    await expect(page.getByTestId("selectdesiredCenter")).toHaveValue("in");
    await expect(page.getByTestId("smallerLinks")).toHaveValue("106");
    await expect(page.getByTestId("smallerCenter")).toHaveValue("9.9683");
    await expect(page.getByTestId("selectsmallerCenter")).toHaveValue("in");
    await expect(page.getByTestId("largerLinks")).toHaveValue("108");
    await expect(page.getByTestId("largerCenter")).toHaveValue("10.2190");
    await expect(page.getByTestId("selectlargerCenter")).toHaveValue("in");
  });

  test("Change extra center value", async ({ page }) => {
    await page.getByTestId("extraCenter").fill("1");
    await expect(page.getByTestId("selectextraCenter")).toHaveValue("mm");
    await expect(page.getByTestId("smallerLinks")).toHaveValue("66");
    await expect(page.getByTestId("smallerCenter")).toHaveValue("4.9753");
    await expect(page.getByTestId("selectsmallerCenter")).toHaveValue("in");
    await expect(page.getByTestId("largerLinks")).toHaveValue("68");
    await expect(page.getByTestId("largerCenter")).toHaveValue("5.2284");
    await expect(page.getByTestId("selectlargerCenter")).toHaveValue("in");
  });

  test("Change extra center value and units", async ({ page }) => {
    await page.getByTestId("extraCenter").fill("1");
    await page.getByTestId("selectextraCenter").selectOption("in");
    await expect(page.getByTestId("smallerLinks")).toHaveValue("66");
    await expect(page.getByTestId("smallerCenter")).toHaveValue("5.9359");
    await expect(page.getByTestId("selectsmallerCenter")).toHaveValue("in");
    await expect(page.getByTestId("largerLinks")).toHaveValue("68");
    await expect(page.getByTestId("largerCenter")).toHaveValue("6.1890");
    await expect(page.getByTestId("selectlargerCenter")).toHaveValue("in");
  });

  test("Change sprocket 1 teeth", async ({ page }) => {
    await page.getByTestId("p1Teeth").fill("24");
    await expect(page.getByTestId("p1Teeth")).toHaveValue("24");
    await expect(page.getByTestId("p1PD")).toHaveValue("1.9153");
    await expect(page.getByTestId("selectp1PD")).toHaveValue("in");
    await expect(page.getByTestId("p2Teeth")).toHaveValue("36");
    await expect(page.getByTestId("p2PD")).toHaveValue("2.8684");
    await expect(page.getByTestId("selectp2PD")).toHaveValue("in");
    await expect(page.getByTestId("smallerLinks")).toHaveValue("70");
    await expect(page.getByTestId("smallerCenter")).toHaveValue("4.9771");
    await expect(page.getByTestId("selectsmallerCenter")).toHaveValue("in");
    await expect(page.getByTestId("largerLinks")).toHaveValue("72");
    await expect(page.getByTestId("largerCenter")).toHaveValue("5.2282");
    await expect(page.getByTestId("selectlargerCenter")).toHaveValue("in");
  });

  test("Change sprocket 2 teeth", async ({ page }) => {
    await page.getByTestId("p2Teeth").fill("40");
    await expect(page.getByTestId("p1Teeth")).toHaveValue("16");
    await expect(page.getByTestId("p1PD")).toHaveValue("1.2815");
    await expect(page.getByTestId("selectp1PD")).toHaveValue("in");
    await expect(page.getByTestId("p2Teeth")).toHaveValue("40");
    await expect(page.getByTestId("p2PD")).toHaveValue("3.1864");
    await expect(page.getByTestId("selectp2PD")).toHaveValue("in");
    await expect(page.getByTestId("smallerLinks")).toHaveValue("68");
    await expect(page.getByTestId("smallerCenter")).toHaveValue("4.9072");
    await expect(page.getByTestId("selectsmallerCenter")).toHaveValue("in");
    await expect(page.getByTestId("largerLinks")).toHaveValue("70");
    await expect(page.getByTestId("largerCenter")).toHaveValue("5.1617");
    await expect(page.getByTestId("selectlargerCenter")).toHaveValue("in");
  });

  test("Change chain size to #35", async ({ page }) => {
    await page.getByTestId("chain").selectOption("#35");
    await expect(page.getByTestId("desiredCenter")).toHaveValue("5");
    await expect(page.getByTestId("selectdesiredCenter")).toHaveValue("in");
    await expect(page.getByTestId("p1Teeth")).toHaveValue("16");
    await expect(page.getByTestId("p1PD")).toHaveValue("1.9222");
    await expect(page.getByTestId("selectp1PD")).toHaveValue("in");
    await expect(page.getByTestId("p2Teeth")).toHaveValue("36");
    await expect(page.getByTestId("p2PD")).toHaveValue("4.3026");
    await expect(page.getByTestId("selectp2PD")).toHaveValue("in");
    await expect(page.getByTestId("smallerLinks")).toHaveValue("52");
    await expect(page.getByTestId("smallerCenter")).toHaveValue("4.7243");
    await expect(page.getByTestId("selectsmallerCenter")).toHaveValue("in");
    await expect(page.getByTestId("largerLinks")).toHaveValue("54");
    await expect(page.getByTestId("largerCenter")).toHaveValue("5.1107");
    await expect(page.getByTestId("selectlargerCenter")).toHaveValue("in");
  });

  test("Copy link button works", async ({ page, browserName }) => {
    test.skip(browserName === "webkit");

    await page.getByRole("button", { name: "Copy Link" }).click();
    const value = await page.evaluate("navigator.clipboard.readText()");
    expect(value).toEqual(
      "http://localhost:3000/chains?chain=%7B%22name%22%3A%22%2325%22%7D&desiredCenter=%7B%22s%22%3A5%2C%22u%22%3A%22in%22%7D&extraCenter=%7B%22s%22%3A0%2C%22u%22%3A%22mm%22%7D&p1Teeth=16&p2Teeth=36",
    );
  });
});

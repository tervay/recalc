import { generateIOTests } from "../support/e2e";

const inputs = {
  desiredCenter: "desiredCenter",
  extraCenter: "extraCenter",
  p1Teeth: "p1Teeth",
  p2Teeth: "p2Teeth",
};

const inputSelects = {
  desiredCenter: "selectdesiredCenter",
  extraCenter: "selectextraCenter",
};

const secondaryInputs = {};

const outputs = {
  p1PD: "p1PD",
  p2PD: "p2PD",
  smallerLinks: "smallerLinks",
  smallerCenter: "smallerCenter",
  largerLinks: "largerLinks",
  largerCenter: "largerCenter",
};

const outputSelects = {
  p1PD: "selectp1PD",
  p2PD: "selectp2PD",
  smallerCenter: "selectsmallerCenter",
  largerCenter: "selectlargerCenter",
};

const allSelects = { ...inputSelects, ...outputSelects };

describe("Chain Calculator e2e tests", () => {
  beforeEach(() => {
    cy.visit("localhost:3000/chains", {
      onBeforeLoad(win) {
        cy.spy(win.navigator.clipboard, "writeText").as("copy");
      },
    });
  });

  it("has a visible title", () => {
    cy.get("p")
      .first()
      .should("be.visible")
      .should("have.text", "Chain Calculator");
  });

  it("copy link button works", () => {
    cy.contains("Copy Link", { timeout: 1000 * 60 })
      .should("be.visible")
      .click();
    cy.get("@copy").should(
      "have.been.calledWithExactly",
      "http://localhost:3000/chains?chain=%7B%22name%22%3A%22%2325%22%7D&desiredCenter=%7B%22s%22%3A5%2C%22u%22%3A%22in%22%7D&extraCenter=%7B%22s%22%3A0%2C%22u%22%3A%22mm%22%7D&p1Teeth=16&p2Teeth=36",
    );
  });

  generateIOTests<
    typeof inputs,
    typeof outputs,
    typeof allSelects,
    typeof secondaryInputs
  >(
    { name: "Chain Calculator", url: "localhost:3000/chains" },
    inputs,
    outputs,
    allSelects,
    [
      [
        { change: { key: "desiredCenter", value: "43" } },
        {
          extraCenter: 0,
          p1Teeth: 16,
          p2Teeth: 36,
          p1PD: 1.2815,
          p2PD: 2.8684,
          smallerLinks: 370,
          smallerCenter: 42.9926,
          largerLinks: 372,
          largerCenter: 43.2427,
        },
      ],
      [
        { change: { key: "extraCenter", value: "3" } },
        {
          desiredCenter: 5,
          p1Teeth: 16,
          p2Teeth: 36,
          p1PD: 1.2815,
          p2PD: 2.8684,
          smallerLinks: 66,
          smallerCenter: "5.0540",
          largerLinks: 68,
          largerCenter: 5.3071,
        },
      ],
      [
        { change: { key: "p1Teeth", value: "24" } },
        {
          desiredCenter: 5,
          extraCenter: 0,
          p2Teeth: 36,
          p1PD: 1.9153,
          p2PD: 2.8684,
          smallerLinks: 70,
          smallerCenter: 4.9771,
          largerLinks: 72,
          largerCenter: 5.2282,
        },
      ],
      [
        { change: { key: "p2Teeth", value: "55" } },
        {
          desiredCenter: 5,
          extraCenter: 0,
          p1Teeth: 16,
          p1PD: 1.2815,
          p2PD: 4.3791,
          smallerLinks: 76,
          smallerCenter: 4.8125,
          largerLinks: 78,
          largerCenter: 5.0755,
        },
      ],
    ],
    secondaryInputs,
  );
});

export default {};

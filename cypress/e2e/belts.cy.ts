import { generateIOTests } from "../support/e2e";

const inputs = {
  pitch: "pitch",
  beltToothIncrement: "beltToothIncrement",
  desiredCenter: "desiredCenter",
  extraCenter: "extraCenter",
  p1Teeth: "p1Teeth",
  p2Teeth: "p2Teeth",
};

const inputSelects = {
  pitch: "selectpitch",
  desiredCenter: "selectdesiredCenter",
  extraCenter: "selectextraCenter",
};

const secondaryInputs = {};

const outputs = {
  p1PitchDiameter: "p1PitchDiameter",
  p2PitchDiameter: "p2PitchDiameter",
  smallerBeltTeeth: "smallerBeltTeeth",
  smallerCenter: "smallerCenter",
  smallerP1TeethInMesh: "smallerP1TeethInMesh",
  smallerP2TeethInMesh: "smallerP2TeethInMesh",
  largerBeltTeeth: "largerBeltTeeth",
  largerCenter: "largerCenter",
  largerP1TeethInMesh: "largerP1TeethInMesh",
  largerP2TeethInMesh: "largerP2TeethInMesh",
  smallerPulleyGap: "smallerPulleyGap",
  largerPulleyGap: "largerPulleyGap",
  smallerDiffFromTarget: "smallerDiffFromTarget",
  largerDiffFromTarget: "largerDiffFromTarget",
};

const outputSelects = {
  p1PitchDiameter: "selectp1PitchDiameter",
  p2PitchDiameter: "selectp2PitchDiameter",
  smallerCenter: "selectsmallerCenter",
  largerCenter: "selectlargerCenter",
  smallerPulleyGap: "selectsmallerPulleyGap",
  largerPulleyGap: "selectlargerPulleyGap",
  smallerDiffFromTarget: "selectsmallerDiffFromTarget",
  largerDiffFromTarget: "selectlargerDiffFromTarget",
};

const allSelects = { ...inputSelects, ...outputSelects };

describe("Belt Calculator e2e tests", () => {
  beforeEach(() => {
    cy.visit("localhost:3000/belts", {
      onBeforeLoad(win) {
        cy.spy(win.navigator.clipboard, "writeText").as("copy");
      },
    });
  });

  it("has a visible title", () => {
    cy.get("p")
      .first()
      .should("be.visible")
      .should("have.text", "Belt Calculator");
  });

  it("copy link button works", () => {
    cy.contains("Copy Link", { timeout: 1000 * 60 })
      .should("be.visible")
      .click();
    cy.get("@copy").should(
      "have.been.calledWithExactly",
      "http://localhost:3000/belts?customBeltTeeth=125&desiredCenter=%7B%22s%22%3A5%2C%22u%22%3A%22in%22%7D&extraCenter=%7B%22s%22%3A0%2C%22u%22%3A%22mm%22%7D&p1Teeth=16&p2Teeth=24&pitch=%7B%22s%22%3A3%2C%22u%22%3A%22mm%22%7D&toothIncrement=5&useCustomBelt=0"
    );
  });

  generateIOTests<
    typeof inputs,
    typeof outputs,
    typeof allSelects,
    typeof secondaryInputs
  >(
    { name: "Belt Calculator", url: "localhost:3000/belts" },
    inputs,
    outputs,
    allSelects,
    [
      [
        { change: { key: "pitch", value: "5" } },
        {
          beltToothIncrement: 5,
          desiredCenter: 5,
          extraCenter: 0,
          p1Teeth: 16,
          p2Teeth: 24,
          p1PitchDiameter: 1.0026,
          p2PitchDiameter: 1.5038,
          smallerBeltTeeth: 70,
          smallerCenter: 4.9149,
          smallerP1TeethInMesh: 7.7,
          smallerP2TeethInMesh: 11.6,
          largerBeltTeeth: 75,
          largerCenter: 5.4076,
          largerP1TeethInMesh: 7.8,
          largerP2TeethInMesh: 11.6,
          smallerPulleyGap: 3.66,
          largerPulleyGap: 4.15,
          smallerDiffFromTarget: -0.085,
          largerDiffFromTarget: 0.408,
        },
      ],
      [
        { change: { key: "beltToothIncrement", value: "6" } },
        {
          pitch: 3,
          desiredCenter: 5,
          extraCenter: 0,
          p1Teeth: 16,
          p2Teeth: 24,
          p1PitchDiameter: 0.6015,
          p2PitchDiameter: 0.9023,
          smallerBeltTeeth: 102,
          smallerCenter: 4.8402,
          smallerP1TeethInMesh: 7.8,
          smallerP2TeethInMesh: 11.8,
          largerBeltTeeth: 108,
          largerCenter: 5.1947,
          largerP1TeethInMesh: 7.8,
          largerP2TeethInMesh: 11.8,
          smallerPulleyGap: 4.09,
          largerPulleyGap: 4.44,
          smallerDiffFromTarget: "-0.160",
          largerDiffFromTarget: 0.195,
        },
      ],
      [
        { change: { key: "desiredCenter", value: "32" } },
        {
          pitch: 3,
          beltToothIncrement: 5,
          extraCenter: 0,
          p1Teeth: 16,
          p2Teeth: 24,
          p1PitchDiameter: 0.6015,
          p2PitchDiameter: 0.9023,
          smallerBeltTeeth: 560,
          smallerCenter: 31.8894,
          smallerP1TeethInMesh: "8.0",
          smallerP2TeethInMesh: "12.0",
          largerBeltTeeth: 565,
          largerCenter: 32.1847,
          largerP1TeethInMesh: "8.0",
          largerP2TeethInMesh: "12.0",
          smallerPulleyGap: 31.14,
          largerPulleyGap: 31.43,
          smallerDiffFromTarget: -0.111,
          largerDiffFromTarget: 0.185,
        },
      ],
      [
        { change: { key: "extraCenter", value: "1" } },
        {
          pitch: 3,
          beltToothIncrement: 5,
          desiredCenter: 5,
          p1Teeth: 16,
          p2Teeth: 24,
          p1PitchDiameter: 0.6015,
          p2PitchDiameter: 0.9023,
          smallerBeltTeeth: 100,
          smallerCenter: 4.7614,
          smallerP1TeethInMesh: 7.8,
          smallerP2TeethInMesh: 11.7,
          largerBeltTeeth: 105,
          largerCenter: 5.0568,
          largerP1TeethInMesh: 7.8,
          largerP2TeethInMesh: 11.8,
          smallerPulleyGap: 4.01,
          largerPulleyGap: "4.30",
          smallerDiffFromTarget: -0.239,
          largerDiffFromTarget: 0.057,
        },
      ],
      [
        { change: { key: "p1Teeth", value: "33" } },
        {
          pitch: 3,
          beltToothIncrement: 5,
          desiredCenter: 5,
          extraCenter: 0,
          p2Teeth: 24,
          p1PitchDiameter: 1.2407,
          p2PitchDiameter: 0.9023,
          smallerBeltTeeth: 110,
          smallerCenter: "4.8100",
          smallerP1TeethInMesh: 16.1,
          smallerP2TeethInMesh: 11.7,
          largerBeltTeeth: 115,
          largerCenter: 5.1055,
          largerP1TeethInMesh: 16.1,
          largerP2TeethInMesh: 11.7,
          smallerPulleyGap: 3.74,
          largerPulleyGap: 4.03,
          smallerDiffFromTarget: "-0.190",
          largerDiffFromTarget: 0.105,
        },
      ],
      [
        { change: { key: "p2Teeth", value: "17" } },
        {
          pitch: 3,
          beltToothIncrement: 5,
          desiredCenter: 5,
          extraCenter: 0,
          p1Teeth: 16,
          p1PitchDiameter: 0.6015,
          p2PitchDiameter: 0.6391,
          smallerBeltTeeth: 100,
          smallerCenter: 4.9311,
          smallerP1TeethInMesh: "8.0",
          smallerP2TeethInMesh: 8.5,
          largerBeltTeeth: 105,
          largerCenter: 5.2263,
          largerP1TeethInMesh: "8.0",
          largerP2TeethInMesh: 8.5,
          smallerPulleyGap: 4.31,
          largerPulleyGap: 4.61,
          smallerDiffFromTarget: -0.069,
          largerDiffFromTarget: 0.226,
        },
      ],
    ],
    secondaryInputs
  );
});

export default {};

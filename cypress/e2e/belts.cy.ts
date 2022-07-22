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
};

const secondaryInputs = {
  specificBeltTeeth: "specificBeltTeeth",
  enableCustomBelt: "enableCustomBelt",
};

const outputs = {
  specificBeltTeeth: "specificBeltTeeth",
  largerCenter: "largerCenter",
  largerP1TeethInMesh: "largerP1TeethInMesh",
  largerP2TeethInMesh: "largerP2TeethInMesh",
  largerBeltTeeth: "largerBeltTeeth",
  p1PitchDiameter: "p1PitchDiameter",
  p2PitchDiameter: "p2PitchDiameter",
  smallerCenter: "smallerCenter",
  smallerP1TeethInMesh: "smallerP1TeethInMesh",
  smallerP2TeethInMesh: "smallerP2TeethInMesh",
  smallerBeltTeeth: "smallerBeltTeeth",
  largerDiffFromTarget: "largerDiffFromTarget",
  smallerDiffFromTarget: "smallerDiffFromTarget",
};

const outputSelects = {};

const allSelects = { ...inputSelects, ...outputSelects };

describe("Belt calculator e2e tests", () => {
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
    cy.contains("Copy Link").should("be.visible").click();
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
        {
          change: { key: "pitch", value: "7" },
        },
        {
          beltToothIncrement: 5,
          desiredCenter: 5,
          extraCenter: 0,
          p1Teeth: 16,
          p2Teeth: 24,
          specificBeltTeeth: 125,
          p1PitchDiameter: 1.4036,
          p2PitchDiameter: 2.1054,
          smallerBeltTeeth: 55,
          smallerCenter: "4.8100",
          smallerP1TeethInMesh: 7.6,
          smallerP2TeethInMesh: 11.4,
          largerBeltTeeth: 60,
          largerCenter: 5.5006,
          largerP1TeethInMesh: 7.7,
          largerP2TeethInMesh: 11.5,
          largerDiffFromTarget: 0.501,
          smallerDiffFromTarget: "-0.190",
        },
      ],
      [
        {
          change: { key: "beltToothIncrement", value: "1" },
        },
        {
          pitch: 3,
          desiredCenter: 5,
          extraCenter: 0,
          p1Teeth: 16,
          p2Teeth: 24,
          specificBeltTeeth: 125,
          p1PitchDiameter: 0.6015,
          p2PitchDiameter: 0.9023,
          smallerBeltTeeth: 104,
          smallerCenter: 4.9583,
          smallerP1TeethInMesh: 7.8,
          smallerP2TeethInMesh: 11.8,
          largerBeltTeeth: 105,
          largerCenter: 5.0174,
          largerP1TeethInMesh: 7.8,
          largerP2TeethInMesh: 11.8,
          largerDiffFromTarget: 0.017,
          smallerDiffFromTarget: -0.042,
        },
      ],
      [
        {
          change: { key: "desiredCenter", value: "35" },
        },
        {
          pitch: 3,
          beltToothIncrement: 5,
          extraCenter: 0,
          p1Teeth: 16,
          p2Teeth: 24,
          specificBeltTeeth: 125,
          p1PitchDiameter: 0.6015,
          p2PitchDiameter: 0.9023,
          smallerBeltTeeth: 610,
          smallerCenter: 34.8422,
          smallerP1TeethInMesh: "8.0",
          smallerP2TeethInMesh: "12.0",
          largerBeltTeeth: 615,
          largerCenter: 35.1375,
          largerP1TeethInMesh: "8.0",
          largerP2TeethInMesh: "12.0",
          largerDiffFromTarget: 0.137,
          smallerDiffFromTarget: -0.158,
        },
      ],
      [
        {
          change: { key: "extraCenter", value: "1" },
        },
        {
          pitch: 3,
          beltToothIncrement: 5,
          desiredCenter: 5,
          p1Teeth: 16,
          p2Teeth: 24,
          specificBeltTeeth: 125,
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
          largerDiffFromTarget: 0.057,
          smallerDiffFromTarget: -0.239,
        },
      ],
      [
        {
          change: { key: "p1Teeth", value: "45" },
        },
        {
          pitch: 3,
          beltToothIncrement: 5,
          desiredCenter: 5,
          extraCenter: 0,
          p2Teeth: 24,
          specificBeltTeeth: 125,
          p1PitchDiameter: 1.6918,
          p2PitchDiameter: 0.9023,
          smallerBeltTeeth: 115,
          smallerCenter: 4.7375,
          smallerP1TeethInMesh: 21.3,
          smallerP2TeethInMesh: 11.3,
          largerBeltTeeth: 120,
          largerCenter: 5.0337,
          largerP1TeethInMesh: 21.3,
          largerP2TeethInMesh: 11.4,
          largerDiffFromTarget: 0.034,
          smallerDiffFromTarget: -0.263,
        },
      ],
      [
        {
          change: { key: "p2Teeth", value: "49" },
        },
        {
          pitch: 3,
          beltToothIncrement: 5,
          desiredCenter: 5,
          extraCenter: 0,
          p1Teeth: 16,
          specificBeltTeeth: 125,
          p1PitchDiameter: 0.6015,
          p2PitchDiameter: 1.8422,
          smallerBeltTeeth: 115,
          smallerCenter: 4.8322,
          smallerP1TeethInMesh: 7.3,
          smallerP2TeethInMesh: 22.4,
          largerBeltTeeth: 120,
          largerCenter: 5.1298,
          largerP1TeethInMesh: 7.4,
          largerP2TeethInMesh: 22.5,
          largerDiffFromTarget: "0.130",
          smallerDiffFromTarget: -0.168,
        },
      ],
      [
        {
          change: {
            key: "pitch",
            value: "0.25",
          },
          select: {
            key: "pitch",
            value: "in",
          },
        },
        {
          largerBeltTeeth: 65,
          largerCenter: "5.6160",
          largerP1TeethInMesh: 7.7,
          largerP2TeethInMesh: 11.5,
          p1PitchDiameter: 1.2732,
          p2PitchDiameter: 1.9099,
          smallerBeltTeeth: 60,
          smallerCenter: 4.9898,
          smallerP1TeethInMesh: 7.7,
          smallerP2TeethInMesh: 11.5,
          specificBeltTeeth: 125,
          largerDiffFromTarget: 0.616,
          smallerDiffFromTarget: "-0.010",
        },
      ],
      [
        {
          queryString: {
            value:
              "?customBeltTeeth=125&desiredCenter=%7B%22s%22%3A18%2C%22u%22%3A%22in%22%7D&" +
              "extraCenter=%7B%22s%22%3A1%2C%22u%22%3A%22in%22%7D&p1Teeth=32&" +
              "p2Teeth=24&pitch=%7B%22s%22%3A5%2C%22u%22%3A%22mm%22%7D&toothIncrement=3&" +
              "toothMax=330&useCustomBelt=0&version=1",
          },
        },
        {
          largerBeltTeeth: 213,
          largerCenter: 19.2069,
          largerP1TeethInMesh: 15.9,
          largerP2TeethInMesh: 11.9,
          p1PitchDiameter: 2.0051,
          p2PitchDiameter: 1.5038,
          smallerBeltTeeth: 210,
          smallerCenter: 18.9116,
          smallerP1TeethInMesh: 15.9,
          smallerP2TeethInMesh: 11.9,
          pitch: 5,
          desiredCenter: 18,
          p1Teeth: 32,
          p2Teeth: 24,
          beltToothIncrement: 3,
          specificBeltTeeth: 125,
          enableCustomBelt: false,
          extraCenter: 1,
          largerDiffFromTarget: 1.207,
          smallerDiffFromTarget: 0.912,
        },
      ],
      [
        {
          queryString: {
            value:
              "?customBeltTeeth=340&desiredCenter=%7B%22s%22%3A5%2C%22u%22%3A%22in%22%7D&" +
              "extraCenter=%7B%22s%22%3A1%2C%22u%22%3A%22in%22%7D&p1Teeth=52&p2Teeth=54&" +
              "pitch=%7B%22s%22%3A7%2C%22u%22%3A%22mm%22%7D&toothIncrement=5&toothMax=250" +
              "&useCustomBelt=1&version=1",
          },
        },
        {
          largerBeltTeeth: null,
          largerCenter: null,
          largerP1TeethInMesh: null,
          largerP2TeethInMesh: null,
          p1PitchDiameter: 4.5616,
          p2PitchDiameter: 4.7371,
          smallerBeltTeeth: 340,
          smallerCenter: 40.5471,
          smallerP1TeethInMesh: "26.0",
          smallerP2TeethInMesh: "27.0",
          pitch: 7,
          desiredCenter: 5,
          p1Teeth: 52,
          p2Teeth: 54,
          beltToothIncrement: 5,
          enableCustomBelt: true,
          extraCenter: 1,
          specificBeltTeeth: 340,
          largerDiffFromTarget: null,
          smallerDiffFromTarget: null,
        },
      ],
    ],
    secondaryInputs
  );
});

export default {};

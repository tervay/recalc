import { generateIOTests } from "../support/e2e";

const inputs = {
  motor: "motor",
  ratio: "ratio",
  comLength: "comLength",
  armMass: "armMass",
  currentLimit: "currentLimit",
  startAngle: "startAngle",
  endAngle: "endAngle",
  iterationLimit: "iterationLimit",
  efficiency: "efficiency",
};

const inputSelects = {};

const secondaryInputs = {};

const outputs = {
  timeToGoal: "timeToGoal",
  kG: "kG",
  kV: "kV",
  kA: "kA",
  responseTime: "responseTime",
};

const outputSelects = {
  timeToGoal: "selecttimeToGoal",
  kG: "selectkG",
  kV: "selectkV",
  kA: "selectkA",
  responseTime: "selectresponseTime",
};

const allSelects = { ...inputSelects, ...outputSelects };

describe("Arm Calculator e2e tests", () => {
  beforeEach(() => {
    cy.visit("localhost:3000/arm", {
      onBeforeLoad(win) {
        cy.spy(win.navigator.clipboard, "writeText").as("copy");
      },
    });
  });

  it("has a visible title", () => {
    cy.get("p")
      .first()
      .should("be.visible")
      .should("have.text", "Arm Calculator");
  });

  it("copy link button works", () => {
    cy.contains("Copy Link", { timeout: 1000 * 60 })
      .should("be.visible")
      .click();
    cy.get("@copy").should(
      "have.been.calledWithExactly",
      "http://localhost:3000/arm?armMass=%7B%22s%22%3A15%2C%22u%22%3A%22lbs%22%7D&comLength=%7B%22s%22%3A20%2C%22u%22%3A%22in%22%7D&currentLimit=%7B%22s%22%3A40%2C%22u%22%3A%22A%22%7D&efficiency=100&endAngle=%7B%22s%22%3A90%2C%22u%22%3A%22deg%22%7D&iterationLimit=10000&motor=%7B%22quantity%22%3A2%2C%22name%22%3A%22NEO%22%7D&ratio=%7B%22magnitude%22%3A100%2C%22ratioType%22%3A%22Reduction%22%7D&startAngle=%7B%22s%22%3A0%2C%22u%22%3A%22deg%22%7D",
    );
  });

  generateIOTests<
    typeof inputs,
    typeof outputs,
    typeof allSelects,
    typeof secondaryInputs
  >(
    { name: "Belt Calculator", url: "localhost:3000/arm" },
    inputs,
    outputs,
    allSelects,
    [
      [
        { change: { key: "motor", value: "1" } },
        {
          ratio: 100,
          comLength: 20,
          armMass: 15,
          currentLimit: 40,
          startAngle: 0,
          endAngle: 90,
          iterationLimit: 10000,
          efficiency: 100,
          timeToGoal: 0.387,
          kG: 1.21,
          kV: 1.95,
          kA: 0.06,
          responseTime: 0.03,
        },
      ],
      [
        { change: { key: "ratio", value: "57" } },
        {
          motor: 2,
          comLength: 20,
          armMass: 15,
          currentLimit: 40,
          startAngle: 0,
          endAngle: 90,
          iterationLimit: 10000,
          efficiency: 100,
          timeToGoal: 0.311,
          kG: 1.06,
          kV: 1.11,
          kA: 0.06,
          responseTime: 0.05,
        },
      ],
      [
        { change: { key: "comLength", value: "28" } },
        {
          motor: 2,
          ratio: 100,
          armMass: 15,
          currentLimit: 40,
          startAngle: 0,
          endAngle: 90,
          iterationLimit: 10000,
          efficiency: 100,
          timeToGoal: 0.362,
          kG: 0.85,
          kV: 1.95,
          kA: 0.06,
          responseTime: 0.03,
        },
      ],
      [
        { change: { key: "armMass", value: "7" } },
        {
          motor: 2,
          ratio: 100,
          comLength: 20,
          currentLimit: 40,
          startAngle: 0,
          endAngle: 90,
          iterationLimit: 10000,
          efficiency: 100,
          timeToGoal: 0.277,
          kG: 0.28,
          kV: 1.95,
          kA: 0.01,
          responseTime: 0.01,
        },
      ],
      [
        { change: { key: "currentLimit", value: "45" } },
        {
          motor: 2,
          ratio: 100,
          comLength: 20,
          armMass: 15,
          startAngle: 0,
          endAngle: 90,
          iterationLimit: 10000,
          efficiency: 100,
          timeToGoal: 0.302,
          kG: 0.61,
          kV: 1.95,
          kA: 0.03,
          responseTime: 0.02,
        },
      ],
      [
        { change: { key: "startAngle", value: "5" } },
        {
          motor: 2,
          ratio: 100,
          comLength: 20,
          armMass: 15,
          currentLimit: 40,
          endAngle: 90,
          iterationLimit: 10000,
          efficiency: 100,
          timeToGoal: 0.293,
          kG: 0.61,
          kV: 1.95,
          kA: 0.03,
          responseTime: 0.02,
        },
      ],
      [
        { change: { key: "endAngle", value: "75" } },
        {
          motor: 2,
          ratio: 100,
          comLength: 20,
          armMass: 15,
          currentLimit: 40,
          startAngle: 0,
          iterationLimit: 10000,
          efficiency: 100,
          timeToGoal: 0.265,
          kG: 0.61,
          kV: 1.95,
          kA: 0.03,
          responseTime: 0.02,
        },
      ],
      [
        { change: { key: "iterationLimit", value: "115" } },
        {
          motor: 2,
          ratio: 100,
          comLength: 20,
          armMass: 15,
          currentLimit: 40,
          startAngle: 0,
          endAngle: 90,
          efficiency: 100,
          timeToGoal: 0.058,
          kG: 0.61,
          kV: 1.95,
          kA: 0.03,
          responseTime: 0.02,
        },
      ],
      [
        { change: { key: "efficiency", value: "90" } },
        {
          motor: 2,
          ratio: 100,
          comLength: 20,
          armMass: 15,
          currentLimit: 40,
          startAngle: 0,
          endAngle: 90,
          iterationLimit: 10000,
          timeToGoal: 0.308,
          kG: 0.54,
          kV: 1.95,
          kA: 0.03,
          responseTime: 0.02,
        },
      ],
    ],
    secondaryInputs,
  );
});

export default {};

import { render, screen } from "@testing-library/react";

import LinearMech from "../LinearMech";

const inputs = {
  motors: () => screen.getByLabelText("Motors"),
  travelDistance: () => screen.getByLabelText("Travel distance"),
  spoolDiameter: () => screen.getByLabelText("Spool diameter"),
  load: () => screen.getByLabelText("Load"),
  ratio: () => screen.getByLabelText("Ratio"),
  efficiency: () => screen.getByLabelText("Efficiency (%)"),
};

const secondaryInputs = {};

const outputs = {
  unloadedSpeed: () => screen.getByLabelText("Unloaded Speed"),
  loadedSpeed: () => screen.getByLabelText("Loaded Speed"),
  timeToGoal: () => screen.getByLabelText("Time to goal"),
  currentDraw: () => screen.getByLabelText("Current draw"),
};

describe("LinearMech tests", () => {
  test("Should see all inputs & outputs", () => {
    render(<LinearMech />);

    for (const [_, getDiv] of Object.entries({
      ...inputs,
      ...secondaryInputs,
      ...outputs,
    })) {
      expect(getDiv()).toBeVisible();
    }
  });

  test("Inputs are enabled, outputs are disabled", () => {
    render(<LinearMech />);
    for (const [_, getDiv] of Object.entries(inputs)) {
      expect(getDiv()).toBeEnabled();
    }
    for (const [_, getDiv] of Object.entries(outputs)) {
      expect(getDiv()).toBeDisabled();
    }
  });

  test("Should see initial state", () => {
    render(<LinearMech />);

    expect(inputs.motors()).toHaveValue(1);
    expect(inputs.travelDistance()).toHaveValue(40);
    expect(inputs.spoolDiameter()).toHaveValue(1);
    expect(inputs.load()).toHaveValue(120);
    expect(inputs.ratio()).toHaveValue(2);
    expect(inputs.efficiency()).toHaveValue(100);
    expect(outputs.unloadedSpeed()).toHaveValue("13.92");
    expect(outputs.loadedSpeed()).toHaveValue("3.86");
    expect(outputs.timeToGoal()).toHaveValue("0.864");
    expect(outputs.currentDraw()).toHaveValue("186.217");
  });

  test.each("Initial state should change with query string", () => {
    delete global.window.location;
    global.window = Object.create(window);
    global.window.location = {
      search:
        "?efficiency=80&load=%7B%22s%22%3A100%2C%22u%22%3A%22lbs%22%7D&" +
        "motor=%7B%22quantity%22%3A3%2C%22name%22%3A%22Falcon%20500%22%7D&" +
        "ratio=%7B%22magnitude%22%3A5%2C%22ratioType%22%3A%22Reduction%22%7D&" +
        "spoolDiameter=%7B%22s%22%3A1.5%2C%22u%22%3A%22in%22%7D&" +
        "travelDistance=%7B%22s%22%3A60%2C%22u%22%3A%22in%22%7D&version=1",
    };

    render(<LinearMech />);
    expect(inputs.motors()).toHaveValue(3);
    expect(inputs.travelDistance()).toHaveValue(60);
    expect(inputs.spoolDiameter()).toHaveValue(1.5);
    expect(inputs.load()).toHaveValue(100);
    expect(inputs.ratio()).toHaveValue(5);
    expect(inputs.efficiency()).toHaveValue(80);
    expect(outputs.unloadedSpeed()).toHaveValue("8.35");
    expect(outputs.loadedSpeed()).toHaveValue("7.09");
    expect(outputs.timeToGoal()).toHaveValue("0.705");
    expect(outputs.currentDraw()).toHaveValue("32.286");
  });
});

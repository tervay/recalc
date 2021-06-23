import { render, screen } from "@testing-library/react";

import Load from "../Load";

const inputs = {
  motor: () => screen.getByLabelText("Motor"),
  planetaryRatio: () => screen.getByLabelText("Planetary Ratio"),
  currentLimit: () => screen.getByLabelText("Current Limit"),
  diametralPitch: () => screen.getByLabelText("Diametral Pitch"),
  pressureAngle: () => screen.getByLabelText("Pressure Angle"),
  pinionTeeth: () => screen.getByTestId("pinionTeeth"),
  pinionMaterial: () => screen.getByTestId("pinionMaterial"),
  pinionWidth: () => screen.getByTestId("pinionWidth"),
  gearTeeth: () => screen.getByTestId("gearTeeth"),
  gearMaterial: () => screen.getByTestId("gearMaterial"),
  gearWidth: () => screen.getByTestId("gearWidth"),
};

const secondaryInputs = {};

const outputs = {
  pinionSafeLoad: () => screen.getByLabelText("Pinion Safe Load"),
  pinionStallLoad: () => screen.getByLabelText("Pinion Stall Load"),
  pinionFOS: () => screen.getByLabelText("Pinion Factor of Safety"),
  gearSafeLoad: () => screen.getByLabelText("Driven Gear Safe Load"),
  gearStallLoad: () => screen.getByLabelText("Driven Gear Stall Load"),
  gearFOS: () => screen.getByLabelText("Driven Gear Factor of Safety"),
};

describe("Load tests", () => {
  test("Should see all inputs & outputs", () => {
    render(<Load />);

    for (const [_, getDiv] of Object.entries({
      ...inputs,
      ...secondaryInputs,
      ...outputs,
    })) {
      expect(getDiv()).toBeVisible();
    }
  });

  test("Inputs are enabled, outputs are disabled", () => {
    render(<Load />);
    for (const [_, getDiv] of Object.entries(inputs)) {
      expect(getDiv()).toBeEnabled();
    }
    for (const [_, getDiv] of Object.entries(outputs)) {
      expect(getDiv()).toBeDisabled();
    }
  });

  test("Should see initial state", () => {
    render(<Load />);

    expect(inputs.motor()).toHaveValue(2);
    expect(inputs.planetaryRatio()).toHaveValue(1);
    expect(inputs.currentLimit()).toHaveValue(60);
    expect(inputs.diametralPitch()).toHaveValue(20);
    expect(inputs.pressureAngle()).toHaveValue("14.5°");
    expect(inputs.pinionTeeth()).toHaveValue(10);
    expect(inputs.pinionMaterial()).toHaveValue("4140 Steel");
    expect(inputs.pinionWidth()).toHaveValue(0.475);
    expect(inputs.gearTeeth()).toHaveValue(60);
    expect(inputs.gearMaterial()).toHaveValue("7075-T6 Aluminum");
    expect(inputs.gearWidth()).toHaveValue(0.375);

    expect(outputs.pinionSafeLoad()).toHaveValue("881.628");
    expect(outputs.pinionStallLoad()).toHaveValue("169.108");
    expect(outputs.pinionFOS()).toHaveValue(5.213);

    expect(outputs.gearSafeLoad()).toHaveValue("684.944");
    expect(outputs.gearStallLoad()).toHaveValue("338.216");
    expect(outputs.gearFOS()).toHaveValue(2.025);
  });
});

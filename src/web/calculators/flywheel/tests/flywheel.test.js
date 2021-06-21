import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Flywheel from "../Flywheel";

const inputs = {
  motor: () => screen.getByLabelText("Motor"),
  ratio: () => screen.getByLabelText("Ratio"),
  radius: () => screen.getByLabelText("Radius"),
  targetSpeed: () => screen.getByLabelText("Target Flywheel Speed"),
  weight: () => screen.getByLabelText("Weight"),
};

const secondaryInputs = {
  enableCustomMOI: () => screen.getByLabelText("Use custom MOI"),
  momentOfInertia: () => screen.getByTestId("moi"),
};

const outputs = {
  windupTime: () => screen.getByLabelText("Windup Time"),
};

describe("Flywheel tests", () => {
  test("Should see all inputs & outputs", () => {
    render(<Flywheel />);

    for (const [_, getDiv] of Object.entries({
      ...inputs,
      ...secondaryInputs,
      ...outputs,
    })) {
      expect(getDiv()).toBeVisible();
    }
  });

  test("Should see initial state", () => {
    render(<Flywheel />);

    expect(inputs.motor()).toHaveValue(1);
    expect(inputs.ratio()).toHaveValue(1);
    expect(inputs.targetSpeed()).toHaveValue(2000);
    expect(inputs.radius()).toHaveValue(2);
    expect(inputs.weight()).toHaveValue(5);
    expect(secondaryInputs.enableCustomMOI()).not.toBeChecked();
    expect(secondaryInputs.momentOfInertia()).toHaveValue(10);
    expect(outputs.windupTime()).toHaveValue("0.157");

    expect(inputs.motor()).toBeEnabled();
    expect(inputs.ratio()).toBeEnabled();
    expect(inputs.targetSpeed()).toBeEnabled();
    expect(inputs.radius()).toBeEnabled();
    expect(inputs.weight()).toBeEnabled();
    expect(secondaryInputs.momentOfInertia()).toBeDisabled();
    expect(outputs.windupTime()).toBeDisabled();
  });

  test.each(Object.values(inputs))(
    "%p Clearing any primary input results in base output state",
    (getInput) => {
      render(<Flywheel />);
      userEvent.clear(getInput());
      expect(outputs.windupTime()).toHaveValue("0.000");
    }
  );

  test("Initial state should change with query string", () => {
    delete global.window.location;
    global.window = Object.create(window);
    global.window.location = {
      search:
        "?momentOfInertia=%7B%22s%22%3A45%2C%22u%22%3A%22lbs" +
        "%2Ain2%22%7D&motor=%7B%22quantity%22%3A3%2C%22name" +
        "%22%3A%22NEO%22%7D&radius=%7B%22s%22%3A3%2C%22u%22%3A%22" +
        "in%22%7D&ratio=%7B%22magnitude%22%3A2%2C%22ratioType" +
        "%22%3A%22Step-up%22%7D&targetSpeed=%7B%22s%22%3A10000%2C%22u%22%3A%22" +
        "rpm%22%7D&useCustomMOI=0&version=1&weight=%7B%22s%22%3A10%2C%22u%22%3A%22lbs%22%7D",
    };

    render(<Flywheel />);
    expect(inputs.motor()).toHaveValue(3);
    expect(inputs.ratio()).toHaveValue(2);
    expect(inputs.targetSpeed()).toHaveValue(10000);
    expect(inputs.radius()).toHaveValue(3);
    expect(inputs.weight()).toHaveValue(10);
    expect(secondaryInputs.enableCustomMOI()).not.toBeChecked();
    expect(secondaryInputs.momentOfInertia()).toHaveValue(45);
    expect(outputs.windupTime()).toHaveValue("3.056");
  });

  test("Initial state should change with query string with custom MOI", () => {
    delete global.window.location;
    global.window = Object.create(window);
    global.window.location = {
      search:
        "?momentOfInertia=%7B%22s%22%3A80%2C%22u%22%3A%22lbs%2Ain" +
        "2%22%7D&motor=%7B%22quantity%22%3A2%2C%22name%22%3A%22NEO%22%7D&" +
        "radius=%7B%22s%22%3A3%2C%22u%22%3A%22in%22%7D&ratio=%7B%22" +
        "magnitude%22%3A1.5%2C%22ratioType%22%3A%22Step-up%22%7D&" +
        "targetSpeed=%7B%22s%22%3A8000%2C%22u%22%3A%22rpm%22%7D&" +
        "useCustomMOI=1&version=1&weight=%7B%22s%22%3A10%2C%22u%22%3A%22lbs%22%7D",
    };

    render(<Flywheel />);
    expect(inputs.motor()).toHaveValue(2);
    expect(inputs.motor()).toBeEnabled();
    expect(inputs.ratio()).toHaveValue(1.5);
    expect(inputs.ratio()).toBeEnabled();
    expect(inputs.targetSpeed()).toHaveValue(8000);
    expect(inputs.targetSpeed()).toBeEnabled();
    expect(inputs.radius()).toHaveValue(3);
    expect(inputs.radius()).toBeDisabled();
    expect(inputs.weight()).toHaveValue(10);
    expect(inputs.weight()).toBeDisabled();
    expect(secondaryInputs.enableCustomMOI()).toBeChecked();
    expect(secondaryInputs.momentOfInertia()).toHaveValue(80);
    expect(secondaryInputs.momentOfInertia()).toBeEnabled();
    expect(outputs.windupTime()).toHaveValue("7.644");
    expect(outputs.windupTime()).toBeDisabled();
  });
});

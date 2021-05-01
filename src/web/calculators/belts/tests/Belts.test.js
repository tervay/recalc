import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Belts from "../Belts";

const inputs = {
  pitch: () => screen.getByLabelText("Pitch"),
  desiredCenter: () => screen.getByLabelText("Desired Center"),
  p1Teeth: () => screen.getByTestId("p1Teeth-input"),
  p2Teeth: () => screen.getByTestId("p2Teeth-input"),
  beltToothIncrement: () => screen.getByLabelText("Belt tooth increment"),
  beltToothMaximum: () => screen.getByLabelText("Belt tooth maximum"),
};

const secondaryInputs = {
  extraCenter: () => screen.getByLabelText("Extra Center"),
  specificBeltTeeth: () => screen.getByLabelText("Belt Teeth"),
};

const outputs = {
  p1PD: () => screen.getByTestId("p1Pitch-input"),
  p2PD: () => screen.getByTestId("p2Pitch-input"),
  smallerCenterDistance: () => screen.getByTestId("smallerCenterDistanceInput"),
  smallerBeltTeeth: () => screen.getByTestId("smallerBeltTeeth"),
  largerCenterDistance: () => screen.getByTestId("largerCenterDistanceInput"),
  largerBeltTeeth: () => screen.getByTestId("largerBeltTeeth"),
  teethInMesh: () => screen.getByLabelText("Teeth in mesh"),
};

describe("Belts calculator", () => {
  test("Renders", () => {
    render(<Belts />);
  });

  test("Should see all inputs & outputs", () => {
    render(<Belts />);

    for (const [_, getDiv] of Object.entries(inputs)) {
      expect(getDiv()).toBeVisible();
    }
    for (const [_, getDiv] of Object.entries(outputs)) {
      expect(getDiv()).toBeVisible();
    }

    expect(screen.getByTestId("enableSpecificBelt")).toBeVisible();
  });

  test("Changing pitch changes outputs", () => {
    render(<Belts />);

    userEvent.clear(screen.getByLabelText("Pitch"));

    expect(screen.getByTestId("smallerCenterDistanceInput")).toHaveValue(
      "0.0000"
    );
    expect(screen.getByTestId("largerCenterDistanceInput")).toHaveValue(
      "0.0000"
    );
    expect(screen.getByTestId("smallerBeltTeeth")).toHaveValue(0);
    expect(screen.getByTestId("largerBeltTeeth")).toHaveValue(0);

    userEvent.type(screen.getByLabelText("Pitch"), "7");

    expect(screen.getByTestId("smallerCenterDistanceInput")).toHaveValue(
      "4.8100"
    );
    expect(screen.getByTestId("largerCenterDistanceInput")).toHaveValue(
      "5.5006"
    );
    expect(screen.getByTestId("smallerBeltTeeth")).toHaveValue(55);
    expect(screen.getByTestId("largerBeltTeeth")).toHaveValue(60);
    expect(screen.getByLabelText("Teeth in mesh")).toHaveValue(7.6);
  });

  test.each(Object.values(inputs))(
    "Changing any primary input results in base output state",
    (getInput) => {
      render(<Belts />);
      userEvent.clear(getInput());

      expect(outputs.smallerCenterDistance()).toHaveValue("0.0000");
      expect(outputs.largerCenterDistance()).toHaveValue("0.0000");
      expect(outputs.smallerBeltTeeth()).toHaveValue(0);
      expect(outputs.largerBeltTeeth()).toHaveValue(0);
    }
  );
});

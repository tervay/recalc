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
  enableSpecificBelt: () => screen.getByTestId("enableSpecificBelt"),
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

    for (const [_, getDiv] of Object.entries({
      ...inputs,
      ...secondaryInputs,
      ...outputs,
    })) {
      expect(getDiv()).toBeVisible();
    }
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
    "%p Clearing any primary input results in base output state",
    (getInput) => {
      render(<Belts />);
      userEvent.clear(getInput());

      expect(outputs.smallerCenterDistance()).toHaveValue("0.0000");
      expect(outputs.largerCenterDistance()).toHaveValue("0.0000");
      expect(outputs.smallerBeltTeeth()).toHaveValue(0);
      expect(outputs.largerBeltTeeth()).toHaveValue(0);
    }
  );

  test("Should see initial state", () => {
    render(<Belts />);

    expect(inputs.pitch()).toHaveValue(3);
    expect(inputs.desiredCenter()).toHaveValue(5);
    expect(secondaryInputs.extraCenter()).toHaveValue(0);
    expect(inputs.p1Teeth()).toHaveValue(24);
    expect(inputs.p2Teeth()).toHaveValue(16);
    expect(inputs.beltToothIncrement()).toHaveValue(5);
    expect(inputs.beltToothMaximum()).toHaveValue(250);

    expect(secondaryInputs.enableSpecificBelt()).not.toBeChecked();
    expect(secondaryInputs.extraCenter()).toHaveValue(0);
    expect(secondaryInputs.specificBeltTeeth()).toBeDisabled();
    expect(secondaryInputs.specificBeltTeeth()).toHaveValue(125);

    expect(outputs.p1PD()).toHaveValue("0.9023");
    expect(outputs.p2PD()).toHaveValue("0.6015");
    expect(outputs.smallerCenterDistance()).toHaveValue("4.7220");
    expect(outputs.smallerBeltTeeth()).toHaveValue(100);
    expect(outputs.largerCenterDistance()).toHaveValue("5.0174");
    expect(outputs.largerBeltTeeth()).toHaveValue(105);
    expect(outputs.teethInMesh()).toHaveValue(7.8);
  });

  test("Initial state should change with query string", () => {
    delete global.window.location;
    global.window = Object.create(window);
    global.window.location = {
      search:
        "?customBeltTeeth=125&desiredCenter=%7B%22s%22%3A18%2C%22u%22%3A%22in%22%7D&" +
        "extraCenter=%7B%22s%22%3A1%2C%22u%22%3A%22in%22%7D&p1Teeth=32&" +
        "p2Teeth=24&pitch=%7B%22s%22%3A5%2C%22u%22%3A%22mm%22%7D&toothIncrement=3&" +
        "toothMax=330&useCustomBelt=0&version=1",
    };

    render(<Belts />);

    expect(inputs.pitch()).toHaveValue(5);
    expect(inputs.desiredCenter()).toHaveValue(18);
    expect(inputs.p1Teeth()).toHaveValue(32);
    expect(inputs.p2Teeth()).toHaveValue(24);
    expect(inputs.beltToothIncrement()).toHaveValue(3);
    expect(inputs.beltToothMaximum()).toHaveValue(330);

    expect(secondaryInputs.enableSpecificBelt()).not.toBeChecked();
    expect(secondaryInputs.extraCenter()).toHaveValue(1);
    expect(secondaryInputs.specificBeltTeeth()).toBeDisabled();
    expect(secondaryInputs.specificBeltTeeth()).toHaveValue(125);

    expect(outputs.p1PD()).toHaveValue("2.0051");
    expect(outputs.p2PD()).toHaveValue("1.5038");
    expect(outputs.smallerCenterDistance()).toHaveValue("18.9116");
    expect(outputs.smallerBeltTeeth()).toHaveValue(210);
    expect(outputs.largerCenterDistance()).toHaveValue("19.2069");
    expect(outputs.largerBeltTeeth()).toHaveValue(213);
    expect(outputs.teethInMesh()).toHaveValue(11.9);
  });

  test("Initial state should change with query string with custom belt", () => {
    delete global.window.location;
    global.window = Object.create(window);
    global.window.location = {
      search:
        "?customBeltTeeth=340&desiredCenter=%7B%22s%22%3A5%2C%22u%22%3A%22in%22%7D&" +
        "extraCenter=%7B%22s%22%3A1%2C%22u%22%3A%22in%22%7D&p1Teeth=52&p2Teeth=54&" +
        "pitch=%7B%22s%22%3A7%2C%22u%22%3A%22mm%22%7D&toothIncrement=5&toothMax=250" +
        "&useCustomBelt=1&version=1",
    };

    render(<Belts />);

    expect(inputs.pitch()).toHaveValue(7);
    expect(inputs.desiredCenter()).toHaveValue(5);
    expect(inputs.desiredCenter()).toBeDisabled();

    expect(inputs.p1Teeth()).toHaveValue(52);
    expect(inputs.p2Teeth()).toHaveValue(54);
    expect(inputs.beltToothIncrement()).toHaveValue(5);
    expect(inputs.beltToothIncrement()).toBeDisabled();
    expect(inputs.beltToothMaximum()).toHaveValue(250);
    expect(inputs.beltToothMaximum()).toBeDisabled();

    expect(secondaryInputs.enableSpecificBelt()).toBeChecked();
    expect(secondaryInputs.extraCenter()).toHaveValue(1);
    expect(secondaryInputs.specificBeltTeeth()).not.toBeDisabled();
    expect(secondaryInputs.specificBeltTeeth()).toHaveValue(340);

    expect(outputs.p1PD()).toHaveValue("4.5616");
    expect(outputs.p2PD()).toHaveValue("4.7371");
    expect(outputs.smallerCenterDistance()).toHaveValue("40.5471");
    expect(outputs.smallerBeltTeeth()).toHaveValue(340);
    expect(outputs.largerCenterDistance()).toHaveValue("0.0000");
    expect(outputs.largerBeltTeeth()).toHaveValue(0);
    expect(outputs.teethInMesh()).toHaveValue(26.0);
  });
});

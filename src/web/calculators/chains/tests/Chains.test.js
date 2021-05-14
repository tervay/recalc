import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Chains from "../Chains";

const inputs = {
  desiredCenter: () => screen.getByLabelText("Desired Center"),
  p1Teeth: () => screen.getByTestId("p1Teeth-input"),
  p2Teeth: () => screen.getByTestId("p2Teeth-input"),
};

const secondaryInputs = {
  chain: () => screen.getByTestId("chainInput"),
  extraCenter: () => screen.getByLabelText("Extra Center"),
};

const outputs = {
  smallerCenterDistance: () => screen.getByTestId("smallerCenterDistance"),
  smallerLinks: () => screen.getByTestId("smallerLinks"),
  largerCenterDistance: () => screen.getByTestId("largerCenterDistance"),
  largerLinks: () => screen.getByTestId("largerLinks"),
  p1PD: () => screen.getByTestId("p1Pitch-input"),
  p2PD: () => screen.getByTestId("p2Pitch-input"),
};

describe("Chain calculator", () => {
  test("Should see all inputs & outputs", () => {
    render(<Chains />);

    for (const [_, getDiv] of Object.entries({
      ...inputs,
      ...secondaryInputs,
      ...outputs,
    })) {
      expect(getDiv()).toBeVisible();
    }
  });

  test("Should see initial state", () => {
    render(<Chains />);

    expect(secondaryInputs.chain()).toHaveValue("#25");
    expect(inputs.desiredCenter()).toHaveValue(5);
    expect(secondaryInputs.extraCenter()).toHaveValue(0);
    expect(inputs.p1Teeth()).toHaveValue(36);
    expect(inputs.p2Teeth()).toHaveValue(16);

    expect(outputs.smallerCenterDistance()).toHaveValue("4.9359");
    expect(outputs.smallerLinks()).toHaveValue(66);
    expect(outputs.largerCenterDistance()).toHaveValue("5.1890");
    expect(outputs.largerLinks()).toHaveValue(68);
    expect(outputs.p1PD()).toHaveValue("2.8684");
    expect(outputs.p2PD()).toHaveValue("1.2815");
  });

  test.each(Object.values(inputs))(
    "%p changing any primary input results in base output state",
    (getInput) => {
      render(<Chains />);
      userEvent.clear(getInput());

      expect(outputs.smallerCenterDistance()).toHaveValue("0.0000");
      expect(outputs.smallerLinks()).toHaveValue(0);
      expect(outputs.largerCenterDistance()).toHaveValue("0.0000");
      expect(outputs.largerLinks()).toHaveValue(0);
    }
  );

  test("Changing chain pitch changes outputs", () => {
    render(<Chains />);

    userEvent.selectOptions(screen.getByTestId("chainInput"), ["#35"]);

    expect(secondaryInputs.chain()).toHaveValue("#35");
    expect(inputs.desiredCenter()).toHaveValue(5);
    expect(secondaryInputs.extraCenter()).toHaveValue(0);
    expect(inputs.p1Teeth()).toHaveValue(36);
    expect(inputs.p2Teeth()).toHaveValue(16);

    expect(outputs.smallerCenterDistance()).toHaveValue("4.7243");
    expect(outputs.smallerLinks()).toHaveValue(52);
    expect(outputs.largerCenterDistance()).toHaveValue("5.1107");
    expect(outputs.largerLinks()).toHaveValue(54);
    expect(outputs.p1PD()).toHaveValue("4.3026");
    expect(outputs.p2PD()).toHaveValue("1.9222");
  });

  test("Initial state should change with query string", () => {});
});

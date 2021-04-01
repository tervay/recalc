import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";

import BooleanInput from "../BooleanInput";

describe("Boolean input", () => {
  test("Renders", () => {
    const [x, setX] = useStateMock(true);
    render(<BooleanInput stateHook={[x, setX]} label="Label" />);
  });

  test("Checked on initially true", () => {
    const [checked, setChecked] = useStateMock(true);
    render(
      <BooleanInput
        stateHook={[checked, setChecked]}
        label="Label"
        inputId="input"
      />
    );
    expect(screen.getByLabelText("Label")).toBeChecked();
  });

  test("Checked on initially false", () => {
    const [checked, setChecked] = useStateMock(false);
    render(
      <BooleanInput
        stateHook={[checked, setChecked]}
        label="Label"
        inputId="input"
      />
    );
    expect(screen.getByLabelText("Label")).not.toBeChecked();
  });

  test("Changes when clicked", () => {
    const [checked, setChecked] = useStateMock(true);
    render(
      <BooleanInput
        stateHook={[checked, setChecked]}
        label="Label"
        inputId="input"
      />
    );

    fireEvent.click(screen.getByLabelText("Label"));
    expect(screen.getByLabelText("Label")).not.toBeChecked();
    expect(setChecked).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByLabelText("Label"));
    expect(screen.getByLabelText("Label")).toBeChecked();
    expect(setChecked).toHaveBeenCalledTimes(2);
  });
});

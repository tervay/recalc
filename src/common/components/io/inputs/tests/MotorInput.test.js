import { render, screen } from "@testing-library/react";
import { renderHook } from "@testing-library/react-hooks";
// import userEvent from "@testing-library/user-event";
import Motor from "common/models/Motor";
import React, { useState } from "react";

import { LabeledMotorInput } from "../MotorInput";

describe("Labeled motor input", () => {
  const {
    result: { current: stateHook },
  } = renderHook(() => useState(Motor.NEOs(2)));

  test("Renders", () => {
    render(
      <LabeledMotorInput
        stateHook={stateHook}
        choices={Motor.choices}
        inputId="motorInput"
        selectId="motorSelect"
      />
    );
  });

  describe("Input has initial value", () => {
    test("Given 2 NEOs", () => {
      const {
        result: { current: stateHook },
      } = renderHook(() => useState(Motor.NEOs(2)));

      render(
        <LabeledMotorInput
          stateHook={stateHook}
          choices={Motor.choices}
          inputId="motorInput"
          selectId="motorSelect"
          label="Label"
        />
      );

      expect(screen.getByLabelText("Label")).toHaveValue(2);
      expect(screen.getByTestId("motorSelect")).toHaveValue("NEO");
    });

    test("Given 3 775 pros", () => {
      const {
        result: { current: stateHook },
      } = renderHook(() => useState(Motor._775pros(3)));

      render(
        <LabeledMotorInput
          stateHook={stateHook}
          choices={Motor.choices}
          inputId="motorInput"
          selectId="motorSelect"
          label="Label"
        />
      );

      expect(screen.getByLabelText("Label")).toHaveValue(3);
      expect(screen.getByTestId("motorSelect")).toHaveValue("775pro");
    });
  });
});

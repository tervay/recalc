import { fireEvent, render, screen } from "@testing-library/react";
import { renderHook } from "@testing-library/react-hooks";
import userEvent from "@testing-library/user-event";
import Motor from "common/models/Motor";
import { useState } from "react";

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

  describe("Changing field changes state hook", () => {
    test("Number input", () => {
      const { result } = renderHook(() => useState(Motor.Falcon500s(1)));
      render(
        <LabeledMotorInput
          stateHook={result.current}
          choices={Motor.choices}
          inputId="motorInput"
          selectId="motorSelect"
          label="Label"
        />
      );

      userEvent.clear(screen.getByLabelText("Label"));
      expect(result.current[0]).toEqualMotor(Motor.Falcon500s(0));

      userEvent.type(screen.getByLabelText("Label"), "4");
      expect(screen.getByLabelText("Label")).toHaveValue(4);
      expect(result.current[0]).toEqualMotor(Motor.Falcon500s(4));
    });

    test("Motor select", () => {
      const { result } = renderHook(() => useState(Motor.Falcon500s(1)));
      render(
        <LabeledMotorInput
          stateHook={result.current}
          choices={Motor.choices}
          inputId="motorInput"
          selectId="motorSelect"
          label="Label"
        />
      );

      fireEvent.change(screen.getByTestId("motorSelect"), {
        target: { value: "NEO" },
      });

      expect(screen.getByTestId("motorSelect")).toHaveValue("NEO");
      expect(result.current[0]).toEqualMotor(Motor.NEOs(1));
    });
  });
});
